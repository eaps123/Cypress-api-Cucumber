import { regrasPorTipo } from './ControlePayloadProposta'
import { propostaBase } from './PayloadBaseProposta'

export function buildPayload(tipoProposta, overrides = {}) {
  // valida tipoProposta passado no cenario
  if (typeof tipoProposta !== 'string') {
    throw new Error(`tipoProposta inválido: ${JSON.stringify(tipoProposta)}`)
  }

  const tipo = tipoProposta.toLowerCase()
  const regra = regrasPorTipo[tipo]

  if (!regra) {
    throw new Error(`Tipo inválido: ${tipoProposta}`)
  }

  cy.log('Regra aplicada:', regra)

  // garante estrutura padrão da regra
  const regraNormalizada = {
    usarCalculo: true,
    usarCampoPadrao: true,
    usarFinanAntigo: false,
    lancamentoForaDto: true,
    contaPagamentoForaDto: true,
    pixPagamentoForaDto: true,
    //incluir: [],
    remover: [],
    ...regra
  }

  //clona o projeto base para criar o payload que seja utilizado
  const payload = Cypress._.cloneDeep(propostaBase)

  //aplica overrides
  payload.dto = {
    ...payload.dto,
    ...overrides
  }

  // remove cálculo se necessário
  if (!regraNormalizada.usarCalculo) {
    delete payload.dto.CalculoProposta
  }

  if (!regraNormalizada.usarCampoPadrao) {
    delete payload.dto.DocumentoCliente
    delete payload.dto.CodigoOperacao
  }

  // trata nomenclatura antiga
  if (regraNormalizada.usarFinanAntigo) {
    payload.dto.TipoIndiceFinan = payload.dto.TipoIndiceFinanceiro
    payload.dto.PercIndiceFinan = payload.dto.PercIndiceFinanceiro

    delete payload.dto.TipoIndiceFinanceiro
    delete payload.dto.PercIndiceFinanceiro
  }

  // move lançamentos pra fora do dto
  if (
    regraNormalizada.lancamentoForaDto &&
    payload.dto.PropostaLancamentos
  ) {
    delete payload.dto.PropostaLancamentos
  }

  // move pagamento por conta pra fora do dto
  if (
    regraNormalizada.contaPagamentoForaDto &&
    (
      payload.dto.PropostaContaPagamentoDTO || 
      payload.dto.PropostaContaPagamento
    )
  ) {
    delete payload.dto.PropostaContaPagamentoDTO
    delete payload.dto.PropostaContaPagamento
  }

  // move pagamento por pix pra fora do dto
  if (
    regraNormalizada.pixPagamentoForaDto &&
    (
      payload.dto.PropostaPIXPagamentoDTO || 
      payload.dto.PropostaPIXPagamento
    )
  ) {
    delete payload.dto.PropostaPIXPagamentoDTO
    delete payload.dto.PropostaPIXPagamento
  }
  
  // garante campos incluídos
  regraNormalizada.incluir.forEach((campo) => {
    if (!(campo in payload.dto)) {
      payload.dto[campo] = null
    }
  })

  // 🔹 remove campos definidos na regra
  regraNormalizada.remover.forEach((campo) => {
    delete payload.dto[campo]
  })

  // limpeza inteligente (mantém os incluídos)
  Object.keys(payload.dto).forEach((key) => {
    const isIncluido = regraNormalizada.remover.includes(key)

    if (payload.dto[key] === null && !isIncluido) {
      delete payload.dto[key]
    }
  })

  return payload
}