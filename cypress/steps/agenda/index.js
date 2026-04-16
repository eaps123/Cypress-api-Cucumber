
import GerarDataMesSeguinte from '../../support/Funcoes/GerarDataMesSeguinte'
import RepetirRequisicao from '../../support/Funcoes/RepetirRequisicao'
import EncontrarCamposJson from '../../support/Funcoes/EncontrarCamposJson'
import VerificarParcelasConsultarDetalhes from '../../support/Funcoes/VerificarParcelasConsultarDetalhes'
import ExcluirCamposPorPalavra from '../../support/Funcoes/ExcluirCamposJson'
const PropostaRequests = Cypress.automacao.Requests.PropostaRequests
const AgendaRequests = Cypress.automacao.Requests.AgendaRequests
const { faker } = require('@faker-js/faker')

let incluirPropostaPayload = {}
let propostaFinalizarPayload = {}
let agendaPayload = {}
let propostaCodigo = ''
let cobrancaPayload = {}
let numeroProposta = ''
let parametrosImpressao = {}
let responseRepeticao = {}

Given("que eu tenha uma agenda criada previamente", () => {

    if(Cypress.env('parcelaDisponivel') == true){
        cy.log("Agenda já gerada para esse cenário.")
    }else{
        cy.fixture('agenda/AgendaIncluirPropostaManualSimplificado').then((proposta) => {

                incluirPropostaPayload = { ...proposta };
                const GerarDataMesSeguinteMes = GerarDataMesSeguinte()


                incluirPropostaPayload.dto.CodigoOperacao = faker.string.uuid()
                incluirPropostaPayload.dto.DtPrimeiroVencto = GerarDataMesSeguinteMes


                PropostaRequests.ManualSimplificado(incluirPropostaPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((ManualSimplificadoResponse) => {
                    //  cy.log('Payload da proposta: ' + incluirPropostaPayload);
                    //  cy.log('Payload da resposta: ' + ManualSimplificadoResponse)
                    const responseManualSimplificado = ManualSimplificadoResponse

                    cy.log('Status: ' + responseManualSimplificado.status)

                    Cypress.env('propostaCodigo', responseManualSimplificado.body.Codigo)

                    Cypress.env('propostaNumero', responseManualSimplificado.body.Numero)

                    cy.wrap(responseManualSimplificado).as('responseProposta')

                })


        })

        cy.fixture('agenda/AgendaPropostaFinalizar').then((propostaFinalizar) => {

                propostaFinalizarPayload = { ...propostaFinalizar }

                propostaFinalizarPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

                PropostaRequests.PropostaFinalizar(propostaFinalizarPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((PropostaFinalizarResponse) => {

                    expect(PropostaFinalizarResponse.body.Result).to.be.true

                })

                RepetirRequisicao(Cypress.env('propostaCodigo'), "agenda/AgendaRecebivelConsultarDetalhes", "/AgendaController/AgendaRecebivelConsultarDetalhes", "INTEGRACAO_AUTOMACAO_AGENDA");
        })

        cy.fixture('agenda/AgendaPropostaPagar').then((payload) => {

                payload.dto.CodigoProposta = Cypress.env('propostaCodigo')

                cy.request({
                    method: "POST",
                    url: Cypress.env("baseUrl") + "/BMPDigital/PropostaPagar",
                    body: payload,
                    failOnStatusCode: false
                })

        })
    }



})

Then("a api retorna sucesso na requisição", () => {

    cy.get(`@responseStatus`).then((responseStatus) => {
        const response = responseStatus.status
        expect(response).to.equal(200)
        cy.log('Resposta na requisição: ' + JSON.stringify(responseStatus.Response))


    })
})

/* v CONSULTA DE AGENDA v */

Then("a agenda é consultada com sucesso", () => {

    cy.get(`@responseStatus`).then((responseStatus) => {
        const response = responseStatus.status
        expect(response).to.equal(200)


    })
})

Then("a situação da agenda é definida para {string}", (Situacao) => {


    RepetirRequisicao(Cypress.env('propostaCodigo'),
    "agenda/AgendaRecebivelConsultarDetalhes",
    "/AgendaController/AgendaRecebivelConsultarDetalhes",
    "INTEGRACAO_AUTOMACAO_AGENDA")
    .then((response) => {

        expect(response.status).to.equal(200)

        if (Situacao == "Aberta"){
            expect(response.body.SituacaoAgenda).be.equal(2)
        }else{
            expect(response.body.SituacaoAgenda).be.equal(1)
        }
        
        
    })
})

When("eu envio uma requisição POST para a consulta de uma agenda", () => {

    cy.fixture('agenda/AgendaRecebivelConsultarDetalhes').then((agendaConsulta) => {

        agendaPayload = { ...agendaConsulta }

        agendaPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')



        AgendaRequests.ConsultarDetalhes(agendaPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((DetalhesResponse) => {

            cy.log(`Reposta da consulta: ${DetalhesResponse}`)

            const responseStatus = DetalhesResponse

            cy.wrap(responseStatus).as('responseStatus')

        })



    })

})

When ("eu realizo lancamento na agenda a fim de alterar sua situação para {string}", (Situacao)=>{

    cy.fixture('agenda/AgendaRecebivelLancamentoMultiplasParcelas').then((lancamentoPayload) => {

        lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')
        lancamentoPayload.dto.MotivoBaixa = null

        for (let i = 0; i < 4; i++) {

            let numeroParcela = i

            lancamentoPayload.dtoLancamentoParcelas[numeroParcela] = {}
            lancamentoPayload.dtoLancamentoParcelas[numeroParcela].NroParcela = i + 1
            if(Situacao == "Liquidada"){
                lancamentoPayload.dtoLancamentoParcelas[numeroParcela].VlrPagamento = 1000
            }else{
                lancamentoPayload.dtoLancamentoParcelas[numeroParcela].VlrPagamento = 500
            }
            lancamentoPayload.dtoLancamentoParcelas[numeroParcela].DtPagamento = new Date().toISOString().slice(0, 10)
            lancamentoPayload.dtoLancamentoParcelas[numeroParcela].PermiteDescapitalizacao = false
        }


        AgendaRequests.LancamentoMultiplasParcelas(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {
            Cypress.env('lancamentoResponse', response)
            cy.log("Response: " + JSON.stringify(response.body))
        })

        
    })


})

/* ^ CONSULTA DE AGENDA ^ */


/* v GERAÇÃO DE COBRANÇA v */

And("que eu preencha todos os campos para geração de cobrança {string} com desconto: {string}", (Modalidade,Desconto) => {

    parametrosImpressao['Modalidade'] = Modalidade;

    cy.fixture('agenda/AgendaRecebivelGerarUnicaCobranca').then((cobranca) => {

        cobrancaPayload = { ...cobranca }

        propostaCodigo = Cypress.env('propostaCodigo')

        cobrancaPayload.dto.CodigoProposta = propostaCodigo
        cobrancaPayload.dtoGerarUnicaLiquidacao.VlrLiquidacao = null

        if (Modalidade == "Pix") {

            cobrancaPayload.dtoGerarUnicaLiquidacao.PagamentoViaPix = true
            cobrancaPayload.dtoGerarUnicaLiquidacao.PagamentoViaBoleto = false

            if(Desconto == "true"){
                cobrancaPayload.dtoGerarUnicaLiquidacao.VlrDesconto = 100
            }else{
                cobrancaPayload.dtoGerarUnicaLiquidacao.VlrDesconto = 0
            }

        } else {

            cobrancaPayload.dtoGerarUnicaLiquidacao.PagamentoViaPix = false
            cobrancaPayload.dtoGerarUnicaLiquidacao.PagamentoViaBoleto = true

            if(Desconto == "true"){
                cobrancaPayload.dtoGerarUnicaLiquidacao.VlrDesconto = 100
            }else{
                cobrancaPayload.dtoGerarUnicaLiquidacao.VlrDesconto = 0
            }
        }

        cy.log(cobrancaPayload)

    })

})

And("que eu preencha todos os campos para geração de cobrança {string} parcial com desconto: {string}", (Modalidade) => {

    parametrosImpressao['Modalidade'] = Modalidade;

    cy.fixture('agenda/AgendaRecebivelGerarUnicaCobranca').then((cobranca) => {

        cobrancaPayload = { ...cobranca }

        propostaCodigo = Cypress.env('propostaCodigo')

        cobrancaPayload.dto.CodigoProposta = propostaCodigo
        cobrancaPayload.dtoGerarUnicaLiquidacao.VlrLiquidacao = 500
        cobrancaPayload.dtoGerarUnicaLiquidacao.Liquidacao = false

        if (Modalidade == "Pix") {

            cobrancaPayload.dtoGerarUnicaLiquidacao.PagamentoViaPix = true
            cobrancaPayload.dtoGerarUnicaLiquidacao.PagamentoViaBoleto = false

        } else {
            cobrancaPayload.dtoGerarUnicaLiquidacao.PagamentoViaPix = false
            cobrancaPayload.dtoGerarUnicaLiquidacao.PagamentoViaBoleto = true
        }

        cy.log(cobrancaPayload)

    })

})

Then("a cobrança é gerada na agenda", () => {

    RepetirRequisicao(Cypress.env('propostaCodigo'),
    "agenda/AgendaRecebivelConsultarDetalhes",
    "/AgendaController/AgendaRecebivelConsultarDetalhes",
    "INTEGRACAO_AUTOMACAO_AGENDA")
    .then((response) => {

        expect(response.status).to.equal(200)

        let codigoLiquicadao = EncontrarCamposJson(response, "CodigoCobranca")

        expect(codigoLiquicadao).be.equal(Cypress.env('codigoCobranca'))
        
        //SalvarJsonUnico(`Resultado da agenda com os parametros Descapitalizacao - ${Cypress.env('descapitalizacao')}, Desconto - ${Cypress.env('desconto')} e Modalidade - ${Cypress.env('modalidade')}`,response.body)

        //SalvarJsonUnicoComParametros(parametrosImpressao, response.body)

        //parametrosImpressao = {};

    })

})

When("eu envio uma requisição POST para a geração de cobrança em uma agenda", () => {


    AgendaRequests.GerarUnicaCobranca(cobrancaPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((DetalhesResponse) => {

        cy.log(`Reposta da consulta: ${DetalhesResponse}`)

        const responseStatus = DetalhesResponse

        cy.log(responseStatus)

        Cypress.env('codigoCobranca', DetalhesResponse.body.Cobrancas[0].CodigoLiquidacao)

    })

})


/* ^ GERAÇÃO DE COBRANÇA ^ */


/* v LANCAMENTO PARCELA v */

Given("que eu tenha uma agenda com o parâmetro Descapitalização: {string}", (Descapitalizacao) => {


    if (Descapitalizacao === 'true' &&  (Cypress.env('agendaDisponivel') === false || Cypress.env('agendaDisponivel') === undefined)) {

        Cypress.env('descapitalizacao', true)

        cy.fixture('agenda/AgendaIncluirPropostaManualSimplificado').then((proposta) => {

            incluirPropostaPayload = { ...proposta };
            const GerarDataMesSeguinteMes = GerarDataMesSeguinte()

            incluirPropostaPayload.dto.TipoContrato = "AGT" //Tipo de contrato configurado para agenda ser criada com Descapitalização e Encargos
            incluirPropostaPayload.dto.CodigoOperacao = faker.string.uuid()
            incluirPropostaPayload.dto.DtPrimeiroVencto = GerarDataMesSeguinteMes


            PropostaRequests.ManualSimplificado(incluirPropostaPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((ManualSimplificadoResponse) => {
                //  cy.log('Payload da proposta: ' + incluirPropostaPayload);
                //  cy.log('Payload da resposta: ' + ManualSimplificadoResponse)
                const responseManualSimplificado = ManualSimplificadoResponse

                cy.log('Status: ' + responseManualSimplificado.status)

                Cypress.env('propostaCodigo', responseManualSimplificado.body.Codigo)

                Cypress.env('propostaNumero', responseManualSimplificado.body.Numero)

                cy.wrap(responseManualSimplificado).as('responseProposta')


            })


        })

        
        cy.fixture('agenda/AgendaPropostaFinalizar').then((propostaFinalizar) => {

            propostaFinalizarPayload = { ...propostaFinalizar }

            propostaFinalizarPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

            PropostaRequests.PropostaFinalizar(propostaFinalizarPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((PropostaFinalizarResponse) => {

                //expect(PropostaFinalizarResponse.body.Result).to.be.true

            })


        })

        cy.fixture('agenda/AgendaPropostaPagar').then((payload) => {

            payload.dto.CodigoProposta = Cypress.env('propostaCodigo')

            cy.request({
                method: "POST",
                url: Cypress.env("baseUrl") + "/BMPDigital/PropostaPagar",
                body: payload,
                failOnStatusCode: false
            })

            RepetirRequisicao(Cypress.env('propostaCodigo'),
                "agenda/AgendaRecebivelConsultarDetalhes",
                "/AgendaController/AgendaRecebivelConsultarDetalhes",
                "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {
            })
        })

        
        cy.log('Agenda com descapitalização')

    } else if (Descapitalizacao === 'false' &&  (Cypress.env('agendaDisponivel') === false || Cypress.env('agendaDisponivel') === undefined)) {

        Cypress.env('descapitalizacao', false)

        cy.fixture('agenda/AgendaIncluirPropostaManualSimplificado').then((proposta) => {

            incluirPropostaPayload = { ...proposta };
            const GerarDataMesSeguinteMes = GerarDataMesSeguinte()


            incluirPropostaPayload.dto.CodigoOperacao = faker.string.uuid()
            incluirPropostaPayload.dto.DtPrimeiroVencto = GerarDataMesSeguinteMes


            PropostaRequests.ManualSimplificado(incluirPropostaPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((ManualSimplificadoResponse) => {
                //  cy.log('Payload da proposta: ' + incluirPropostaPayload);
                //  cy.log('Payload da resposta: ' + ManualSimplificadoResponse)
                const responseManualSimplificado = ManualSimplificadoResponse

                cy.log('Status: ' + responseManualSimplificado.status)

                Cypress.env('propostaCodigo', responseManualSimplificado.body.Codigo)

                Cypress.env('propostaNumero', responseManualSimplificado.body.Numero)

                cy.wrap(responseManualSimplificado).as('responseProposta')

            })


        })

        cy.fixture('agenda/AgendaPropostaFinalizar').then((propostaFinalizar) => {

            propostaFinalizarPayload = { ...propostaFinalizar }

            propostaFinalizarPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

            PropostaRequests.PropostaFinalizar(propostaFinalizarPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((PropostaFinalizarResponse) => {

                expect(PropostaFinalizarResponse.body.Result).to.be.true

            })

            RepetirRequisicao(Cypress.env('propostaCodigo'), "agenda/AgendaRecebivelConsultarDetalhes", "/AgendaController/AgendaRecebivelConsultarDetalhes", "INTEGRACAO_AUTOMACAO_AGENDA");
        })

        cy.fixture('agenda/AgendaPropostaPagar').then((payload) => {

            payload.dto.CodigoProposta = Cypress.env('propostaCodigo')

            cy.request({
                method: "POST",
                url: Cypress.env("baseUrl") + "/BMPDigital/PropostaPagar",
                body: payload,
                failOnStatusCode: false
            })

        })

        cy.log('Agenda sem descapitalização')
    } else {
        cy.log("Agenda já gerada para esse cenário.")
    }

})

When("eu realizo o lancamento na parcela com Desconto: {string} para {string}", (Desconto, Modalidade) => {

    VerificarParcelasConsultarDetalhes()

    cy.fixture('agenda/AgendaRecebivelLancamentoParcela.json').then((lancamentoPayload) => {

        if (Desconto === 'true') {
            if (Modalidade === 'Liquidacao') {
                Cypress.env('liquidacao', true)

                    responseRepeticao = Cypress.env('responsePrimeiraConsulta')

                    lancamentoPayload.dtoLancamentoParcela.VlrPagamento = (responseRepeticao.body.Parcelas[Cypress.env('parcelaComSaldo')].VlrSaldoAtual) - 100

                    lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

                    lancamentoPayload.dtoLancamentoParcela.VlrDesconto = 100

                    lancamentoPayload.dto.NroParcela = Cypress.env('parcelaComSaldo') + 1

                    lancamentoPayload.dtoLancamentoParcela.DtPagamento = new Date().toISOString().slice(0, 10)

                    lancamentoPayload.dtoLancamentoParcela.PermiteDescapitalizacao = Cypress.env('descapitalizacao')

                    AgendaRequests.LancamentoParcela(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

                        Cypress.env('lancamentoResponse', response)

                        cy.log("Response: " + JSON.stringify(response.body))

                    })

            } else { 
                Cypress.env('liquidacao', false)


                    responseRepeticao = Cypress.env('responsePrimeiraConsulta')

                    lancamentoPayload.dtoLancamentoParcela.VlrPagamento = (responseRepeticao.body.Parcelas[Cypress.env('parcelaComSaldo')].VlrSaldoAtual) - 200

                    lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

                    lancamentoPayload.dto.NroParcela = Cypress.env('parcelaComSaldo') + 1

                    lancamentoPayload.dtoLancamentoParcela.VlrDesconto = 100

                    lancamentoPayload.dtoLancamentoParcela.DtPagamento = new Date().toISOString().slice(0, 10)

                    lancamentoPayload.dtoLancamentoParcela.PermiteDescapitalizacao = Cypress.env('descapitalizacao')

                    AgendaRequests.LancamentoParcela(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

                        Cypress.env('lancamentoResponse', response)

                        cy.log("Response: " + JSON.stringify(response.body))

                    })


            }


        } else { //Desconto = false
            if (Modalidade === 'Liquidacao') {
                Cypress.env('liquidacao', true)


                    responseRepeticao = Cypress.env('responsePrimeiraConsulta')

                    lancamentoPayload.dtoLancamentoParcela.VlrPagamento = (responseRepeticao.body.Parcelas[Cypress.env('parcelaComSaldo')].VlrSaldoAtual) 

                    lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

                    lancamentoPayload.dto.NroParcela = Cypress.env('parcelaComSaldo') + 1

                    lancamentoPayload.dtoLancamentoParcela.PermiteDescapitalizacao = Cypress.env('descapitalizacao')

                    lancamentoPayload.dtoLancamentoParcela.DtPagamento = new Date().toISOString().slice(0, 10)

                    AgendaRequests.LancamentoParcela(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

                        Cypress.env('lancamentoResponse', response)

                        cy.log("Response: " + JSON.stringify(response.body))

                    })

            } else {
                Cypress.env('liquidacao', false)


                    Cypress.env('liquidacao', false)

                    responseRepeticao = Cypress.env('responsePrimeiraConsulta')

                    lancamentoPayload.dtoLancamentoParcela.VlrPagamento = (responseRepeticao.body.Parcelas[Cypress.env('parcelaComSaldo')].VlrSaldoAtual) - 100

                    lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

                    lancamentoPayload.dto.NroParcela = Cypress.env('parcelaComSaldo') + 1

                    lancamentoPayload.dtoLancamentoParcela.PermiteDescapitalizacao = Cypress.env('descapitalizacao')

                    lancamentoPayload.dtoLancamentoParcela.DtPagamento = new Date().toISOString().slice(0, 10)

                    AgendaRequests.LancamentoParcela(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

                        Cypress.env('lancamentoResponse', response)

                        cy.log("Response: " + JSON.stringify(response.body))

                    })

               
            }
        }

        Cypress.env('vlrPagamento', lancamentoPayload.dtoLancamentoParcela.VlrPagamento)
    })  

}
)

Then("a api de lançamento retorna sucesso e a agenda e parcelas afetadas são atualizadas corretamente", () => {

    let parcelaComSaldo = Cypress.env('parcelaComSaldo')
    const primeiraConsulta = Cypress.env('responsePrimeiraConsulta')

    RepetirRequisicao(Cypress.env('propostaCodigo'),
    "agenda/AgendaRecebivelConsultarDetalhes",
    "/AgendaController/AgendaRecebivelConsultarDetalhes",
    "INTEGRACAO_AUTOMACAO_AGENDA")
    .then((response) => {

        cy.log('Consulta finalizada com sucesso');

        const segundaConsulta = Cypress.env('responseRepeticao')

        expect(response.status).to.equal(200)
        expect(segundaConsulta.body.VlrTotalPago).to.be.greaterThan(0)
        expect(segundaConsulta.body.Parcelas[parcelaComSaldo].VlrTotalPago).to.be.equal(Cypress.env('vlrPagamento'))
        expect(segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrPagamento).to.be.equal(Cypress.env('vlrPagamento'))
        expect(segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrParcelaAtualizado).to.be.closeTo(
            (segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrParcela - segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrAbatimento), 0.01
        )
        expect(segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrSaldoParcela).to.be.equal(
            segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrParcelaAtualizado - segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrPagamento - segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrDesconto
        )
        
        if (Cypress.env('liquidacao') === true) {
            expect(segundaConsulta.body.Parcelas[parcelaComSaldo].VlrSaldoAtual).to.equal(0)
            expect(segundaConsulta.body.Parcelas[parcelaComSaldo].Situacao).to.equal(1)

        }else {
            expect(segundaConsulta.body.Parcelas[parcelaComSaldo].VlrSaldoAtual).to.not.equal(0)
            expect(segundaConsulta.body.Parcelas[parcelaComSaldo].Situacao).to.equal(0)

        }

    })
    
    //SalvarJsonUnico(`Resultado da agenda com os parametros Descapitalizacao - ${Cypress.env('descapitalizacao')}, Desconto - ${Cypress.env('desconto')} e Modalidade - ${Cypress.env('modalidade')}`,response.body)

    // SalvarJsonUnicoComParametros(parametrosImpressao, response.body)

    // parametrosImpressao = {};

})

When("eu realizo o lancamento nas parcelas com Desconto: {string} para {string}", (Desconto, Modalidade) =>{
   
    VerificarParcelasConsultarDetalhes()

    let parcelaComSaldo = Cypress.env('parcelaComSaldo')
    
    cy.fixture('agenda/AgendaRecebivelLancamentoMultiplasParcelas.json').then((lancamentoPayload) => {

        if (Desconto === 'true') {
            if (Modalidade === 'Liquidacao') {
                Cypress.env('liquidacao', true)

                responseRepeticao = Cypress.env('responsePrimeiraConsulta')

                lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

                lancamentoPayload.dto.MotivoBaixa = null

                lancamentoPayload.dtoLancamentoParcelas[0].NroParcela = parcelaComSaldo + 1

                lancamentoPayload.dtoLancamentoParcelas[0].VlrPagamento = (responseRepeticao.body.Parcelas[parcelaComSaldo].VlrSaldoAtual) - 100

                lancamentoPayload.dtoLancamentoParcelas[0].VlrDesconto = 100

                lancamentoPayload.dtoLancamentoParcelas[0].DtPagamento = new Date().toISOString().slice(0, 10)

                lancamentoPayload.dtoLancamentoParcelas[0].PermiteDescapitalizacao = Cypress.env('descapitalizacao')
            
                AgendaRequests.LancamentoMultiplasParcelas(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

                    Cypress.env('lancamentoResponse', response)

                    cy.log("Response: " + JSON.stringify(response.body))

                })


            } else { 
                Cypress.env('liquidacao', false)

                responseRepeticao = Cypress.env('responsePrimeiraConsulta')

                lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

                lancamentoPayload.dto.MotivoBaixa = null

                lancamentoPayload.dtoLancamentoParcelas[0].NroParcela = parcelaComSaldo + 1

                lancamentoPayload.dtoLancamentoParcelas[0].VlrPagamento = (responseRepeticao.body.Parcelas[parcelaComSaldo].VlrSaldoAtual) - 200

                lancamentoPayload.dtoLancamentoParcelas[0].VlrDesconto = 100

                lancamentoPayload.dtoLancamentoParcelas[0].DtPagamento = new Date().toISOString().slice(0, 10)

                lancamentoPayload.dtoLancamentoParcelas[0].PermiteDescapitalizacao = Cypress.env('descapitalizacao')

                AgendaRequests.LancamentoMultiplasParcelas(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

                    Cypress.env('lancamentoResponse', response)

                    cy.log("Response: " + JSON.stringify(response.body))

                })

            }


        } else { //Desconto = false
            if (Modalidade === 'Liquidacao') {
                Cypress.env('liquidacao', true)

                responseRepeticao = Cypress.env('responsePrimeiraConsulta')

                lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

                lancamentoPayload.dto.MotivoBaixa = null

                lancamentoPayload.dtoLancamentoParcelas[0].NroParcela = parcelaComSaldo + 1

                lancamentoPayload.dtoLancamentoParcelas[0].VlrPagamento = (responseRepeticao.body.Parcelas[parcelaComSaldo].VlrSaldoAtual) 

                lancamentoPayload.dtoLancamentoParcelas[0].VlrDesconto = 0

                lancamentoPayload.dtoLancamentoParcelas[0].DtPagamento = new Date().toISOString().slice(0, 10)

                lancamentoPayload.dtoLancamentoParcelas[0].PermiteDescapitalizacao = Cypress.env('descapitalizacao')


                AgendaRequests.LancamentoMultiplasParcelas(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

                    Cypress.env('lancamentoResponse', response)

                    cy.log("Response: " + JSON.stringify(response.body))

                })

            } else {
                Cypress.env('liquidacao', false)

                
                Cypress.env('liquidacao', false)

                responseRepeticao = Cypress.env('responsePrimeiraConsulta')

                lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

                lancamentoPayload.dto.MotivoBaixa = null

                lancamentoPayload.dtoLancamentoParcelas[0].NroParcela = parcelaComSaldo + 1

                lancamentoPayload.dtoLancamentoParcelas[0].VlrPagamento = (responseRepeticao.body.Parcelas[parcelaComSaldo].VlrSaldoAtual) - 100

                lancamentoPayload.dtoLancamentoParcelas[0].VlrDesconto = 0

                lancamentoPayload.dtoLancamentoParcelas[0].DtPagamento = new Date().toISOString().slice(0, 10)

                lancamentoPayload.dtoLancamentoParcelas[0].PermiteDescapitalizacao = Cypress.env('descapitalizacao')

                AgendaRequests.LancamentoMultiplasParcelas(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

                    Cypress.env('lancamentoResponse', response)

                    cy.log("Response: " + JSON.stringify(response.body))

                })

            }
        }

        Cypress.env('vlrPagamento', lancamentoPayload.dtoLancamentoParcelas[0].VlrPagamento)

    })

})

