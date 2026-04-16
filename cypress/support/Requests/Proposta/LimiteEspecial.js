import FuncoesRequests from '../../Funcoes/index';

const LimiteEspecialRequests = {
    LimiteEspecial(payload = {}, integracao) {
        // aceita payload no formato { dto: { PropostaDTO, PessoaDTO }, ParceiroDTO }
        // ou payload direto { PropostaDTO, PessoaDTO, ParceiroDTO }
        const dtoWrapper = payload && payload.dto ? payload.dto : payload;

        const body = {
            auth: FuncoesRequests.gerarAuth(integracao),
            PropostaDTO: dtoWrapper.PropostaDTO || {},
            PessoaDTO: dtoWrapper.PessoaDTO || {},
            ParceiroDTO: dtoWrapper.ParceiroDTO || {}
        };

        return cy.request({
            method: 'POST',
            url: Cypress.env('baseUrl') + '/BMPDigital/IncluirPropostaLimiteEspecial',
            body,
            failOnStatusCode: false
        });
    }
};

export default LimiteEspecialRequests;