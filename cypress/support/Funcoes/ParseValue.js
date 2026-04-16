import { replaceScenario } from "./ReplaceScenario";

export const parseValue = (v) => {
    const rv = replaceScenario(v)
    if (rv == null || rv === "") return null
    const lv = String(rv).trim()
    if (/^(true|false)$/i.test(lv)) return lv.toLowerCase() === 'true'
    if (/^\-?\d+(\.\d+)?$/.test(lv)) return Number(lv)
    // tenta JSON para arrays/objetos (ex.: "[...]" ou "{...}")
    if ((lv.startsWith('{') && lv.endsWith('}')) || (lv.startsWith('[') && lv.endsWith(']'))) {
        try { return JSON.parse(lv) } catch (e) { /* fallback */ }
    }
    return lv.replace(/^"(.*)"$/, '$1')
}

export default {
    parseValue
}