When("eu realizo o lancamento nas parcelas com o motivo baixa {string}", (MotivoBaixa) =>{
   
      cy.fixture('agenda/AgendaRecebivelLancamentoMultiplasParcelas').then((lancamentoPayload) => {

        lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')
        lancamentoPayload.dto.MotivoBaixa = null

        switch (MotivoBaixa) {
            case "Cancelamento":
                lancamentoPayload.dto.MotivoBaixa = 2
                break;  
            case "Fraude":
                lancamentoPayload.dto.MotivoBaixa = 3
                break;
            case "Óbito":
                lancamentoPayload.dto.MotivoBaixa = 4
                break;
            case "Pré-Pagamento":
                lancamentoPayload.dto.MotivoBaixa = 5
                break;
            case "Renegociação":
                lancamentoPayload.dto.MotivoBaixa = 6
                break;
            case "Alienação":
                lancamentoPayload.dto.MotivoBaixa = 7
                break;
            default:
                lancamentoPayload.dto.MotivoBaixa = null
                break;
        }

        for (let i = 0; i < 4; i++) {

            let numeroParcela = i

            lancamentoPayload.dtoLancamentoParcelas[numeroParcela] = {}
            lancamentoPayload.dtoLancamentoParcelas[numeroParcela].NroParcela = i + 1

            lancamentoPayload.dtoLancamentoParcelas[numeroParcela].VlrPagamento = 1000

            lancamentoPayload.dtoLancamentoParcelas[numeroParcela].DtPagamento = new Date().toISOString().slice(0, 10)
            lancamentoPayload.dtoLancamentoParcelas[numeroParcela].PermiteDescapitalizacao = false
        }


        AgendaRequests.LancamentoMultiplasParcelas(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {
            Cypress.env('lancamentoResponse', response)
            cy.log("Response: " + JSON.stringify(response.body))
        })

        
    })
})

