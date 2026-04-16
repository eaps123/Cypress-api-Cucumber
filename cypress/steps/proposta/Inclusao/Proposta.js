import BuilderUtils, {
    assertResponseStatus,
    applyPaymentNormalization,
    removeDtoFieldFromPayload
} from "../../../support/Builders/proposta/Builder-PropostaUtils";
import { faker } from '@faker-js/faker'
import { PostRequest } from "../../../support/Requests/Proposta/Inclusao/PostRequestProposta";
import { buildPayload } from '../../../support/Payload/MontaPayload'
//Fazer @ arroba para o import
let PropostaPayload = {}

Given('1que eu preencha o payload {string}:', (tipoPayload, dataTable) => {
    const data = dataTable.rowsHash()
    cy.log('Dados do cenário:', data)
    const tipoProposta = data.tipoProposta
    delete data.tipoProposta
    cy.log('Tipo de proposta extraído dos dados:', tipoProposta)
    let payload
    switch (tipoPayload) {
        case 'proposta':
            payload = buildPayload(tipoProposta, data)
            break
        case 'manual':
            payload = buildPayload(tipoProposta, data)
            break
        case 'manualSAC':
            payload = buildPayload(tipoProposta, data)
            break
        case 'simplificado':
            payload = buildPayload(tipoProposta, data)
            break
        case 'simplificadoSAC':
            payload = buildPayload(tipoProposta, data)
            break
        case 'simplificadoPrice':
            payload = buildPayload(tipoProposta, data)
            break
        case 'limiteEspecial':
            payload = buildPayload(tipoProposta, data)
            break
        default:
            throw new Error(`Tipo de payload não suportado: ${tipoPayload}`)
    }
    cy.log('Payload construído:', payload)
    cy.log('Dados do cenário:', data)
    payload.dto.CodigoOperacao = faker.string.uuid()
    cy.wrap(payload).as('requestBody')
})

And("1que eu valide o metodo de pagamento pix DTO com a chave: {string}", (ChavePIX) => {
    cy.get('@requestBody').then((requestBody) => {
        requestBody.dto.PropostaPIXPagamentoDTO = {
            ChavePIX: ChavePIX,
        }
        cy.wrap(requestBody).as('requestBody')
    })
})

And("1que eu valide o metodo de pagamento pix com a chave: {string}", (ChavePIX) => {
    cy.get('@requestBody').then((requestBody) => {
        requestBody.dto.PropostaPIXPagamento = {
            ChavePIX: ChavePIX,
        }
        cy.wrap(requestBody).as('requestBody')
    })
})

And("1que eu valide o metodo de pagamento como conta DTO:", (dataTable) => {
    const dados = dataTable.rowsHash()
    cy.get('@requestBody').then((requestBody) => {
        requestBody.dto.PropostaContaPagamentoDTO = {
            CodigoBanco: dados.CodigoBanco,
            Conta: dados.Conta,
            TipoConta: dados.TipoConta,
            Agencia: dados.Agencia,
            AgenciaDig: dados.AgenciaDig,
            ContaDig: dados.ContaDig,
            NumeroBanco: dados.NumeroBanco,
            DocumentoFederalPagamento: dados.DocumentoFederalPagamento,
            NomePagamento: dados.NomePagamento
        }
        cy.wrap(requestBody).as('requestBody')
    })
})

And("1que eu valide o metodo de pagamento como conta:", (dataTable) => {
    const dados = dataTable.rowsHash()
    cy.get('@requestBody').then((requestBody) => {      
        requestBody.dto.PropostaContaPagamento = {
            CodigoBanco: dados.CodigoBanco,
            Conta: dados.Conta,
            TipoConta: dados.TipoConta,
            Agencia: dados.Agencia,
            AgenciaDig: dados.AgenciaDig,
            ContaDig: dados.ContaDig,
            NumeroBanco: dados.NumeroBanco,
            DocumentoFederalPagamento: dados.DocumentoFederalPagamento,
            NomePagamento: dados.NomePagamento
        }
        cy.wrap(requestBody).as('requestBody')
    })
})

