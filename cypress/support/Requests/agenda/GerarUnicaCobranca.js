import FuncoesRequests from '../../Funcoes/index';

const GerarUnicaCobrancaRequests =
{

    GerarUnicaCobranca(GerarUnicaCobrancaPayload, integracao) {
        const body = {
            auth: FuncoesRequests.gerarAuth(integracao),
            dto: GerarUnicaCobrancaPayload.dto,
            dtoGerarUnicaLiquidacao: GerarUnicaCobrancaPayload.dtoGerarUnicaLiquidacao
        };
        return cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/AgendaController/AgendaRecebivelGerarUnicaCobranca",
            body: body,
            failOnStatusCode: false
        })
    }
}
export default GerarUnicaCobrancaRequests;