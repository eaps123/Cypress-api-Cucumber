Given("que eu preencha o payload dto da proposta limite especial com:", (dataTable) => {

  if (PropostaPayload && PropostaPayload.dto) {
    // quando existe .dto, garantir que não exista cópia top-level (evita payload duplicado)
    delete PropostaPayload.dto
  }
  cy.wrap(JSON.parse(JSON.stringify(PropostaPayload || {}))).as('requestBody')

  const rows = (dataTable.rowsHash && dataTable.rowsHash()) || {}

  const parseVal = (v) => {
    if (v === null || v === undefined || v === "") return undefined
    const s = String(v).trim()
    if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true'
    if (!Number.isNaN(Number(s)) && /^\-?\d+(\.\d+)?$/.test(s)) return Number(s)
    return s.replace(/^"(.*)"$/, '$1')
  }

  // garante estrutura do payload esperada por LimiteEspecialRequests
  PropostaPayload = PropostaPayload || {}
  PropostaPayload.PropostaDTO = PropostaPayload.PropostaDTO || {}
  PropostaPayload.PessoaDTO = PropostaPayload.PessoaDTO || {}
  PropostaPayload.ParceiroDTO = PropostaPayload.ParceiroDTO || {}

  // coletar overrides específicos para PessoaDTO (aceita chaves dot-notated: PessoaDTO.Nome, PessoaDTO.PJ.CPFResponsavelEmpresa, ...)
  const pessoaOverrides = {}
  const propostaRows = {}
  const parceiroRows = {}
  Object.entries(rows).forEach(([k, v]) => {
    const rawVal = v
    let pv = parseVal(v)
    // preservar zeros à esquerda de CNPJ informado em feature/fixtures
    if (/^ParceiroDTO(\.|$)/i.test(k) && /^CNPJ$/i.test(String(k).replace(/^ParceiroDTO\.?/i, ''))) {
      pv = String(rawVal).trim()
    }
    if (/^PessoaDTO(\.|$)/i.test(k)) {
      pessoaOverrides[k.replace(/^PessoaDTO\.?/i, '')] = pv
    } else if (/^PropostaDTO(\.|$)/i.test(k)) {
      propostaRows[k.replace(/^PropostaDTO\.?/i, '')] = pv
    } else if (/^ParceiroDTO(\.|$)/i.test(k)) {
      parceiroRows[k.replace(/^ParceiroDTO\.?/i, '')] = pv
    } else {
      propostaRows[k] = pv
    }
  })

  // garantir estruturas
  PropostaPayload.PropostaDTO = PropostaPayload.PropostaDTO || {}
  PropostaPayload.ParceiroDTO = PropostaPayload.ParceiroDTO || {}

  // montar arrays/objetos a partir das linhas
  FuncoesRequests.AtribuirArraysDTO(propostaRows, PropostaPayload.PropostaDTO, { parseVal })
  FuncoesRequests.AtribuirArraysDTO(parceiroRows, PropostaPayload.ParceiroDTO, { parseVal })

  // NORMALIZA ParceiroDTO.CNPJ -> string com 14 dígitos (preserva zero à esquerda)
  try {
    PropostaPayload.ParceiroDTO = PropostaPayload.ParceiroDTO || {}
    if (PropostaPayload.ParceiroDTO.CNPJ != null) {
      const raw = String(PropostaPayload.ParceiroDTO.CNPJ)
      if (!/^<.*>$/.test(raw)) { // não tocar placeholders
        const digits = raw.replace(/\D/g, '')
        PropostaPayload.ParceiroDTO.CNPJ = digits.padStart(14, '0')
      }
    }
  } catch (e) { /* ignore */ }

  // gerar PessoaDTO só uma vez e sincronizar DocumentoCliente
  try {
    const generatedPessoa = FuncoesRequests.fillPessoaDTO(pessoaOverrides, { validate: false })
    PropostaPayload.PessoaDTO = generatedPessoa

    const pf = generatedPessoa && generatedPessoa.DocumentoFederal
    if (pf) {
      PropostaPayload.PropostaDTO = PropostaPayload.PropostaDTO || {}
      const docCli = PropostaPayload.PropostaDTO.DocumentoCliente
      const isPlaceholder = docCli === undefined || docCli === null || String(docCli).trim() === '' || /^<.*>$/.test(String(docCli))
      if (isPlaceholder) {
        PropostaPayload.PropostaDTO.DocumentoCliente = pf
      }
    }
  } catch (e) {
    cy.log('Erro ao gerar PessoaDTO:', String(e))
    throw e
  }

  cy.log('PropostaPayload.PropostaDTO gerado/atualizado:', PropostaPayload.PropostaDTO)
  cy.log('PropostaPayload.PessoaDTO gerado:', PropostaPayload.PessoaDTO)
  cy.wrap(PropostaPayload).as('requestBody')
  cy.log ('Validando requestBody Everton:', PropostaPayload)
})

When("eu envio uma requisição POST para o cadastro de uma proposta limite especial", () => {

  // grava snapshot atualizado antes de enviar (evita alias desatualizado)
  cy.wrap(JSON.parse(JSON.stringify(PropostaPayload || {}))).as('requestBody')

  return cy.get('@requestBody').then((rb) => {
    const payload = rb && rb.dto ? rb : { dto: rb || {} }

    // GERA NOVO CodigoOperacao A CADA EXECUÇÃO (cada Example)
    const novoCodigo = faker.string.uuid()
    const idTransacao = faker.string.uuid()
    payload.dto = payload.dto || {}
    // garantir que PropostaDTO exista e colocar os GUIDs dentro dele
    payload.dto.PropostaDTO = payload.dto.PropostaDTO || {}
    payload.dto.PropostaDTO.CodigoOperacao = novoCodigo
    payload.dto.PropostaDTO.IdTransacao = idTransacao
    // mantém global atualizado (opcional, para compatibilidade com outros steps)
    PropostaPayload = payload
    cy.log(`[IncluirPropostaLimiteEspecial] CodigoOperacao: ${novoCodigo}`)
    cy.log(`[IncluirPropostaLimiteEspecial] IdTransacao: ${idTransacao}`)
    // chamada à API (retornando Chainables)
    return PropostaRequests.LimiteEspecial(payload, Integracao).then((resp) => {
      cy.log('[IncluirPropostaLimiteEspecial] response:', resp)
      cy.wrap(resp).as('responseStatus')

      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      const safeName = (currentScenarioTitle && currentScenarioTitle.length) ? currentScenarioTitle : 'IncluirPropostaLimiteEspecial'
      const reqFile = `cypress/results/workbooks/Jsons/Request-${safeName}-${ts}.json`
      const resFile = `cypress/results/workbooks/Jsons/Response-${safeName}-${ts}.json`
      const bodyToWrite = resp && resp.body ? resp.body : resp

      return cy.writeFile(reqFile, payload, { flag: 'w' })
        .then(() => cy.writeFile(resFile, bodyToWrite, { flag: 'w' }))
        .then(() => {
          cy.log(`[IncluirPropostaLimiteEspecial] Request/Response salvos: ${reqFile} / ${resFile}`)
          return cy.wrap(resp)
        })
    })
  })
})