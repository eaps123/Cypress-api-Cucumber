const ImprimirRequests =
{
    GETimprimir(code, tipo) {
        const url = `${Cypress.env("baseURLreports")}/Imprimir?Impressao=s&Code=${encodeURIComponent(code)}&Tipo=${encodeURIComponent(tipo)}`;
        return cy.request({
            method: "GET",
            url,
            headers: {
                "Content-Type": "application/json"
            }
        })
    },

    // nova função que permite receber opções (ex: encoding binary, failOnStatusCode)
    GETimprimirBinary(code, tipo, opts = {}) {
        const url = `${Cypress.env("baseURLreports")}/Imprimir?Impressao=s&Code=${encodeURIComponent(code)}&Tipo=${encodeURIComponent(tipo)}`;
        return cy.request({
            method: "GET",
            url,
            encoding: opts.encoding || 'binary',
            failOnStatusCode: typeof opts.failOnStatusCode === 'boolean' ? opts.failOnStatusCode : false,
            headers: Object.assign({ "Content-Type": "application/json" }, opts.headers || {})
        })
    }
}
export default ImprimirRequests;