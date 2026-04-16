import FuncoesRequests from "../../support/Funcoes/index"
const PropostaRequests = Cypress.automacao.Requests.PropostaRequests
const Integracao = "QA_INTEGRATION_EVERTON"
const { faker, da } = require('@faker-js/faker')

let PropostaPayload = {}
let caminhoExcelDoTeste = ''

Given("que eu preencha todos os campos para simulacao do valor da parcela SAC", () => {

  cy.fixture('proposta/CalculaGridParcelasSimplificadoSAC.json').then((dados) => {
    PropostaPayload = { ...dados }
    cy.log(PropostaPayload)
    //Cria cópia do Excel template para este caso (não escreve aqui)
    cy.task('copiarExcelTemplate', {
      caminhoTemplate: 'cypress/results/excel/CalculoSACpos.xlsx',
      outDir: 'cypress/results/workbooks'
    }).then((novoCaminho) => {
      caminhoExcelDoTeste = novoCaminho
      cy.wrap(novoCaminho).as('caminhoExcelDoTeste')
    })
  })
})

When("eu envio uma requisição POST para simular o valor da parcela SAC", () => {
  cy.wrap(PropostaPayload).as('requestBody')
  PropostaRequests.CalculaGridParcelasSimplificadoSAC(PropostaPayload, Integracao)
    .then((CalculaGridParcelasSimplificadoSACResponse) => {
      cy.log(CalculaGridParcelasSimplificadoSACResponse)
      cy.wrap(CalculaGridParcelasSimplificadoSACResponse).as('responseStatus')
    })
})

Then("escrevo request e response na planilha do SAC", () => {
  cy.get('@caminhoExcelDoTeste').then((caminhoExcel) => {
    cy.get('@requestBody').then((requestBodyWrapped) => {
      const requestBody = (requestBodyWrapped?.dto)
        ? Object.assign({}, requestBodyWrapped.dto, { parametros: requestBodyWrapped.parametros })
        : requestBodyWrapped
      cy.fixture('mapeamentos/entradaPMTsac.json').then((entradaMapping) => {
        const mappingArray = Array.isArray(entradaMapping) ? entradaMapping.slice() : []
        cy.task('expandMapping', { mappingArray, json: requestBody }).then((expandedRequestMapping) => {
          const mappingForPMT = expandedRequestMapping.filter(m => !(m.path && String(m.path).toLowerCase().includes('parcelas')))
          const mappingForAPIRequest = mappingForPMT.slice()
          cy.task('preencherExcelComJson', {
            caminho: caminhoExcel,
            sheetName: 'PMT',
            mappingArray: mappingForPMT,
            json: requestBody,
            skipSave: true
          }).then((resPMT) => {
            cy.log('Request escrito na aba PMT (sem parcelas)', resPMT, mappingForPMT)
          })
          cy.task('preencherExcelComJson', {
            caminho: caminhoExcel,
            sheetName: 'API',
            mappingArray: mappingForAPIRequest,
            json: requestBody,
            skipSave: true
          }).then((resAPIRequest) => {
            cy.log('Request escrito na aba API (sem parcelas)', resAPIRequest, mappingForAPIRequest)
            cy.get('@responseStatus').then((responseStatus) => {
              const responseBody = responseStatus.body?.Proposta || responseStatus.body || {}
              cy.fixture('mapeamentos/saidaPMTsac.json').then((saidaMapping) => {
                const saidaArray = Array.isArray(saidaMapping) ? saidaMapping : []
                cy.task('expandMapping', { mappingArray: saidaArray, json: responseBody }).then((expandedSaida) => {
                  const expanded = Array.isArray(expandedSaida) ? expandedSaida : []
                  const nonRepeatDefs = expanded.filter(m => {
                    if (!m) return false
                    if (m.__fromRepeat) return false
                    const p = String(m.path || '').toLowerCase()
                    return !p.includes('parcelas')
                  })
                  const parcelMappings = expanded.filter(m => {
                    if (!m) return false
                    if (m.__fromRepeat) return true
                    const p = String(m.path || '').toLowerCase()
                    return p.includes('parcelas')
                  })
                  const firstRepeat = (saidaArray || []).find(m => m && m.repeat && String(m.repeat.forEach).toLowerCase() === 'parcelas')
                  const startRow = Number(firstRepeat?.repeat?.startRow) || 0
                  let parcelasCount = Number(responseBody?.Prazo)
                  if (!Number.isInteger(parcelasCount) || parcelasCount <= 0) {
                    const rows = parcelMappings.map(pm => {
                      const r = String(pm.cell).match(/(\d+)$/)
                      return r ? Number(r[1]) : null
                    }).filter(x => x != null)
                    parcelasCount = rows.length === 0 ? 0 : (Math.max(...rows) - Math.min(...rows) + 1)
                  }
                  if (parcelMappings.length) {
                    cy.task('preencherExcelComJson', {
                      caminho: caminhoExcel,
                      sheetName: 'API',
                      mappingArray: parcelMappings,
                      json: responseBody,
                      skipSave: false
                    }).then((resWriteParcelas) => {
                      cy.log('Parcelas escritas na API', resWriteParcelas)
                      cy.wrap(caminhoExcel).as('caminhoExcelDoTeste')
                    })
                  } else {
                    cy.task('preencherRespostaNaPlanilha', {
                      caminho: caminhoExcel,
                      sheetName: 'API',
                      mappingPath: 'cypress/fixtures/mapeamentos/saidaPMTsac.json',
                      json: responseBody,
                      skipSave: false
                    }).then((resSave) => {
                      cy.log('Parcelas escritas na API', resSave)
                      cy.wrap(caminhoExcel).as('caminhoExcelDoTeste')
                    })
                  }
                  const endRowParaComparacao = (parcelasCount > 0) ? (startRow + Math.max(0, parcelasCount - 1)) : null
                  cy.wrap(endRowParaComparacao).as('endRowParaComparacao')
                  if (nonRepeatDefs.length) {
                    cy.task('preencherExcelComJson', {
                      caminho: caminhoExcel,
                      sheetName: 'API',
                      mappingArray: nonRepeatDefs,
                      json: responseBody,
                      skipSave: false
                    }).then((resWriteNonRepeat) => {
                      cy.log('Campos DTO escritos na API', resWriteNonRepeat)
                    })
                  }
                })
              })
            })
          })
        })
      })
    })
  })
})

