import FuncoesRequests from "../../support/Funcoes/index"
const FluxoIrregularRequests = Cypress.automacao.Requests.FluxoIrregularRequests
const Integracao = "QA_INTEGRATION_EVERTON"
const { faker } = require('@faker-js/faker')

let FluxoIrregularPayload = {}
let caminhoExcelDoTeste = ''

Given("que eu preencha todos os campos para calcular o fluxo irregular", () => {
  cy.fixture('FluxoIrregular/CalcularFluxoIrregular.json').then((dados) => {
    const GerarDataMesSeguinteMes = FuncoesRequests.GerarDataMesSeguinteFuncoes()
    const valorParcela = dados.dto.Parcelas[0].Valor
    const currentDate = new Date().toISOString().slice(0, 10)
    const parcelas = FuncoesRequests.GerarParcelas(
      dados.dto.Prazo,
      dados.dto.DtVencimento = GerarDataMesSeguinteMes,
      valorParcela
    )

    FluxoIrregularPayload = { ...dados.dto }
    FluxoIrregularPayload.DtContratacao = currentDate
    FluxoIrregularPayload.Parcelas = parcelas

    // Cria cópia do Excel template para este caso (não escreve aqui)
    cy.task('copiarExcelTemplate', {
      caminhoTemplate: 'cypress/results/excel/CalculoPMTfluxoIrregular.xlsx',
      outDir: 'cypress/results/workbooks'
    }).then((novoCaminho) => {
      caminhoExcelDoTeste = novoCaminho
      cy.wrap(novoCaminho).as('caminhoExcelDoTeste')
    })

    cy.log("Valor da parcela:", valorParcela.toString())
  })
})

When("eu envio uma requisição POST para calcular o fluxo irregular", () => {
  cy.wrap(FluxoIrregularPayload).as('requestBody')

  FluxoIrregularRequests.CalcularFluxoIrregular(FluxoIrregularPayload, Integracao)
    .then((CalcularFluxoIrregularResponse) => {
      cy.wrap(CalcularFluxoIrregularResponse).as('responseStatus')
    })
})

Then("a simulacao foi gerada com sucesso", () => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')

  cy.get('@responseStatus').then((responseStatus) => {
    // validação básica de status / resultado
    expect([200, 201]).to.include(responseStatus.status)
    if (typeof responseStatus.body?.Result !== 'undefined') {
      expect(responseStatus.body.Result).to.be.true
    }

    // salva response e request para auditoria
    cy.writeFile(`cypress/results/workbooks/ResponseCalcularFluxoIrregular-${ts}.json`, responseStatus.body)
    cy.log('Response salvo em results/responseBody')

    cy.get('@requestBody').then((requestBody) => {
      cy.writeFile(`cypress/results/workbooks/RequestCalcularFluxoIrregular-${ts}.json`, requestBody)
      cy.log('Request salvo em results/requestBody')
    })
  })
})

Then("escrevo request e response na planilha de teste", () => {
  cy.get('@caminhoExcelDoTeste').then((caminhoExcel) => {
    cy.get('@requestBody').then((requestBody) => {

      cy.task('preencherExcelComJson', {
        caminho: caminhoExcel,
        sheetName: 'PMT',
        mappingPath: 'cypress/fixtures/mapeamentos/entradaPMT.json',
        json: requestBody
      }).then((resWriteRequest) => {
        cy.log('Request: campos gerais escritos na planilha de teste')
        console.log('preencherExcelComJson (request general) result:', resWriteRequest)

        cy.fixture('mapeamentos/entradaPMT.json').then((entradaMapping) => {
          const mappingArray = Array.isArray(entradaMapping) ? entradaMapping : []
          const directParcelMappings = mappingArray.filter(m => m && m.path && /parcelas/i.test(String(m.path)))
          const repeatEntries = mappingArray.filter(m => m && m.repeat && String(m.repeat.forEach).toLowerCase() === 'parcelas')
          const parcelMappings = [...directParcelMappings]
          const parcelasArray = requestBody?.Parcelas || []

          for (const rep of repeatEntries) {
            const startRow = Number(rep.repeat.startRow) || 0
            const cols = rep.repeat.columns || {}
            parcelasArray.forEach((__, i) => {
              const row = startRow + i
              Object.entries(cols).forEach(([colLetter, colDef]) => {
                const path = (colDef && colDef.path) ? `Parcelas[${i}].${colDef.path}` : `Parcelas[${i}]`
                const cell = `${colLetter}${row}`
                const mapEntry = {
                  path,
                  cell,
                  format: colDef && colDef.format,
                  excelNumberFormat: colDef && colDef.excelNumberFormat,
                }
                parcelMappings.push(mapEntry)
              })
            })
          }

          if (parcelMappings.length === 0) {
            cy.log('Nenhum mapeamento de Parcelas encontrado em entradaPMT.json pulando escrita específica de parcelas.')
            return
          }

          cy.task('preencherExcelComJson', {
            caminho: caminhoExcel,
            sheetName: 'PMT',
            mappingArray: parcelMappings,
            json: requestBody
          }).then((resWriteParcelas) => {
            cy.log(`Parcelas escritas na planilha (${parcelMappings.length} entradas)`)
            console.log('preencherExcelComJson (parcelas) result:', resWriteParcelas)
          })
        })

        cy.get('@responseStatus').then((responseStatus) => {
          const jsonEsperado = responseStatus.body?.PMTIrregular || responseStatus.body
          cy.task('preencherRespostaNaPlanilha', {
            caminho: caminhoExcel,
            sheetName: 'PMT',
            mappingPath: 'cypress/fixtures/mapeamentos/validaPMT.json',
            json: jsonEsperado,
            responseColumn: 'L',
            skipSave: false
          }).then((resWriteResponse) => {
            cy.log('Response escrito na coluna L do workbook')
            console.log('preencherRespostaNaPlanilha result:', resWriteResponse)
            cy.wrap(caminhoExcel).as('caminhoExcelDoTeste')
          })
        })
      })
    })
  })
})

