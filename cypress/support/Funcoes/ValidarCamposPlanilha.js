/**
 * Valida os campos da planilha contra o JSON do requestBody
 * @param {Object} requestBody - JSON com os dados esperados
 * @param {Object} excelData - Dados extraídos da planilha
 */
function validarCamposPlanilha(requestBody, excelData) {
  const campos = Object.keys(requestBody)

  campos.forEach((campo) => {
    const esperado = requestBody[campo]
    const atual = excelData[campo]

    cy.log(`🔍 Validando campo: ${campo}`)
    cy.log(`📄 Planilha: ${atual} | 🧾 JSON: ${esperado}`)

    expect(atual).to.equal(esperado, `Campo ${campo} não corresponde`)
  })
}
