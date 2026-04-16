import FuncoesRequests from '../../Funcoes/index';

const ConsultarDetalhesRequests =
{
    ConsultarDetalhes(ConsultarDetalhesPayload, integracao) {
        const body = {
            auth: FuncoesRequests.gerarAuth(integracao), // acessa gerarAuth via FuncoesRequests
            dto: ConsultarDetalhesPayload.dto,
            dtoConsultaDetalhes: ConsultarDetalhesPayload.dtoConsultaDetalhes
        }

        return cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/AgendaController/AgendaRecebivelConsultarDetalhes",
            body: body,
            failOnStatusCode: false
        })
    }
}
export default ConsultarDetalhesRequests;