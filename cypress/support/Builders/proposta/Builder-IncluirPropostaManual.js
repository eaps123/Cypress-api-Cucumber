import FuncoesRequests, {
    setPropostaEnv,
    parseValue,
    saveRequestAndResponseFiles,
    deepClone,
    findKeyCI
} from "../../Funcoes/index"
import BuilderUtils, {applyPaymentNormalization} from "./Builder-PropostaUtils";
import { faker } from '@faker-js/faker'
const propostaRequests = Cypress.automacao.Requests.PropostaRequests
const DEFAULT_INTEGRATION = "QA_INTEGRATION_EVERTON"

let scenarioTitle = ''
export const setScenarioTitle = (title) => { scenarioTitle = title }
export const getScenarioTitle = () => scenarioTitle

export const buildDtoFromDataTable = (dataTable) => {
    const rows = dataTable.rowsHash()
    const dto = {}
    Object.entries(rows).forEach(([k, v]) => {
        dto[k] = parseValue(v)
    })
    return { dto }
}

export const parseParametersTable = (dataTable = {}) => {
    try {
        const hashes = dataTable?.hashes?.() || []
        if (Array.isArray(hashes) && hashes.length > 0 && typeof hashes[0] === 'object' && !Array.isArray(hashes[0])) {
            const out = {}
            for (const rowObj of hashes) {
                Object.entries(rowObj).forEach(([k, v]) => {
                    out[String(k).trim()] = parseValue(v)
                })
            }
            return out
        }
        const rows = dataTable?.raw?.() || dataTable?.rows?.() || []
        const out = {}
            (rows || [])
            .filter(r => Array.isArray(r) && r.length >= 2 && String(r[0]).trim() !== '')
            .forEach(r => {
                out[String(r[0]).trim()] = parseValue(r[1])
            })
        return out
    } catch (e) {
        return {}
    }
}

export const mergeDataTableIntoPayload = (payload = {}, dataTable) => {
    const rows = (dataTable && typeof dataTable.rowsHash === 'function') ? dataTable.rowsHash() : (dataTable || {})
    payload = payload || {}
    payload.dto = payload.dto || {}
    Object.entries(rows).forEach(([k, v]) => {
        const parsed = parseValue(v)
        const existingKey = Object.keys(payload.dto).find(key => key.toLowerCase() === k.toLowerCase())
        if (parsed === null || typeof parsed === 'undefined' || parsed === '') {
            if (existingKey) delete payload.dto[existingKey]
        } else {
            payload.dto[existingKey || k] = parsed
        }
    })
    return payload
}

export const preparePayloadForSubmit = (currentPayload = {}, dataTable) => {
    const base = deepClone(currentPayload) || {}
    base.dto = base.dto || {}
    if (dataTable) {
        const merged = mergeDataTableIntoPayload(base, dataTable)
        const normalized = applyPaymentNormalization(merged, dataTable)
        const paymentNormalized = findKeyCI(base, '_paymentNormalized')
        delete base[paymentNormalized]
        return normalized
    }
    const paymentNormalized = findKeyCI(base, '_paymentNormalized')
    delete base[paymentNormalized]
    return base
}

export const submitPropostaManual = (payload = {}, { requests = propostaRequests, integration = DEFAULT_INTEGRATION, setEnv = setPropostaEnv } = {}) => {
    const incoming = deepClone(payload) || {}
    const normalized = (incoming && incoming.dto) ? incoming : { dto: (incoming || {}) }
    const novoCodigo = faker.string.uuid()
    const findKeyCI = (obj, name) => Object.keys(obj || {}).find(k => k.toLowerCase() === String(name).toLowerCase())
    const hasCodDto = !!findKeyCI(normalized.dto, 'CodigoOperacao')
    // Preserve explicit absence of CodigoOperacao (used by tests that remove this field).
    if (hasCodDto) {
        normalized.dto = { ...(normalized.dto || {}), CodigoOperacao: novoCodigo }
        cy.log(`[IncluirPropostaManual] CodigoOperacao gerado: ${novoCodigo}`)
    } else {
        cy.log(`[IncluirPropostaManual] CodigoOperacao preservado: ${normalized.dto.CodigoOperacao}`)
    }
    const body = { ...normalized, dto: normalized.dto }
    return requests.IncluirPropostaManual(body, integration).then((resp) => {
        cy.log('[IncluirPropostaManual] response:', resp)
        cy.wrap(resp).as('responseStatus')
        const safeName = (scenarioTitle && scenarioTitle.length) ? scenarioTitle : 'IncluirPropostaManual'
        const propostaCodigo = resp && resp.body && resp.body.Codigo ? resp.body.Codigo : 'unknown'
        try {
            setEnv && setEnv('IncluirPropostaManual', resp)
        } catch (e) {
            Cypress.env('propostaCodigo', propostaCodigo)
        }
        cy.log('PropostaCodigo definido como:', propostaCodigo)
        return saveRequestAndResponseFiles(safeName, body, resp)
            .then(() => {
                cy.log(`Request/Response salvos for ${safeName}`)
                return cy.wrap(resp)
            })
    })
}

const BuilderIncluirPropostaManual = {
    buildDtoFromDataTable,
    parseParametersTable,
    preparePayloadForSubmit,
    submitPropostaManual,
    setScenarioTitle,
    getScenarioTitle,
    mergeDataTableIntoPayload,
}

export default BuilderIncluirPropostaManual;