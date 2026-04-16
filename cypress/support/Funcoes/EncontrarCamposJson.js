function EncontrarCamposJson(objeto, palavraChave) {
  for (let chave in objeto) {

    if (chave.includes(palavraChave)) {
      return objeto[chave];
    }

    if (typeof objeto[chave] === "object" && objeto[chave] !== null) {
      const result = EncontrarCamposJson(objeto[chave], palavraChave);

      if (result !== undefined) {
        return result;
      }
    }
  }
}

export default EncontrarCamposJson;
