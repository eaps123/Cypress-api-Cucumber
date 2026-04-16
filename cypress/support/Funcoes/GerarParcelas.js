
function GerarParcelas(prazo, dataInicial, valorParcela) {
    const parcelas = []
    const data = new Date(dataInicial)

    for (let i = 1; i <= prazo; i++) {
        const vencimento = new Date(data)
        vencimento.setMonth(data.getMonth() + i - 1)
        const parcela = {
            NroParcela: i,
            DtVencimento: vencimento.toISOString().split('T')[0] + "T00:00:00",
            Valor: i === prazo ? 0 : valorParcela // valor 0 na última parcela
        }
        parcelas.push(parcela)
        console.log(parcelas);
    }
    return parcelas
}

export default GerarParcelas;