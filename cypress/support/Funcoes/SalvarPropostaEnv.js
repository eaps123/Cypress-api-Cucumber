// Helper para salvar propostas por tipo em Cypress.env('propostas')
// Mantém compatibilidade escrevendo também `propostaCodigo` e `CodigoOperacao` quando disponíveis
export function setPropostaEnv(tipo, response = {}) {
  const propostas = Cypress.env('propostas') || {}
  const body = (response && response.body) ? response.body : response || {}

  propostas[tipo] = {
    Codigo: body?.Codigo ?? body?.codigo ?? null,
    CodigoOperacao: body?.CodigoOperacao ?? body?.CodigoOperacao ?? null,
    Numero: body?.Numero ?? null,
    raw: body
  }

  Cypress.env('propostas', propostas)

  // backward compatibility
  if (propostas[tipo].Codigo) Cypress.env('propostaCodigo', propostas[tipo].Codigo)
  if (propostas[tipo].CodigoOperacao) Cypress.env('CodigoOperacao', propostas[tipo].CodigoOperacao)

  return propostas[tipo]
}
export default setPropostaEnv