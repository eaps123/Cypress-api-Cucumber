const fs = require('fs')
const path = require('path')
const ExcelJS = require('exceljs')
const lodashGet = require('lodash.get')
const { parseDDMMYYYY, toDateOnly, formatDateToDDMMYYYY, normalizeValue: commonNormalizeValue, normalizeNumberString } = require('./excelCommon')

const DEBUG = !!process.env.DEBUG_EXCELUTILS

function log(...args) { if (DEBUG) console.log('[excelUtils]', ...args) }
function warn(...args) { console.warn('[excelUtils]', ...args) }
function error(...args) { console.error('[excelUtils]', ...args) }

// --- ADDED HELPERS: openWorkbook, getWorksheetOrFirst, formatForExcel, normalizeForCompare ---
async function openWorkbook(caminho) {
  if (!caminho) throw new Error('openWorkbook: caminho não informado')
  const workbook = new ExcelJS.Workbook()
  // tenta ler como arquivo; lança erro se não existir
  if (!fs.existsSync(caminho)) throw new Error(`openWorkbook: arquivo não encontrado ${caminho}`)
  await workbook.xlsx.readFile(caminho)
  return workbook
}

function getWorksheetOrFirst(workbook, sheetName) {
  if (!workbook) throw new Error('getWorksheetOrFirst: workbook inválido')
  if (sheetName) {
    const byName = workbook.getWorksheet(sheetName)
    if (byName) return byName
    // tentar indexado por número quando sheetName for number-like
    const idx = Number(sheetName)
    if (!Number.isNaN(idx) && workbook.worksheets[idx - 1]) return workbook.worksheets[idx - 1]
  }
  // fallback para primeira aba
  if (workbook.worksheets && workbook.worksheets.length > 0) return workbook.worksheets[0]
  throw new Error('getWorksheetOrFirst: nenhuma aba encontrada no workbook')
}

/**
 * formatForExcel - formata valor conforme map (date/number/percent) antes de escrever em célula
 */
function formatForExcel(value, map) {
  if (value == null) return null
  const fmt = map && map.format

  // map format: usa valueMap para converter valores (ex.: true -> "SIM")
  if (fmt === 'map') {
    const vm = map && map.valueMap
    if (vm && typeof vm === 'object') {
      const key = value === null || value === undefined ? '' : String(value)
      // tentativa direta
      if (Object.prototype.hasOwnProperty.call(vm, key)) return vm[key]
      // tentativa case-insensitive
      const found = Object.keys(vm).find(k => String(k).toLowerCase() === String(key).toLowerCase())
      if (found) return vm[found]
      // se boolean, tentar 'true'/'false'
      if (typeof value === 'boolean') {
        const bKey = value ? 'true' : 'false'
        if (Object.prototype.hasOwnProperty.call(vm, bKey)) return vm[bKey]
      }
      // se number/string sem match, retornar null (não escrever)
      return null
    }
    // sem valueMap definido -> stringify fallback
    return String(value)
  }

  if (fmt === 'date') {
    if (value instanceof Date) return toDateOnly(value)
    if (typeof value === 'string') {
      const p = parseDDMMYYYY(value) || new Date(value)
      if (p && !Number.isNaN(p.getTime())) return toDateOnly(p)
    }
    if (typeof value === 'number') {
      // tratar excel serial ou timestamp
      const d = toDateOnly(value)
      if (d) return d
    }
    return null
  }
  if (fmt === 'number' || fmt === 'numberBR' || fmt === 'integer') {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const cleaned = String(value).replace(/\./g, '').replace(',', '.').replace('%', '')
      const n = Number(cleaned)
      return Number.isNaN(n) ? null : n
    }
    const n = Number(value)
    return Number.isNaN(n) ? null : n
  }
  if (fmt === 'percent') {
    return value / 100
  }
  // default: use commonNormalizeValue to trim/convert BR numbers
  return commonNormalizeValue(value)
}

/**
 * normalizeForCompare - normaliza valor vindo do Excel para comparação (string/number/date/boolean/null)
 */