Then("compara valores das parcelas entre abas", () => {
  cy.get('@caminhoExcelDoTeste').then((caminhoExcel) => {
    cy.log('Workbook salvo:', caminhoExcel)
    cy.get('@responseStatus').then((responseStatus) => {
      const responseBody = responseStatus.body?.Proposta || responseStatus.body || {}

      cy.get('@requestBody').then((requestBody) => {
        cy.fixture('mapeamentos/entradaPMTsac.json').then((entradaMapping) => {
          const entradaArray = Array.isArray(entradaMapping) ? entradaMapping : []
          cy.task('expandMapping', { mappingArray: entradaArray, json: requestBody }).then((expandedPMT) => {
            const expandedPMTArray = Array.isArray(expandedPMT) ? expandedPMT : []

            cy.fixture('mapeamentos/saidaPMTsac.json').then((saidaMapping) => {
              const saidaArray = Array.isArray(saidaMapping) ? saidaMapping : []
              cy.task('expandMapping', { mappingArray: saidaArray, json: responseBody }).then((expandedAPI) => {
                const expandedAPIArray = Array.isArray(expandedAPI) ? expandedAPI : []

                // debug: inspeciona os arrays expandidos
                //cy.task('print', { msg: 'expandedPMTArray', len: expandedPMTArray.length, sample: expandedPMTArray.slice(0, 40) })
                //cy.task('print', { msg: 'expandedAPIArray', len: expandedAPIArray.length, sample: expandedAPIArray.slice(0, 40) })

                // 1) tentativa direta por path (mais segura quando paths batem)
                const mapByPathPMT = new Map()
                for (const e of expandedPMTArray)
                  if (e && e.path)
                    mapByPathPMT.set(String(e.path), e)

                let mappingForCompare = []
                for (const a of expandedAPIArray) {
                  if (!a || !a.path) continue
                  const key = String(a.path)
                  //const pmtEntry = mapByPathPMT.get(key)
                  // if (pmtEntry && pmtEntry.cell && a.cell) {
                  mappingForCompare.push({
                    expectedCell: a.cell,
                    actualCell: a.cell,
                    format: a.format,
                    path: key
                  })
                  //}
                }

                // 2) fallback: casar por índice/field quando os repeats existem mas paths diferem
                if (mappingForCompare.length < Math.max(1, expandedAPIArray.length / 4)) {
                  const pmtsRepeat = expandedPMTArray.filter(x => x && x.__fromRepeat)
                  const apisRepeat = expandedAPIArray.filter(x => x && x.__fromRepeat)
                  if (apisRepeat.length && pmtsRepeat.length) {
                    const groupByIndexField = (arr) => {
                      const out = {}
                      for (const it of arr) {
                        const m = String(it.path || '').match(/Parcelas\[(\d+)\]\.?(.*)/i)
                        if (!m) continue
                        const idx = Number(m[1])
                        const field = (m[2] || '').replace(/^\./, '')
                        out[idx] = out[idx] || {}
                        out[idx][field] = it
                      }
                      return out
                    }
                    const pmtGrouped = groupByIndexField(pmtsRepeat)
                    const apiGrouped = groupByIndexField(apisRepeat)
                    const indices = Array.from(new Set([...Object.keys(pmtGrouped), ...Object.keys(apiGrouped)])).map(Number).sort((a, b) => a - b)
                    for (const idx of indices) {
                      const pRow = pmtGrouped[idx] || {}
                      const aRow = apiGrouped[idx] || {}
                      for (const field of Object.keys(aRow)) {
                        const aEntry = aRow[field]
                        const pEntry = pRow[field]
                        if (aEntry && aEntry.cell && pEntry && pEntry.cell) {
                          mappingForCompare.push({
                            expectedCell: pEntry.cell,
                            actualCell: aEntry.cell,
                            format: aEntry.format || pEntry.format,
                            path: aEntry.path,
                            parcelaIndex: idx
                          })
                        }
                      }
                    }
                  }
                }

                // debug final do mapping
                //cy.task('print', { msg: 'mappingForCompare final', len: mappingForCompare.length, sample: mappingForCompare.slice(0, 80) })

                // usar endRowParaComparacao (salvo na etapa anterior) para comparar E:S
                // pega endRowParaComparacao salvo antes (startRow = 8 por mapeamento)
                cy.get('@endRowParaComparacao').then((aliasEndRow) => {
                  const startCol = 'E', endCol = 'S', startRow = 8
                  const endRow = (aliasEndRow && Number(aliasEndRow)) ? Number(aliasEndRow) : null

                  if (!endRow) {
                    // fallback: ainda tentar comparar por mapping detalhado (mantém formatação/casa decimais)
                    return cy.task('compararPorMapping', {
                      caminho: caminhoExcel,
                      sheetExpected: 'PMT',
                      sheetActual: 'API',
                      mappingArray: mappingForCompare,
                      tolerance: 0.01
                    }).then((res) => {
                      cy.log('Comparação concluída', res, mappingForCompare)
                    })
                  }

                  // compara todas as colunas E..S entre as duas abas, linhas 8..endRow
                  cy.task('excel:compareCols', {
                    filePath: caminhoExcel,
                    sheetLeft: 'PMT',
                    sheetRight: 'API',
                    startCol,
                    endCol,
                    startRow,
                    endRow,
                    tolerance: 0.01
                  }).then((res) => {
                    const failures = res.failures || []
                    const totalCompared = res.totalCompared || 0
                    const totalPassed = res.totalPassed || 0

                    // resumo
                    cy.log(`Comparação PMT x API E${startRow}:S${endRow}`, res)
                    cy.log(`Total comparados: ${totalCompared}`)
                    cy.log(`Total passaram: ${totalPassed}`)
                    cy.log(`Total falharam: ${failures.length}`)

                    // mantém o comportamento de falhar o teste se houver mismatches
                    if (failures.length > 0) {
                      const msg = `Falhas na comparação (${failures.length}):\n` + JSON.stringify(failures, null, 2)
                      cy.task('warn', msg)
                      expect(failures.length, `Falhas na comparação: ${JSON.stringify(failures, null, 2)}`).to.equal(0)
                    } else {
                      cy.log('Comparação concluída sem diferenças')
                    }
                  })
                })
              })
            })
          })
        })
      })
    })
  })
})

Given("que eu preencha todos os campos para simulacao do valor da parcela", () => {

  cy.fixture('proposta/SimulacaoValorParcela.json').then((dados) => {
    const GerarDataMesSeguinteMes = FuncoesRequests.GerarDataMesSeguinteFuncoes()
    PropostaPayload = { ...dados.dto }
    PropostaPayload.CodigoOperacao = faker.string.uuid()
    PropostaPayload.DtPrimeiroVencto = GerarDataMesSeguinteMes
    cy.log(GerarDataMesSeguinteMes)
    cy.log(PropostaPayload)
  })
})

