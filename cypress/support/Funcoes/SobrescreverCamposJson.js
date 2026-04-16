function SobrescreverCamposJson(objeto, palavraChave, novoValor) {
    for (let chave in objeto) {

      if (chave.includes(palavraChave)) {
        objeto[chave] = novoValor; 
      }

      if (typeof objeto[chave] === "object" && objeto[chave] !== null) {
        SobrescreverCamposJson(objeto[chave], palavraChave, novoValor);
      }
    }
  }
  export default SobrescreverCamposJson