Then("a api de lançamentos retorna sucesso e a agenda e parcelas afetadas são atualizadas corretamente", () => {

    let parcelaComSaldo = Cypress.env('parcelaComSaldo')
    const primeiraConsulta = Cypress.env('responsePrimeiraConsulta')

    RepetirRequisicao(Cypress.env('propostaCodigo'),
    "agenda/AgendaRecebivelConsultarDetalhes",
    "/AgendaController/AgendaRecebivelConsultarDetalhes",
    "INTEGRACAO_AUTOMACAO_AGENDA")
    .then((response) => {

        cy.log('Consulta finalizada com sucesso');

        const segundaConsulta = Cypress.env('responseRepeticao')

        expect(response.status).to.equal(200)
        expect(segundaConsulta.body.VlrTotalPago).to.be.greaterThan(0)
        expect(segundaConsulta.body.Parcelas[parcelaComSaldo].VlrTotalPago).to.be.equal(Cypress.env('vlrPagamento'))
        expect(segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrPagamento).to.be.equal(Cypress.env('vlrPagamento'))
        expect(segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrParcelaAtualizado).to.be.closeTo(
            segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrParcela - segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrAbatimento,
            0.01
        )
        expect(segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrSaldoParcela).to.be.equal(
            segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrParcelaAtualizado - segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrPagamento - segundaConsulta.body.Parcelas[parcelaComSaldo].Lancamentos[0].VlrDesconto
        )
        
        if (Cypress.env('liquidacao') === true) {
            expect(segundaConsulta.body.Parcelas[parcelaComSaldo].VlrSaldoAtual).to.equal(0)
            expect(segundaConsulta.body.Parcelas[parcelaComSaldo].Situacao).to.equal(1)

        }else {
            expect(segundaConsulta.body.Parcelas[parcelaComSaldo].VlrSaldoAtual).to.not.equal(0)
            expect(segundaConsulta.body.Parcelas[parcelaComSaldo].Situacao).to.equal(0)

        }
    })
})

