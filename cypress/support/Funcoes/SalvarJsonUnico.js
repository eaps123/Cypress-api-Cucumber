function SalvarJsonUnico(nomeArquivo, conteudo){


  cy.writeFile(`cypress/evidencias/${nomeArquivo}.json`, conteudo); 


}
export default SalvarJsonUnico