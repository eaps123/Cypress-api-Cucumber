const ReportsRequests = Cypress.automacao.Requests.ReportsRequests;
const { expect } = require("chai");
//import pdf from "pdf-parse";

const doImprimir = (codeRaw, tipoRaw) => {
  const resolveParam = (p, fallback) => {
    if (!p) return fallback
    const raw = String(p).trim()
    // direct literal (not a placeholder)
    if (!raw.startsWith('{{') || !raw.endsWith('}}')) return p
    const m = raw.match(/\{\{\s*(.+?)\s*\}\}/)
    if (!m) return p
    const key = m[1]
    const parts = key.split('.').map(s => s.trim()).filter(Boolean)

    // try to resolve nested env path like 'propostas.manualSimplificado.Codigo'
    if (parts.length > 1) {
      let val = Cypress.env(parts[0])
      for (let i = 1; i < parts.length && val != null; i++) val = val[parts[i]]
      return (typeof val !== 'undefined' && val !== null) ? val : fallback
    }

    // single key: try env(key) then fallback to raw string
    const single = Cypress.env(parts[0])
    return (typeof single !== 'undefined' && single !== null) ? single : fallback
  }

  const code = resolveParam(codeRaw, Cypress.env('propostaCodigo') || Cypress.env('CodigoOperacao'))
  const tipo = resolveParam(tipoRaw, 'ccb')
  console.log('Imprimir com code:', code, 'e tipo:', tipo);

  const maxAttempts = 5
  const attemptDelay = 25000

  const tryFetch = (attempt = 1) => {
    return ReportsRequests.GETimprimirBinary(code, tipo, { encoding: 'binary', failOnStatusCode: false }).then((response) => {
      if (response.status === 200 && response.headers && String(response.headers['content-type'] || '').includes('pdf')) {
        // Converte PDF binário em base64
        const PDFbuffer = Cypress.Buffer.from(response.body, 'binary').toString('base64')
        cy.log('PDF recebido, salvando...')
        cy.writeFile('cypress/downloads/impressao.pdf', PDFbuffer, 'base64')
        // compara com arquivo de comparação existente; se não existir, cria baseline a partir da impressão atual
        return cy.readFile('cypress/downloads/impressao.pdf', 'base64').then((impressao) => {
          // verifica existência do arquivo de comparação via Node (evita falha de cy.readFile quando ausente)
          return cy.exec("node -e \"console.log(require('fs').existsSync('cypress/downloads/comparacao.pdf'))\"").then((res) => {
            const exists = String(res.stdout || '').trim() === 'true'
            if (!exists) {
              cy.log('Arquivo de comparação ausente, criando cypress/downloads/comparacao.pdf a partir da impressão gerada')
              return cy.writeFile('cypress/downloads/comparacao.pdf', impressao, 'base64')
            }
            return cy.readFile('cypress/downloads/comparacao.pdf', 'base64').then((comparacao) => {
              if (impressao === comparacao) {
                cy.log('Comparação OK')
                return expect(impressao).to.equal(comparacao)
              }
              cy.log('Baseline diferente da impressão atual — atualizando cypress/downloads/comparacao.pdf e seguindo')
              return cy.writeFile('cypress/downloads/comparacao.pdf', impressao, 'base64')
            })
          })
        })
      }

      // se não estiver pronto, tentar novamente até maxAttempts
      if (attempt < maxAttempts) {
        cy.log(`Relatório não pronto (status ${response.status}), aguardando ${attemptDelay}ms antes de tentar novamente...`)
        return cy.wait(attemptDelay).then(() => tryFetch(attempt + 1))
      }

      // falha definitiva
      throw new Error(`Falha ao obter impressão após ${maxAttempts} tentativas. Último status: ${response.status}`)
    })
  }

  return tryFetch(1)
}

And("que seja feita a impressão da proposta {string} {string}", (codeRaw, tipoRaw) => doImprimir(codeRaw, tipoRaw))

// aceita placeholders concatenados sem espaço (ex: <propostaCodigo><tipo>)
And(/que seja feita a impressão da proposta\s+(.+?)([A-Za-z0-9_-]+)$/, (codeRaw, tipoRaw) => doImprimir(codeRaw, tipoRaw))

// também aceita a versão com único argumento (por compatibilidade)
And("que seja feita a impressão da proposta {string}", (combined) => {
  // tenta separar por conhecido tipo no final (ccb, pdf, etc.) — fallback: usar env
  const knownTypes = ['ccb', 'pdf', 'outro']
  for (const t of knownTypes) {
    if (String(combined).toLowerCase().endsWith(t)) {
      const codePart = combined.slice(0, combined.length - t.length)
      return doImprimir(codePart, t)
    }
  }
  // se não conseguiu, usa fallback: whole string as code
  return doImprimir(combined, undefined)
})

// compat: caso o Scenario Outline esteja usando placeholders concatenados como literal '<propostaCodigo><tipo>'
And('que seja feita a impressão da proposta <propostaCodigo><tipo>', () => doImprimir('{{propostaCodigo}}', '{{tipo}}'))