When("eu envio uma requisição POST para o lançamento em uma parcela", () => {


    AgendaRequests.LancamentoParcela(agendaPayload.dto, "INTEGRACAO_AUTOMACAO_AGENDA").then((DetalhesResponse) => {

        cy.log(`Reposta da consulta: ${DetalhesResponse}`)

        const responseStatus = DetalhesResponse

        cy.wrap(responseStatus).as('responseStatus')

    })


})

Given("que eu preencha todos os campos para lançamento em uma parcela", () => {


    cy.fixture('agenda/AgendaRecebivelLancamentoParcela').then((agenda) => {

        agendaPayload = { ...agenda };

        propostaCodigo = Cypress.env('propostaCodigo')

        agendaPayload.dto.CodigoProposta = propostaCodigo


    })



})

When("eu realizo o lancamento na parcela sem o campo obrigatório {string}", (CampoObrigatorios) => {
   
    cy.fixture('agenda/AgendaRecebivelLancamentoParcela').then((lancamentoPayload) => {


        lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

        ExcluirCamposPorPalavra(lancamentoPayload, CampoObrigatorios)

        
        
        AgendaRequests.LancamentoParcela(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

            Cypress.env('lancamentoResponse', response)
        })
        
     })
})

Then("a api de lançamento retorna erro informando a mensagem de erro {string}", (MensagemErro) => {
   
    expect(Cypress.env('lancamentoResponse').body.Msg).to.include(MensagemErro)

    Cypress.env('parcelaDisponivel', true)

})