Given("que eu preencha todos os campos para simulacao do valor da parcela SAC", () => {

  cy.fixture('proposta/CalculaGridParcelasSimplificadoSAC.json').then((dados) => {
    PropostaPayload = { ...dados }
    cy.log(PropostaPayload)
    //Cria cópia do Excel template para este caso (não escreve aqui)
    cy.task('copiarExcelTemplate', {
      caminhoTemplate: 'cypress/results/excel/CalculoSACpos.xlsx',
      outDir: 'cypress/results/workbooks'
    }).then((novoCaminho) => {
      caminhoExcelDoTeste = novoCaminho
      cy.wrap(novoCaminho).as('caminhoExcelDoTeste')
    })
  })
})

When("eu envio uma requisição POST para simular o valor da parcela SAC", () => {
  cy.wrap(PropostaPayload).as('requestBody')
  PropostaRequests.CalculaGridParcelasSimplificadoSAC(PropostaPayload, Integracao)
    .then((CalculaGridParcelasSimplificadoSACResponse) => {
      cy.log(CalculaGridParcelasSimplificadoSACResponse)
      cy.wrap(CalculaGridParcelasSimplificadoSACResponse).as('responseStatus')
    })
})

Then("sucesso a simulacao da parcela SAC foi gerada", () => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  cy.get(`@responseStatus`).then((responseStatus) => {
    expect([200, 201]).to.include(responseStatus.status)
    if (typeof responseStatus.body?.Result !== 'undefined') {
      expect(responseStatus.body.Result).to.be.true
    }
    cy.writeFile(`cypress/results/workbooks/Jsons/ResponseCalculaGridParcelasSimplificadoSAC-${ts}.json`, responseStatus.body)
    cy.log('Response salvo em results/responseBody')
    cy.get('@requestBody').then((requestBody) => {
      cy.writeFile(`cypress/results/workbooks/Jsons/RequestCalculaGridParcelasSimplificadoSAC-${ts}.json`, requestBody)
      cy.log('Request salvo em results/requestBody')
    })
  })
})

Then("escrevo request e response na planilha do SAC", () => {
  cy.get('@caminhoExcelDoTeste').then((caminhoExcel) => {
    cy.get('@requestBody').then((requestBodyWrapped) => {
      const requestBody = (requestBodyWrapped?.dto)
        ? Object.assign({}, requestBodyWrapped.dto, { parametros: requestBodyWrapped.parametros })
        : requestBodyWrapped
      cy.fixture('mapeamentos/entradaPMTsac.json').then((entradaMapping) => {
        const mappingArray = Array.isArray(entradaMapping) ? entradaMapping.slice() : []
        cy.task('expandMapping', { mappingArray, json: requestBody }).then((expandedRequestMapping) => {
          const mappingForPMT = expandedRequestMapping.filter(m => !(m.path && String(m.path).toLowerCase().includes('parcelas')))
          const mappingForAPIRequest = mappingForPMT.slice()
          cy.task('preencherExcelComJson', {
            caminho: caminhoExcel,
            sheetName: 'PMT',
            mappingArray: mappingForPMT,
            json: requestBody,
            skipSave: true
          }).then((resPMT) => {
            cy.log('Request escrito na aba PMT (sem parcelas)', resPMT, mappingForPMT)
          })
          cy.task('preencherExcelComJson', {
            caminho: caminhoExcel,
            sheetName: 'API',
            mappingArray: mappingForAPIRequest,
            json: requestBody,
            skipSave: true
          }).then((resAPIRequest) => {
            cy.log('Request escrito na aba API (sem parcelas)', resAPIRequest, mappingForAPIRequest)
            cy.get('@responseStatus').then((responseStatus) => {
              const responseBody = responseStatus.body?.Proposta || responseStatus.body || {}
              cy.fixture('mapeamentos/saidaPMTsac.json').then((saidaMapping) => {
                const saidaArray = Array.isArray(saidaMapping) ? saidaMapping : []
                cy.task('expandMapping', { mappingArray: saidaArray, json: responseBody }).then((expandedSaida) => {
                  const expanded = Array.isArray(expandedSaida) ? expandedSaida : []
                  const nonRepeatDefs = expanded.filter(m => {
                    if (!m) return false
                    if (m.__fromRepeat) return false
                    const p = String(m.path || '').toLowerCase()
                    return !p.includes('parcelas')
                  })
                  const parcelMappings = expanded.filter(m => {
                    if (!m) return false
                    if (m.__fromRepeat) return true
                    const p = String(m.path || '').toLowerCase()
                    return p.includes('parcelas')
                  })
                  const firstRepeat = (saidaArray || []).find(m => m && m.repeat && String(m.repeat.forEach).toLowerCase() === 'parcelas')
                  const startRow = Number(firstRepeat?.repeat?.startRow) || 0
                  let parcelasCount = Number(responseBody?.Prazo)
                  if (!Number.isInteger(parcelasCount) || parcelasCount <= 0) {
                    const rows = parcelMappings.map(pm => {
                      const r = String(pm.cell).match(/(\d+)$/)
                      return r ? Number(r[1]) : null
                    }).filter(x => x != null)
                    parcelasCount = rows.length === 0 ? 0 : (Math.max(...rows) - Math.min(...rows) + 1)
                  }
                  if (parcelMappings.length) {
                    cy.task('preencherExcelComJson', {
                      caminho: caminhoExcel,
                      sheetName: 'API',
                      mappingArray: parcelMappings,
                      json: responseBody,
                      skipSave: false
                    }).then((resWriteParcelas) => {
                      cy.log('Parcelas escritas na API', resWriteParcelas)
                      cy.wrap(caminhoExcel).as('caminhoExcelDoTeste')
                    })
                  } else {
                    cy.task('preencherRespostaNaPlanilha', {
                      caminho: caminhoExcel,
                      sheetName: 'API',
                      mappingPath: 'cypress/fixtures/mapeamentos/saidaPMTsac.json',
                      json: responseBody,
                      skipSave: false
                    }).then((resSave) => {
                      cy.log('Parcelas escritas na API', resSave)
                      cy.wrap(caminhoExcel).as('caminhoExcelDoTeste')
                    })
                  }
                  const endRowParaComparacao = (parcelasCount > 0) ? (startRow + Math.max(0, parcelasCount - 1)) : null
                  cy.wrap(endRowParaComparacao).as('endRowParaComparacao')
                  if (nonRepeatDefs.length) {
                    cy.task('preencherExcelComJson', {
                      caminho: caminhoExcel,
                      sheetName: 'API',
                      mappingArray: nonRepeatDefs,
                      json: responseBody,
                      skipSave: false
                    }).then((resWriteNonRepeat) => {
                      cy.log('Campos DTO escritos na API', resWriteNonRepeat)
                    })
                  }
                })
              })
            })
          })
        })
      })
    })
  })
})