function normalizeForCompare(excelValue, map) {
  const raw = normalizeFromExcel(excelValue)
  if (raw == null || raw === '') return null
  const fmt = map && map.format
  // dates
  if (fmt === 'date') {
    const d = (raw instanceof Date) ? toDateOnly(raw) : (typeof raw === 'string' ? (parseDDMMYYYY(raw) || new Date(raw)) : toDateOnly(Number(raw)))
    if (!d || Number.isNaN(d.getTime())) return null
    return d.toISOString().slice(0, 10)
  }
  // numbers / percent
  if (fmt === 'number' || fmt === 'numberBR' || fmt === 'integer' || fmt === 'percent') {
    if (typeof raw === 'number') {
      return fmt === 'percent' ? raw / 100 : raw
    }
    if (typeof raw === 'string') {
      const cleaned = raw.replace(/\./g, '').replace(',', '.').replace('%', '')
      const n = Number(cleaned)
      if (Number.isNaN(n)) return null
      return fmt === 'percent' ? n / 100 : n
    }
    const n = Number(raw)
    return Number.isNaN(n) ? null : (fmt === 'percent' ? n / 100 : n)
  }
  if (fmt === 'boolean') return Boolean(raw)
  // fallback: string trimmed
  return String(raw).trim()
}
// --- END ADDED HELPERS ---

