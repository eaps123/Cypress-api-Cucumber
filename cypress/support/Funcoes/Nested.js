function setNested(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (i === keys.length - 1) {
      // detecta arrays passados como JSON string
      if (typeof value === 'string' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
        try { cur[k] = JSON.parse(value); continue; } catch(e) {}
      }
      // tenta converter números/booleans simples
      if (value === 'true' || value === 'false') cur[k] = (value === 'true');
      else if (!isNaN(value) && value !== '') cur[k] = Number(value);
      else cur[k] = value;
    } else {
      if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
  }
}
export default setNested;