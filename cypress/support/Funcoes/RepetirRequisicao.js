import FuncoesRequests from '../Funcoes/index';

function RepetirRequisicao(
  propostaCodigo,
  fixture,
  endpoint,
  integracao,
  tentativa = 1,
  maxTentativas = 30
) {

  cy.log(`Tentativa ${tentativa} de ${maxTentativas}`);

  let AgendaPayload = {}

  return cy.fixture(fixture).then((agendaConsulta) => {

    AgendaPayload = { ...agendaConsulta }

    AgendaPayload.dto.CodigoProposta = propostaCodigo

    AgendaPayload.auth = FuncoesRequests.gerarAuth(integracao)


    return cy.request({
      method: "POST",
      url: Cypress.env("baseUrl") + endpoint,
      body: AgendaPayload,
      failOnStatusCode: false
    }).then((response) => {

if (response.status === 200) {

  cy.log(`Sucesso na tentativa ${tentativa}`);
  

  if(tentativa > 1){
    Cypress.env('responsePrimeiraConsulta', response);
    Cypress.env('responseRepeticao', 'next')
  }else{
    Cypress.env('responseRepeticao', response);
  }

  return cy.wrap(response); 
}

      if (tentativa < maxTentativas) {
        cy.wait(5000);
        return RepetirRequisicao(
          propostaCodigo,
          fixture,
          endpoint,
          integracao,
          tentativa + 1,
          maxTentativas
        );
      }

      throw new Error(
        `Não obteve sucesso na requisição após ${maxTentativas} tentativas`
      );
    });
  });
}

export default RepetirRequisicao;
