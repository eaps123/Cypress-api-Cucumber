import FuncoesRequests from '../../Funcoes/index';

const CalcularFluxoIrregularRequests = {
    CalcularFluxoIrregular(dtoPayload = {}, integracao) {
        const body = {
            auth: FuncoesRequests.gerarAuth(integracao), // acessa gerarAuth via FuncoesRequests
            dto: dtoPayload.dto,
            parametros: dtoPayload.parametros
        };
        console.log(body); // loga o body antes de enviar a request
        return cy.request({
            method: "POST",
            //url: Cypress.env("baseUrl") + "/BMPDigital//CalcularFluxoIrregular",
            url: Cypress.env("baseUrl") + "/BMPDigital/CalcularFluxoIrregular",
            body: body,
            failOnStatusCode: false
        });
    }
};

export default CalcularFluxoIrregularRequests;