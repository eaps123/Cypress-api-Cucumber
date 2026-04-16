import FuncoesRequests from '../../Funcoes/index';

const CancelarCobrancasRequests =
{
    CancelarCobrancas(CancelarCobrancasPayload, integracao) {
        const body = {
            auth: FuncoesRequests.gerarAuth(integracao), // acessa gerarAuth via FuncoesRequests
            dto: CancelarCobrancasPayload.dto,
            dtoCancelarCobrancas: CancelarCobrancasPayload.dtoCancelarCobrancas
        }

        return cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/AgendaController/AgendaRecebivelCancelarCobrancas",
            body: body,
            failOnStatusCode: false
        })
    }
}
export default CancelarCobrancasRequests;