import { gerarAuth } from '../../../Funcoes/index'

const IncluirPropostaRequests = {
    IncluirProposta(dtoPayload = {}, integracao) {
        const body = {
            auth: gerarAuth(integracao), // acessa gerarAuth via FuncoesRequests
            dto: dtoPayload.dto,
            parametros: dtoPayload.parametros
        }
        console.log(body); // loga o body antes de enviar a request
        return cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/BMPDigital/IncluirProposta",
            body: body,
            failOnStatusCode: false
        })
    }
}
export default IncluirPropostaRequests;