And("1que eu valide o Calculo da Proposta:", (dataTable) => {
    const dados = dataTable.rowsHash()
    cy.get('@requestBody').then((requestBody) => {
        requestBody.dto.CalculoProposta = {
            PropostaModelo: dados.PropostaModelo,
            DadosCalculo: {
                PmtDesejada: dados.PmtDesejada,
                Prazo: dados.Prazo,
                percJurosNegociado: dados.percJurosNegociado,
                VlrParcela: dados.VlrParcela,
                VlrSolicitado: dados.VlrSolicitado,
                VlrTAC: dados.VlrTAC,
                DtPrimVencimento: dados.DtPrimVencimento,
                TipoPessoa: dados.TipoPessoa,
                DtContratacao: dados.DtContratacao,
            }
        }
        cy.wrap(requestBody).as('requestBody')
    })
})

And("1que eu valide o Lancamento da Proposta:", (dataTable) => {
    const dados = dataTable.rowsHash()
    cy.get('@requestBody').then((requestBody) => {
        requestBody.dto.PropostaLancamentos = {
            CampoID: dados.CampoID,
            VlrTransacao: dados.VlrTransacao,
            CodigoBanco: dados.CodigoBanco,
            NumeroBanco: dados.NumeroBanco,
            TipoConta: dados.TipoConta,
            Agencia: dados.Agencia,
            AgenciaDig: dados.AgenciaDig,
            ContaDig: dados.ContaDig,
            Conta: dados.Conta,
            NumeroBanco: dados.NumeroBanco,
            DocumentoFederal: dados.DocumentoFederal,
            NomePagamento: dados.NomePagamento,
            DtPagamento: dados.DtPagamento,
            LinhaDigitavel: dados.LinhaDigitavel,
            DocumentoFederalCedente: dados.DocumentoFederalCedente,
            NomeCedente: dados.NomeCedente,
            PagamentoViaChavePix: {
                ChavePIX: dados.ChavePIX
            }
        }
        cy.wrap(requestBody).as('requestBody')
    })
})

And("1defina parametros Proposta:", (dataTable) => {
    const dados = dataTable.hashes()[0]
    cy.get('@requestBody').then((requestBody) => {
        requestBody.parametros = {
            Nome: dados.Nome,
            Valor: dados.Valor
        }
        cy.wrap(requestBody).as('requestBody')
    })
})

And("1remova os campos obrigatórios do DTO Proposta: {string}", (campoAusente) => {
    cy.get('@requestBody').then((payload) => {
        PropostaPayload = { ...payload }
        delete PropostaPayload.dto[campoAusente]
        cy.wrap(PropostaPayload).as('requestBody')
    })
})

When("1eu envio uma requisição POST para criação de proposta", (dataTable) => {
    const dados = dataTable.rowsHash()
    const endpoints = [
        { nome: 'Proposta', url: '/BMPDigital/IncluirProposta' },
        { nome: 'Proposta Manual', url: '/BMPDigital/IncluirPropostaManual' },
        { nome: 'Proposta Manual SAC', url: '/BMPDigital/IncluirPropostaManualSAC' },
        { nome: 'Proposta Manual Simplificado', url: '/BMPDigital/IncluirPropostaManualSimplificado' },
        { nome: 'Proposta Manual Simplificado SAC', url: '/BMPDigital/IncluirPropostaManualSimplificadoSAC' },
        { nome: 'Proposta Manual Simplificado Price', url: '/BMPDigital/IncluirPropostaManualSimplificadoPrice' },
        { nome: 'Proposta Limite Especial', url: '/BMPDigital/IncluirPropostaLimiteEspecial' },
    ]
    cy.log('endpoints:', endpoints)
    const url = endpoints.find((e) => e.nome === dados.TipoDeProposta)?.url
    cy.log('URL selecionada para envio da requisição:', url)
    if (!url) {
        throw new Error('TipoDeProposta inválido')
    }
    cy.get('@requestBody').then((PropostaPayload) => {
        cy.log('Payload final a ser enviado:', PropostaPayload)
        PostRequest(url, PropostaPayload).then((responseStatus) => {
            cy.wrap(responseStatus).as('responseStatus')
            cy.log('Response:', responseStatus)
        })
    })
})

Then("1recebo status Proposta {int}", (expectedStatus, dataTable) => {
    const erroEsperado = Boolean(dataTable)
    cy.get('@responseStatus').then((response) => {
        assertResponseStatus(response, { expectedStatus, erroEsperado })
    })
})