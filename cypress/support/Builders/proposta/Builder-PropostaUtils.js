import FuncoesRequests, {
    ExcluirCamposJsonFuncoes,
    findKeyCaseInsensitive,
    deepClone,
    ensureCodigoOperacao,
    findKeyCI
} from "../../Funcoes/index"

export const assertResponseStatus = (response, { expectedStatus, erroEsperado } = {}) => {
    const status = response?.status ?? (typeof response === 'number' ? response : undefined)
    const body = response?.body ?? response ?? {}
    const readMsgs = (b) => b?.Messages ?? b?.messages ?? b?.Msg ?? b?.Message ?? []
    const toBool = (v) => v === true || String(v).toLowerCase() === 'true'
    const msgs = readMsgs(body)
    const hasMessages = Array.isArray(msgs) ? msgs.length > 0 : Boolean(msgs)
    const hasErrorFlag = toBool(body?.HasError)
    const apiHasError = hasErrorFlag || hasMessages
    erroEsperado = typeof erroEsperado === 'undefined' ? false : erroEsperado
    switch (true) {
        //Espero Erro
        case erroEsperado === true && status === expectedStatus && !apiHasError:
            throw new Error(
                '❌ O teste esperava erro, mas a API respondeu como sucesso.'
            )
        case erroEsperado === true && status != expectedStatus && hasErrorFlag === false:
            throw new Error(
                `❌ O teste esperava erro, mas a API respondeu como sucesso: ${JSON.stringify(status)}`
            )
        case erroEsperado === true && (apiHasError || hasErrorFlag === true) && (status === expectedStatus || (status >= 400 && status < 500)):
            expect(hasErrorFlag).to.equal(true)
            cy.log('✅ Erro esperado ocorreu. Teste validado com sucesso. Mensagem gerada:', msgs)
            break
        case erroEsperado === true && (apiHasError || hasErrorFlag === true) && (status != expectedStatus || (status >= 400 && status < 500)):
            expect(hasErrorFlag).to.equal(true)
            cy.log('✅ Erro esperado ocorreu. Teste validado com sucesso. Mensagem gerada:', msgs)
            break
        //Espero Sucesso
        case erroEsperado === false && status === expectedStatus && !apiHasError:
            expect(hasErrorFlag).to.equal(false)
            cy.log('✅ Teste validado com sucesso.')
            break
        case erroEsperado === false && (apiHasError || hasErrorFlag === true) && (status != expectedStatus || (status >= 400 && status < 500)):
            throw new Error(
                `❌ O teste esperava sucesso, porém API respondeu com erro: ${JSON.stringify(status)} e mensagens: ${JSON.stringify(msgs)}`
            )
        default:
            throw new Error(
                `❌ Combinação não mapeada:`,
                cy.log('ℹ️ Combinação não mapeada:', { erroEsperado, apiHasError, status, expectedStatus, msgs })
            )
    }
}

