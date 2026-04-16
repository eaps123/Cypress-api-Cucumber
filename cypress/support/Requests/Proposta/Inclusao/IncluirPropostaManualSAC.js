import { gerarAuth } from '../../../Funcoes/index';

const IncluirPropostaManualSACRequests ={
    IncluirPropostaManualSAC(dtoPayload = {}, integracao) {
        const body = {
            auth: gerarAuth(integracao), // acessa gerarAuth via FuncoesRequests
            dto: dtoPayload.dto,
            parametros: dtoPayload.parametros
        }
        console.log(body)
        return cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/BMPDigital/IncluirPropostaManualSAC",
            body: body,
            failOnStatusCode: false
        })
    }
}
export default IncluirPropostaManualSACRequests;