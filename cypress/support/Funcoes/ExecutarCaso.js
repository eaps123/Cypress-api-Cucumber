import { stringify } from 'ini';
import { AgendaRequests } from '../Requests/agenda'


const casos = {


  "true_LancamentoParcela": () => {

    cy.log("Desconto TRUE + Lançamento Parcela");

    cy.fixture('agenda/AgendaRecebivelLancamentoParcela.json').then((lancamentoPayload) => {

      lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

      lancamentoPayload.dtoLancamentoParcela.VlrDesconto = 100

      if (Cypress.env('descapitalizacao') == 'true') {

        lancamentoPayload.dtoLancamentoParcela.PermiteDescapitalizacao = true
      }

      AgendaRequests.LancamentoParcela(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

        Cypress.env('lancamentoResponse', response)

        cy.log("Response: " + JSON.stringify(response.body))

      })

    })


  },
  "true_LancamentoMultiplasParcelas": () => {

    cy.log("Desconto TRUE + Lançamento Múltiplas Parcelas");

    cy.fixture('agenda/AgendaRecebivelLancamentoMultiplasParcelas.json').then((lancamentosPayload) => {

      if (Cypress.env('descapitalizacao') == 'false') {

        lancamentosPayload.dtoLancamentoParcelas[0].PermiteDescapitalizacao = false
        lancamentosPayload.dtoLancamentoParcelas[1].PermiteDescapitalizacao = false
        lancamentosPayload.dtoLancamentoParcelas[2].PermiteDescapitalizacao = false
        lancamentosPayload.dtoLancamentoParcelas[3].PermiteDescapitalizacao = false
      }

      lancamentosPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

      lancamentosPayload.dto.MotivoBaixa = null

      lancamentosPayload.dtoLancamentoParcelas[0].VlrPagamento = 500
      lancamentosPayload.dtoLancamentoParcelas[1].VlrPagamento = 500
      lancamentosPayload.dtoLancamentoParcelas[2].VlrPagamento = 500
      lancamentosPayload.dtoLancamentoParcelas[3].VlrPagamento = 500

      lancamentosPayload.dtoLancamentoParcelas[0].VlrDesconto = 100
      lancamentosPayload.dtoLancamentoParcelas[1].VlrDesconto = 100
      lancamentosPayload.dtoLancamentoParcelas[2].VlrDesconto = 100
      lancamentosPayload.dtoLancamentoParcelas[3].VlrDesconto = 100

      AgendaRequests.LancamentoMultiplasParcelas(lancamentosPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

        Cypress.env('lancamentoResponse', response)

        cy.log("Response: " + JSON.stringify(response.body))

      })

    })
  },
  "true_Tela": () => {

    let numeroProposta = Cypress.env('numeroProposta')

    cy.log("Desconto TRUE + Tela");

    cy.visit("https://bmpteste.moneyp.com.br/#/loginempresa")

    cy.get('[name="email"]').type('jose.crema@fulltechpro.com.br')
    cy.get('[name="password"]').type('Jc.040923!')
    cy.get('#wEPCodigo').select('JOINVILLE')
    cy.get('.btn').click().wait(1000)
    cy.get('.breadcrumb > :nth-child(1)').should('be.visible')

    cy.get('[href="#"][title="Agenda de Recebíveis"] > .menu-item-parent').click()
    cy.get('[style="display: block;"] > :nth-child(1) > a').click()

    cy.get('[name="nroProposta"]').should('be.visible').type(numeroProposta)

    cy.intercept('POST', 'https://bmpteste.moneyp.com.br/api/AgendaRecebivel/ListaAgendasMP?v=*')
      .as('AgendaLista')

    cy.get('.col-2 > .btn').click()

    cy.wait('@AgendaLista')
    cy.wait(1000)

    cy.window()
      .then(win => {
        cy.stub(win, 'open')
          .callsFake((url) => {
            return win.open.wrappedMethod.call(win, url, '_self');
          })
          .as('Open')
      });

    cy.get('button[title="Detalhes"]').click()
    cy.get('button[class="btn btn-default dropdown-toggle"]').first().click()
    cy.get('a[title="Realizar Pagamento Manual da Parcela"]').first().click()

    cy.get('input[id="vlrLancamento"]').type('900,00');

    cy.get('input[id="vlrDesconto"]').type('100,00')
    if (Cypress.env('descapitalizacao') == 'true') {
      cy.get('select[id="MotivoLancamento"]').select('Liquidação')
      cy.get('input[id="VlrCalculado"]').invoke('val').then((valorCalculado) => {

        const valorDesconto = parseInt(valorCalculado)


        cy.get('input[id="vlrLancamento"]').clear().type(valorDesconto - 100 + '00');

      })
    } else {
      cy.get('select[id="MotivoLancamento"]').select('Parcial')
      cy.get('input[id="vlrLancamento"]').clear().type('800,00');
    }

    cy.get('textarea[id="DescLancamento"]').type('Teste automatizado com desconto')
    cy.get('button[ng-click="salvarLancamento()"]').click()
    cy.intercept('POST', 'https://bmpteste.moneyp.com.br/api/AgendaRecebivel/LancamentoManualParcela?v=*')
      .as('AgendaLancamento')

    cy.get('#delete-form > footer > .btn-primary').click().wait('@AgendaLancamento')
    cy.wait(1000)

  },
  "false_LancamentoParcela": () => {
    cy.log("Desconto FALSE + Lançamento Parcela");

    cy.fixture('agenda/AgendaRecebivelLancamentoParcela.json').then((lancamentoPayload) => {

      lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

      lancamentoPayload.dtoLancamentoParcela.VlrDesconto = 0

      if (Cypress.env('descapitalizacao') == 'true') {

        lancamentoPayload.dtoLancamentoParcela.PermiteDescapitalizacao = true
      }

      AgendaRequests.LancamentoParcela(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

        Cypress.env('lancamentoResponse', response)

        cy.log("Response: " + JSON.stringify(response.body))

      })

    })
  },
  "false_LancamentoMultiplasParcelas": () => {
    cy.log("Desconto FALSE + Lançamento Múltiplas Parcelas");

    cy.fixture('agenda/AgendaRecebivelLancamentoMultiplasParcelas.json').then((lancamentosPayload) => {

      lancamentosPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

      lancamentosPayload.dto.MotivoBaixa = null

      if (Cypress.env('descapitalizacao') == 'false') {
        lancamentosPayload.dtoLancamentoParcelas[0].PermiteDescapitalizacao = false
        lancamentosPayload.dtoLancamentoParcelas[1].PermiteDescapitalizacao = false
        lancamentosPayload.dtoLancamentoParcelas[2].PermiteDescapitalizacao = false
        lancamentosPayload.dtoLancamentoParcelas[3].PermiteDescapitalizacao = false
      }

      lancamentosPayload.dtoLancamentoParcelas[0].VlrPagamento = 500
      lancamentosPayload.dtoLancamentoParcelas[1].VlrPagamento = 500
      lancamentosPayload.dtoLancamentoParcelas[2].VlrPagamento = 500
      lancamentosPayload.dtoLancamentoParcelas[3].VlrPagamento = 500

      lancamentosPayload.dtoLancamentoParcelas[0].VlrDesconto = 0
      lancamentosPayload.dtoLancamentoParcelas[1].VlrDesconto = 0
      lancamentosPayload.dtoLancamentoParcelas[2].VlrDesconto = 0
      lancamentosPayload.dtoLancamentoParcelas[3].VlrDesconto = 0

      AgendaRequests.LancamentoMultiplasParcelas(lancamentosPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

        Cypress.env('lancamentoResponse', response)

        cy.log("Response: " + JSON.stringify(response.body))

      })

    })

  },
  "false_Tela": () => {
    cy.log("Desconto FALSE + Tela");

    let numeroProposta = Cypress.env('numeroProposta')

    cy.visit("https://bmpteste.moneyp.com.br/#/loginempresa")

    cy.get('[name="email"]').type('jose.crema@fulltechpro.com.br')
    cy.get('[name="password"]').type('Jc.040923!')
    cy.get('#wEPCodigo').select('JOINVILLE')
    cy.get('.btn').click().wait(1000)
    cy.get('.breadcrumb > :nth-child(1)').should('be.visible')

    cy.get('[href="#"][title="Agenda de Recebíveis"] > .menu-item-parent').click()
    cy.get('[style="display: block;"] > :nth-child(1) > a').click()

    cy.intercept('POST', 'https://bmpteste.moneyp.com.br/api/AgendaRecebivel/ListaAgendasMP?v=*')
      .as('AgendaLista')



    cy.get('[name="nroProposta"]').type(numeroProposta)



    cy.get('.col-2 > .btn').click()

    cy.wait('@AgendaLista')
    cy.wait(1000)

    cy.window()
      .then(win => {
        cy.stub(win, 'open')
          .callsFake((url) => {
            return win.open.wrappedMethod.call(win, url, '_self');
          })
          .as('Open')
      });

    cy.get('button[title="Detalhes"]').click()
    cy.get('button[class="btn btn-default dropdown-toggle"]').first().click()
    cy.get('a[title="Realizar Pagamento Manual da Parcela"]').first().click()

    cy.get('input[id="vlrLancamento"]').type('1000,00');

    cy.get('input[id="vlrDesconto"]').type('0')
    if (Cypress.env('descapitalizacao') == 'true') {
      cy.get('select[id="MotivoLancamento"]').select('Liquidação')
      cy.get('input[id="VlrCalculado"]').invoke('val').then((valorCalculado) => {

        cy.get('input[id="vlrLancamento"]').clear().type(valorCalculado);

      })
    }
    else {
      cy.get('select[id="MotivoLancamento"]').select('Parcial')
      cy.get('input[id="vlrLancamento"]').clear().type('800,00')
    }
    cy.get('textarea[id="DescLancamento"]').type('Teste automatizado com desconto')
    cy.get('button[ng-click="salvarLancamento()"]').click()

    cy.intercept('POST', 'https://bmpteste.moneyp.com.br/api/AgendaRecebivel/LancamentoManualParcela?v=*')
      .as('AgendaLancamento')

    cy.get('#delete-form > footer > .btn-primary').click().wait('@AgendaLancamento')
    cy.wait(1000)

  },
  "default": () => {
    cy.log("Caso não mapeado");
  }
};

function ExecutarCaso(desconto, modalidade) {
  const chave = `${desconto}_${modalidade}`;
  (casos[chave] || casos["default"])();
}
export default ExecutarCaso