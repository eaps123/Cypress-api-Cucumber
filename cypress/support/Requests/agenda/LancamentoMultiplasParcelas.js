import FuncoesRequests from '../../Funcoes/index';

const LancamentoMultiplasParcelasRequests =
{
    
    LancamentoMultiplasParcelas(LancamentoMultiplasParcelasPayload, integracao) {
        const body = {
            auth: FuncoesRequests.gerarAuth(integracao), // acessa gerarAuth via FuncoesRequests
            dto: LancamentoMultiplasParcelasPayload.dto,
            dtoLancamentoParcelas: LancamentoMultiplasParcelasPayload.dtoLancamentoParcelas,
            parametros: LancamentoMultiplasParcelasPayload.parametros
        };
        return cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/AgendaController/AgendaRecebivelLancamentoMultiplasParcelas",
            body: body,
            failOnStatusCode: false
        })
    }
}
export default LancamentoMultiplasParcelasRequests;