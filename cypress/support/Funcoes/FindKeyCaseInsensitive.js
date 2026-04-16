export const findKeyCaseInsensitive = (obj = {}, key) => {
    const lk = String(key || '').toLowerCase()
    return Object.keys(obj || {}).find(k => String(k).toLowerCase() === lk)
}
export default {
    findKeyCaseInsensitive
}