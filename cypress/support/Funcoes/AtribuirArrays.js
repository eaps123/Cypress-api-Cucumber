import setNested from './Nested';

// rows: objeto rowsHash() do cucumber; targetRoot: objeto onde atribuir (ex: PropostaPayload.dto)
// options.parseVal: função opcional para converter valores (número/boolean), default = identity
function AtribuirArraysDTO(rows = {}, targetRoot = {}, options = {}) {
  const parseVal = options.parseVal || (v => v);

  const arrayLike = /LancamentoDTO|ContaPagamentoDTO|ParcelasDTO/i;

  Object.entries(rows || {}).forEach(([rawKey, rawVal]) => {
    const pv = parseVal(rawVal);
    if (typeof pv === 'undefined') {
      const k = String(rawKey).replace(/^PropostaDTO\./i, '');
      if (Object.prototype.hasOwnProperty.call(targetRoot, k)) delete targetRoot[k];
      return;
    }

    const key = String(rawKey).replace(/^PropostaDTO\./i, '');
    const parts = key.split('.').filter(p => p !== '');
    if (parts.length === 0) return;

    const top = parts[0];

    if (parts.length === 1) {
      targetRoot[top] = pv;
      return;
    }

    const subPath = parts.slice(1).join('.');
    if (arrayLike.test(top)) {
      targetRoot[top] = targetRoot[top] || {};
      setNested(targetRoot[top], subPath, pv);
    } else {
      targetRoot[top] = targetRoot[top] || {};
      setNested(targetRoot[top], subPath, pv);
    }
  });
}
export default AtribuirArraysDTO;