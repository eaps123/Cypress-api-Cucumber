function gerarNomeAleatorio() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // Inclui letras maiúsculas e minúsculas
  let nome = '';
  for (let i = 0; i < 5; i++) {
    const indiceAleatorio = Math.floor(Math.random() * letras.length);
    nome += letras[indiceAleatorio];
  }
  return nome;
}
export default gerarNomeAleatorio;
// Teste da função
console.log(gerarNomeAleatorio());
