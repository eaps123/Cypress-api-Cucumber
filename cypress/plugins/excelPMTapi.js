const path = require('path');
const XLSX = require('xlsx');
const XLSX_CALC = require('xlsx-calc');
const formulajs = require('@formulajs/formulajs');
const { normalizeValue: commonNormalizeValue, parseDDMMYYYY, toDateOnly } = require('./excelCommon');
const excelSerialToDate = require('./excelCommon')._internal.excelSerialToDate

const DEBUG = !!process.env.DEBUG_EXCELUTILS

function log(...args) { if (DEBUG) console.log('[excelPMTapi]', ...args) }

// importa todas as funções do Formula.js para o motor xlsx-calc (override)
try {
  XLSX_CALC.import_functions(formulajs, { override: true });
} catch (e) {
  console.warn('[excelPMTapi] import_functions warning:', e && e.message);
}

/**
 * normalizeValue - delega para excelCommon.normalizeValue para manter consistência
 */
function normalizeValue(v) {
  return commonNormalizeValue(v);
}

function decodeRange(range) {
  return XLSX.utils.decode_range(range);
}

// --- ADDED: helpers para col/num
function colToNum(col) {
  if (!col) return 0;
  let n = 0;
  for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64);
  return n;
}
function numToCol(n) {
  let col = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col;
}

/**
 * loadAndCalc - lê workbook e re-calcula fórmulas em memória com xlsx-calc
 * garante que após a execução as células tenham seus valores (cell.v) com o resultado
 */