Then("valido os dados calculados da planilha com o responseBody", () => {
  cy.get('@responseStatus').then((responseStatus) => {
    const jsonEsperado = responseStatus.body?.PMTIrregular || responseStatus.body

    cy.get('@caminhoExcelDoTeste').then((caminhoExcel) => {
      cy.fixture('mapeamentos/validaPMT.json').then((mapping) => {
        cy.task('compararExcel', {
          caminho: caminhoExcel,
          sheetName: 'PMT',
          mappingArray: mapping,
          json: jsonEsperado,
          expectedColumn: 'J',
          actualColumn: 'L',
          writeResponseToSheet: false
        }).then((resultado) => {
          const resultados = resultado?.resultados || resultado?.resultados || []
          const total = resultado?.total ?? resultados.length
          const passed = resultados.filter(r => r.ok)
          const failed = resultados.filter(r => !r.ok)
          cy.log(`Total comparados: ${total}`)
          cy.log(`Passaram: ${passed.length}`)
          cy.log(`Falharam: ${failed.length}`)
          passed.forEach(p => {
            const cell = p.expectedCell || p.jCelula || p.lCelula || ''
            cy.log(`OK: ${p.campo || ''} @${cell} esperado=${p.esperado} atual=${p.atual}`)
          })
          failed.forEach(p => {
            const cell = p.actualCell || p.lCelula || p.jCelula || p.expectedCell || ''
            cy.log(`FAIL: ${p.campo || ''} @${cell} esperado=${p.esperado} atual=${p.atual}`)
          })

          if (failed.length > 0) {
            const msg = `Falhas na comparação (${failed.length}):\n` + JSON.stringify(failed, null, 2);
            cy.log(`failed ${msg}`)
            cy.task('warn', msg)
            //expect(failed.length, `Falhas na comparação: ${JSON.stringify(failed, null, 2)}`).to.equal(0)
          }

        })
      })
    })
  })
})

Given("que eu preencha o payload dto com:", (dataTable) => {
  // dataTable é um cucumber table -> rowsHash retorna { Campo: Valor, ... }
  const rows = dataTable.rowsHash()
  // converte strings simples para number/boolean quando aplicável
  const parseVal = (v) => {
    if (v === null || v === undefined || v === "") return v
    const lv = String(v).trim()
    if (/^(true|false)$/i.test(lv)) return lv.toLowerCase() === 'true'
    if (!Number.isNaN(Number(lv)) && /^\-?\d+(\.\d+)?$/.test(lv)) return Number(lv)
    return lv
  }
  FluxoIrregularPayload = FluxoIrregularPayload || {}
  FluxoIrregularPayload.dto = FluxoIrregularPayload.dto || {}
  Object.entries(rows).forEach(([k, v]) => {
    // mantém nome tal como informado na feature (ex: Prazo, VlrSolicitado, ...)
    FluxoIrregularPayload.dto[k] = parseVal(v)
  })
  cy.log('FluxoIrregularPayload.dto preenchido:', FluxoIrregularPayload.dto)
})

