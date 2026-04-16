let scenarioTitle = ''
export const replaceScenario = (v) => {
    if (v == null) return v
    const s = String(v)
    return s.includes('{{$scenario}}') ? scenarioTitle : s
}

export default {
    replaceScenario
}