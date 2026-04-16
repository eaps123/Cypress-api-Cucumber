import { UrlBaseRequests } from "../../../../../secrets";
import gerarAuth from "../../../../../secrets";

export function PostRequest(url, PropostaPayload) {

    const urlendpoint = UrlBaseRequests() + url

    cy.log('URL base para requisições:', urlendpoint)

    const authpost = gerarAuth().QA_INTEGRATION_EVERTON

    const body = {
        auth: authpost,
        ...PropostaPayload
    }

    cy.log('Body final enviado:', body)

    return cy.request({
        method: "POST",
        url: urlendpoint,
        body: body,
        failOnStatusCode: false
    })
}