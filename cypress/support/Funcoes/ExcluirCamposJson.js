function ExcluirCamposPorPalavra(objeto, palavraChave) {
    for (let chave in objeto) {

      if (chave.includes(palavraChave)) {
        delete objeto[chave]; 
      } else if (typeof objeto[chave] === "object" && objeto[chave] !== null) {

        ExcluirCamposPorPalavra(objeto[chave], palavraChave);
      }
    }
  }
  export default ExcluirCamposPorPalavra