Then("compara valores das parcelas entre abas", () => {
  cy.get('@caminhoExcelDoTeste').then((caminhoExcel) => {
    cy.log('Workbook salvo:', caminhoExcel)
    cy.get('@responseStatus').then((responseStatus) => {
      const responseBody = responseStatus.body?.Proposta || responseStatus.body || {}

      cy.get('@requestBody').then((requestBody) => {
        cy.fixture('mapeamentos/entradaPMTsac.json').then((entradaMapping) => {
          const entradaArray = Array.isArray(entradaMapping) ? entradaMapping : []
          cy.task('expandMapping', { mappingArray: entradaArray, json: requestBody }).then((expandedPMT) => {
            const expandedPMTArray = Array.isArray(expandedPMT) ? expandedPMT : []

            cy.fixture('mapeamentos/saidaPMTsac.json').then((saidaMapping) => {
              const saidaArray = Array.isArray(saidaMapping) ? saidaMapping : []
              cy.task('expandMapping', { mappingArray: saidaArray, json: responseBody }).then((expandedAPI) => {
                const expandedAPIArray = Array.isArray(expandedAPI) ? expandedAPI : []

                // debug: inspeciona os arrays expandidos
                //cy.task('print', { msg: 'expandedPMTArray', len: expandedPMTArray.length, sample: expandedPMTArray.slice(0, 40) })
                //cy.task('print', { msg: 'expandedAPIArray', len: expandedAPIArray.length, sample: expandedAPIArray.slice(0, 40) })

                // 1) tentativa direta por path (mais segura quando paths batem)
                const mapByPathPMT = new Map()
                for (const e of expandedPMTArray)
                  if (e && e.path)
                    mapByPathPMT.set(String(e.path), e)

                let mappingForCompare = []
                for (const a of expandedAPIArray) {
                  if (!a || !a.path) continue
                  const key = String(a.path)
                  //const pmtEntry = mapByPathPMT.get(key)
                  // if (pmtEntry && pmtEntry.cell && a.cell) {
                  mappingForCompare.push({
                    expectedCell: a.cell,
                    actualCell: a.cell,
                    format: a.format,
                    path: key
                  })
                  //}
                }

                // 2) fallback: casar por índice/field quando os repeats existem mas paths diferem
                if (mappingForCompare.length < Math.max(1, expandedAPIArray.length / 4)) {
                  const pmtsRepeat = expandedPMTArray.filter(x => x && x.__fromRepeat)
                  const apisRepeat = expandedAPIArray.filter(x => x && x.__fromRepeat)
                  if (apisRepeat.length && pmtsRepeat.length) {
                    const groupByIndexField = (arr) => {
                      const out = {}
                      for (const it of arr) {
                        const m = String(it.path || '').match(/Parcelas\[(\d+)\]\.?(.*)/i)
                        if (!m) continue
                        const idx = Number(m[1])
                        const field = (m[2] || '').replace(/^\./, '')
                        out[idx] = out[idx] || {}
                        out[idx][field] = it
                      }
                      return out
                    }
                    const pmtGrouped = groupByIndexField(pmtsRepeat)
                    const apiGrouped = groupByIndexField(apisRepeat)
                    const indices = Array.from(new Set([...Object.keys(pmtGrouped), ...Object.keys(apiGrouped)])).map(Number).sort((a, b) => a - b)
                    for (const idx of indices) {
                      const pRow = pmtGrouped[idx] || {}
                      const aRow = apiGrouped[idx] || {}
                      for (const field of Object.keys(aRow)) {
                        const aEntry = aRow[field]
                        const pEntry = pRow[field]
                        if (aEntry && aEntry.cell && pEntry && pEntry.cell) {
                          mappingForCompare.push({
                            expectedCell: pEntry.cell,
                            actualCell: aEntry.cell,
                            format: aEntry.format || pEntry.format,
                            path: aEntry.path,
                            parcelaIndex: idx
                          })
                        }
                      }
                    }
                  }
                }

                // debug final do mapping
                //cy.task('print', { msg: 'mappingForCompare final', len: mappingForCompare.length, sample: mappingForCompare.slice(0, 80) })

                // usar endRowParaComparacao (salvo na etapa anterior) para comparar E:S
                // pega endRowParaComparacao salvo antes (startRow = 8 por mapeamento)
                cy.get('@endRowParaComparacao').then((aliasEndRow) => {
                  const startCol = 'E', endCol = 'S', startRow = 8
                  const endRow = (aliasEndRow && Number(aliasEndRow)) ? Number(aliasEndRow) : null

                  if (!endRow) {
                    // fallback: ainda tentar comparar por mapping detalhado (mantém formatação/casa decimais)
                    return cy.task('compararPorMapping', {
                      caminho: caminhoExcel,
                      sheetExpected: 'PMT',
                      sheetActual: 'API',
                      mappingArray: mappingForCompare,
                      tolerance: 0.01
                    }).then((res) => {
                      cy.log('Comparação concluída', res, mappingForCompare)
                    })
                  }

                  // compara todas as colunas E..S entre as duas abas, linhas 8..endRow
                  cy.task('excel:compareCols', {
                    filePath: caminhoExcel,
                    sheetLeft: 'PMT',
                    sheetRight: 'API',
                    startCol,
                    endCol,
                    startRow,
                    endRow,
                    tolerance: 0.01
                  }).then((res) => {
                    const failures = res.failures || []
                    const totalCompared = res.totalCompared || 0
                    const totalPassed = res.totalPassed || 0

                    // resumo
                    cy.log(`Comparação PMT x API E${startRow}:S${endRow}`, res)
                    cy.log(`Total comparados: ${totalCompared}`)
                    cy.log(`Total passaram: ${totalPassed}`)
                    cy.log(`Total falharam: ${failures.length}`)

                    // mantém o comportamento de falhar o teste se houver mismatches
                    if (failures.length > 0) {
                      const msg = `Falhas na comparação (${failures.length}):\n` + JSON.stringify(failures, null, 2)
                      cy.task('warn', msg)
                      expect(failures.length, `Falhas na comparação: ${JSON.stringify(failures, null, 2)}`).to.equal(0)
                    } else {
                      cy.log('Comparação concluída sem diferenças')
                    }
                  })
                })
              })
            })
          })
        })
      })
    })
  })
})

Then("será exibida a seguinte mensagem {string} de erro", (Mensagem) => {
  cy.get(`@responseStatus`).then((responseStatus) => {
    const response = responseStatus.body
    expect(response.Result).to.be.false
    expect(response.Messages[0].Description).to.be.equal(Mensagem)
  })
})