When("eu realizo o lancamento na parcela diferente a descapitalização parametrizada", () => {
   
    cy.fixture('agenda/AgendaRecebivelLancamentoParcela').then((lancamentoPayload) => {


        lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

        lancamentoPayload.dto.Descapitalizacao = !Cypress.env('descapitalizacao')
        
        AgendaRequests.LancamentoParcela(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

            Cypress.env('lancamentoResponse', response)
        })
        
     })
})

When("eu realizo o lancamento na parcela com problema no campo VlrPagamento {string}", (ProblemaVlrPagamento) => {
   
    cy.fixture('agenda/AgendaRecebivelLancamentoParcela').then((lancamentoPayload) => {

        lancamentoPayload.dto.CodigoProposta = Cypress.env('propostaCodigo')

        switch (ProblemaVlrPagamento) {
            case "Valor e desconto maior que saldo":
                lancamentoPayload.dtoLancamentoParcela.VlrPagamento = 200
                lancamentoPayload.dtoLancamentoParcela.VlrDesconto = 20000
                break;  
            case "Valor maior que saldo":
                lancamentoPayload.dtoLancamentoParcela.VlrPagamento = 20000
                break;
            case "Valor string":
                lancamentoPayload.dtoLancamentoParcela.VlrPagamento = "100"
                break;
            case "Valor grande":
                lancamentoPayload.dtoLancamentoParcela.VlrPagamento = 999999999999999
                break;
            case "Valor negativo":
                lancamentoPayload.dtoLancamentoParcela.VlrPagamento = -100
                break;
            default:
                lancamentoPayload.dtoLancamentoParcela.VlrPagamento = null
                break;
        }

        AgendaRequests.LancamentoParcela(lancamentoPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {
            Cypress.env('lancamentoResponse', response)
        })
        
     })


})
     
