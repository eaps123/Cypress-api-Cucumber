export const findKeyCI = (obj, name) => 
    Object.keys(obj || {}).find(k => k.toLowerCase() === String(name).toLowerCase())

export default findKeyCI