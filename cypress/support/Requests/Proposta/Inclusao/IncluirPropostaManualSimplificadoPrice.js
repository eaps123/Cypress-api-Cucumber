import { gerarAuth } from '../../../Funcoes/index';

const IncluirPropostaManualSimplificadoPriceRequests ={
    IncluirPropostaManualSimplificadoPrice(dtoPayload = {}, integracao) {
        const body = {
            auth: gerarAuth(integracao), // acessa gerarAuth via named import
            dto: dtoPayload.dto,
            parametros: dtoPayload.parametros
        };
        return cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/BMPDigital/IncluirPropostaManualSimplificadoPrice",
            body: body,
            failOnStatusCode: false
        })
    }
}
export default IncluirPropostaManualSimplificadoPriceRequests;