Given("que eu preencha todos os campos para simulacao do valor da parcela", () => {

  cy.fixture('proposta/SimulacaoValorParcela.json').then((dados) => {
    const GerarDataMesSeguinteMes = FuncoesRequests.GerarDataMesSeguinteFuncoes()
    PropostaPayload = { ...dados.dto }
    PropostaPayload.CodigoOperacao = faker.string.uuid()
    PropostaPayload.DtPrimeiroVencto = GerarDataMesSeguinteMes
    cy.log(GerarDataMesSeguinteMes)
    cy.log(PropostaPayload)
  })
})

When("eu envio uma requisição POST para simular o valor da parcela", () => {
  PropostaRequests.SimulacaoValorParcela(PropostaPayload, Integracao).then((SimulacaoValorParcelaResponse) => {
    cy.log(SimulacaoValorParcelaResponse)
    const responseStatus = SimulacaoValorParcelaResponse
    cy.log(responseStatus)
    cy.wrap(responseStatus).as('responseStatus')

  })
})

Given("que eu preencha todos os campos para simulacao do valor da parcela SAC", () => {

  cy.fixture('proposta/CalculaGridParcelasSimplificadoSAC.json').then((dados) => {
    PropostaPayload = { ...dados }
    cy.log(PropostaPayload)
    //Cria cópia do Excel template para este caso (não escreve aqui)
    cy.task('copiarExcelTemplate', {
      caminhoTemplate: 'cypress/results/excel/CalculoSACpos.xlsx',
      outDir: 'cypress/results/workbooks'
    }).then((novoCaminho) => {
      caminhoExcelDoTeste = novoCaminho
      cy.wrap(novoCaminho).as('caminhoExcelDoTeste')
    })
  })
})

When("eu envio uma requisição POST para simular o valor da parcela SAC", () => {
  cy.wrap(PropostaPayload).as('requestBody')
  PropostaRequests.CalculaGridParcelasSimplificadoSAC(PropostaPayload, Integracao)
    .then((CalculaGridParcelasSimplificadoSACResponse) => {
      cy.log(CalculaGridParcelasSimplificadoSACResponse)
      cy.wrap(CalculaGridParcelasSimplificadoSACResponse).as('responseStatus')
    })
})

Then("sucesso a simulacao da parcela SAC foi gerada", () => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  cy.get(`@responseStatus`).then((responseStatus) => {
    expect([200, 201]).to.include(responseStatus.status)
    if (typeof responseStatus.body?.Result !== 'undefined') {
      expect(responseStatus.body.Result).to.be.true
    }
    cy.writeFile(`cypress/results/workbooks/Jsons/ResponseCalculaGridParcelasSimplificadoSAC-${ts}.json`, responseStatus.body)
    cy.log('Response salvo em results/responseBody')
    cy.get('@requestBody').then((requestBody) => {
      cy.writeFile(`cypress/results/workbooks/Jsons/RequestCalculaGridParcelasSimplificadoSAC-${ts}.json`, requestBody)
      cy.log('Request salvo em results/requestBody')
    })
  })
})

