const { defineConfig } = require('cypress')
const cucumber = require('cypress-cucumber-preprocessor').default
const pg = require('pg')
const fs = require('fs')

module.exports = defineConfig({
  modifyObstructiveCode: true,
  projectId: 'test-master',
  viewportWidth: 1300,
  viewportHeight: 720,
  chromeWebSecurity: false,
  watchForFileChanges: false,
  defaultCommandTimeout: 20000,
  requestTimeout: 50000,
  retries: { runMode: 1 },
  env: {
    baseUrl: `https://bmpteste.moneyp.com.br/api`,
    baseUrlLocal: `http://localhost:52576/api`,
    baseURLreports: `https://reports.moneyp.dev.br`
  },
  e2e: {
    setupNodeEvents(on, config) {
      if (config.isTextTerminal) console.log('Running in terminal mode!')
      on('before:run', () => console.log("Cypress Started"))
      on('before:spec', (spec) => console.log("Running... " + spec.fileName))

      // lazy-require excelUtils (usado para outras tasks)
      let excelTasksModule = null
      let writeResponseColumn = null
      try {
        excelTasksModule = require('./cypress/plugins/excelUtils')
        writeResponseColumn = excelTasksModule.writeResponseColumn
      } catch (e) {
        console.error('[cypress.config] falha ao carregar ./cypress/plugins/excelUtils:', e && e.message)
        throw e
      }

      // tenta registrar tasks do excelPMTapi (se disponível). Se falhar, registra fallback mínimo.
      try {
        const excelPMTapi = require('./cypress/plugins/excelPMTapi')
        if (!global.__excelTasksRegistered && typeof excelPMTapi.registerExcelTasks === 'function') {
          excelPMTapi.registerExcelTasks(on)
          global.__excelTasksRegistered = true
          console.log('[cypress.config] registerExcelTasks executed')
        } else if (!global.__excelTasksRegistered && excelPMTapi && excelPMTapi._internal && typeof excelPMTapi._internal.compareColsRange === 'function') {
          on('task', { 'excel:compareCols'(args) { return excelPMTapi._internal.compareColsRange(args) } })
          global.__excelTasksRegistered = true
          console.log('[cypress.config] fallback registered excel:compareCols via _internal.compareColsRange')
        } else {
          console.log('[cypress.config] excel tasks already registered or registerExcelTasks missing')
        }
      } catch (e) {
        console.warn('[cypress.config] erro ao carregar excelPMTapi:', e && e.message)
      }

      // registra demais tasks (não-excel)
      on('task', {
        dbQuery({ dbConfig, query }) { const client = new pg.Pool(dbConfig); return client.query(query) },
        print(s) { console.log(s); return null },
        warn(message) { console.warn(message); return null },
        copiarExcelTemplate({ caminhoTemplate, outDir }) { return excelTasksModule.copyFileUnique(caminhoTemplate, outDir) },
        preencherExcelComJson(args) { return excelTasksModule.writeExcel(args) },
        compararExcel(args) { return excelTasksModule.compareExcel(args) },
        preencherRespostaNaPlanilha(args) { return writeResponseColumn ? writeResponseColumn(args) : excelTasksModule.writeResponseColumn(args) },
        expandMapping({ mappingArray, json }) { return excelTasksModule.expandMappingArray(mappingArray, json) },
        compararPorMapping(args) { return excelTasksModule.compareUsingMapping(args) },
        salvarWorkbook({ caminho }) { return excelTasksModule.salvarWorkbook(caminho) },
        compararRangePlanilhas(params) { return excelTasksModule.compareRangeSheets(params) }
      })

      on('file:preprocessor', cucumber())
      config.accessToken = process.env.accessToken
      return config
    },
    supportFile: 'cypress/support/e2e.js',
    baseUrl: `https://bmpteste.moneyp.com.br/api`,
    specPattern: ['cypress/features/**/*.feature'],
    experimentalRunAllSpecs: true
  },
})