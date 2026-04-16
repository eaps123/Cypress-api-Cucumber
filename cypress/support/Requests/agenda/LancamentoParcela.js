import FuncoesRequests from '../../Funcoes/index';



const LancamentoParcelaRequests =
{
    
    LancamentoParcela(LancamentoParcelaPayload, integracao) {
        const body = {
            auth: FuncoesRequests.gerarAuth(integracao), // acessa gerarAuth via FuncoesRequests
            dto: LancamentoParcelaPayload.dto,
            dtoLancamentoParcela: LancamentoParcelaPayload.dtoLancamentoParcela,
            parametros: LancamentoParcelaPayload.parametros
        };
        return cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/AgendaController/AgendaRecebivelLancamentoParcela",
            body: body,
            failOnStatusCode: false
        })
    }
}
export default LancamentoParcelaRequests;