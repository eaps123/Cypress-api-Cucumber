function SalvarJsonUnicoComParametros(parametros, conteudo){

    function formatObjectToString(obj) {
        return Object.entries(obj)
            .map(([key, value]) => `${key} - ${value}`)
            .join(', ');
    }

const resultado = formatObjectToString(parametros);
console.log(resultado); // "Modalide - tela, Desconto - true, Descap - false"

cy.writeFile(`cypress/evidencias/Resultado da requisicao com os parametros ${resultado}.json`, conteudo); 

//resultado = {}

}
export default SalvarJsonUnicoComParametros