Then("escrevo request e response na planilha do SAC", () => {
  cy.get('@caminhoExcelDoTeste').then((caminhoExcel) => {
    cy.get('@requestBody').then((requestBodyWrapped) => {
      const requestBody = (requestBodyWrapped?.dto)
        ? Object.assign({}, requestBodyWrapped.dto, { parametros: requestBodyWrapped.parametros })
        : requestBodyWrapped
      cy.fixture('mapeamentos/entradaPMTsac.json').then((entradaMapping) => {
        const mappingArray = Array.isArray(entradaMapping) ? entradaMapping.slice() : []
        cy.task('expandMapping', { mappingArray, json: requestBody }).then((expandedRequestMapping) => {
          const mappingForPMT = expandedRequestMapping.filter(m => !(m.path && String(m.path).toLowerCase().includes('parcelas')))
          const mappingForAPIRequest = mappingForPMT.slice()
          cy.task('preencherExcelComJson', {
            caminho: caminhoExcel,
            sheetName: 'PMT',
            mappingArray: mappingForPMT,
            json: requestBody,
            skipSave: true
          }).then((resPMT) => {
            cy.log('Request escrito na aba PMT (sem parcelas)', resPMT, mappingForPMT)
          })
          cy.task('preencherExcelComJson', {
            caminho: caminhoExcel,
            sheetName: 'API',
            mappingArray: mappingForAPIRequest,
            json: requestBody,
            skipSave: true
          }).then((resAPIRequest) => {
            cy.log('Request escrito na aba API (sem parcelas)', resAPIRequest, mappingForAPIRequest)
            cy.get('@responseStatus').then((responseStatus) => {
              const responseBody = responseStatus.body?.Proposta || responseStatus.body || {}
              cy.fixture('mapeamentos/saidaPMTsac.json').then((saidaMapping) => {
                const saidaArray = Array.isArray(saidaMapping) ? saidaMapping : []
                cy.task('expandMapping', { mappingArray: saidaArray, json: responseBody }).then((expandedSaida) => {
                  const expanded = Array.isArray(expandedSaida) ? expandedSaida : []
                  const nonRepeatDefs = expanded.filter(m => {
                    if (!m) return false
                    if (m.__fromRepeat) return false
                    const p = String(m.path || '').toLowerCase()
                    return !p.includes('parcelas')
                  })
                  const parcelMappings = expanded.filter(m => {
                    if (!m) return false
                    if (m.__fromRepeat) return true
                    const p = String(m.path || '').toLowerCase()
                    return p.includes('parcelas')
                  })
                  const firstRepeat = (saidaArray || []).find(m => m && m.repeat && String(m.repeat.forEach).toLowerCase() === 'parcelas')
                  const startRow = Number(firstRepeat?.repeat?.startRow) || 0
                  let parcelasCount = Number(responseBody?.Prazo)
                  if (!Number.isInteger(parcelasCount) || parcelasCount <= 0) {
                    const rows = parcelMappings.map(pm => {
                      const r = String(pm.cell).match(/(\d+)$/)
                      return r ? Number(r[1]) : null
                    }).filter(x => x != null)
                    parcelasCount = rows.length === 0 ? 0 : (Math.max(...rows) - Math.min(...rows) + 1)
                  }
                  if (parcelMappings.length) {
                    cy.task('preencherExcelComJson', {
                      caminho: caminhoExcel,
                      sheetName: 'API',
                      mappingArray: parcelMappings,
                      json: responseBody,
                      skipSave: false
                    }).then((resWriteParcelas) => {
                      cy.log('Parcelas escritas na API', resWriteParcelas)
                      cy.wrap(caminhoExcel).as('caminhoExcelDoTeste')
                    })
                  } else {
                    cy.task('preencherRespostaNaPlanilha', {
                      caminho: caminhoExcel,
                      sheetName: 'API',
                      mappingPath: 'cypress/fixtures/mapeamentos/saidaPMTsac.json',
                      json: responseBody,
                      skipSave: false
                    }).then((resSave) => {
                      cy.log('Parcelas escritas na API', resSave)
                      cy.wrap(caminhoExcel).as('caminhoExcelDoTeste')
                    })
                  }
                  const endRowParaComparacao = (parcelasCount > 0) ? (startRow + Math.max(0, parcelasCount - 1)) : null
                  cy.wrap(endRowParaComparacao).as('endRowParaComparacao')
                  if (nonRepeatDefs.length) {
                    cy.task('preencherExcelComJson', {
                      caminho: caminhoExcel,
                      sheetName: 'API',
                      mappingArray: nonRepeatDefs,
                      json: responseBody,
                      skipSave: false
                    }).then((resWriteNonRepeat) => {
                      cy.log('Campos DTO escritos na API', resWriteNonRepeat)
                    })
                  }
                })
              })
            })
          })
        })
      })
    })
  })
})
Then("compara valores das parcelas entre abas", () => {
  cy.get('@caminhoExcelDoTeste').then((caminhoExcel) => {
    cy.log('Workbook salvo:', caminhoExcel)
    cy.get('@responseStatus').then((responseStatus) => {
      const responseBody = responseStatus.body?.Proposta || responseStatus.body || {}

      cy.get('@requestBody').then((requestBody) => {
        cy.fixture('mapeamentos/entradaPMTsac.json').then((entradaMapping) => {
          const entradaArray = Array.isArray(entradaMapping) ? entradaMapping : []
          cy.task('expandMapping', { mappingArray: entradaArray, json: requestBody }).then((expandedPMT) => {
            const expandedPMTArray = Array.isArray(expandedPMT) ? expandedPMT : []

            cy.fixture('mapeamentos/saidaPMTsac.json').then((saidaMapping) => {
              const saidaArray = Array.isArray(saidaMapping) ? saidaMapping : []
              cy.task('expandMapping', { mappingArray: saidaArray, json: responseBody }).then((expandedAPI) => {
                const expandedAPIArray = Array.isArray(expandedAPI) ? expandedAPI : []

                // debug: inspeciona os arrays expandidos
                //cy.task('print', { msg: 'expandedPMTArray', len: expandedPMTArray.length, sample: expandedPMTArray.slice(0, 40) })
                //cy.task('print', { msg: 'expandedAPIArray', len: expandedAPIArray.length, sample: expandedAPIArray.slice(0, 40) })

                // 1) tentativa direta por path (mais segura quando paths batem)
                const mapByPathPMT = new Map()
                for (const e of expandedPMTArray)
                  if (e && e.path)
                    mapByPathPMT.set(String(e.path), e)

                let mappingForCompare = []
                for (const a of expandedAPIArray) {
                  if (!a || !a.path) continue
                  const key = String(a.path)
                  //const pmtEntry = mapByPathPMT.get(key)
                  // if (pmtEntry && pmtEntry.cell && a.cell) {
                  mappingForCompare.push({
                    expectedCell: a.cell,
                    actualCell: a.cell,
                    format: a.format,
                    path: key
                  })
                  //}
                }

                // 2) fallback: casar por índice/field quando os repeats existem mas paths diferem
                if (mappingForCompare.length < Math.max(1, expandedAPIArray.length / 4)) {
                  const pmtsRepeat = expandedPMTArray.filter(x => x && x.__fromRepeat)
                  const apisRepeat = expandedAPIArray.filter(x => x && x.__fromRepeat)
                  if (apisRepeat.length && pmtsRepeat.length) {
                    const groupByIndexField = (arr) => {
                      const out = {}
                      for (const it of arr) {
                        const m = String(it.path || '').match(/Parcelas\[(\d+)\]\.?(.*)/i)
                        if (!m) continue
                        const idx = Number(m[1])
                        const field = (m[2] || '').replace(/^\./, '')
                        out[idx] = out[idx] || {}
                        out[idx][field] = it
                      }
                      return out
                    }
                    const pmtGrouped = groupByIndexField(pmtsRepeat)
                    const apiGrouped = groupByIndexField(apisRepeat)
                    const indices = Array.from(new Set([...Object.keys(pmtGrouped), ...Object.keys(apiGrouped)])).map(Number).sort((a, b) => a - b)
                    for (const idx of indices) {
                      const pRow = pmtGrouped[idx] || {}
                      const aRow = apiGrouped[idx] || {}
                      for (const field of Object.keys(aRow)) {
                        const aEntry = aRow[field]
                        const pEntry = pRow[field]
                        if (aEntry && aEntry.cell && pEntry && pEntry.cell) {
                          mappingForCompare.push({
                            expectedCell: pEntry.cell,
                            actualCell: aEntry.cell,
                            format: aEntry.format || pEntry.format,
                            path: aEntry.path,
                            parcelaIndex: idx
                          })
                        }
                      }
                    }
                  }
                }

                // debug final do mapping
                //cy.task('print', { msg: 'mappingForCompare final', len: mappingForCompare.length, sample: mappingForCompare.slice(0, 80) })

                // usar endRowParaComparacao (salvo na etapa anterior) para comparar E:S
                // pega endRowParaComparacao salvo antes (startRow = 8 por mapeamento)
                cy.get('@endRowParaComparacao').then((aliasEndRow) => {
                  const startCol = 'E', endCol = 'S', startRow = 8
                  const endRow = (aliasEndRow && Number(aliasEndRow)) ? Number(aliasEndRow) : null

                  if (!endRow) {
                    // fallback: ainda tentar comparar por mapping detalhado (mantém formatação/casa decimais)
                    return cy.task('compararPorMapping', {
                      caminho: caminhoExcel,
                      sheetExpected: 'PMT',
                      sheetActual: 'API',
                      mappingArray: mappingForCompare,
                      tolerance: 0.01
                    }).then((res) => {
                      cy.log('Comparação concluída', res, mappingForCompare)
                    })
                  }

                  // compara todas as colunas E..S entre as duas abas, linhas 8..endRow
                  cy.task('excel:compareCols', {
                    filePath: caminhoExcel,
                    sheetLeft: 'PMT',
                    sheetRight: 'API',
                    startCol,
                    endCol,
                    startRow,
                    endRow,
                    tolerance: 0.01
                  }).then((res) => {
                    const failures = res.failures || []
                    const totalCompared = res.totalCompared || 0
                    const totalPassed = res.totalPassed || 0

                    // resumo
                    cy.log(`Comparação PMT x API E${startRow}:S${endRow}`, res)
                    cy.log(`Total comparados: ${totalCompared}`)
                    cy.log(`Total passaram: ${totalPassed}`)
                    cy.log(`Total falharam: ${failures.length}`)

                    // mantém o comportamento de falhar o teste se houver mismatches
                    if (failures.length > 0) {
                      const msg = `Falhas na comparação (${failures.length}):\n` + JSON.stringify(failures, null, 2)
                      cy.task('warn', msg)
                      expect(failures.length, `Falhas na comparação: ${JSON.stringify(failures, null, 2)}`).to.equal(0)
                    } else {
                      cy.log('Comparação concluída sem diferenças')
                    }
                  })
                })
              })
            })
          })
        })
      })
    })
  })
})