function loadAndCalc(filePath) {
  // lê mantendo fórmulas em memória
  const wb = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellText: true });

  // backup das fórmulas originais (usado para restaurar fórmulas que não queremos perder)
  let wbOriginalFormulas = null;
  try {
    wbOriginalFormulas = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellText: true });
  } catch (e) {
    log('[loadAndCalc] warning reading original workbook for formula backup:', e && e.message);
    wbOriginalFormulas = null;
  }

  // DEBUG: log básico do workbook e exemplo de célula (troque 'I9' por qualquer célula que queira investigar)
  try {
    log('[loadAndCalc] filePath=', filePath);
    log('[loadAndCalc] SheetNames=', wb.SheetNames);
    if (wbOriginalFormulas && wbOriginalFormulas.Sheets) {
      const origCellI9 = wbOriginalFormulas.Sheets['PMT'] && wbOriginalFormulas.Sheets['PMT']['I9'];
      log('[loadAndCalc] original PMT!I9 (orig):', origCellI9 ? { t: origCellI9.t, v: origCellI9.v, w: origCellI9.w, f: origCellI9.f } : null);
    }
    const curCellI9 = wb.Sheets['PMT'] && wb.Sheets['PMT']['I9'];
    log('[loadAndCalc] current PMT!I9 (wb):', curCellI9 ? { t: curCellI9.t, v: curCellI9.v, w: curCellI9.w, f: curCellI9.f, _preFixed: curCellI9._preFixed } : null);
  } catch (e) {
    log('[loadAndCalc] debug dump failed:', e && e.message);
  }

  // NORMALIZA fórmulas PT-BR -> EN para o engine/formulajs (ex.: SE -> IF, DATAM -> EDATE) e ; -> ,
  try {
    const funcMap = {
      'SE': 'IF',
      'DATAM': 'EDATE',
      'HOJE': 'TODAY',
      // adicione outros mapeamentos se necessário
    }
    Object.keys(wb.Sheets || {}).forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      Object.keys(ws || {}).forEach(addr => {
        if (addr[0] === '!') return;
        const cell = ws[addr];
        if (!cell || !cell.f || typeof cell.f !== 'string') return;
        let f = String(cell.f);
        // troca ; por , (separador de argumentos)
        f = f.replace(/;/g, ',');
        // traduz nomes de funções (aplica apenas palavras seguidas de parêntese)
        Object.entries(funcMap).forEach(([pt, en]) => {
          const re = new RegExp('\\b' + pt + '\\s*\\(', 'gi');
          f = f.replace(re, en + '(');
        });
        if (f !== cell.f) {
          log(`Translated formula ${sheetName}!${addr}: "${cell.f}" => "${f}"`);
          cell.f = f;
        }

        // Auto-fix comum: se fórmula usa IF(E9="","",DATAM/EDATE(...,E8)) mas E9 está vazio e E8 tem valor,
        // talvez devesse testar E8. Corrige IF(E9...)->IF(E8...) quando detectado.
        try {
          const fixIfRef = (ff) => {
            // padrão simples: IF\(\s*E9\s*=\s*""  (aceita $)
            if (/\bIF\s*\(\s*\$?E9\s*=\s*""/i.test(ff) && /\b(EDATE|DATAM)\s*\(/i.test(ff)) {
              const e9ref = 'E9'.toUpperCase();
              const e8ref = 'E8'.toUpperCase();
              const e9Cell = ws[e9ref];
              const e8Cell = ws[e8ref];
              const e9Empty = !e9Cell || e9Cell.v === '' || e9Cell.v === undefined || e9Cell.v === null;
              const e8HasVal = e8Cell && e8Cell.v !== '' && e8Cell.v !== undefined && e8Cell.v !== null;
              if (e9Empty && e8HasVal) {
                const newF = ff.replace(/\bE9\b/gi, 'E8');
                log(`Auto-fix IF ref ${sheetName}!${addr}: "${ff}" => "${newF}"`);
                return newF;
              }
            }
            return ff;
          }
          const newFormula = fixIfRef(f);
          if (newFormula !== f) cell.f = newFormula;
        } catch (e) { /* ignore */ }
      });
    });
  } catch (e) { /* ignore */ }

  // PREPARE: garante fórmulas da coluna F para linhas do prazo (evita F9 == null)
  try {
    Object.keys(wb.Sheets || {}).forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      if (!ws) return;
      // ONLY prepare sheet if it already looks like a calculation sheet:
      // require that F8 exists AND has a formula (so we don't inject into API/value sheets)
      const f8 = ws['F8'];
      if (!f8 || !f8.f) {
        // fallback: if sheetName clearly identifies left (e.g. contains 'PMT'), allow it
        if (!/PMT/i.test(sheetName)) return;
      }

      // detecta prazo em C11 (se existir)
      const prazoCell = ws['C11'] || ws['$C$11'];
      const prazo = (prazoCell && typeof prazoCell.v === 'number' && Number.isFinite(prazoCell.v))
        ? Math.max(0, Math.floor(prazoCell.v))
        : null;
      if (!prazo) return;
      const startRow = 8;
      const lastRow = startRow + prazo - 1;
      for (let row = startRow + 1; row <= lastRow; row++) {
        const fAddr = `F${row}`;
        const fCell = ws[fAddr];
        // só cria fórmula se não existir uma fórmula presente
        if (!fCell || !fCell.f) {
          const formula = `IF(E${row}="","",EDATE($F$8,E${row - 1}))`;
          ws[fAddr] = { f: formula };
          log(`Inserted formula ${sheetName}!${fAddr} => ${formula}`);
        }
      }
    });
  } catch (e) { /* ignore */ }

  // 1) tenta recalcular o workbook imediatamente para popular cell.v das dependências
  try {
    XLSX_CALC(wb, { continue_after_error: true, log_error: true });
    log('Initial recalculation done');
  } catch (e) {
    log('Initial recalculation error:', e && e.message);
  }

  // Converte valores numéricos muito grandes (ms timestamp) em Date para funções DATAM/EDATE funcionarem
  try {
    const DAY_MS = 24 * 60 * 60 * 1000;
    Object.keys(wb.Sheets || {}).forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      Object.keys(ws || {}).forEach(addr => {
        if (addr[0] === '!') return;
        const cell = ws[addr];
        if (!cell || !cell.f) return;
        const formula = String(cell.f || '').toUpperCase();
        // detecta DATAM (português) ou EDATE (inglês)
        if (!/\b(DATAM|EDATE)\s*\(/.test(formula)) return;
        const refs = (cell.f.match(/([A-Z]+\$?\d+)/gi) || []).map(r => r.replace(/\$/g, '').toUpperCase());
        refs.forEach(ref => {
          const refCell = ws[ref];
          if (refCell && typeof refCell.v === 'number' && Math.abs(refCell.v) > DAY_MS) {
            // transforma ms -> Date para o engine entender como data
            refCell.v = new Date(refCell.v);
            refCell.t = 'd';
            delete refCell.w;
            log(`Converted ${sheetName}!${ref} numeric->Date for DATAM/EDATE`);
          }
        });
      });
    });
  } catch (e) { /* ignore */ }

  // --- PRE-COMPUTE / FIX: corrige células que o engine deixou sem valor (ex.: K8)
  Object.keys(wb.Sheets || {}).forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    Object.keys(ws || {}).forEach(addr => {
      if (addr[0] === '!') return;
      const cell = ws[addr];
      if (!cell || !cell.f) return;
      const formula = String(cell.f || '').toUpperCase();

      // identifica candidates (aceita variações com IF/IFERROR envolvendo ROUND(...,2) e ^)
      const looksLikeTarget = formula.includes('ROUND') && formula.includes('^') && formula.includes('(1+') && formula.includes(',2)');
      if (!looksLikeTarget) return;

      // extrai referências A1 (remove $)
      const refs = (cell.f.match(/([A-Z]+\$?\d+)/gi) || []).map(r => r.replace(/\$/g, '').toUpperCase());
      const cref = refs.find(r => /^C\d+$/.test(r));
      const gref = refs.find(r => /^G\d+$/.test(r));
      const iref = refs.find(r => /^I\d+$/.test(r));
      const eref = refs.find(r => /^E\d+$/.test(r)); // se houver condicionamento IF(E*,...,...)

      if (!cref || !gref || !iref) return;

      // se a fórmula depende de E* e E* está vazio, respeita o IF(E="","",...) e NÃO calcula
      if (eref) {
        const eCell = ws[eref];
        const eVal = eCell ? eCell.v : undefined;
        if (eVal === '' || eVal === undefined || eVal === null) {
          return;
        }
      }

      // pega valores JÁ atualizados pelo XLSX_CALC
      const crefCell = ws[cref];
      const grefCell = ws[gref];
      const irefCell = ws[iref];
      const cv = crefCell && typeof crefCell.v === 'number' ? Number(crefCell.v) : NaN;
      let gv = grefCell && typeof grefCell.v === 'number' ? Number(grefCell.v) : NaN;
      const iv = irefCell && typeof irefCell.v === 'number' ? Number(irefCell.v) : NaN;

      if (Number.isNaN(cv) || Number.isNaN(gv) || Number.isNaN(iv)) return;

      try {
        const DAY_MS = 24 * 60 * 60 * 1000;
        const origGv = gv;
        if (Math.abs(gv) > DAY_MS) gv = gv / DAY_MS; // heurística ms -> dias
        if (Math.abs(gv) > 1e7) {
          log(`Pre-fix skipped ${sheetName}!${addr}: exponent too large (${origGv} -> ${gv})`);
          return;
        }
        const pow = Math.pow(1 + cv, gv);
        if (!Number.isFinite(pow)) {
          log(`Pre-fix skipped ${sheetName}!${addr}: pow not finite (cv=${cv}, gv=${origGv} -> ${gv})`);
          return;
        }
        const raw = (pow - 1) * iv;
        if (!Number.isFinite(raw)) {
          log(`Pre-fix skipped ${sheetName}!${addr}: raw not finite`);
          return;
        }
        const rounded = Number(raw.toFixed(2));
        // grava apenas se necessário e marca como pré-fixada
        if (cell.v !== rounded) {
          cell.v = rounded;
          cell.t = 'n';
          delete cell.w;
        }
        // preserva valor fixado removendo a fórmula (impede sobrescrita posterior)
        cell._preFixed = true;
        delete cell.f;
        log(`Pre-fixed ${sheetName}!${addr} => ${rounded} (from ${cref}=${cv}, ${gref}=${origGv} -> ${gv}, ${iref}=${iv})`);
      } catch (e) {
        /* ignore */
      }
    });
  });

  // LIMPA valores em cache (v, w) de células com fórmula para forçar recálculo limpo,
  // mas PRESERVA as células que pré-calculamos (cell._preFixed) e PRESERVA fórmulas de auto-fill.
  // ADDED: preserva apenas intervalo E[startRowOfSeries .. startRowOfSeries + prazo] quando possível.
  Object.keys(wb.Sheets || {}).forEach(sheetName => {
    const ws = wb.Sheets[sheetName];

    // detecta início da série na coluna E (ex.: fórmula que referencia E{row-1})
    let seriesStartRow = null;
    Object.keys(ws || {}).forEach(a => {
      if (a[0] === '!') return;
      const m = a.match(/^E(\d+)$/i);
      if (!m) return;
      const addrRow = Number(m[1]);
      const cell = ws[a];
      if (!cell || !cell.f) return;
      const f = String(cell.f).replace(/\$+/g, '');
      const refs = (f.match(/([A-Z]+)(\d+)/g) || []);
      const hasPrevRef = refs.some(r => {
        const mm = r.match(/^([A-Z]+)(\d+)$/i);
        if (!mm) return false;
        return mm[1].toUpperCase() === 'E' && Number(mm[2]) === addrRow - 1;
      });
      if (hasPrevRef) {
        if (seriesStartRow === null || addrRow < seriesStartRow) seriesStartRow = addrRow;
      }
    });

    // tenta ler prazo em C11 (fallbacks conservadores)
    const prazoCell = ws['C11'];
    const prazo = (prazoCell && typeof prazoCell.v === 'number' && Number.isFinite(prazoCell.v)) ? Math.max(0, Math.floor(prazoCell.v)) : null;

    // define intervalo a preservar na coluna E
    let preserveEfrom = null, preserveEto = null;
    if (seriesStartRow && prazo != null) {
      preserveEfrom = seriesStartRow;
      preserveEto = seriesStartRow + prazo; // inclusive
      log(`Preserving column E ${sheetName}!E${preserveEfrom}..E${preserveEto} based on detected seriesStart=${seriesStartRow} and prazo=${prazo}`);
    } else {
      // fallback: preservar toda coluna E (comportamento anterior conservador)
      preserveEfrom = null;
      preserveEto = null;
      log(`Could not detect seriesStart/prazo for ${sheetName} - preserving whole column E`);
    }

    // agora limpa cache exceto células pré-fixadas ou preservadas na coluna E
    Object.keys(ws || {}).forEach(addr => {
      if (addr[0] === '!') return;
      const cell = ws[addr];
      if (cell && cell.f) {
        if (cell._preFixed) return; // não remover o valor que precomputamos

        // se coluna E e intervalo detectado, preserva apenas se dentro do intervalo
        const colMatch = addr.match(/^([A-Z]+)(\d+)$/i);
        if (colMatch) {
          const colName = colMatch[1].toUpperCase();
          const rowNum = Number(colMatch[2]);
          if (colName === 'E') {
            if (preserveEfrom != null && preserveEto != null) {
              if (rowNum >= preserveEfrom && rowNum <= preserveEto) {
                return; // preserva fórmula de E dentro do intervalo
              }
            } else {
              // preserve whole column E when detection failed
              return;
            }
          }
        }

        // Detecta fórmulas de auto-fill simples: referencia a célula da mesma coluna na linha anterior
        const autoFillPattern = (() => {
          try {
            const f = String(cell.f).replace(/\$+/g, '');
            const refs = (f.match(/([A-Z]+)(\d+)/g) || []);
            if (refs.length === 0) return false;
            const addrMatch = addr.match(/^([A-Z]+)(\d+)$/i);
            if (!addrMatch) return false;
            const col = addrMatch[1].toUpperCase();
            const row = Number(addrMatch[2]);
            return refs.some(r => {
              const m = r.match(/^([A-Z]+)(\d+)$/i);
              if (!m) return false;
              return m[1].toUpperCase() === col && Number(m[2]) === row - 1;
            });
          } catch (e) {
            return false;
          }
        })();

        if (autoFillPattern) {
          return; // preserva auto-fill simples
        }

        delete cell.v;
        delete cell.w;
      }
    });
  });

  // recalcula usando xlsx-calc (gera cell.v com os resultados)
  // Recalcula repetidamente até estabilizar (propaga séries/depêndencias em cascata)
  try {
    const countPopulated = (workbook) => {
      let count = 0;
      Object.keys(workbook.Sheets || {}).forEach(sName => {
        const ws = workbook.Sheets[sName];
        Object.keys(ws || {}).forEach(a => {
          if (a[0] === '!') return;
          const c = ws[a];
          if (c && c.v !== undefined && c.v !== null) count++;
        });
      });
      return count;
    };

    let prev = -1;
    const MAX_ITER = 5;
    for (let iter = 1; iter <= MAX_ITER; iter++) {
      try {
        XLSX_CALC(wb, { continue_after_error: true, log_error: true });
      } catch (e) {
        log('XLSX_CALC error on iteration', iter, e && e.message);
      }
      const cur = countPopulated(wb);
      log(`Recalc iteration ${iter}: populatedCells=${cur}`);
      if (cur === prev) {
        log('Recalc stabilized');
        break;
      }
      prev = cur;
    }
  } catch (e) {
    log('Final recalculation loop error:', e && e.message);
  }

  // POST-FIX: converte resultados em ms (timestamp) gerados por funções de data em Date (cell.t='d')
  try {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const dateFuncsRegex = /\b(DATAM|EDATE|TODAY|DATE|HOJE)\s*\(|\bEDATE\b|\bDATAM\b/i;
    Object.keys(wb.Sheets || {}).forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      Object.keys(ws || {}).forEach(addr => {
        if (addr[0] === '!') return;
        const cell = ws[addr];
        if (!cell) return;
        const formula = String(cell.f || '');
        // se a célula resultado de função de data tem um número grande (ms), converte em Date
        if (formula && dateFuncsRegex.test(formula) && typeof cell.v === 'number' && Math.abs(cell.v) > DAY_MS) {
          try {
            cell.v = new Date(cell.v);
            cell.t = 'd';
            delete cell.w;
            log(`Post-convert ${sheetName}!${addr} ms->Date for date-func result`);
          } catch (e) { /* ignore */ }
        }
      });
    });
  } catch (e) { /* ignore */ }

  // POST-FIX 2: propaga Date através de referências simples (ex.: f: 'C10' -> copia C10 como Date para C*)
  try {
    const simpleRefRE = /^\s*\$?([A-Z]+)\$?(\d+)\s*$/i;
    Object.keys(wb.Sheets || {}).forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      Object.keys(ws || {}).forEach(addr => {
        if (addr[0] === '!') return;
        const cell = ws[addr];
        if (!cell || !cell.f) return;
        const f = String(cell.f).trim();
        // aceita casos simples: "C10" ou "$C$10" (sem operações)
        const m = f.match(simpleRefRE);
        if (!m) return;
        const ref = `${m[1].toUpperCase()}${m[2]}`;
        const refCell = ws[ref];
        if (!refCell) return;
        // se a célula referenciada é Date (ou um número grande que representa ms), copie como Date
        if (refCell.t === 'd' || (refCell.v instanceof Date) || (typeof refCell.v === 'number' && Math.abs(refCell.v) > 24 * 60 * 60 * 1000)) {
          try {
            let dv = refCell.v;
            if (typeof dv === 'number') dv = new Date(dv);
            // grava Date e evita que engine sobrescreva (remover fórmula)
            cell.v = new Date(dv);
            cell.t = 'd';
            delete cell.w;
            cell._postFixed = true;
            delete cell.f;
            log(`Propagated Date ${sheetName}!${addr} <= ${sheetName}!${ref}`);
          } catch (e) { /* ignore */ }
        }
      });
    });
  } catch (e) { /* ignore */ }

  // PRE-FILL coluna E: se existir E8 numérico e C11 (prazo) numérico, preenche E9..E(last) com sequência
  try {
    Object.keys(wb.Sheets || {}).forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      if (!ws) return;
      const startAddr = 'E8';
      const startCell = ws[startAddr];
      if (!startCell || typeof startCell.v !== 'number') return;
      const prazoCell = ws['C11'] || ws['$C$11'];
      const prazo = (prazoCell && typeof prazoCell.v === 'number' && Number.isFinite(prazoCell.v))
        ? Math.max(0, Math.floor(prazoCell.v))
        : null;
      if (prazo == null || prazo <= 1) return;
      const startRow = 8;
      const lastRow = startRow + prazo - 1; // inclusive (E8..E(lastRow) total = prazo entries)
      for (let row = startRow + 1; row <= lastRow; row++) {
        const addr = `E${row}`;
        const cell = ws[addr];
        // só escreve se célula não existir ou estiver vazia (evita sobrescrever fórmulas existentes)
        if (!cell || (cell && !cell.f && (cell.v === undefined || cell.v === null || cell.v === ''))) {
          ws[addr] = { t: 'n', v: Number(startCell.v) + (row - startRow), z: '#,##0.00' };
        }
      }
      log(`Pre-filled ${sheetName}!E${startRow + 1}..E${lastRow} based on E8=${startCell.v} and prazo=${prazo}`);
    });
  } catch (e) { /* ignore */ }

  // RESTAURA fórmulas originais para colunas diferentes de E e F, se por acaso foram removidas
  // (mantém E/F como valores; restaura G..S etc)
  try {
    if (wbOriginalFormulas && Array.isArray(wb.SheetNames)) {
      wb.SheetNames.forEach((sheetName) => {
        const wsOrig = wbOriginalFormulas.Sheets && wbOriginalFormulas.Sheets[sheetName];
        const ws = wb.Sheets && wb.Sheets[sheetName];
        if (!wsOrig || !ws) return;
        Object.keys(wsOrig).forEach((addr) => {
          if (addr[0] === '!') return;
          const m = addr.match(/^([A-Z]+)(\d+)$/i);
          if (!m) return;
          const col = m[1].toUpperCase();
          // preserva apenas E/F como valores; restaura fórmulas para outras colunas
          if (col === 'E' || col === 'F') return;
          const origCell = wsOrig[addr];
          const curCell = ws[addr];
          if (origCell && origCell.f && (!curCell || !curCell.f) && !(curCell && curCell._preFixed)) {
            // restaura fórmula e remove v/w para forçar recalculo pelo engine
            ws[addr] = Object.assign({}, curCell || {}, { f: origCell.f });
            delete ws[addr].v;
            delete ws[addr].w;
            log(`[loadAndCalc] restored formula ${sheetName}!${addr}`);
          }
        });
      });
    }
  } catch (e) {
    log('[loadAndCalc] restore fórmulas step failed:', e && e.message);
  }

  // IMPORTANTE: após preencher E (e/ou F) manualmente, execute o recálculo agora
  // para que as demais colunas que possuem fórmulas sejam calculadas com esses novos valores.
  try {
    // executa recalc uma vez (ou mais vezes se preferir); desativa log_error para reduzir ruído
    XLSX_CALC(wb, { continue_after_error: true, log_error: false });
    log('Recalc executed after pre-fill E/F to populate dependent formulas');
  } catch (e) {
    console.warn('[excelPMTapi] Recalc after pre-fill failed:', e && e.message);
  }

  // --- PRE-COMPUTE / FIX: corrige células que o engine deixou sem valor (ex.: K8)
  Object.keys(wb.Sheets || {}).forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    Object.keys(ws || {}).forEach(addr => {
      if (addr[0] === '!') return;
      const cell = ws[addr];
      if (!cell || !cell.f) return;
      const formula = String(cell.f || '').toUpperCase();

      // identifica candidates (aceita variações com IF/IFERROR envolvendo ROUND(...,2) e ^)
      const looksLikeTarget = formula.includes('ROUND') && formula.includes('^') && formula.includes('(1+') && formula.includes(',2)');
      if (!looksLikeTarget) return;

      // extrai referências A1 (remove $)
      const refs = (cell.f.match(/([A-Z]+\$?\d+)/gi) || []).map(r => r.replace(/\$/g, '').toUpperCase());
      const cref = refs.find(r => /^C\d+$/.test(r));
      const gref = refs.find(r => /^G\d+$/.test(r));
      const iref = refs.find(r => /^I\d+$/.test(r));
      const eref = refs.find(r => /^E\d+$/.test(r)); // se houver condicionamento IF(E*,...,...)

      if (!cref || !gref || !iref) return;

      // se a fórmula depende de E* e E* está vazio, respeita o IF(E="","",...) e NÃO calcula
      if (eref) {
        const eCell = ws[eref];
        const eVal = eCell ? eCell.v : undefined;
        if (eVal === '' || eVal === undefined || eVal === null) {
          return;
        }
      }

      // pega valores JÁ atualizados pelo XLSX_CALC
      const crefCell = ws[cref];
      const grefCell = ws[gref];
      const irefCell = ws[iref];
      const cv = crefCell && typeof crefCell.v === 'number' ? Number(crefCell.v) : NaN;
      let gv = grefCell && typeof grefCell.v === 'number' ? Number(grefCell.v) : NaN;
      const iv = irefCell && typeof irefCell.v === 'number' ? Number(irefCell.v) : NaN;

      if (Number.isNaN(cv) || Number.isNaN(gv) || Number.isNaN(iv)) return;

      try {
        const DAY_MS = 24 * 60 * 60 * 1000;
        const origGv = gv;
        if (Math.abs(gv) > DAY_MS) gv = gv / DAY_MS; // heurística ms -> dias
        if (Math.abs(gv) > 1e7) {
          log(`Pre-fix skipped ${sheetName}!${addr}: exponent too large (${origGv} -> ${gv})`);
          return;
        }
        const pow = Math.pow(1 + cv, gv);
        if (!Number.isFinite(pow)) {
          log(`Pre-fix skipped ${sheetName}!${addr}: pow not finite (cv=${cv}, gv=${origGv} -> ${gv})`);
          return;
        }
        const raw = (pow - 1) * iv;
        if (!Number.isFinite(raw)) {
          log(`Pre-fix skipped ${sheetName}!${addr}: raw not finite`);
          return;
        }
        const rounded = Number(raw.toFixed(2));
        // grava apenas se necessário e marca como pré-fixada
        if (cell.v !== rounded) {
          cell.v = rounded;
          cell.t = 'n';
          delete cell.w;
        }
        // preserva valor fixado removendo a fórmula (impede sobrescrita posterior)
        cell._preFixed = true;
        delete cell.f;
        log(`Pre-fixed ${sheetName}!${addr} => ${rounded} (from ${cref}=${cv}, ${gref}=${origGv} -> ${gv}, ${iref}=${iv})`);
      } catch (e) {
        /* ignore */
      }
    });
  });

  // LIMPA valores em cache (v, w) de células com fórmula para forçar recálculo limpo,
  // mas PRESERVA as células que pré-calculamos (cell._preFixed) e PRESERVA fórmulas de auto-fill.
  // ADDED: preserva apenas intervalo E[startRowOfSeries .. startRowOfSeries + prazo] quando possível.
  Object.keys(wb.Sheets || {}).forEach(sheetName => {
    const ws = wb.Sheets[sheetName];

    // detecta início da série na coluna E (ex.: fórmula que referencia E{row-1})
    let seriesStartRow = null;
    Object.keys(ws || {}).forEach(a => {
      if (a[0] === '!') return;
      const m = a.match(/^E(\d+)$/i);
      if (!m) return;
      const addrRow = Number(m[1]);
      const cell = ws[a];
      if (!cell || !cell.f) return;
      const f = String(cell.f).replace(/\$+/g, '');
      const refs = (f.match(/([A-Z]+)(\d+)/g) || []);
      const hasPrevRef = refs.some(r => {
        const mm = r.match(/^([A-Z]+)(\d+)$/i);
        if (!mm) return false;
        return mm[1].toUpperCase() === 'E' && Number(mm[2]) === addrRow - 1;
      });
      if (hasPrevRef) {
        if (seriesStartRow === null || addrRow < seriesStartRow) seriesStartRow = addrRow;
      }
    });

    // tenta ler prazo em C11 (fallbacks conservadores)
    const prazoCell = ws['C11'];
    const prazo = (prazoCell && typeof prazoCell.v === 'number' && Number.isFinite(prazoCell.v)) ? Math.max(0, Math.floor(prazoCell.v)) : null;

    // define intervalo a preservar na coluna E
    let preserveEfrom = null, preserveEto = null;
    if (seriesStartRow && prazo != null) {
      preserveEfrom = seriesStartRow;
      preserveEto = seriesStartRow + prazo; // inclusive
      log(`Preserving column E ${sheetName}!E${preserveEfrom}..E${preserveEto} based on detected seriesStart=${seriesStartRow} and prazo=${prazo}`);
    } else {
      // fallback: preservar toda coluna E (comportamento anterior conservador)
      preserveEfrom = null;
      preserveEto = null;
      log(`Could not detect seriesStart/prazo for ${sheetName} - preserving whole column E`);
    }

    // agora limpa cache exceto células pré-fixadas ou preservadas na coluna E
    Object.keys(ws || {}).forEach(addr => {
      if (addr[0] === '!') return;
      const cell = ws[addr];
      if (cell && cell.f) {
        if (cell._preFixed) return; // não remover o valor que precomputamos

        // se coluna E e intervalo detectado, preserva apenas se dentro do intervalo
        const colMatch = addr.match(/^([A-Z]+)(\d+)$/i);
        if (colMatch) {
          const colName = colMatch[1].toUpperCase();
          const rowNum = Number(colMatch[2]);
          if (colName === 'E') {
            if (preserveEfrom != null && preserveEto != null) {
              if (rowNum >= preserveEfrom && rowNum <= preserveEto) {
                return; // preserva fórmula de E dentro do intervalo
              }
            } else {
              // preserve whole column E when detection failed
              return;
            }
          }
        }

        // Detecta fórmulas de auto-fill simples: referencia a célula da mesma coluna na linha anterior
        const autoFillPattern = (() => {
          try {
            const f = String(cell.f).replace(/\$+/g, '');
            const refs = (f.match(/([A-Z]+)(\d+)/g) || []);
            if (refs.length === 0) return false;
            const addrMatch = addr.match(/^([A-Z]+)(\d+)$/i);
            if (!addrMatch) return false;
            const col = addrMatch[1].toUpperCase();
            const row = Number(addrMatch[2]);
            return refs.some(r => {
              const m = r.match(/^([A-Z]+)(\d+)$/i);
              if (!m) return false;
              return m[1].toUpperCase() === col && Number(m[2]) === row - 1;
            });
          } catch (e) {
            return false;
          }
        })();

        if (autoFillPattern) {
          return; // preserva auto-fill simples
        }

        delete cell.v;
        delete cell.w;
      }
    });
  });

  // recalcula usando xlsx-calc (gera cell.v com os resultados)
  // Recalcula repetidamente até estabilizar (propaga séries/depêndencias em cascata)
  try {
    const countPopulated = (workbook) => {
      let count = 0;
      Object.keys(workbook.Sheets || {}).forEach(sName => {
        const ws = workbook.Sheets[sName];
        Object.keys(ws || {}).forEach (a => {
          if (a[0] === '!') return;
          const c = ws[a];
          if (c && c.v !== undefined && c.v !== null) count++;
        });
      });
      return count;
    };

    let prev = -1;
    const MAX_ITER = 5;
    for (let iter = 1; iter <= MAX_ITER; iter++) {
      try {
        XLSX_CALC(wb, { continue_after_error: true, log_error: true });
      } catch (e) {
        log('XLSX_CALC error on iteration', iter, e && e.message);
      }
      const cur = countPopulated(wb);
      log(`Recalc iteration ${iter}: populatedCells=${cur}`);
      if (cur === prev) {
        log('Recalc stabilized');
        break;
      }
      prev = cur;
    }
  } catch (e) {
    log('Final recalculation loop error:', e && e.message);
  }

  // POST-FIX: converte resultados em ms (timestamp) gerados por funções de data em Date (cell.t='d')
  try {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const dateFuncsRegex = /\b(DATAM|EDATE|TODAY|DATE|HOJE)\s*\(|\bEDATE\b|\bDATAM\b/i;
    Object.keys(wb.Sheets || {}).forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      Object.keys(ws || {}).forEach(addr => {
        if (addr[0] === '!') return;
        const cell = ws[addr];
        if (!cell) return;
        const formula = String(cell.f || '');
        // se a célula resultado de função de data tem um número grande (ms), converte em Date
        if (formula && dateFuncsRegex.test(formula) && typeof cell.v === 'number' && Math.abs(cell.v) > DAY_MS) {
          try {
            cell.v = new Date(cell.v);
            cell.t = 'd';
            delete cell.w;
            log(`Post-convert ${sheetName}!${addr} ms->Date for date-func result`);
          } catch (e) { /* ignore */ }
        }
      });
    });
  } catch (e) { /* ignore */ }

  // POST-FIX 2: propaga Date através de referências simples (ex.: f: 'C10' -> copia C10 como Date para C*)
  try {
    const simpleRefRE = /^\s*\$?([A-Z]+)\$?(\d+)\s*$/i;
    Object.keys(wb.Sheets || {}).forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      Object.keys(ws || {}).forEach(addr => {
        if (addr[0] === '!') return;
        const cell = ws[addr];
        if (!cell || !cell.f) return;
        const f = String(cell.f).trim();
        // aceita casos simples: "C10" ou "$C$10" (sem operações)
        const m = f.match(simpleRefRE);
        if (!m) return;
        const ref = `${m[1].toUpperCase()}${m[2]}`;
        const refCell = ws[ref];
        if (!refCell) return;
        // se a célula referenciada é Date (ou um número grande que representa ms), copie como Date
        if (refCell.t === 'd' || (refCell.v instanceof Date) || (typeof refCell.v === 'number' && Math.abs(refCell.v) > 24 * 60 * 60 * 1000)) {
          try {
            let dv = refCell.v;
            if (typeof dv === 'number') dv = new Date(dv);
            // grava Date e evita que engine sobrescreva (remover fórmula)
            cell.v = new Date(dv);
            cell.t = 'd';
            delete cell.w;
            cell._postFixed = true;
            delete cell.f;
            log(`Propagated Date ${sheetName}!${addr} <= ${sheetName}!${ref}`);
          } catch (e) { /* ignore */ }
        }
      });
    });
  } catch (e) { /* ignore */ }

  // PRE-FILL coluna E: se existir E8 numérico e C11 (prazo) numérico, preenche E9..E(last) com sequência
  try {
    Object.keys(wb.Sheets || {}).forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      if (!ws) return;
      const startAddr = 'E8';
      const startCell = ws[startAddr];
      if (!startCell || typeof startCell.v !== 'number') return;
      const prazoCell = ws['C11'] || ws['$C$11'];
      const prazo = (prazoCell && typeof prazoCell.v === 'number' && Number.isFinite(prazoCell.v))
        ? Math.max(0, Math.floor(prazoCell.v))
        : null;
      if (prazo == null || prazo <= 1) return;
      const startRow = 8;
      const lastRow = startRow + prazo - 1; // inclusive (E8..E(lastRow) total = prazo entries)
      for (let row = startRow + 1; row <= lastRow; row++) {
        const addr = `E${row}`;
        const cell = ws[addr];
        // só escreve se célula não existir ou estiver vazia (evita sobrescrever fórmulas existentes)
        if (!cell || (cell && !cell.f && (cell.v === undefined || cell.v === null || cell.v === ''))) {
          ws[addr] = { t: 'n', v: Number(startCell.v) + (row - startRow), z: '#,##0.00' };
        }
      }
      log(`Pre-filled ${sheetName}!E${startRow + 1}..E${lastRow} based on E8=${startCell.v} and prazo=${prazo}`);
    });
  } catch (e) { /* ignore */ }

  // RESTAURA fórmulas originais para colunas diferentes de E e F, se por acaso foram removidas
  // (mantém E/F como valores; restaura G..S etc)
  try {
    if (wbOriginalFormulas && Array.isArray(wb.SheetNames)) {
      wb.SheetNames.forEach((sheetName) => {
        const wsOrig = wbOriginalFormulas.Sheets && wbOriginalFormulas.Sheets[sheetName];
        const ws = wb.Sheets && wb.Sheets[sheetName];
        if (!wsOrig || !ws) return;
        Object.keys(wsOrig).forEach((addr) => {
          if (addr[0] === '!') return;
          const m = addr.match(/^([A-Z]+)(\d+)$/i);
          if (!m) return;
          const col = m[1].toUpperCase();
          // não restaurar fórmulas para E/F (queremos manter valores escritos em E/F)
          if (col === 'E' || col === 'F') return;
          const origCell = wsOrig[addr];
          const curCell = ws[addr];
          // restaura somente quando orig tinha fórmula e a atual não tem,
          // e não foi intencionalmente pré-fixada/post-fixed
          if (origCell && origCell.f && (!curCell || !curCell.f) && !(curCell && (curCell._preFixed || curCell._postFixed))) {
            ws[addr] = Object.assign({}, curCell || {}, { f: origCell.f });
            delete ws[addr].v;
            delete ws[addr].w;
            log(`[loadAndCalc] restored missing formula ${sheetName}!${addr}`);
          }
        });
      });
      // recalc rápido para popular .v/.w das fórmulas restauradas
      try { XLSX_CALC(wb, { continue_after_error: true, log_error: false }); } catch (e) { /* ignore */ }
    }
  } catch (e) {
    log('[loadAndCalc] final restore step failed:', e && e.message);
  }

  return wb;
}

