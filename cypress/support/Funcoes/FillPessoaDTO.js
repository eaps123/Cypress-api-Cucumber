const { faker } = require('@faker-js/faker');

// força locale pt_BR para gerar formats mais previsíveis
faker.locale = 'pt_BR';

function generateCPF(){
  // gera 9 dígitos aleatórios (não todos iguais) e calcula os 2 dígitos verificadores
  const rand9 = () => {
    let arr;
    do {
      arr = Array.from({length:9}, () => Math.floor(Math.random() * 10));
    } while (arr.every(d => d === arr[0]));
    return arr;
  }

  const calcDigit = (digits, factorStart) => {
    const sum = digits.reduce((acc, d, i) => acc + d * (factorStart - i), 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  }

  const base = rand9();
  const d1 = calcDigit(base, 10);
  const d2 = calcDigit([...base, d1], 11);
  const full = [...base, d1, d2].join('');
  return `${full.slice(0,3)}.${full.slice(3,6)}.${full.slice(6,9)}-${full.slice(9)}`;
}

// formata telefone para BR: (##)####-#### ou (##)9####-####
function formatPhoneBR(value){
  if (value === null || value === undefined) return value;
  let s = String(value).trim();

  // remove sufixos de extensão comum (x, ext, ext., ramal, etc.)
  s = s.replace(/\s*(?:x|ext\.?|extension|ramal)\s*\d+$/i, '').trim();

  const digits = s.replace(/\D/g, '');
  if (!digits) return s;

  // usa os últimos 11 ou 10 dígitos (ignora códigos de país ou prefixos longos)
  let d = digits;
  if (d.length >= 11) d = d.slice(-11);
  else if (d.length === 10) d = d;
  else if (d.length >= 8) d = d.slice(-8);

  if (d.length === 11) { // (##)9####-####
    return `(${d.slice(0,2)})${d.slice(2,7)}-${d.slice(7)}`;
  }
  if (d.length === 10) { // (##)####-####
    return `(${d.slice(0,2)})${d.slice(2,6)}-${d.slice(6)}`;
  }
  if (d.length === 8) { // ####-####
    return `${d.slice(0,4)}-${d.slice(4)}`;
  }
  return d;
}

function isObject(v){ return v && typeof v === 'object' && !Array.isArray(v); }

function mergeDeep(target, source){
  if (!isObject(source)) return source;
  Object.keys(source).forEach(k=>{
    if (isObject(source[k])){
      if (!target[k]) target[k] = {};
      mergeDeep(target[k], source[k]);
    } else target[k] = source[k];
  });
  return target;
}

function setPath(obj, path, value){
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length; i++){
    const p = parts[i];
    if (i === parts.length - 1) { cur[p] = value; }
    else { cur[p] = cur[p] || {}; cur = cur[p]; }
  }
}

function generateCNPJ(){
  const n = faker.string.numeric(14);
  return `${n.slice(0,2)}.${n.slice(2,5)}.${n.slice(5,8)}/${n.slice(8,12)}-${n.slice(12,14)}`;
}

function normalizePlaceholderValue(value, examplesMap){
  if (typeof value !== 'string') return value;
  const m = value.match(/^<([^>]+)>$/);
  if (m){
    const key = m[1];
    if (examplesMap && examplesMap.hasOwnProperty(key)) return examplesMap[key];
    return value;
  }
  return value;
}

function validateCPFFormat(v){ return typeof v === 'string' && /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v); }
function validateCNPJFormat(v){ return typeof v === 'string' && /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(v); }

function flattenDotKeys(overrides){
  const out = {};
  Object.keys(overrides || {}).forEach(k => {
    if (k.includes('.')) setPath(out, k, overrides[k]);
    else out[k] = overrides[k];
  });
  return out;
}

function fillPessoaDTO(overrides = {}, options = {}){
  const { seed, examplesMap, validate = false } = options || {};
  if (seed !== undefined) faker.seed(seed);

  const pessoa = {
    Nome: `${faker.name.firstName()} ${faker.name.lastName()}`,
    DocumentoFederal: generateCPF(),
    PessoaDadosContato: {
      Email: faker.internet.email(),
      EmailCorporativo: faker.internet.email(),
      TelefoneFixo1: faker.phone.number('(##)####-####'),
      TelefoneFixo2: null,
      TelefoneCelular1: faker.phone.number('(##)9####-####'),
      TelefoneCelular2: null
    },
    PJ: {
      NomeFantasia: faker.company.name(),
      DocumentoEstadual: faker.string.numeric(9),
      DocumentoMunicipal: null,
      DtAberturaEmpresa: faker.date.past(20).toISOString().slice(0,10),
      NomeResponsavelEmpresa: faker.name.firstName() + ' ' + faker.name.lastName(),
      CPFResponsavelEmpresa: generateCPF(),
      RGResponsavelEmpresa: faker.string.numeric(8),
      TelefoneResponsavelEmpresa: faker.phone.number('(##)####-####'),
      EmailResponsavelEmpresa: faker.internet.email()
    },
    PessoaQualificacao: {
      Codigo: null,
      CodigoProfissao: null,
      VlrRenda: Number(faker.finance.amount(1000,100000,2)),
      DtAdmissao: faker.date.past(10).toISOString().slice(0,10),
      DtDemissao: null,
      NomeEmpresa: faker.company.name(),
      CEP: faker.address.zipCode('########'),
      Logradouro: faker.address.streetAddress(),
      NroLogradouro: faker.string.numeric(4),
      Bairro: faker.address.county(),
      Complemento: null,
      Cidade: faker.address.city(),
      UF: faker.helpers.arrayElement(["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]),
      TelefoneFixo: faker.phone.number('(##)####-####')
    }
  };

  const flat = flattenDotKeys(overrides);
  const normalized = {};
  Object.keys(flat).forEach(k => {
    normalized[k] = normalizePlaceholderValue(flat[k], examplesMap);
  });

  const merged = mergeDeep(pessoa, normalized);

  // aplica formatação BR consistente após merge (cobre overrides/fixtures)
  try {
    if (merged.PessoaDadosContato){
      merged.PessoaDadosContato.TelefoneFixo1 = formatPhoneBR(merged.PessoaDadosContato.TelefoneFixo1);
      merged.PessoaDadosContato.TelefoneFixo2 = formatPhoneBR(merged.PessoaDadosContato.TelefoneFixo2);
      merged.PessoaDadosContato.TelefoneCelular1 = formatPhoneBR(merged.PessoaDadosContato.TelefoneCelular1);
      merged.PessoaDadosContato.TelefoneCelular2 = formatPhoneBR(merged.PessoaDadosContato.TelefoneCelular2);
    }
    if (merged.PJ){
      merged.PJ.TelefoneResponsavelEmpresa = formatPhoneBR(merged.PJ.TelefoneResponsavelEmpresa);
    }
    if (merged.PessoaQualificacao){
      merged.PessoaQualificacao.TelefoneFixo = formatPhoneBR(merged.PessoaQualificacao.TelefoneFixo);
    }
  } catch(e){ /* ignore */ }

  if (validate){
    if (merged.DocumentoFederal && !validateCPFFormat(merged.DocumentoFederal)) throw new Error('DocumentoFederal inválido: ' + merged.DocumentoFederal);
    if (merged.PJ && merged.PJ.CPFResponsavelEmpresa && !validateCPFFormat(merged.PJ.CPFResponsavelEmpresa)) throw new Error('CPFResponsavelEmpresa inválido');
  }

  return merged;
}

export { generateCPF, generateCNPJ, mergeDeep };
export default fillPessoaDTO;