/**
 * Escreva os arquivos JSON de request/response na pasta de resultados.
 * @param {string} safeName
 * @param {object} payload
 * @param {object} resp
 * @returns {Chainable}
 */
export const Timestamp = (date = new Date()) => {
  return date.toISOString().replace(/[:.]/g, '-')
}

export const saveRequestAndResponseFiles = (safeName, payload, resp) => {
  const ts = Timestamp()
    const reqFile = `cypress/results/workbooks/Jsons/Request-${safeName}-${ts}.json`
    const resFile = `cypress/results/workbooks/Jsons/Response-${safeName}-${ts}.json`
    const bodyToWrite = resp && resp.body ? resp.body : resp
    return cy.writeFile(reqFile, payload, { flag: 'w' })
        .then(() => cy.writeFile(resFile, bodyToWrite, { flag: 'w' }))
}

export default {
    saveRequestAndResponseFiles,
    Timestamp
}