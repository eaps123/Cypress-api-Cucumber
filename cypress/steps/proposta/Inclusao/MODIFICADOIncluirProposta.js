import BuilderIncluirProposta, {
    parseParametersTable,
    submitProposta,
    mergeDataTableIntoPayload,
    preparePayloadForSubmit
} from "../../../support/Builders/proposta/Builder-IncluirProposta";


import { faker } from '@faker-js/faker'
import { PostRequest } from "../../../support/Requests/Proposta/Inclusao/PostRequestProposta";
import { buildPayload } from '../../../support/Payload/MontaPayload'

let PropostaPayload = {}

Given("que eu preencha o payload dto da Proposta MODIFICADO2:", (dataTable) => {
    cy.fixture('proposta/MODIFICADOIncluirProposta.json').then((PropostaPayload) => {
        const dtoData = dataTable.rowsHash()
        PropostaPayload.dto = { ...PropostaPayload.dto, ...dtoData }
        PropostaPayload.dto.CodigoOperacao = faker.string.uuid()

        cy.log('[IncluirProposta] payload.dto:', PropostaPayload.dto)
        cy.wrap(PropostaPayload).as('requestBody')

    })
})

Given("que eu preencha o payload dto da Proposta simplificada:", (dataTable) => {
    cy.fixture('proposta/IncluirPropostaManualSimplificado.json').then((PropostaPayload) => {
        const dtoData = dataTable.rowsHash()
        PropostaPayload.dto = { ...PropostaPayload.dto, ...dtoData }
        PropostaPayload.dto.CodigoOperacao = faker.string.uuid()


        cy.log('[IncluirProposta] payload.dto:', PropostaPayload.dto)
        cy.wrap(PropostaPayload).as('requestBody')

    })
})

And("defina parametros Proposta MODIFICADO:", (dataTable) => {
    const dados = dataTable.hashes()[0]
    cy.get('@requestBody').then((requestBody) => {
        requestBody.parametros = {
            Nome: dados.Nome,
            Valor: dados.Valor
        }
        cy.wrap(requestBody).as('requestBody')
    })
})

And("que eu valide o metodo de pagamento pix com a chave: {string}", (ChavePIX) => {
    cy.get('@requestBody').then((requestBody) => {
        requestBody.dto.PropostaPIXPagamentoDTO = {
            ChavePIX: ChavePIX,
        }
        cy.wrap(requestBody).as('requestBody')
    })
})

And("que eu valide o metodo de pagamento como conta", (dataTable) => {

    const dados = dataTable.rowsHash()

    cy.get('@requestBody').then((requestBody) => {

        if (requestBody.dto.PropostaPIXPagamentoDTO) {
            delete requestBody.dto.PropostaPIXPagamentoDTO
        }

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

When("eu envio uma requisição POST para Proposta MODIFICADO", () => {
    return cy.get('@requestBody').then((payload) => {
        PropostaPayload = payload
        cy.log('Payload final a ser enviado:', PropostaPayload)
        return submitProposta(payload)
    })
})

When("eu envio uma requisição POST para criação de proposta3", (dataTable) => {
    const dados = dataTable.rowsHash()
    cy.log('tipoPayload', tipoPayload)
    const endpoints = [
        { nome: 'Proposta', url: '/BMPDigital/IncluirProposta' },
        { nome: 'Proposta Manual', url: '/BMPDigital/IncluirPropostaManual' },
        { nome: 'Proposta Manual SAC', url: '/BMPDigital/IncluirPropostaManualSAC' },
        { nome: 'Proposta Manual Simplificado', url: '/BMPDigital/IncluirPropostaManualSimplificado' },
        { nome: 'Proposta Manual Simplificado SAC', url: '/BMPDigital/IncluirPropostaManualSimplificadoSAC' },
        { nome: 'Proposta Manual Simplificado Price', url: '/BMPDigital/IncluirPropostaManualSimplificadoPrice' },
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



And("remova os campos obrigatórios do DTO Proposta {string}", (campoAusente) => {
    cy.get('@requestBody').then((payload) => {
        PropostaPayload = { ...payload }
        delete PropostaPayload.dto[campoAusente]
        cy.wrap(PropostaPayload).as('requestBody')
        expect(campoPresente, `Campo ${campoAusente} não deve estar presente no dto após remoção`).to.equal(false)
    })
})

Given('que eu preencha o payload2 {string}:', (tipoPayload, dataTable) => {
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
        case 'price':
            payload = buildPayload(tipoProposta, data)
            break

        default:
            throw new Error(`Tipo de payload não suportado: ${tipoPayload}`)
    }

    cy.log('Payload construído:', payload)


    payload.dto.CodigoOperacao = faker.string.uuid()

    cy.wrap(payload).as('requestBody')
})

Given('que eu preencha o payload {string}:', (dataTable) => {
    const data = dataTable.rowsHash()
    cy.log('Dados do cenário:', data)

    const tipoProposta = data.tipoProposta
    delete data.tipoProposta

    cy.log('Tipo de proposta extraído dos dados:', tipoProposta)

    const payload = buildPayload(tipoProposta, data)

    cy.log('Payload construído:', payload)

    payload.dto.CodigoOperacao = faker.string.uuid()

    cy.wrap(payload).as('requestBody')
})