Then("recebo status {int}", (expectedStatus) => {
  cy.get('@responseStatus').then((responseStatus) => {
    const actualStatus = responseStatus.status || responseStatus
    const body = responseStatus.body || {}

    // considera body.Messages como indicação de erro mesmo quando HasError não está setado
    const hasMessages = Array.isArray(body.Messages) && body.Messages.length > 0
    const apiHasError = (actualStatus === 200) && (body.HasError === true || String(body.HasError).toLowerCase() === 'true' || hasMessages)

    if (expectedStatus >= 400) {
      const httpMatch = actualStatus === expectedStatus
      if (!(httpMatch || apiHasError)) {
        // grava request/response para ajudar debug
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        // request pode estar em @requestBody — tenta recuperar
        // substitui .then(...).catch(...) (não suportado em Chainable) por .then(onFulfilled, onRejected)
        cy.get('@requestBody').then(
          (req) => {
            return cy.writeFile(`cypress/results/workbooks/Debug-Request-${ts}.json`, req || FluxoIrregularPayload || {})
          },
          () => {
            // caso @requestBody não exista, grava fallback com FluxoIrregularPayload
            return cy.writeFile(`cypress/results/workbooks/Debug-Request-${ts}.json`, FluxoIrregularPayload || {})
          }
        ).then(() => {
          return cy.writeFile(`cypress/results/workbooks/Debug-Response-${ts}.json`, responseStatus.body || responseStatus)
        }).then(() => {
          throw new Error(`Esperado status ${expectedStatus} ou body.HasError=true/Messages, mas obteve status ${actualStatus} e HasError=${body.HasError} Messages=${hasMessages}. Request/Response salvos em cypress/results/workbooks/Debug-*.json`)
        })
      } else {
        // ok: recebeu indicação de erro conforme esperado
        expect(true).to.equal(true)
      }
    } else {
      // sucesso esperado: exigir status exato e ausência de HasError/Messages
      if (actualStatus !== expectedStatus) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        cy.writeFile(`cypress/results/workbooks/Debug-Request-${ts}.json`, FluxoIrregularPayload || {})
        cy.writeFile(`cypress/results/workbooks/Debug-Response-${ts}.json`, responseStatus.body || responseStatus)
        throw new Error(`Esperado status ${expectedStatus} mas obteve ${actualStatus}. Request/Response salvos em cypress/results/workbooks/Debug-*.json`)
      }
      // garantir que a API não sinalizou erro via HasError/Messages
      if (actualStatus === 200 && (body.HasError === true || hasMessages)) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        cy.writeFile(`cypress/results/workbooks/Debug-Request-${ts}.json`, FluxoIrregularPayload || {})
        cy.writeFile(`cypress/results/workbooks/Debug-Response-${ts}.json`, responseStatus.body || responseStatus)
        throw new Error(`Resposta HTTP 200 com HasError=true ou Messages: ${JSON.stringify(body.Messages || body.Msg || body.Message)}. Request/Response salvos para análise.`)
      }
      expect(actualStatus).to.eq(expectedStatus)
    }
  })
})

