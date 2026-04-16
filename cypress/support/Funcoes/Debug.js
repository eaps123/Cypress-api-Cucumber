const { isoForFileName } = require('./Timestamp')

/**
 * Salva request/response em arquivos de debug (assíncrono com Cypress).
 * Usa cy.writeFile para garantir encadeamento.
 */
function saveDebug(requestObj, responseObj, prefix = 'Debug') {
  const ts = isoForFileName()
  const basePath = 'cypress/results/workbooks'
  cy.writeFile(`${basePath}/${prefix}-Request-${ts}.json`, requestObj || {})
  cy.writeFile(`${basePath}/${prefix}-Response-${ts}.json`, responseObj || {})
}

module.exports = { saveDebug }