function readMapping(mappingPath, mappingArray) {
  if (mappingArray) {
    if (!Array.isArray(mappingArray)) throw new Error('mappingArray deve ser Array')
    return mappingArray.slice()
  }
  const raw = fs.readFileSync(mappingPath, 'utf-8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error(`Mapping inválido em ${mappingPath} (esperado Array)`)
  return parsed
}

function sanitizeResponseColumn(rc) {
  const m = String(rc || 'L').toUpperCase().match(/^[A-Z]+/)
  return m ? m[0] : 'L'
}

function extractRowFromCell(cell) {
  if (!cell) return null
  const m = String(cell).match(/(\d+)$/)
  return m ? Number(m[1]) : null
}

function safeGetByPath(obj, p) {
  if (!p) return undefined
  try {
    return lodashGet(obj, p) ?? (function fallback() {
      return p.replace(/\[(\d+)\]/g, '.$1').split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
    })()
  } catch (e) {
    return undefined
  }
}

function normalizeFromExcel(cellValue) {
  if (cellValue && typeof cellValue === 'object' && 'result' in cellValue) return cellValue.result
  return cellValue
}

function toDateOnlyWrapper(value) {
  // usa helper importado para evitar duplicação de implementação
  return toDateOnly(value)
}

function formatDateToDDMMYYYYWrapper(d) {
  // usa helper importado para evitar duplicação de implementação
  return formatDateToDDMMYYYY(d)
}

// --- NEW HELPERS: tenta obter valor exibido da célula (prioriza result -> text -> master) ---
function extractDisplayedValue(cell, sheetRef) {
  if (!cell) return null
  const v = cell.value

  // primitivo direto (number/string/Date/boolean/null)
  if (v == null || typeof v !== 'object') return v

  // 1) PRIORIZE o valor exibido formatado (cell.text) — evita usar result stale de fórmulas
  if (typeof cell.text === 'string' && cell.text.trim() !== '') {
    const txt = cell.text.trim()
    const dt = parseDDMMYYYY(txt)
    if (dt) return dt
    const n = Number(txt.replace(/\./g, '').replace(',', '.'))
    if (!Number.isNaN(n)) return n
    return txt
  }

  // 2) se não houver text, use result (cache) quando presente e não nulo
  if ('result' in v && v.result != null) return v.result

  // 3) se sharedFormula — tente a célula mestre, priorizando master.text, depois master.result
  if (v.sharedFormula && typeof v.sharedFormula === 'string' && sheetRef) {
    try {
      const master = sheetRef.getCell(v.sharedFormula)
      if (master) {
        if (typeof master.text === 'string' && master.text.trim() !== '') {
          const mtxt = master.text.trim()
          const mdt = parseDDMMYYYY(mtxt)
          if (mdt) return mdt
          const mn = Number(mtxt.replace(/\./g, '').replace(',', '.'))
          if (!Number.isNaN(mn)) return mn
          return mtxt
        }
        const mv = master.value
        if (mv == null || typeof mv !== 'object') return mv
        if ('result' in mv && mv.result != null) return mv.result
      }
    } catch (e) {
      // ignore
    }
  }

  // 4) se houver formula sem text/result -> não calcular aqui (retorna undefined)
  if ('formula' in v) return undefined

  // fallback: tentar result mesmo que nulo/undefined
  return v.result ?? undefined
}

// normaliza primitivo obtido de extractDisplayedValue / normalizeFromExcel
function normalizeRawPrimitive(raw, map) {
  if (raw == null || (typeof raw === 'string' && raw.trim() === '')) return { kind: 'empty', value: null }
  const v0 = normalizeFromExcel(raw)
  if (v0 == null || (typeof v0 === 'string' && v0.trim() === '')) return { kind: 'empty', value: null }

  const v = commonNormalizeValue(v0)
  const fmt = map && map.format

  if (fmt === 'date') {
    const d = (v instanceof Date) ? toDateOnly(v) : (typeof v === 'string' ? (parseDDMMYYYY(v) || new Date(v)) : new Date(v))
    if (d && !Number.isNaN(d.getTime())) return { kind: 'date', value: toDateOnly(d) }
    return { kind: 'empty', value: null }
  }

  if (fmt === 'number' || fmt === 'numberBR' || fmt === 'integer' || fmt === 'percent') {
    if (typeof v === 'number') {
      return { kind: 'number', value: (fmt === 'percent' ? v / 100 : v) }
    }
    if (typeof v === 'string') {
      const cleaned = v.replace(/\./g, '').replace(',', '.').replace('%', '')
      const n = Number(cleaned)
      if (Number.isNaN(n)) return { kind: 'empty', value: null }
      return { kind: 'number', value: (fmt === 'percent' ? n / 100 : n) }
    }
    const n = Number(v)
    if (!Number.isNaN(n)) return { kind: 'number', value: (fmt === 'percent' ? n / 100 : n) }
    return { kind: 'empty', value: null }
  }

  if (v instanceof Date) return { kind: 'date', value: toDateOnly(v) }
  if (typeof v === 'string') {
    const s = v.trim()
    const parsedDMY = parseDDMMYYYY(s)
    if (parsedDMY) return { kind: 'date', value: toDateOnly(parsedDMY) }
    const num = Number(s.replace(/\./g, '').replace(',', '.'))
    if (!Number.isNaN(num)) return { kind: 'number', value: num }
    return { kind: 'string', value: s }
  }
  if (typeof v === 'number') return { kind: 'number', value: v }
  return { kind: 'string', value: String(v).trim() }
}

function writeSingleMappingToCell(ws, map, json) {
  if (!map || !map.cell) return { skipped: true, reason: 'no cell' }
  const val = safeGetByPath(json, map.path)
  const formatted = formatForExcel(val, map)
  const cellRef = map.cell
  const cell = ws.getCell(cellRef)
  if (map?.format === 'date') {
    let dateObj = null
    if (formatted instanceof Date) dateObj = toDateOnly(formatted)
    else {
      const maybe = new Date(formatted)
      if (!Number.isNaN(maybe.getTime())) dateObj = toDateOnly(maybe)
    }
    const asString = dateObj ? formatDateToDDMMYYYY(dateObj) : ''
    cell.value = asString === '' ? null : asString
    if (dateObj) cell.numFmt = map.excelNumberFormat || 'dd/MM/yyyy'
    return { skipped: false, cell: cellRef, value: cell.value }
  }
  if (formatted === null || typeof formatted === 'undefined' || formatted === '') {
    cell.value = null
  } else {
    cell.value = formatted
  }
  if (map && map.excelNumberFormat) cell.numFmt = map.excelNumberFormat
  return { skipped: false, cell: cellRef, value: cell.value }
}

function writeMappingArray(ws, mapping, json, options = {}) {
  const results = []
  for (const [idx, map] of mapping.entries()) {
    try {
      if (!map) { results.push({ idx, skipped: true, reason: 'falsy map' }); continue; }
      if (map.repeat) { results.push({ idx, skipped: true, reason: 'repeat block' }); continue; }
      if (!map.cell) { results.push({ idx, skipped: true, reason: 'missing cell' }); continue; }
      const res = writeSingleMappingToCell(ws, map, json)
      results.push(Object.assign({ idx }, res))
    } catch (err) {
      error('writeMappingArray error idx', idx, err && err.message)
      results.push({ idx, skipped: true, reason: String(err) })
    }
  }
  return results
}

function expandMappingArray(mappingArray, json = {}) {
  if (!Array.isArray(mappingArray)) return []
  const out = []

  // helper: case-insensitive lookup that supports nested paths like "Proposta.Parcelas"
  function findPathCaseInsensitive(obj, path) {
    if (!obj || !path) return undefined
    // try exact first
    let v = lodashGet(obj, path)
    if (v !== undefined) return v
    // try variations: lowercase first segment, lowercase whole path
    try {
      const lower = path.split('.').map(p => p.toLowerCase()).join('.')
      v = lodashGet(obj, lower)
      if (v !== undefined) return v
    } catch (e) { /* ignore */ }
    // fallback: walk keys case-insensitively for nested path
    const parts = String(path).split('.')
    let cursor = obj
    for (const part of parts) {
      if (cursor == null || typeof cursor !== 'object') { cursor = undefined; break }
      const keyExact = part
      if (Object.prototype.hasOwnProperty.call(cursor, keyExact)) { cursor = cursor[keyExact]; continue }
      // find case-insensitive match
      const foundKey = Object.keys(cursor).find(k => k.toLowerCase() === String(part).toLowerCase())
      if (foundKey) { cursor = cursor[foundKey]; continue }
      cursor = undefined
      break
    }
    return cursor
  }

  for (const map of mappingArray) {
    if (!map) continue
    if (!map.repeat) {
      out.push(map)
      continue
    }
    // map.repeat expected shape: { forEach: "Parcelas", startRow: N, columns: { "E": { path: "Parcela", ... }, ... } }
    const forEachKey = String(map.repeat.forEach || '').trim()
    if (!forEachKey) continue
    const arr = findPathCaseInsensitive(json, forEachKey) || []
    if (!Array.isArray(arr) || arr.length === 0) continue
    const startRow = Number(map.repeat.startRow) || 0
    const cols = map.repeat.columns || {}
    for (let i = 0; i < arr.length; i++) {
      const row = startRow + i
      for (const [colLetter, colDef] of Object.entries(cols)) {
        const path = (colDef && colDef.path) ? `${forEachKey}[${i}].${colDef.path}` : `${forEachKey}[${i}]`
        const cell = `${colLetter}${row}`
        out.push({
          path,
          cell,
          format: colDef && colDef.format,
          excelNumberFormat: colDef && colDef.excelNumberFormat,
          // preserve original meta if needed later
          __fromRepeat: true
        })
      }
    }
  }
  return out
}

function writeResponseColumnMappings(ws, mapping, json, responseColumn) {
  const written = []
  for (const [idx, map] of mapping.entries()) {
    try {
      if (!map || !map.cell) continue
      const row = extractRowFromCell(map.cell)
      if (!row) continue
      const target = `${responseColumn}${row}`
      const rawVal = safeGetByPath(json, map.path)
      const formatted = formatForExcel(rawVal, map)
      let cell = ws.getCell(target)
      if (cell && cell.value && typeof cell.value === 'object' && (('formula' in cell.value) || ('result' in cell.value))) {
        const formula = cell.value.formula
        if (map?.format === 'date') {
          const dateVal = (formatted instanceof Date) ? toDateOnly(formatted) : (new Date(formatted))
          const dateOnly = (!Number.isNaN(dateVal.getTime())) ? toDateOnly(dateVal) : null
          const asString = dateOnly ? formatDateToDDMMYYYY(dateOnly) : ''
          cell.value = formula ? { formula, result: (asString || null) } : { result: (asString || null) }
          if (dateOnly) cell.numFmt = map.excelNumberFormat || 'dd/MM/yyyy'
        } else {
          cell.value = formula ? { formula, result: formatted } : { result: formatted }
          if (map.excelNumberFormat) cell.numFmt = map.excelNumberFormat
        }
      } else {
        if (map?.format === 'date') {
          const dateVal = (formatted instanceof Date) ? toDateOnly(formatted) : (new Date(formatted))
          const dateOnly = (!Number.isNaN(dateVal.getTime())) ? toDateOnly(dateVal) : null
          const asString = dateOnly ? formatDateToDDMMYYYY(dateOnly) : ''
          cell.value = asString === '' ? null : asString
          if (dateOnly) cell.numFmt = map.excelNumberFormat || 'dd/MM/yyyy'
        } else {
          cell.value = formatted
          if (map.excelNumberFormat) cell.numFmt = map.excelNumberFormat
        }
      }
      written.push({ idx, cell: target, value: cell.value })
    } catch (err) {
      error('writeResponseColumnMappings error idx', idx, err && err.message)
    }
  }
  return written
}

// --- Public API (refatoradas, mantendo comportamento compatível) ---
async function writeExcel({ caminho, sheetName, mappingPath, mappingArray, json }) {
  const workbook = await openWorkbook(caminho)
  const ws = getWorksheetOrFirst(workbook, sheetName)
  log('writeExcel called', { caminho, sheetName, mappingPath, mappingArrayProvided: !!mappingArray })
  const mapping = readMapping(mappingPath, mappingArray)
  const results = writeMappingArray(ws, mapping, json)

  // FIX: garantir C11 (Prazo) é number e E7 = 0 na aba PMT para evitar #DIV/0! em L8
  try {
    if ((ws && ws.name && String(ws.name).toUpperCase() === 'PMT') || String(sheetName).toUpperCase() === 'PMT') {
      // se C11 foi escrito como string, tente converter; se ausente, use json.Prazo
      const cellC11 = ws.getCell('C11')
      const rawC11 = cellC11.value
      let prazoNum = Number(rawC11)
      if (Number.isNaN(prazoNum)) {
        const jp = safeGetByPath(json, 'Prazo') ?? safeGetByPath(json, 'dto.Prazo')
        prazoNum = Number(jp)
      }
      if (!Number.isNaN(prazoNum)) {
        cellC11.value = prazoNum
      }
      // garantir E7 = 0 (necessário para fórmula ROUND(I8/($C$11-E7),2) não dividir por zero)
      const cellE7 = ws.getCell('E7')
      if (cellE7.value === null || cellE7.value === undefined || String(cellE7.value).trim() === '') {
        cellE7.value = 0
      } else {
        // se estava string vazia ou não-numérico, forçar 0
        const e7n = Number(cellE7.value)
        if (Number.isNaN(e7n)) cellE7.value = 0
      }
    }
  } catch (e) {
    warn('writeExcel: não foi possível aplicar fix PMT C11/E7', e && e.message)
  }

  await workbook.xlsx.writeFile(caminho)
  if (DEBUG) {
    try { console.log('[writeExcel] written mappings:', results) } catch (e) { /* ignore */ }
  }
  return { ok: true, written: results }
}

async function compareExcel({ caminho, sheetName, mappingPath, mappingArray, json, writeResponseToSheet = false, expectedColumn = 'J', actualColumn, responseColumn }) {
  // Tentativa preferencial: delegar comparação de colunas E..S entre abas PMT x API
  // para o motor xlsx/xlsx-calc (mais confiável que mix ExcelJS/xlsx).
  try {
    const excelPMTapiInternal = require('./excelPMTapi')._internal
    if (excelPMTapiInternal && typeof excelPMTapiInternal.compareColsRange === 'function') {
      try {
        const compareRes = excelPMTapiInternal.compareColsRange({
          filePath: caminho,
          sheetLeft: 'PMT',
          sheetRight: 'API',
          startCol: 'E',
          endCol: 'S',
          // se houver json com Prazo, aproveita para definir endRow; fallback ignora
          startRow: 8,
          endRow: (json && (json.Prazo || (json.dto && json.dto.Prazo))) ? (8 + Number(json.Prazo || json.dto?.Prazo) - 1) : null,
          tolerance: 0.01
        })
        // normaliza retorno para formato esperado por código existente
        const failures = compareRes.failures || []
        const totalCompared = compareRes.totalCompared || 0
        const totalPassed = compareRes.totalPassed || 0
        const resultados = (compareRes.rows || []).map(()=>{}) // placeholder para compatibilidade
        return {
          ok: (failures.length === 0),
          total: totalCompared || (failures.length + totalPassed),
          mismatches: failures,
          resultados: failures.map(f => ({
            campo: null,
            expectedCell: f.leftCell,
            actualCell: f.rightCell,
            esperado: f.left,
            atual: f.right,
            ok: false,
            detalhe: null,
            rawExpected: f.left,
            rawActual: f.right
          })),
          written: [],
          expectedColumn: 'E..S',
          actualColumn: 'E..S',
          audit: compareRes.audit || null
        }
      } catch (e) {
        // se delegação falhar, segue para implementação clássica abaixo
        warn('compareExcel: delegação compareColsRange falhou:', e && e.message)
      }
    }
  } catch (e) {
    if (DEBUG) warn('compareExcel: não foi possível carregar excelPMTapi internals:', e && e.message)
  }

  // --- TRY: recalcular workbook usando loadAndCalc (xlsx + xlsx-calc) e gravar resultados ---
  try {
    // tenta importar o helper de recálculo exposto em excelPMTapi._internal.loadAndCalc
    const excelPMTapiInternal = require('./excelPMTapi')._internal
    if (excelPMTapiInternal && typeof excelPMTapiInternal.loadAndCalc === 'function') {
      try {
        const wbX = excelPMTapiInternal.loadAndCalc(caminho)
        // grava workbook recalculado usando 'xlsx' para que os resultados fiquem no arquivo
        const XLSX = require('xlsx')
        XLSX.writeFile(wbX, caminho)
        log('compareExcel: workbook recalculado e salvo (xlsx-calc) ->', caminho)
      } catch (e) {
        warn('compareExcel: recalc/write failed:', e && e.message)
      }
    }
  } catch (e) {
    // não falhar se não conseguir importar / recalcular - seguir com comportamento antigo
    if (DEBUG) warn('compareExcel: não foi possível executar recalc:', e && e.message)
  }
  // --- END TRY ---
  const workbook = await openWorkbook(caminho)
  const ws = getWorksheetOrFirst(workbook, sheetName)
  log('compareExcel called', { caminho, sheetName, mappingPath, mappingArrayProvided: !!mappingArray, writeResponseToSheet })
  if (!actualColumn && responseColumn) actualColumn = responseColumn
  const sanitizeCol = (c) => {
    const m = String(c || '').toUpperCase().match(/^[A-Z]+/)
    return m ? m[0] : null
  }
  const colExpected = sanitizeCol(expectedColumn) || 'J'
  const colActual = sanitizeCol(actualColumn) || 'L'
  const mapping = readMapping(mappingPath, mappingArray)
  const written = []
  if (writeResponseToSheet && json) {
    const w = writeResponseColumnMappings(ws, mapping, json, colActual)
    written.push(...w)
  }
  const resultados = []
  const mismatches = []
  for (const [idx, map] of mapping.entries()) {
    try {
      if (!map || !map.cell) { resultados.push({ campo: map?.path ?? null, ok: false, detalhe: 'missing cell' }); continue; }
      const row = extractRowFromCell(map.cell)
      if (!row) { resultados.push({ campo: map?.path ?? null, ok: false, detalhe: 'invalid cell' }); continue; }
      const expectedCellRef = `${colExpected}${row}`
      const actualCellRef = `${colActual}${row}`

      // usar valor exibido (prioriza cell.text / master) para evitar comparar ms/serial com dias
      const cellExpObj = ws.getCell(expectedCellRef)
      const cellActObj = ws.getCell(actualCellRef)
      const rawExpected = normalizeFromExcel(extractDisplayedValue(cellExpObj, ws))
      const rawActual = normalizeFromExcel(extractDisplayedValue(cellActObj, ws))

      // DETAILED LOG: imprime comparação entre left(PMT) e right(API) no console
      try {
        const safe = v => {
          if (v === null || v === undefined) return null
          if (v instanceof Date) return v.toISOString()
          try { return JSON.parse(JSON.stringify(v)) } catch (e) { return String(v) }
        }
        console.log('[compareExcel] compare',
          {
            mapIndex: idx,
            mapPath: map && map.path,
            expectedCell: expectedCellRef,
            expected_raw: safe(rawExpected),
            expected_text: (cellExpObj && cellExpObj.text) || null,
            expected_formula: (cellExpObj && (cellExpObj.value && cellExpObj.value.formula)) || cellExpObj && cellExpObj.formula || null,
            actualCell: actualCellRef,
            actual_raw: safe(rawActual),
            actual_text: (cellActObj && cellActObj.text) || null,
            actual_formula: (cellActObj && (cellActObj.value && cellActObj.value.formula)) || cellActObj && cellActObj.formula || null
          }
        )
      } catch (e) { /* ignore logging errors */ }

      const esperado = normalizeForCompare(rawExpected, map)
      const atual = normalizeForCompare(rawActual, map)
      const ok = (atual === esperado) || (String(atual) === String(esperado))
      const detalhe = ok ? '' : `expected ${esperado} but got ${atual}`
      const res = { campo: map.path || null, expectedCell: expectedCellRef, actualCell: actualCellRef, esperado, atual, ok, detalhe }
      resultados.push(res)
      if (!ok) {
        mismatches.push(res)
        // debug detalhado quando habilitado
        if (DEBUG) {
          try {
            console.log('[compareExcel][MISMATCH]', {
              workbook: caminho,
              mapIndex: idx,
              map,
              expectedCellRef,
              actualCellRef,
              esperado,
              atual,
              rawExpected,
              rawActual,
              cellExpObj: {
                value: cellExpObj && cellExpObj.value,
                text: cellExpObj && cellExpObj.text,
                formula: (cellExpObj && cellExpObj.value && cellExpObj.value.formula) || cellExpObj && cellExpObj.formula || null
              },
              cellActObj: {
                value: cellActObj && cellActObj.value,
                text: cellActObj && cellActObj.text,
                formula: (cellActObj && cellActObj.value && cellActObj.value.formula) || cellActObj && cellActObj.formula || null
              }
            })
          } catch (e) {
            console.error('[compareExcel][MISMATCH][LOG-ERR]', e && e.message)
          }
        }
      }
    } catch (err) {
      error('compareExcel error idx', idx, err && err.message)
      const resErr = { campo: map?.path || null, expectedCell: null, actualCell: null, esperado: null, atual: null, ok: false, detalhe: String(err) }
      resultados.push(resErr)
      mismatches.push(resErr)
    }
  }
  try { await workbook.xlsx.writeFile(caminho) } catch (e) { error('save after compare failed', e && e.message) }
  return { ok: mismatches.length === 0, total: resultados.length, mismatches, resultados, written, expectedColumn: colExpected, actualColumn: colActual }
}

function copyFileUnique(src, outDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const base = path.basename(src, path.extname(src))
  const ext = path.extname(src)
  const dstDir = outDir || path.join('cypress', 'results', 'workbooks')
  if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true })
  const dst = path.join(dstDir, `${base}-${timestamp}${ext}`)
  fs.copyFileSync(src, dst)
  return dst
}

