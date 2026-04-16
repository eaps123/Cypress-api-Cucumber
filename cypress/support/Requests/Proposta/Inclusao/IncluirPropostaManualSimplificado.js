import { gerarAuth } from '../../../Funcoes/index';

const IncluirPropostaManualSimplificadoRequests = {
    IncluirPropostaManualSimplificado(dtoPayload = {}, integracao) {
        const body = {
            auth: gerarAuth(integracao), // acessa gerarAuth via FuncoesRequests
            dto: dtoPayload.dto,
            parametros: dtoPayload.parametros
        }
        return cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/BMPDigital/IncluirPropostaManualSimplificado",
            body: body,
            failOnStatusCode: false
        })
    }
}
export default IncluirPropostaManualSimplificadoRequests;