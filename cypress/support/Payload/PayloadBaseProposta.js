export const propostaBase = {
  dto: {
    // identificação
    DocumentoCliente: null,
    DocumentoParceiroCorrespondente: null,
    CodigoOperacao: null,
    TipoContrato: null,
    
    // índices (padronizado)
    TipoIndiceFinanceiro: null,
    PercIndiceFinanceiro: null,

    // versão / contrato
    CodigoVersaoCCB: null,
    NumeroCCB: null,

    // controle
    AnoBase: null,
    NroDiasIntervaloPrazo: null,
    NroDiasAcrescimo: null,
    FluxoIrregular: null,

    // valores
    VlrSolicitado: null,
    Prazo: null,
    PercJurosNegociado: null,
    VlrIOF: null,
    PercIOF: null,
    PercIOFAdicional: null,
    VlrParcela: null,
    VlrBoleto: null,
    VlrTAC: null,

    // produto
    VlrProdutoBem: null,
    VlrEntrada: null,
    VlrEntradaTradeIn: null,
    VlrEntradaParcelada: null,
    VlrDespesasAF: null,

    // adicionais
    VlrOutrasDespesas: null,
    VlrOutrosServicos: null,
    VlrSeguro: null,
    VlrCorban: null,
    VlrAvaliacao: null,
    VlrDespachante: null,
    VlrRegistro: null,
    VlrServTerceiro: null,
    VlrRegistroCartorio: null,
    VlrTxAdmMensal: null,

    // retenção
    PercRetencao: null,
    VlrRetencao: null,

    // extras
    VlrBlindagem: null,
    VlrAcessorios: null,
    VlrVistoria: null,
    VlrCertiDocs: null,

    // seguros
    VlrSeguroMensal1: null,
    PercSeguroMensal1: null,
    VlrSeguroMensal2: null,
    PercSeguroMensal2: null,

    // datas
    DtPrimeiroVencto: null,
    ObservacoesVendedor: null,

    // cálculo (proposta normal)
    CalculoProposta: {
      PropostaModelo: null,
      DadosCalculo: {
        PmtDesejada: null,
        Prazo: null,
        percJurosNegociado: null,
        VlrParcela: null,
        VlrSolicitado: null,
        VlrTAC: null,
        DtPrimVencimento: null,
        TipoPessoa: null,
        DtContratacao: null,
      }
    },

    // pagamento por pix (opcional)
    PropostaPIXPagamentoDTO: {
      ChavePIX: null,
    },

    // pagamento por conta (opcional)
    PropostaContaPagamentoDTO: {
      CodigoBanco: null,
      NumeroBanco: null,
      TipoConta: null,
      Agencia: null,
      AgenciaDig: null,
      Conta: null,
      ContaDig: null,
      DocumentoFederalPagamento: null,
      NomePagamento: null,
    },

    // padrão
    PropostaLancamentos: [
      {
        CampoID: null,
        VlrTransacao: null,
        CodigoBanco: null,
        NumeroBanco: null,
        TipoConta: null,
        Agencia: null,
        AgenciaDig: null,
        Conta: null,
        ContaDig: null,
        DocumentoFederal: null,
        NomePagamento: null,
        DocumentoFederalCedente: null,
        NomeCedente: null,
        DtPagamento: null,
        LinhaDigitavel: null,
      }
    ]
  }
}