/**
 * readRangeValues - retorna um 2D-array (linhas x colunas) com os resultados das células
 * - range: string no formato "E2:S200" ou similar
 * - trimEmptyRows: remove linhas vazias (todas as colunas vazias) se true
 *
 * usa raw: true para preservar tipos (number, Date, boolean) ao invés de strings formatadas.
 */
function readRangeValues({ filePath, sheet, range, trimEmptyRows = true }) {
  const wb = loadAndCalc(filePath);
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Aba não encontrada: ${sheet}`);

  // sheet_to_json com header:1 retorna array de arrays; raw:true entrega valores brutos (números, Date, strings)
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    range,
    blankrows: false,
    raw: true,
  });

  const normalized = rows.map((r) => (Array.isArray(r) ? r.map(normalizeValue) : []));

  if (!trimEmptyRows) return normalized;
  const notEmpty = (row) => row?.some((v) => v !== undefined && v !== null && `${v}`.trim() !== '');
  return normalized.filter(notEmpty);
}

// --- NEW: readRangeValuesFromWorkbook - usa workbook já recalculado (não chama loadAndCalc) ---
function readRangeValuesFromWorkbook({ wb, sheet, range, trimEmptyRows = true }) {
  if (!wb) throw new Error('readRangeValuesFromWorkbook: workbook não informado')
  const ws = wb.Sheets[sheet]
  if (!ws) throw new Error(`Aba não encontrada: ${sheet}`)

  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    range,
    blankrows: false,
    raw: true,
  })

  const normalized = rows.map((r) => (Array.isArray(r) ? r.map(normalizeValue) : []))

  if (!trimEmptyRows) return normalized
  const notEmpty = (row) => row?.some((v) => v !== undefined && v !== null && `${v}`.trim() !== '')
  return normalized.filter(notEmpty)
}

// --- NEW: readRangeCellsFromWorkbook - retorna matriz com metadados por célula ---
function readRangeCellsFromWorkbook({ wb, sheet, range, trimEmptyRows = true }) {
  if (!wb) throw new Error('readRangeCellsFromWorkbook: workbook não informado')
  const ws = wb.Sheets[sheet]
  if (!ws) throw new Error(`Aba não encontrada: ${sheet}`)

  const dec = decodeRange(range)
  const rows = []
  for (let R = dec.s.r; R <= dec.e.r; ++R) {
    const rowArr = []
    for (let C = dec.s.c; C <= dec.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C })
      const cell = ws[addr]
      const raw = cell ? cell.v : null
      const txt = cell ? (cell.w || (cell.t === 'd' && cell.v instanceof Date ? (cell.v.toISOString() || '') : undefined)) : undefined
      const formula = cell ? (cell.f || null) : null
      const type = cell ? cell.t : null
      rowArr.push({
        address: addr,
        rawValue: raw,
        value: normalizeValue(raw),
        text: typeof txt === 'string' ? txt : (typeof raw === 'string' ? raw : undefined),
        formula,
        type,
        _cell: cell // kept for deeper inspection if needed
      })
    }
    // opção de remover linhas totalmente vazias
    if (!trimEmptyRows) rows.push(rowArr)
    else {
      const notEmpty = rowArr.some(c => c.rawValue !== undefined && c.rawValue !== null && `${c.rawValue}`.trim() !== '')
      if (notEmpty) rows.push(rowArr)
    }
  }
  return { rows, dec }
}

/**
 * auditRange - percorre células do intervalo e retorna:
 * - functionsUsed: lista de funções encontradas em fórmulas (nome, count)
 * - totalFormulaCells, totalErrors, errors[]
 */
function auditRange({ filePath, sheet, range }) {
  const wb = loadAndCalc(filePath);
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Aba não encontrada: ${sheet}`);

  const r = decodeRange(range);
  const functionsCount = new Map();
  const formulaCells = [];
  const errorCells = [];

  for (let R = r.s.r; R <= r.e.r; ++R) {
    for (let C = r.s.c; C <= r.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;

      // fórmulas em XLSX ficam em cell.f (em inglês: IF, SUM, VLOOKUP, etc.)
      if (cell.f && typeof cell.f === 'string') {
        formulaCells.push({ address: addr, formula: cell.f });
        const names = (cell.f.match(/([A-Za-z_\.]+)\s*\(/g) || []).map((m) => m.replace('(', '').trim());
        names.forEach((fn) => functionsCount.set(fn, (functionsCount.get(fn) || 0) + 1));
      }

      // erros de cálculo são representados por tipo 'e' e podem estar em cell.w/cell.v
      if (cell.t === 'e' || (cell.v === undefined && cell.w && String(cell.w).toUpperCase().includes('#'))) {
        errorCells.push({ address: addr, error: cell.w || cell.v, formula: cell.f || null });
      }
    }
  }

  const functionsUsed = Array.from(functionsCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return { functionsUsed, totalFormulaCells: formulaCells.length, totalErrors: errorCells.length, errors: errorCells };
}

/**
 * compareRanges - compara dois ranges já recalculados no workbook com tolerância numérica (ex.: 0.01 = 1 centavo)
 * retorna diffs com row/col relativos ao intervalo (1-based)
 */
function compareRanges({ filePath, left: { sheet: sheetL, range: rangeL }, right: { sheet: sheetR, range: rangeR }, tolerance = 0.01 }) {
  const left = readRangeValues({ filePath, sheet: sheetL, range: rangeL, trimEmptyRows: true });
  const right = readRangeValues({ filePath, sheet: sheetR, range: rangeR, trimEmptyRows: true });

  const rows = Math.min(left.length, right.length);
  const diffs = [];

  for (let i = 0; i < rows; i++) {
    const lc = left[i] || [];
    const rc = right[i] || [];
    const cols = Math.min(lc.length, rc.length);
    for (let c = 0; c < cols; c++) {
      const lv = lc[c];
      const rv = rc[c];

      // datas primeiro: converte e compara date-only
      const lDate = toDateOnlyFromValue(lv);
      const rDate = toDateOnlyFromValue(rv);
      let equal = false;
      if (lDate && rDate) {
        equal = lDate.getTime() === rDate.getTime();
      } else {
        // depois números
        const lvn = (typeof lv === 'number') ? lv : (Number(lv));
        const rvn = (typeof rv === 'number') ? rv : (Number(rv));
        const bothNum = !Number.isNaN(lvn) && !Number.isNaN(rvn);
        if (bothNum) {
          equal = Math.abs(lvn - rvn) <= tolerance;
        } else {
          const sLv = lv == null ? '' : String(lv).trim();
          const sRv = rv == null ? '' : String(rv).trim();
          equal = sLv === sRv;
        }
      }

      if (!equal) {
        diffs.push({
          row: i + 1,
          col: c + 1,
          left: lv,
          right: rv,
        });
      }
    }
  }

  return {
    leftRowCount: left.length,
    rightRowCount: right.length,
    diffCount: diffs.length,
    diffs,
  };
}

/**
 * compareColsRange - compara colunas startCol..endCol entre duas abas (E..S por padrão)
 * retorna { failures: [...], totalCompared, totalPassed, leftRange, rightRange }
 */
function compareColsRange({ filePath, sheetLeft, sheetRight, startCol = 'E', endCol = 'S', startRow = 1, endRow = null, tolerance = 0.01 }) {
  // garante variáveis iniciais para evitar ReferenceError
  // ensure comparators collection and counters
  const comparisons = [];
  let totalCompared = 0;
  let totalPassed = 0;
  const failures = [];

  // compat layer: garante objeto args mesmo se a função for chamada com destructuring
  // permite usar flags como logEachComparison / treatEmptyAsZero sem ReferenceError
  const args = (typeof arguments !== 'undefined' && arguments[0]) ? arguments[0] : {};
  const logEachComparison = !!args.logEachComparison;
  const treatEmptyAsZero = !!args.treatEmptyAsZero;

  // recalcula workbook apenas UMA vez e reutiliza para leitura dos ranges
  // loadAndCalc deve retornar o workbook já calculado; reforçamos com recalc
  const wb = loadAndCalc(filePath)
  // garantimos ao menos uma recalc adicional para popular .v/.w quando houver fórmulas
  try {
    for (let i = 0; i < 3; i++) {
      // continue_after_error evita throw por células com erro; log_error desliga logs ruidosos
      XLSX_CALC(wb, { continue_after_error: true, log_error: false })
    }
  } catch (e) {
    // não interromper fluxo por erros de cálculo; deixamos valores como estão
    console.warn('[excelPMTapi] XLSX_CALC finalization failed:', e && e.message)
  }
  const wsL = wb.Sheets[sheetLeft]
  const wsR = wb.Sheets[sheetRight]

  if (!wsL) throw new Error(`Aba não encontrada: ${sheetLeft}`)
  if (!wsR) throw new Error(`Aba não encontrada: ${sheetRight}`)

  // se endRow não informado, use limite máximo entre as duas abas
  const refL = wsL['!ref'] ? decodeRange(wsL['!ref']) : null
  const refR = wsR['!ref'] ? decodeRange(wsR['!ref']) : null
  const maxRowL = refL ? (refL.e.r + 1) : startRow
  const maxRowR = refR ? (refR.e.r + 1) : startRow
  const maxRow = endRow ? Number(endRow) : Math.max(maxRowL, maxRowR)

  const leftRange = `${startCol}${startRow}:${endCol}${maxRow}`
  const rightRange = `${startCol}${startRow}:${endCol}${maxRow}`

  // lê os ranges A PARTIR do workbook já recalculado (sem novo loadAndCalc)
  const leftInfo = readRangeCellsFromWorkbook({ wb, sheet: sheetLeft, range: leftRange, trimEmptyRows: false })
  const rightInfo = readRangeCellsFromWorkbook({ wb, sheet: sheetRight, range: rightRange, trimEmptyRows: false })

  const left = leftInfo.rows
  const right = rightInfo.rows
  const decLeft = leftInfo.dec
  const decRight = rightInfo.dec

  // AUDIT simples das fórmulas/erros no intervalo (left + right) usando os ws já carregados
  function auditSheetRange(ws, dec) {
    const functionsCount = new Map()
    const errors = []
    let totalFormulaCells = 0
    for (let R = dec.s.r; R <= dec.e.r; ++R) {
      for (let C = dec.s.c; C <= dec.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C })
        const cell = ws[addr]
        //log('Depuração:', { addr, cell, C13: ws && ws['I8'] ? ws['I8'].v : undefined });
        // ...dentro do loop de comparação em compareColsRange...
        try {
          log('[DEBUG] sheetLeft name:', sheetLeft);
          log('[DEBUG] wsL !ref:', wsL['!ref']);
          log('[DEBUG] raw wsL[H9]:', wsL['H9']); // objeto da biblioteca xlsx (t,v,f,w,...)
          // se você já tem leftInfo e decLeft:
          log('[DEBUG] leftInfo.dec:', leftInfo && leftInfo.dec);
          // e mostre o conteúdo da row/col lida
          const sampleRowIndex = (8 /*startRow*/ - (leftInfo.dec ? leftInfo.dec.s.r : 1));
          log('[DEBUG] left rows sample:', (leftInfo.rows && leftInfo.rows[sampleRowIndex]) || leftInfo.rows?.slice(0, 3));
          // detalhe: dump de algumas células críticas (I9,K9,G9)
          try {
            const dump = (ws, addr) => ws && ws[addr] ? { t: ws[addr].t, v: ws[addr].v, w: ws[addr].w, f: ws[addr].f, _preFixed: ws[addr]._preFixed } : null;
            log('[DEBUG] wsL PMT!G9,I9,K9:', dump(wsL, 'G9'), dump(wsL, 'I9'), dump(wsL, 'K9'));
            log('[DEBUG] wsR API!G9,I9,K9:', dump(wsR, 'G9'), dump(wsR, 'I9'), dump(wsR, 'K9'));
          } catch (e) { log('[DEBUG] per-cell dump failed:', e && e.message) }
        } catch (e) {
          log('[ERROR] catch block:', e);
        }
        if (!cell) continue
        if (cell.f && typeof cell.f === 'string') {
          totalFormulaCells++
          const names = (cell.f.match(/([A-Za-z_\.]+)\s*\(/g) || []).map((m) => m.replace('(', '').trim())
          names.forEach((fn) => functionsCount.set(fn, (functionsCount.get(fn) || 0) + 1))
        }
        if (cell.t === 'e' || (cell.w && String(cell.w).toUpperCase().includes('#'))) {
          errors.push({ address: addr, error: cell.w || cell.v, formula: cell.f || null })
        }
      }
    }
    const functionsUsed = Array.from(functionsCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
    return { functionsUsed, totalFormulaCells, totalErrors: errors.length, errors }
  }

  const auditLeft = auditSheetRange(wsL, decLeft)
  const auditRight = auditSheetRange(wsR, decLeft)

  // ADDED: checar M8 em ambos os sheets e nas matrizes lidas
  try {
    const dumpCell = (c) => c ? { t: c.t, v: c.v, w: c.w, f: c.f } : null
    //log('M8 worksheet left:', dumpCell(wsL['M8']))
    //log('K8 worksheet left:', wsL['K8'] ? { t: wsL['K8'].t, v: wsL['K8'].v, w: wsL['K8'].w, f: wsL['K8'].f } : null)
    //log('L8 worksheet left:', wsL['L8'] ? { t: wsL['L8'].t, v: wsL['L8'].v, w: wsL['L8'].w, f: wsL['L8'].f } : null)
    const startColNum = colToNum(startCol)
    const rIdx = 8 - Number(startRow)   // linha 8 -> index (8 - startRow)
    const cIdx = colToNum('M') - startColNum
    //log('M8 from left rows:', left[rIdx] && left[rIdx][cIdx])
    //log('M8 from right rows:', right[rIdx] && right[rIdx][cIdx])
  } catch (e) {
    log('Erro ao checar M8 diagnostico:', e && e.message)
  }

  // número de linhas/colunas comparadas (minutos entre left/right sizes)
  const rows = Math.min(left.length, right.length)
  const cols = (decLeft.e.c - decLeft.s.c + 1)

  // NOTE: variables 'failures', 'comparisons', 'totalCompared' and 'totalPassed'
  // are declared earlier in this function. Do NOT redeclare them here.
  // robust comparison loop: usa metadados das células lidas e popula comparisons/failures corretamente
  for (let r = 0; r < rows; r++) {
    const lc = left[r] || []
    const rc = right[r] || []
    for (let c = 0; c < cols; c++) {
      totalCompared++

      // cell objects da função readRangeCellsFromWorkbook
      const lCellObj = lc[c] || { address: `${numToCol(decLeft.s.c + c + 1)}${startRow + r}` }
      const leftCellAddr = String(lCellObj.address || `${numToCol(decLeft.s.c + c + 1)}${startRow + r}`)

      // Fallback: tenta pegar valor diretamente do workbook recalculado se value/rawValue vierem nulos
      let leftVal = (lCellObj.value !== undefined && lCellObj.value !== null)
        ? lCellObj.value
        : (lCellObj.rawValue !== undefined && lCellObj.rawValue !== null)
          ? lCellObj.rawValue
          : null;

      let leftMeta = { text: lCellObj.text, formula: lCellObj.formula, type: lCellObj.type }

      if (leftVal === null || leftVal === undefined) {
        const cellDirect = wsL[leftCellAddr];
        if (cellDirect) {
          if (cellDirect.v !== undefined && cellDirect.v !== null) leftVal = cellDirect.v;
          else if (cellDirect.w !== undefined && cellDirect.w !== null) leftVal = cellDirect.w;
          // Atualiza metadados se vierem nulos
          if (!leftMeta.formula && cellDirect.f) leftMeta.formula = cellDirect.f;
          if (!leftMeta.type && cellDirect.t) leftMeta.type = cellDirect.t;
        }
      }

      const rightCellObj = rc[c] || { address: `${numToCol(decRight.s.c + c + 1)}${startRow + r}` }
      const rightCellAddr = String(rightCellObj.address || `${numToCol(decRight.s.c + c + 1)}${startRow + r}`)

      // Adicione esta linha para declarar rightVal antes dos fallbacks:
      let rightVal = (rightCellObj.value !== undefined && rightCellObj.value !== null)
        ? rightCellObj.value
        : (rightCellObj.rawValue !== undefined && rightCellObj.rawValue !== null)
          ? rightCellObj.rawValue
          : null;

      // garante rightMeta inicial para evitar ReferenceError
      let rightMeta = { text: rightCellObj && rightCellObj.text, formula: rightCellObj && rightCellObj.formula, type: rightCellObj && rightCellObj.type }

      // fallbacks a partir dos objetos "raw" (não redeclara leftVal/leftMeta que já existem)
      const rawLeftCell = lCellObj || {};
      const rawRightCell = rightCellObj || {};

      if (leftVal === null || leftVal === undefined) {
        leftVal = (rawLeftCell.value !== undefined && rawLeftCell.value !== null)
          ? rawLeftCell.value
          : (rawLeftCell.rawValue !== undefined && rawLeftCell.rawValue !== null)
            ? rawLeftCell.rawValue
            : (rawLeftCell.v !== undefined ? rawLeftCell.v : (rawLeftCell.w !== undefined ? rawLeftCell.w : null));
      }
      if (rightVal === null || rightVal === undefined) {
        rightVal = (rawRightCell.value !== undefined && rawRightCell.value !== null)
          ? rawRightCell.value
          : (rawRightCell.rawValue !== undefined && rawRightCell.rawValue !== null)
            ? rawRightCell.rawValue
            : (rawRightCell.v !== undefined ? rawRightCell.v : (rawRightCell.w !== undefined ? rawRightCell.w : null));
      }

      // atualiza metadados apenas se necessário (não redeclara)
      leftMeta = leftMeta || { text: lCellObj && lCellObj.text, formula: lCellObj && lCellObj.formula, type: lCellObj && lCellObj.type }
      rightMeta = rightMeta || { text: rightCellObj && rightCellObj.text, formula: rightCellObj && rightCellObj.formula, type: rightCellObj && rightCellObj.type }

      // tentativa de converter para date-only quando aplicável
      const lDate = toDateOnlyFromValue(leftVal)
      const rDate = toDateOnlyFromValue(rightVal)

      let ok = false
      if (lDate && rDate) {
        ok = lDate.getTime() === rDate.getTime()
      } else {
        const lNum = (typeof leftVal === 'number') ? leftVal : Number(leftVal)
        const rNum = (typeof rightVal === 'number') ? rightVal : Number(rightVal)
        const bothNum = !Number.isNaN(lNum) && !Number.isNaN(rNum)
        if (bothNum) {
          ok = Math.abs(lNum - rNum) <= tolerance
        } else {
          const sL = leftVal == null ? '' : String(leftVal).trim()
            ;
          const sR = rightVal == null ? '' : String(rightVal).trim();
          ok = sL === sR
        }
      }

      const detalhe = ok ? '' : `expected ${String(leftVal)} but got ${String(rightVal)}`

      // push safe comparison
      try {
        const cmp = {
          leftCell: leftCellAddr,
          rightCell: rightCellAddr,
          left: (leftVal instanceof Date) ? leftVal.toISOString() : leftVal,
          right: (rightVal instanceof Date) ? rightVal.toISOString() : rightVal,
          ok: !!ok,
          detalhe,
          leftMeta,
          rightMeta
        }
        comparisons.push(cmp)
        if (logEachComparison) {
          try { console.log(`[excel:compareCols] ${cmp.ok ? 'OK' : 'FAIL'} ${cmp.leftCell} vs ${cmp.rightCell} — left=${String(cmp.left)} right=${String(cmp.right)}`) } catch (e) { }
        }
        if (cmp.ok) totalPassed++; else failures.push(cmp)
      } catch (e) {
        console.warn('[compareColsRange] push comparison error', e && e.message)
      }
    }
  }

  // normalize comparisons to safe payload
  const safeComparisons = (comparisons || []).map(c => ({
    leftCell: String(c.leftCell || ''),
    rightCell: String(c.rightCell || ''),
    left: (c.left instanceof Date) ? c.left.toISOString() : (c.left === undefined ? null : c.left),
    right: (c.right instanceof Date) ? c.right.toISOString() : (c.right === undefined ? null : c.right),
    ok: !!c.ok,
    detalhe: c.detalhe || null,
    leftMeta: c.leftMeta || null,
    rightMeta: c.rightMeta || null
  }));

  // --- tentativa adicional: se houver muitas comparações com left == null e right != null,
  // recalc *apenas* a sheetLeft e reavaliar essas comparações (não altera sheetRight)
  try {
    const nullLefts = safeComparisons.filter(c => (c.left === null || c.left === undefined || c.left === '') && (c.right !== null && c.right !== undefined && String(c.right) !== ''));
    if (nullLefts.length > 0) {
      log('[compareColsRange] detected null-left comparisons, attempting selective recalc left only:', nullLefts.length);

      // loadAndCalcSelective deve estar disponível (se não, fallback: não faz nada)
      if (typeof loadAndCalcSelective === 'function') {
        const { wbOriginal, wbCalc } = loadAndCalcSelective(filePath, [sheetLeft]);
        if (wbCalc) {
          // helper para extrair valor bruto de uma célula do workbook
          const extractFromSheetCellSimple = (wbObj, sheetName, addr) => {
            try {
              const cell = wbObj && wbObj.Sheets && wbObj.Sheets[sheetName] && wbObj.Sheets[sheetName][addr];
              if (!cell) return null;
              if (cell.v !== undefined && cell.v !== null) return cell.v;
              if (cell.w !== undefined && cell.w !== null) return cell.w;
            } catch (e) { /* ignore */ }
            return null;
          };

          // comparador local (mesma heurística que o loop principal)
          const compareVals = (lv, rv) => {
            const lDate = toDateOnlyFromValue(lv);
            const rDate = toDateOnlyFromValue(rv);
            let okLocal = false;
            if (lDate && rDate) {
              okLocal = lDate.getTime() === rDate.getTime();
            } else {
              const lNum = (typeof lv === 'number') ? lv : Number(lv);
              const rNum = (typeof rv === 'number') ? rv : Number(rv);
              const bothNum = !Number.isNaN(lNum) && !Number.isNaN(rNum);
              if (bothNum) okLocal = Math.abs(lNum - rNum) <= tolerance;
              else {
                const sL = lv == null ? '' : String(lv).trim();
                const sR = rv == null ? '' : String(rv).trim();
                okLocal = sL === sR;
              }
            }
            return { ok: !!okLocal, detalhe: okLocal ? '' : `expected ${String(lv)} but got ${String(rv)}` };
          };

          // reavalia somente as entradas com left vazio
          nullLefts.forEach((entry) => {
            const addr = entry.leftCell;
            const newLeftRaw = extractFromSheetCellSimple(wbCalc, sheetLeft, addr);
            if (newLeftRaw !== null && newLeftRaw !== undefined) {
              // atualiza o safeComparisons entry em-place
              const idx = safeComparisons.findIndex(s => s.leftCell === addr && s.rightCell === entry.rightCell);
              if (idx >= 0) {
                const prevRight = safeComparisons[idx].right;
                const newLeft = (newLeftRaw instanceof Date) ? newLeftRaw.toISOString() : newLeftRaw;
                const { ok: newOk, detalhe: newDetalhe } = compareVals(newLeftRaw, prevRight);
                safeComparisons[idx].left = newLeft;
                safeComparisons[idx].ok = !!newOk;
                safeComparisons[idx].detalhe = newOk ? '' : newDetalhe;
                log('[compareColsRange] selective updated', { addr, newLeft, prevRight, ok: newOk });
              }
            }
          });
        }
      } else {
        log('[compareColsRange] loadAndCalcSelective not available, skipping selective recalc');
      }
    }
  } catch (e) {
    log('[compareColsRange] selective recalc attempt failed:', e && e.message);
  }

  log('[compareColsRange] returning', { totalCompared, totalPassed, comparisons: safeComparisons.length });

  // recompute totals/failures from safeComparisons (defensive)
  const totalComparedComputed = safeComparisons.length;
  const totalPassedComputed = safeComparisons.reduce((acc, c) => acc + (c.ok ? 1 : 0), 0);
  const failuresComputed = safeComparisons.filter(c => !c.ok);

  log('[compareColsRange] computed totals', { totalComparedComputed, totalPassedComputed, failures: failuresComputed.length });

  return {
    failures: failuresComputed,
    totalCompared: totalComparedComputed,
    totalPassed: totalPassedComputed,
    leftRange,
    rightRange,
    comparisons: safeComparisons

  }
}

/**
 * registra tasks para uso em Cypress (nomes compatíveis com o exemplo comentado)
 */
function registerExcelTasks(on) {
  on('task', {
    'excel:readRange'(args) {
      try {
        return readRangeValues(args);
      } catch (e) {
        console.error('[excel:readRange] ERRO:', e.message);
        throw e;
      }
    },

    'excel:auditRange'(args) {
      try {
        return auditRange(args);
      } catch (e) {
        console.error('[excel:auditRange] ERRO:', e.message);
        throw e;
      }
    },

    'excel:compareRanges'(args) {
      try {
        return compareRanges(args);
      } catch (e) {
        console.error('[excel:compareRanges] ERRO:', e.message);
        throw e;
      }
    },

    // novo: compara colunas startCol..endCol entre duas abas e retorna somente falhas + totais
    'excel:compareCols'(args) {
      try {
        return compareColsRange(args);
      } catch (e) {
        console.error('[excel:compareCols] ERRO:', e.message);
        throw e;
      }
    },
  });
}



// export defensivo: registra apenas o que existe para evitar ReferenceErrors ao require()
const _internal = {}
if (typeof readRangeValues === 'function') _internal.readRangeValues = readRangeValues
if (typeof readRangeValuesFromWorkbook === 'function') _internal.readRangeValuesFromWorkbook = readRangeValuesFromWorkbook
if (typeof readRangeCellsFromWorkbook === 'function') _internal.readRangeCellsFromWorkbook = readRangeCellsFromWorkbook
if (typeof auditRange === 'function') _internal.auditRange = auditRange
if (typeof compareRanges === 'function') _internal.compareRanges = compareRanges
if (typeof compareColsRange === 'function') _internal.compareColsRange = compareColsRange
if (typeof loadAndCalc === 'function') _internal.loadAndCalc = loadAndCalc
if (typeof loadAndCalcSelective === 'function') _internal.loadAndCalcSelective = loadAndCalcSelective

const exported = {
  // registra tasks no setupNodeEvents, se a função existir
  registerExcelTasks: (typeof registerExcelTasks === 'function') ? registerExcelTasks : function(on) {
    // fallback mínimo: tenta expor compareColsRange se disponível
    if (typeof _internal.compareColsRange === 'function') {
      on('task', { 'excel:compareCols'(args) { return _internal.compareColsRange(args) } })
      console.log('[excelPMTapi] fallback registerExcelTasks: registered excel:compareCols')
    } else {
      console.warn('[excelPMTapi] registerExcelTasks not available and no fallback found')
    }
  },
  _internal
}

module.exports = exported

// tenta converter vários tipos em Date (date-only) ou retorna null
function toDateOnlyFromValue(v) {
  if (v == null || v === '') return null
  if (v instanceof Date && !Number.isNaN(v.getTime())) return toDateOnly(v)
  if (typeof v === 'string') {
    const d1 = parseDDMMYYYY(v)
    if (d1) return toDateOnly(d1)
    const iso = new Date(v)
    if (!Number.isNaN(iso.getTime())) return toDateOnly(iso)
    return null
  }
  if (typeof v === 'number' && !Number.isNaN(v)) {
    // tenta excel serial primeiro
    try {
      const ex = excelSerialToDate(v)
      if (ex) return toDateOnly(ex)
    } catch (e) { /* ignore */ }
    // fallback para timestamp ms
    const ts = new Date(v)
    if (!Number.isNaN(ts.getTime())) return toDateOnly(ts)
  }
  return null
}