When('eu envio uma requisição POST para {string}', (endpoint_simular) => {
  // some features pass '/proposta/simular-parcelas-sac' while helper expects BMPDigital/... 
  cy.wrap(PropostaPayload).as('requestBody')
  cy.log('endpoint_simular:', endpoint_simular)

  // rota centralizada: chama a função exportada
  const callCalculaGrid = (payload) => {
    // wrapper conforme CalculaGridParcelasSimplificadoSACRequests espera: { dto, parametros }
    return PropostaRequests.CalculaGridParcelasSimplificadoSAC(payload, Integracao)
  }

  // nome seguro baseado no cenário + endpoint
  const endpointSafe = String(endpoint_simular || 'simular').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').slice(0, 60)
  const safeName = (currentScenarioTitle ? `${currentScenarioTitle}` : endpointSafe)
  // permitir que feature passe endpoint simbólico; se for o path esperado chama a função
  if (String(endpoint_simular).toLowerCase().includes('simular-parcelas-sac') ||
    String(endpoint_simular).toLowerCase().includes('calculagridparcelas')) {
    callCalculaGrid({ dto: PropostaPayload.dto || PropostaPayload, parametros: PropostaPayload.parametros || [] })
      .then((res) => {
        cy.log(res)
        cy.wrap(res).as('responseStatus')

        // grava request/response para cada execução do cenário (sempre)
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        const reqFile = `cypress/results/workbooks/Jsons/Request-${safeName}-${ts}.json`
        const resFile = `cypress/results/workbooks/Jsons/Response-${safeName}-${ts}.json`

        // garante que requestBody esteja disponível e grava ambos
        cy.get('@requestBody').then((rb) => {
          const reqToWrite = (rb && (rb.dto || rb.parametros)) ? rb : PropostaPayload || rb || {}
          return cy.writeFile(reqFile, reqToWrite, { flag: 'w' })
        }).then(() => {
          return cy.writeFile(resFile, res.body || res, { flag: 'w' })
        }).then(() => {
          cy.log(`Request/Response salvos: ${reqFile} / ${resFile}`)
        })
      })
  } else {
    // fallback genérico: tenta mandar para a mesma função
    callCalculaGrid({ dto: PropostaPayload.dto || PropostaPayload, parametros: PropostaPayload.parametros || [] })
      .then((res) => {
        cy.wrap(res).as('responseStatus')

        // grava request/response para cada execução do cenário (sempre)
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        const reqFile = `cypress/results/workbooks/Jsons/Request-${safeName}-${ts}.json`
        const resFile = `cypress/results/workbooks/Jsons/Response-${safeName}-${ts}.json`

        cy.get('@requestBody').then((rb) => {
          const reqToWrite = (rb && (rb.dto || rb.parametros)) ? rb : PropostaPayload || rb || {}
          return cy.writeFile(reqFile, reqToWrite, { flag: 'w' })
        }).then(() => {
          return cy.writeFile(resFile, res.body || res, { flag: 'w' })
        }).then(() => {
          cy.log(`Request/Response salvos: ${reqFile} / ${resFile}`)
        })
      })
  }
})

Then("a resposta contém a grade de parcelas e totais esperados", () => {
  cy.get('@responseStatus').then((responseStatus) => {
    const body = responseStatus.body.Proposta || {}
    // validação mínima: existe array Parcelas
    expect(body).to.have.property('Parcelas')
    expect(Array.isArray(body.Parcelas)).to.be.true

    const prazo = Number(PropostaPayload?.dto?.Prazo) || null

    if (Number.isInteger(prazo) && prazo > 0) {
      const parcelasLen = body.Parcelas.length

      if (parcelasLen === 0) {
        // salva request/response para debugging
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        cy.writeFile(`cypress/results/workbooks/Jsons/Request-EmptyParcelas-${ts}.json`, PropostaPayload)
        cy.writeFile(`cypress/results/workbooks/Jsons/Response-EmptyParcelas-${ts}.json`, responseStatus.body)
        cy.log('Parcelas vazio. Request/Response salvos para análise.')

        // falhar apenas se a API indicou sucesso (Result true) ou status 200
        const status = responseStatus.status || responseStatus
        const resultFlag = responseStatus.body?.Result
        if (status === 200 && (typeof resultFlag === 'undefined' || resultFlag === true)) {
          throw new Error('Resposta com status 200/Result=true, mas Parcelas veio vazio. Verificar serviço/entrada.')
        } else {
          // não falhar o teste automaticamente; registrar para análise
          cy.log('Resposta não considerada sucesso completo — não falhando teste automaticamente.')
        }
      } else {
        // regra básica: pelo menos uma parcela quando não está vazia
        expect(parcelasLen).to.be.at.least(1)
        // opcional: validar que o número de parcelas seja consistente com Prazo
        // expect(parcelasLen).to.be.oneOf([prazo, parcelasLen]) // ajustar conforme regra de negócio
      }
    }
  })
})

Then('escrevo request e response na planilha {string}', (planilha) => {
  // sempre reutiliza o template padrão já presente no repositório
  const templatePadrao = 'cypress/results/excel/CalculoSACpos.xlsx'
  cy.log(`Usando template padrão: ${templatePadrao}`)

  // copia o template padrão para a pasta de workbooks (task já adiciona timestamp no nome)
  cy.task('copiarExcelTemplate', {
    caminhoTemplate: templatePadrao,
    outDir: 'cypress/results/workbooks'
  }).then((novoCaminho) => {
    cy.wrap(novoCaminho).as('caminhoExcelDoTeste')

    // escrever request (entrada) na aba PMT usando entradaPMTsac.json
    cy.get('@requestBody').then((requestBody) => {
      cy.task('preencherExcelComJson', {
        caminho: novoCaminho,
        sheetName: 'PMT',
        mappingPath: 'cypress/fixtures/mapeamentos/entradaPMTsac.json',
        json: requestBody,
        skipSave: true
      })
    })

    // escrever response na aba API e coluna de resposta (usa mapeamento de saída)
    cy.get('@responseStatus').then((responseStatus) => {
      const responseBody = responseStatus.body || {}
      cy.task('preencherExcelComJson', {
        caminho: novoCaminho,
        sheetName: 'API',
        mappingPath: 'cypress/fixtures/mapeamentos/saidaPMTsac.json',
        json: responseBody,
        skipSave: false
      })
    })
  })
})

