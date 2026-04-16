import BuilderIncluirProposta, {
    parseParametersTable,
    submitProposta,
    mergeDataTableIntoPayload,
    preparePayloadForSubmit
} from "../../../support/Builders/proposta/Builder-IncluirProposta";
import BuilderUtils, {
    assertResponseStatus,
    applyPaymentNormalization,
    removeDtoFieldFromPayload
} from "../../../support/Builders/proposta/Builder-PropostaUtils";

let PropostaPayload = {}

Given("que eu preencha o payload dto da Proposta:", () => {
    PropostaPayload = {}
    PropostaPayload.parametros = {}
    cy.wrap({}).as('requestBody')
    cy.fixture('proposta/IncluirProposta.json').then((dados) => {
        PropostaPayload = { ...dados }
        cy.log('[IncluirProposta] payload.dto:', PropostaPayload.dto)
        cy.wrap(PropostaPayload).as('requestBody')
    })
})

And("defina parametros Proposta:", (dataTable) => {
    const parametros = parseParametersTable(dataTable)
    PropostaPayload = PropostaPayload || {}
    PropostaPayload.parametros = parametros
    cy.log('[IncluirProposta] parametros:', parametros)
    cy.wrap(PropostaPayload).as('requestBody')
})

And("remova os campos obrigatórios do DTO Proposta {string}", (campoAusente) => {
    return cy.get('@requestBody').then((rb) => {
        const propostaModificada = removeDtoFieldFromPayload(rb, campoAusente)
        PropostaPayload = { ...propostaModificada }
        cy.wrap(PropostaPayload).as('requestBody')
        const target = PropostaPayload.dto && typeof PropostaPayload.dto === 'object' ? PropostaPayload.dto : PropostaPayload
        const campoPresente = Object.keys(target || {}).some(k => k.toLowerCase() === String(campoAusente).toLowerCase())
        expect(campoPresente, `Campo ${campoAusente} não deve estar presente no dto após remoção`).to.equal(false)
    })
})

And("que eu valide o metodo de pagamento Proposta:", (dataTable) => {
    return cy.get('@requestBody').then((rb) => {
        PropostaPayload = PropostaPayload || {}
        PropostaPayload = mergeDataTableIntoPayload(PropostaPayload, dataTable)
        PropostaPayload = applyPaymentNormalization(PropostaPayload, dataTable)
        cy.wrap(JSON.parse(JSON.stringify(PropostaPayload || {}))).as('requestBody')
        cy.get('@requestBody').then(rb => cy.log('[ALIAS AFTER GIVEN] requestBody dto keys:', Object.keys(rb.dto || {})))
    })
})

When("eu envio uma requisição POST para Proposta", (dataTable) => {
    return cy.get('@requestBody').then((rb) => {
        const base = rb && rb.dto ? rb : { dto: rb || {} }
        const payload = preparePayloadForSubmit(base, dataTable)
        PropostaPayload = payload
        cy.wrap(JSON.parse(JSON.stringify(PropostaPayload))).as('requestBody')
        return submitProposta(payload)
    })
})

Then("recebo status Proposta {int}", (expectedStatus, dataTable) => {
    const erroEsperado = Boolean(dataTable)
    cy.get('@responseStatus').then((response) => {
        assertResponseStatus(response, { expectedStatus, erroEsperado })
    })
})