/* ^ LANCAMENTO PARCELA ^ */

/* v CANCELAMENTO v */

Given("que eu tenha uma agenda previamene criada com cobrança gerada", () =>{


    cy.fixture('agenda/AgendaIncluirPropostaManualSimplificado').then((proposta) => {

        incluirPropostaPayload = { ...proposta };
        const GerarDataMesSeguinteMes = GerarDataMesSeguinte()

        incluirPropostaPayload.dto.CodigoOperacao = faker.string.uuid()
        incluirPropostaPayload.dto.DtPrimeiroVencto = GerarDataMesSeguinteMes


        PropostaRequests.ManualSimplificado(incluirPropostaPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((ManualSimplificadoResponse) => {
            //  cy.log('Payload da proposta: ' + incluirPropostaPayload);
            //  cy.log('Payload da resposta: ' + ManualSimplificadoResponse)

            const responseStatus = ManualSimplificadoResponse
            cy.log('Status: ' + responseStatus.status)

            cy.wrap(responseStatus).as('responseStatusProposta')

            const response = responseStatus.body

            propostaCodigo = responseStatus.body.Codigo

            numeroProposta = responseStatus.body.Numero

            Cypress.env('propostaCodigo', propostaCodigo)

            Cypress.env('numeroProposta', numeroProposta)


            expect(response.Result).to.be.true

        })


    })

    cy.fixture('agenda/AgendaPropostaFinalizar').then((propostaFinalizar) => {

        propostaFinalizarPayload = { ...propostaFinalizar }

        propostaFinalizarPayload.dto.CodigoProposta = propostaCodigo

        PropostaRequests.PropostaFinalizar(propostaFinalizarPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((PropostaFinalizarResponse) => {

            expect(PropostaFinalizarResponse.body.Result).to.be.true

        })

        RepetirRequisicao(propostaCodigo, "agenda/AgendaRecebivelConsultarDetalhes", "/AgendaController/AgendaRecebivelConsultarDetalhes", "INTEGRACAO_AUTOMACAO_AGENDA");
    })

    cy.fixture('agenda/AgendaRecebivelGerarUnicaCobranca').then((cobranca) => {

        cobrancaPayload = { ...cobranca }

        propostaCodigo = Cypress.env('propostaCodigo')

        cobrancaPayload.dto.CodigoProposta = propostaCodigo
        cobrancaPayload.dtoGerarUnicaLiquidacao.VlrLiquidacao = 500
        cobrancaPayload.dtoGerarUnicaLiquidacao.Liquidacao = false

        cobrancaPayload.dtoGerarUnicaLiquidacao.PagamentoViaPix = false
        cobrancaPayload.dtoGerarUnicaLiquidacao.PagamentoViaBoleto = true
        


        AgendaRequests.GerarUnicaCobranca(cobrancaPayload, "INTEGRACAO_AUTOMACAO_AGENDA").then((DetalhesResponse) => {

            cy.log(`Reposta da consulta: ${DetalhesResponse}`)

            const responseStatus = DetalhesResponse

            cy.log(responseStatus)
            Cypress.env('codigoCobranca', DetalhesResponse.body.Cobrancas[0].CodigoLiquidacao )
            cy.wrap(DetalhesResponse.body.Cobrancas[0].CodigoLiquidacao).as('codigoCobranca')
            cy.wrap(responseStatus).as('responseStatus')

        })

    })

})

When("eu informo o codigo da cobrança na api de cancelamento e envio a requisição", () =>{

    cy.fixture('agenda/AgendaRecebivelCancelarCobrancas').then((payloadCancelar) => {


        propostaCodigo = Cypress.env('propostaCodigo')

        payloadCancelar.dto.CodigoProposta = propostaCodigo
        payloadCancelar.dtoCancelarCobrancas.CodigosLiquidacoes[0] = Cypress.env('codigoCobranca')

		AgendaRequests.CancelarCobrancas(payloadCancelar, "INTEGRACAO_AUTOMACAO_AGENDA").then((responseCancelamento)=>{
			Cypress.env('responseCancelamento', responseCancelamento)
		})

    })
   
})

Then("a api de lançamento retorna sucesso e a cobrança não se encontra mais ativa e vinculada a agenda", () => {

        const primeiraConsulta = Cypress.env('responsePrimeiraConsulta')

        RepetirRequisicao(Cypress.env('propostaCodigo'),
        "agenda/AgendaRecebivelConsultarDetalhes",
        "/AgendaController/AgendaRecebivelConsultarDetalhes",
        "INTEGRACAO_AUTOMACAO_AGENDA")
        .then((response) => {

            const segundaConsulta = Cypress.env('responseRepeticao')

            expect(response.status).to.equal(200)

            expect(segundaConsulta.body.Parcelas[0].Boletos).to.be.an('array').that.is.empty;
            
            //SalvarJsonUnico(`Resultado da agenda com os parametros Descapitalizacao - ${Cypress.env('descapitalizacao')}, Desconto - ${Cypress.env('desconto')} e Modalidade - ${Cypress.env('modalidade')}`,response.body)

            //SalvarJsonUnicoComParametros(parametrosImpressao, response.body)

            //parametrosImpressao = {};

            })

})
/* ^ CANCELAMENTO ^ */

/* v REFATORACAO DOS LANCAMENTOS v 

When("eu realizo o lancamento na parcela via: {string} com o parâmetro desconto: {string}", (Modalidade, Desconto) => {

    parametrosImpressao['Modalidade'] = Modalidade;

    parametrosImpressao['Desconto'] = Desconto;
    cy.fixture('agenda/AgendaPropostaPagar').then((payload) => {

        payload.dto.CodigoProposta = Cypress.env('propostaCodigo')

        cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/BMPDigital/PropostaPagar",
            body: payload,
            failOnStatusCode: false
        })

    })


    ExecutarCaso(Desconto, Modalidade);

    Cypress.env('desconto', Desconto)
    Cypress.env('modalidade', Modalidade)

})

And("o parâmetro de descapitalização da agenda está com o valor: {string}", (Descapitalizacao) => {

    parametrosImpressao['Descapitalizacao'] = Descapitalizacao;
    Cypress.env('descapitalizacao', Descapitalizacao)

    if (Descapitalizacao == "true") {



        cy.visit("https://bmpteste.moneyp.com.br/#/loginempresa")

        cy.get('[name="email"]').type('jose.crema@fulltechpro.com.br')
        cy.get('[name="password"]').type('Jc.040923!')
        cy.get('#wEPCodigo').select('JOINVILLE')
        cy.get('.btn').click()
        cy.get('.breadcrumb > :nth-child(1)').should('be.visible')

        cy.get('[href="#"][title="Agenda de Recebíveis"] > .menu-item-parent').click()
        cy.get('[style="display: block;"] > :nth-child(1) > a').click()

        cy.get('[name="nroProposta"]').should('be.visible').type(numeroProposta)

        cy.intercept('POST', 'https://bmpteste.moneyp.com.br/api/AgendaRecebivel/ListaAgendasMP?v=*')
            .as('AgendaLista')

        cy.get('.col-2 > .btn').click()

        cy.wait('@AgendaLista')
        cy.wait(1000)

        cy.get('button[title="Parâmetros"]').click()
        cy.wait(4000)
        cy.get(':nth-child(3) > .col-3 > .checkbox > i').should('be.visible').click()
        cy.get('.btn-primary').click()
        cy.get('#delete-form > footer > .btn-primary').click()

        cy.get('.confirm').click()

        cy.log("*Descapitalização ativada*")

        RepetirRequisicao(propostaCodigo, "agenda/AgendaRecebivelConsultarDetalhes", "/AgendaController/AgendaRecebivelConsultarDetalhes", "INTEGRACAO_AUTOMACAO_AGENDA");

    } else {



        cy.log("*Descapitalização desativada*")

    }

})

Then("o saldo atual da parcela é atualizado conforme lancamento realizado", () => {

    cy.get(`@responseRepeticao`).then((response) => {

        const primeiraConsulta = response

        RepetirRequisicao(propostaCodigo, "agenda/AgendaRecebivelConsultarDetalhes", "/AgendaController/AgendaRecebivelConsultarDetalhes", "INTEGRACAO_AUTOMACAO_AGENDA");

        cy.get(`@responseRepeticao`).then((response) => {

            const segundaConsulta = response

            expect(response.status).to.equal(200)
            expect(segundaConsulta.body.Parcelas[0].VlrSaldoAtual).to.not.equal(primeiraConsulta.body.Parcelas[0].VlrSaldoAtual)

            //SalvarJsonUnico(`Resultado da agenda com os parametros Descapitalizacao - ${Cypress.env('descapitalizacao')}, Desconto - ${Cypress.env('desconto')} e Modalidade - ${Cypress.env('modalidade')}`,response.body)

            SalvarJsonUnicoComParametros(parametrosImpressao, response.body)

            parametrosImpressao = {};
        })
    })




})

When("eu realizo o lancamento na parcela com o motivo de liquidacao {string}", (Motivo) => {
    parametrosImpressao['Motivo'] = Motivo;
    cy.fixture('agenda/AgendaRecebivelLancamentoMultiplasParcelas.json').then((payload) => {

        cy.fixture('agenda/AgendaPropostaPagar').then((payload) => {

            payload.dto.CodigoProposta = Cypress.env('propostaCodigo')

            cy.request({
                method: "POST",
                url: Cypress.env("baseUrl") + "/BMPDigital/PropostaPagar",
                body: payload,
                failOnStatusCode: false
            })

        })

        payload.dto.MotivoBaixa = Motivo
        payload.dto.CodigoProposta = Cypress.env('propostaCodigo')

        SobrescreverCamposJson(payload, "VlrPagamento", 1000)
        SobrescreverCamposJson(payload, "PermiteDescapitalizacao", false)
        SobrescreverCamposJson(payload, "vlrDesconto", 0)

        AgendaRequests.LancamentoMultiplasParcelas(payload, "INTEGRACAO_AUTOMACAO_AGENDA").then((response) => {

            Cypress.env('lancamentoResponse', response)

        })


    })

})

When("eu importo a planilha na Baixa de Titulo Automatica, com o motivo {string}", (Motivo) => {

    parametrosImpressao['Motivo'] = Motivo;


    const currentDate = new Date();

    let dataAtual = currentDate.toISOString().slice(0, 10);


    const csvCaminho = 'cypress/fixtures/agenda/ModeloBaixaDeTitulosAutomatica.csv';
    const novasLinhas = [
        [Cypress.env('numeroProposta'), '1', '1000', dataAtual, new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10), 'S', Motivo],
        [Cypress.env('numeroProposta'), '2', '1000', dataAtual, new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().slice(0, 10), 'S', Motivo],
        [Cypress.env('numeroProposta'), '3', '1000', dataAtual, new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10), 'S', Motivo],
        [Cypress.env('numeroProposta'), '4', '1000', dataAtual, new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().slice(0, 10), 'S', Motivo],
    ];

    cy.fixture('agenda/AgendaPropostaPagar').then((payload) => {

        payload.dto.CodigoProposta = Cypress.env('propostaCodigo')

        cy.request({
            method: "POST",
            url: Cypress.env("baseUrl") + "/BMPDigital/PropostaPagar",
            body: payload,
            failOnStatusCode: false
        })
    })

    cy.task('addRowsToCsv', { filePath: csvCaminho, newRows: novasLinhas })
        .then(({ newFilePath: novoArquivo, nomeArquivo: nomeArquivo }) => {



            cy.visit("https://bmpteste.moneyp.com.br/#/loginempresa")

            cy.get('[name="email"]').type('jose.crema@fulltechpro.com.br')
            cy.get('[name="password"]').type('Jc.040923!')
            cy.get('#wEPCodigo').select('JOINVILLE')
            cy.get('.btn').click()
            cy.get('.breadcrumb > :nth-child(1)').should('be.visible')

            cy.visit('https://bmpteste.moneyp.com.br/#/processos/baixaautomatica')
            cy.wait(2000)

            cy.get('.btn-primary').click()
            cy.get('input[id="Documento"]').selectFile(novoArquivo);

            cy.get('footer > .btn-primary').click()

            cy.wait(1000)

            cy.get('.confirm').click()

            cy.get('.input-group > .form-control').type(nomeArquivo)

            cy.contains('td', nomeArquivo, { matchCase: false })
                .parent('tr')
                .find('button[title="Validar Arquivo"]')
                .click();

            cy.get('.btn-success').click()
            cy.get('footer > .btn-primary').click()

            cy.wait(60000)

        });

})

When("eu realizo o lancamento na parcela com o tipo de lançamento: {string}", (Tipo) => {

    parametrosImpressao['Tipo'] = Tipo;

    cy.visit("https://bmpteste.moneyp.com.br/#/loginempresa")

    cy.get('[name="email"]').type('jose.crema@fulltechpro.com.br')
    cy.get('[name="password"]').type('Jc.040923!')
    cy.get('#wEPCodigo').select('JOINVILLE')
    cy.get('.btn').click()
    cy.get('.breadcrumb > :nth-child(1)').should('be.visible')
    cy.visit('https://bmpteste.moneyp.com.br/#/processos/agendarecebivel')

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
    cy.get('a[title="Realizar Acréscimo ou Abatimento da Parcela"]').first().click()
    cy.get('#VlrLancamento').type('100,00');
    cy.get('#TipoLancamento').select(Tipo)
    cy.get('#DesLancamento').type('Teste')
    cy.get('button[class="btn btn-primary"]').first().click()
    cy.get('button[class="btn btn-primary ng-binding"]').first().click()
    cy.wait(1000)


})

 ^ REFATORACAO DOS LANCAMENTOS ^ */