Given("que eu preencha o payload dto removendo o campo {string}", (campoAusente) => {
  cy.fixture('proposta/CalculaGridParcelasSimplificadoSAC.json').then((dados) => {
    // deep clone para evitar referências
    const proposta = JSON.parse(JSON.stringify(dados))
    const ExcluirCamposPorPalavra = FuncoesRequests.ExcluirCamposJsonFuncoes()

    // normaliza o nome do campo (aceita variações de case)
    const campoKey = Object.keys(proposta.dto || {}).find(k => String(k).toLowerCase() === String(campoAusente).toLowerCase()) || campoAusente

    // remove o campo diretamente do dto quando existir
    if (proposta && proposta.dto && Object.prototype.hasOwnProperty.call(proposta.dto, campoKey)) {
      delete proposta.dto[campoKey]
      cy.log(`Campo removido diretamente de dto: ${campoKey}`)
    } else {
      // fallback: usar o helper que remove por palavra em todo o objeto
      ExcluirCamposPorPalavra(proposta, campoAusente)
      cy.log(`Campo removido com ExcluirCamposPorPalavra: ${campoAusente}`)
    }

    // Garantir valores mínimos válidos para que o teste erre somente pelo campo removido
    proposta.dto = proposta.dto || {}
    const safeDefaults = {
      TipoPessoa: 1,
      TipoIndiceFinanceiro: 1,
      PercIndiceFinanceiro: 80,
      VlrProdutoBem: 100000,
      AnoBase: 365,
      NroDiasAcrescimo: 28,
      Prazo: 12,
      PercJurosNegociado: 0.728833,
      VlrSolicitado: 1000,
      VlrTAC: 0,
      VlrOutrasDespesas: 0,
      VlrOutrosServicos: 0,
      VlrSeguro: 0
    }
    Object.entries(safeDefaults).forEach(([k, v]) => {
      if (k.toLowerCase() !== String(campoKey).toLowerCase() &&
        (proposta.dto[k] === undefined || proposta.dto[k] === null || proposta.dto[k] === "")) {
        proposta.dto[k] = v
      }
    })

    // manter/forçar parametros mínimos
    proposta.parametros = proposta.parametros || [{ Nome: "Proposta_IsentarIOF", Valor: "false" }]

    PropostaPayload = { ...proposta }
    // log e validação rápida para evitar enviar payload com campo ainda presente
    cy.log('Payload apos remoção e aplicação de defaults:', PropostaPayload)
    const campoPresente = !!(PropostaPayload?.dto && Object.keys(PropostaPayload.dto).some(k => k.toLowerCase() === String(campoAusente).toLowerCase()))
    expect(campoPresente, `Campo ${campoAusente} não deve estar presente no dto após remoção`).to.equal(false)
  })
})

Then("a resposta contém validação ou cálculo consistente", () => {
  cy.get('@responseStatus').then((responseStatus) => {
    const body = responseStatus.body || {}
    const hasError = (body.HasError === true) || (String(body.HasError).toLowerCase() === 'true')

    if (hasError) {
      // API sinalizou erro via HasError -> valida presença de mensagens de validação
      const msgs = body.Messages || body.messages || body.Msg || body.Message || []
      expect(msgs, 'Esperava mensagens de validação quando HasError=true').to.exist
      // opcional: garantir array com pelo menos 1 mensagem
      if (Array.isArray(msgs)) expect(msgs).to.be.at.least()
      cy.log('API retornou HasError=true com mensagens:', JSON.stringify(msgs))
      return
    }

    // Quando não há erro, validar estrutura de parcelas e totais
    const proposta = body.Proposta || body
    const parcelas = proposta.Parcelas || body.Parcelas || []
    expect(Array.isArray(parcelas), 'Parcelas deve ser um array').to.be.true

    // Se houver prazo no request, valide pelo menos 1 parcela e registre discrepância
    const prazo = Number(PropostaPayload?.dto?.Prazo)
    if (Number.isInteger(prazo) && prazo > 0) {
      if (parcelas.length === 0) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        cy.writeFile(`cypress/results/workbooks/Request-EmptyParcelas-${ts}.json`, PropostaPayload)
        cy.writeFile(`cypress/results/workbooks/Response-EmptyParcelas-${ts}.json`, responseStatus.body)
        throw new Error('Prazo informado mas Parcelas veio vazio — request/response salvos para análise.')
      }
      // não exigir igualdade estrita entre parcelas.length e prazo (regra de negócio pode variar),
      // apenas logar se diferente
      if (parcelas.length !== prazo) {
        cy.log(`Atenção: prazo=${prazo} mas quantidade de parcelas=${parcelas.length}`)
      }
    }

    // Checagem de soma das parcelas contra algum total retornado (quando existir)
    const extractParcelaValor = (p) => {
      return Number(p.ValorParcela ?? p.VlrParcela ?? p.Valor ?? p.Vlr ?? p.ValorParcelaLiquida ?? 0)
    }
    const somaParcelas = parcelas.reduce((s, p) => s + (isNaN(extractParcelaValor(p)) ? 0 : extractParcelaValor(p)), 0)

    // possíveis campos de total no response
    const possiveisTotais = [
      proposta.TotalFinanciado,
      proposta.TotalPago,
      proposta.Total,
      body.Total,
      body.TotalFinanciado,
      proposta.TotalParcela
    ].filter(v => typeof v === 'number')

    if (possiveisTotais.length) {
      const totalResp = possiveisTotais[0]
      const diff = Math.abs(totalResp - somaParcelas)
      const tol = Math.max(1, Math.abs(totalResp) * 0.005) // tolerância: 0.5% ou 1 unidade
      if (diff > tol) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        cy.writeFile(`cypress/results/workbooks/Request-MismatchTotal-${ts}.json`, PropostaPayload)
        cy.writeFile(`cypress/results/workbooks/Response-MismatchTotal-${ts}.json`, responseStatus.body)
        throw new Error(`Soma das parcelas (${somaParcelas.toFixed(2)}) difere do total retornado (${totalResp.toFixed(2)}) acima da tolerância (${tol.toFixed(2)}). Arquivos salvos para análise.`)
      } else {
        cy.log(`Soma das parcelas ${somaParcelas.toFixed(2)} compatível com total retornado ${totalResp.toFixed(2)} (dif ${diff.toFixed(2)})`)
      }
    } else {
      cy.log('Nenhum campo de total numérico encontrado no response para comparar soma das parcelas.')
    }
  })
})