async function writeResponseColumn({ caminho, sheetName, mappingPath, mappingArray, json, responseColumn = 'L', skipSave = false }) {
  const workbook = await openWorkbook(caminho)
  const ws = getWorksheetOrFirst(workbook, sheetName)
  const mapping = readMapping(mappingPath, mappingArray)
  const rc = sanitizeResponseColumn(responseColumn)
  const written = writeResponseColumnMappings(ws, mapping, json, rc)
  if (!skipSave) await workbook.xlsx.writeFile(caminho)
  return { ok: true, written }
}

async function compareUsingMapping({ caminho, sheetExpected, sheetActual, mappingPath, mappingArray, tolerance = 1e-8 }) {
  const wb = await openWorkbook(caminho)
  const wsExp = getWorksheetOrFirst(wb, sheetExpected)
  const wsAct = getWorksheetOrFirst(wb, sheetActual)
  const expectedSheetName = (wsExp && wsExp.name) ? wsExp.name : sheetExpected
  const actualSheetName = (wsAct && wsAct.name) ? wsAct.name : sheetActual

  const mapping = readMapping(mappingPath, mappingArray)
  const resultados = []
  const mismatches = []

  for (const [idx, map] of mapping.entries()) {
    try {
      const expectedRef = map.expectedCell || map.cell
      const actualRef = map.actualCell || map.cell
      if (!expectedRef && !actualRef) {
        resultados.push({ idx, map, skipped: true, reason: 'no cell refs' })
        continue
      }

      const cellExp = expectedRef ? wsExp.getCell(expectedRef) : null
      const cellAct = actualRef ? wsAct.getCell(actualRef) : null

      const rawExpPrim = extractDisplayedValue(cellExp, wsExp)
      const rawActPrim = extractDisplayedValue(cellAct, wsAct)

      const nExp = normalizeRawPrimitive(rawExpPrim, map)
      const nAct = normalizeRawPrimitive(rawActPrim, map)

      if (nExp.kind === 'empty' && nAct.kind === 'empty') {
        resultados.push({ idx, map, ok: true, reason: 'both empty', expectedCell: expectedRef, actualCell: actualRef, expectedSheet: expectedSheetName, actualSheet: actualSheetName })
        continue
      }

      let ok = false
      if (nExp.kind === 'date' && nAct.kind === 'date') {
        ok = nExp.value.toISOString().slice(0, 10) === nAct.value.toISOString().slice(0, 10)
      } else if (nExp.kind === 'number' && nAct.kind === 'number') {
        ok = Math.abs(nExp.value - nAct.value) <= tolerance
      } else {
        const sExp = nExp.kind === 'empty' ? '' : String(nExp.value).trim()
        const sAct = nAct.kind === 'empty' ? '' : String(nAct.value).trim()
        ok = sExp === sAct
      }

      const expectedOut = (nExp.kind === 'date') ? formatDateToDDMMYYYY(nExp.value) : (nExp.kind === 'number' ? nExp.value : (nExp.kind === 'empty' ? null : String(nExp.value)))
      const actualOut = (nAct.kind === 'date') ? formatDateToDDMMYYYY(nAct.value) : (nAct.kind === 'number' ? nAct.value : (nAct.kind === 'empty' ? null : String(nAct.value)))

      const res = {
        idx,
        map,
        expectedCell: expectedRef,
        actualCell: actualRef,
        expectedSheet: expectedSheetName,
        actualSheet: actualSheetName,
        workbook: caminho,
        expected: expectedOut,
        actual: actualOut,
        ok,
        // evidências brutas mostradas para debug: valor objeto e texto formatado quando disponível
        rawExpected: { value: cellExp && cellExp.value, text: cellExp && cellExp.text },
        rawActual: { value: cellAct && cellAct.value, text: cellAct && cellAct.text }
      }

      resultados.push(res)
      if (!ok) mismatches.push(res)
      if (DEBUG && !ok) console.log('[compareUsingMapping][MISMATCH]', res)
    } catch (err) {
      resultados.push({ idx, map, ok: false, error: String(err) })
      mismatches.push({ idx, map, ok: false, error: String(err) })
    }
  }

  return { ok: mismatches.length === 0, total: resultados.length, resultados, mismatches }
}

async function salvarWorkbook(caminho) {
  if (!caminho) throw new Error('salvarWorkbook: caminho não informado')
  if (!fs.existsSync(caminho)) throw new Error(`salvarWorkbook: arquivo não encontrado ${caminho}`)
  const wb = await openWorkbook(caminho)
  await wb.xlsx.writeFile(caminho)
  return { ok: true, caminho }
}


// js
// filepath: c:\Users\everton.pedro\source\automation\BMPDigital.TestesAutomatizados\cypress\plugins\excelPMTapi.js
// ...existing code...
module.exports = {
  writeExcel,
  compareExcel,
  copyFileUnique,
  writeResponseColumn,
  expandMappingArray,
  compareUsingMapping,
  salvarWorkbook
}