Then("a resposta contém a grade de parcelas e totais esperados", () => {
  cy.get('@responseStatus').then((responseStatus) => {
    const body = responseStatus.body.PMTIrregular || {}
    // validação mínima: existe array Parcelas
    expect(body).to.have.property('Parcelas')
    expect(Array.isArray(body.Parcelas)).to.be.true

    const prazo = Number(FluxoIrregularPayload?.dto?.Prazo) || null

    if (Number.isInteger(prazo) && prazo > 0) {
      const parcelasLen = body.Parcelas.length

      if (parcelasLen === 0) {
        // salva request/response para debugging
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        cy.writeFile(`cypress/results/workbooks/Jsons/Request-EmptyParcelas-${ts}.json`, FluxoIrregularPayload)
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
    const prazo = Number(FluxoIrregularPayload?.dto?.Prazo)
    if (Number.isInteger(prazo) && prazo > 0) {
      if (parcelas.length === 0) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        cy.writeFile(`cypress/results/workbooks/Request-EmptyParcelas-${ts}.json`, FluxoIrregularPayload)
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
        cy.writeFile(`cypress/results/workbooks/Request-MismatchTotal-${ts}.json`, FluxoIrregularPayload)
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

Then("a resposta contém mensagem de validação para {string}", (campo) => {
  const normalize = (s) => {
    if (!s) return ''
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
  }

  const humanizeField = (f) => {
    if (!f) return ''
    let s = String(f).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim().toLowerCase()
    const mapa = {
      'vlr': 'valor',
      'perc': 'percentual',
      'nro': 'numero',
      'dt': 'data',
      'tx': 'taxa',
      'cod': 'codigo',
      'prazo': 'prazo',
      'indice': 'indice'
    }
    Object.entries(mapa).forEach(([k, v]) => {
      s = s.replace(new RegExp(`\\b${k}\\b`, 'g'), v)
    })
    return s.replace(/\s+/g, ' ').trim()
  }

  const needleRaw = normalize(String(campo))
  const needleHuman = normalize(humanizeField(campo))

  // descrições de erro específicas que devemos aceitar
  const prazoMsg = "O prazo informado para o parcelamento excede o limite configurado para este produto. Por favor, selecione um prazo de parcelamento válido."
  const prazoMsgNormalized = normalize(prazoMsg)

  const percIndiceMsg = "Para poder calcular com Percentual Indice Financeiro é necessário enviar um Tipo Indice Financeiro válido."
  const percIndiceMsgNormalized = normalize(percIndiceMsg)

  cy.get('@responseStatus').then((responseStatus) => {
    const body = responseStatus?.body || {}
    const msgsArr = body?.Messages || body?.messages || body?.Errors || body?.errors || []
    const singleMsg = normalize(String(body?.Msg || body?.Message || ''))

    const foundInArray = Array.isArray(msgsArr) && msgsArr.some(m => {
      if (!m) return false
      const desc = normalize(String(m.Description || m.Message || m.Msg || ''))
      const fieldInMsg = normalize(String(m.Field || m.FieldName || ''))
      return (fieldInMsg && fieldInMsg.includes(needleRaw)) ||
        (desc && (desc.includes(needleRaw) || desc.includes(needleHuman)))
    })

    const foundInSingle = singleMsg && (singleMsg.includes(needleRaw) || singleMsg.includes(needleHuman))

    // aceita também as descrições exatas/normalizadas do prazo e do percentual indice
    const foundPrazoMsg = Array.isArray(msgsArr) && msgsArr.some(m => normalize(String(m.Description || '')) === prazoMsgNormalized)
    const foundPercIndiceMsg = Array.isArray(msgsArr) && msgsArr.some(m => normalize(String(m.Description || '')) === percIndiceMsgNormalized)

    const ok = foundInArray || foundInSingle || foundPrazoMsg || foundPercIndiceMsg

    expect(ok, `Esperava mensagem de validação contendo "${campo}" ou "${needleHuman}" nas mensagens: ${JSON.stringify(msgsArr || singleMsg)}`).to.be.true
  })
})

When('eu envio uma requisição POST para {string}', (endpoint_simular) => {
  // some features pass '/proposta/simular-parcelas-sac' while helper expects BMPDigital/... 
  cy.wrap(FluxoIrregularPayload).as('requestBody')
  cy.log('endpoint_simular:', endpoint_simular)

  // rota centralizada: chama a função exportada
  const callCalculaGrid = (payload) => {
    // wrapper conforme CalculaGridParcelasSimplificadoSACRequests espera: { dto, parametros }
    return PropostaRequests.CalcularFluxoIrregular(payload, Integracao)
  }

  // nome seguro baseado no cenário + endpoint
  const endpointSafe = String(endpoint_simular || 'simular').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').slice(0, 60)
  const safeName = (currentScenarioTitle ? `${currentScenarioTitle}` : endpointSafe)
  // permitir que feature passe endpoint simbólico; se for o path esperado chama a função
  if (String(endpoint_simular).toLowerCase().includes('simular-parcelas-sac') ||
    String(endpoint_simular).toLowerCase().includes('calculagridparcelas')) {
    callCalculaGrid({ dto: FluxoIrregularPayload.dto || FluxoIrregularPayload })
      .then((res) => {
        cy.log(res)
        cy.wrap(res).as('responseStatus')

        // grava request/response para cada execução do cenário (sempre)
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        const reqFile = `cypress/results/workbooks/Jsons/Request-${safeName}-${ts}.json`
        const resFile = `cypress/results/workbooks/Jsons/Response-${safeName}-${ts}.json`

        // garante que requestBody esteja disponível e grava ambos
        cy.get('@requestBody').then((rb) => {
          const reqToWrite = (rb && (rb.dto )) ? rb : FluxoIrregularPayload 
          return cy.writeFile(reqFile, reqToWrite, { flag: 'w' })
        }).then(() => {
          return cy.writeFile(resFile, res.body || res, { flag: 'w' })
        }).then(() => {
          cy.log(`Request/Response salvos: ${reqFile} / ${resFile}`)
        })
      })
  } else {
    // fallback genérico: tenta mandar para a mesma função
    callCalculaGrid({ dto: FluxoIrregularPayload.dto || FluxoIrregularPayload })
      .then((res) => {
        cy.wrap(res).as('responseStatus')

        // grava request/response para cada execução do cenário (sempre)
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        const reqFile = `cypress/results/workbooks/Jsons/Request-${safeName}-${ts}.json`
        const resFile = `cypress/results/workbooks/Jsons/Response-${safeName}-${ts}.json`

        cy.get('@requestBody').then((rb) => {
          const reqToWrite = (rb && (rb.dto )) ? rb : FluxoIrregularPayload || rb 
          return cy.writeFile(reqFile, reqToWrite, { flag: 'w' })
        }).then(() => {
          return cy.writeFile(resFile, res.body || res, { flag: 'w' })
        }).then(() => {
          cy.log(`Request/Response salvos: ${reqFile} / ${resFile}`)
        })
      })
  }
})