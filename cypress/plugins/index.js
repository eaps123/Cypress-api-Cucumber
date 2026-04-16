const { writeExcel, compareExcel, copyFileUnique, writeResponseColumn } = require('./excelUtils');

module.exports = (on, config) => {
  on('task', {
    copiarExcelTemplate({ caminhoTemplate, outDir }) {
      const novoCaminho = copyFileUnique(caminhoTemplate, outDir)
      return novoCaminho;
    },

    preencherExcelComJson(args) {
      return writeExcel(args)
    },

    // escreve os valores do response na coluna de resposta (ex: 'L') usando mapping transformado
    preencherRespostaNaPlanilha(args) {
      return writeResponseColumn(args);
    },

    compararExcel(args) {
      return compareExcel(args)
    },
  })

  return config
}
