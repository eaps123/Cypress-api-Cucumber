export const ensureCodigoOperacao = (proposta) => {
    proposta.dto = proposta.dto || {}
    proposta.dto.CodigoOperacao = proposta.dto.CodigoOperacao || faker.string.uuid()
    return proposta
}

export default ensureCodigoOperacao