export const applyPaymentNormalization = (payload = {}, dataTable) => {
    if (payload && payload._paymentNormalized) {
        return payload
    }
    payload = payload || {}
    payload.dto = payload.dto || {}
    const dto = payload.dto
    const explicitPaymentKey = findKeyCI(dto, 'PaymentType')
    const explicitPayment = explicitPaymentKey ? String(dto[explicitPaymentKey]).trim().toUpperCase() : ''
    const chavePixKey = findKeyCI(dto, 'ChavePIX')
    const propostaPIX = findKeyCI(dto, 'PropostaPIX_ChavePIX')
    const contaKey = findKeyCI(dto, 'Conta') || findKeyCI(dto, 'PCC_Conta')
    const codigoBancoKey = findKeyCI(dto, 'CodigoBanco') || findKeyCI(dto, 'PCC_CodigoBanco') || findKeyCI(dto, 'NumeroBanco')
    const isPix = explicitPayment === 'PIX' || (!!propostaPIX && String(dto[propostaPIX]).trim() !== '')
    const isConta = explicitPayment === 'CONTA' || (!!codigoBancoKey || !!contaKey)
    const removeKeys = (keys) => keys.forEach(k => {
        const fk = findKeyCI(dto, k)
        if (fk) delete dto[fk]
        const fp = Object.keys(payload || {}).find(pk => String(pk).toLowerCase() === String(k).toLowerCase())
        if (fp && fp !== 'dto') delete payload[fp]
    })
    if (isPix) {
        const chaveVal = propostaPIX ? String(dto[propostaPIX]).trim() : (chavePixKey ? String(dto[chavePixKey]).trim() : undefined)
        if (typeof chaveVal !== 'undefined') dto.PropostaPIXPagamentoDTO = { ChavePIX: chaveVal || '' }
        removeKeys(['CodigoBanco', 'Conta', 'ContaDig', 'Agencia', 'AgenciaDig', 'PropostaContaPagamentoDTO', 'DocumentoFederalPagamento', 'NomePagamento', 'NumeroBanco', 'PaymentType'])
        delete dto[chavePixKey]
    } else if (isConta) {
        const contaDto = {}
        const pick = (srcNames, dst) => {
            for (const n of srcNames) {
                const fk = findKeyCI(dto, n)
                if (fk && dto[fk] !== undefined && String(dto[fk]).trim() !== '') {
                    contaDto[dst || n] = dto[fk]
                    break
                }
            }
        }
        pick(['CodigoBanco', 'PCC_CodigoBanco', 'NumeroBanco'], 'CodigoBanco')
        pick(['Conta', 'PCC_Conta'], 'Conta')
        pick(['ContaDig'], 'ContaDig')
        pick(['TipoConta'], 'TipoConta')
        pick(['Agencia'], 'Agencia')
        pick(['AgenciaDig'], 'AgenciaDig')
        pick(['DocumentoFederalPagamento'], 'DocumentoFederalPagamento')
        pick(['NomePagamento'], 'NomePagamento')
        if (Object.keys(contaDto).length) {
            dto.PropostaContaPagamentoDTO = contaDto
        }
        removeKeys(['ChavePIX', 'PropostaPIX_ChavePIX', 'PropostaPIXPagamentoDTO', 'PaymentType'])
    } else {
        // nenhum método detectado: remove ambos DTOs para evitar payload inválido
        delete dto.PropostaPIXPagamentoDTO
        delete dto.PropostaContaPagamentoDTO
        delete dto.PaymentType
    }
    payload._paymentNormalized = true
    return payload
}

export const removeDtoFieldFromPayload = (payload = {}, campoAusente) => {
    const proposta = deepClone(payload)
    // suporta payload.dto ou dto "achatado"
    const target = proposta.dto && typeof proposta.dto === 'object' ? proposta.dto : proposta
    const ExcluirCamposPorPalavra = ExcluirCamposJsonFuncoes
    // remove key at top-level if present (case-insensitive)
    const campoKey = findKeyCaseInsensitive(target, campoAusente)
    if (campoKey && Object.prototype.hasOwnProperty.call(target, campoKey)) {
        delete target[campoKey]
        console.log(`[Builder] Campo removido diretamente: ${campoKey}`)
    }
    // recursive function to remove field from objects/arrays deeply
    const removeFieldRecursively = (obj, fieldName) => {
        if (!obj) return
        if (Array.isArray(obj)) {
            for (const item of obj) {
                if (item && (typeof item === 'object')) removeFieldRecursively(item, fieldName)
            }
            return
        }
        if (typeof obj === 'object') {
            // delete matching key in this object (case-insensitive)
            const localKey = Object.keys(obj).find(k => k.toLowerCase() === String(fieldName).toLowerCase())
            if (localKey && Object.prototype.hasOwnProperty.call(obj, localKey)) {
                delete obj[localKey]
                console.log(`[Builder] Campo removido em objeto: ${localKey}`)
            }
            // recurse into children
            for (const k of Object.keys(obj)) {
                const val = obj[k]
                if (val && (typeof val === 'object' || Array.isArray(val))) {
                    removeFieldRecursively(val, fieldName)
                }
            }
        }
    }
    // perform deep removal across the dto
    removeFieldRecursively(target, campoAusente)
    // fallback to word-based remover if available (keeps existing behavior)
    if (typeof ExcluirCamposPorPalavra === 'function') {
        try {
            ExcluirCamposPorPalavra(target, campoAusente)
            console.log(`[Builder] ExcluirCamposJsonFuncoes aplicado para: ${campoAusente}`)
        } catch (e) {
            console.warn('[Builder] ExcluirCamposJsonFuncoes falhou:', e && e.message)
        }
    }
    const removingCodigoOperacao = String(campoAusente || '').toLowerCase() === 'codigooperacao'
    if (!removingCodigoOperacao) ensureCodigoOperacao(proposta)
    return proposta
}

const BuilderUtils = {
    applyPaymentNormalization,
    assertResponseStatus,
    removeDtoFieldFromPayload
}

export default BuilderUtils;