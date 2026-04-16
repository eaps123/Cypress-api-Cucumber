import FuncoesRequests from '../../Funcoes/index';

const PropostaFinalizarRequests = {
    PropostaFinalizar(dtoPayload ={}, integracao) {

        const body = {
            auth: FuncoesRequests.gerarAuth(integracao), // acessa gerarAuth via FuncoesRequests
            dto: dtoPayload.dto,
            parametros: dtoPayload.parametros
        }
        return cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/BMPDigital/PropostaFinalizar",
            body: body,
            failOnStatusCode: false
        })
    }
}
export default PropostaFinalizarRequests;