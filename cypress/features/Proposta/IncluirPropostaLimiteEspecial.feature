Feature: Teste automatizado para inclusao da proposta do Limite Especial.

    # ============================
    # SUCESSO - Proposta Limite Especial
    # ============================
    @IncluirPropostaLimiteEspecial @Success
    Scenario Outline: Incluir proposta limite especial
        Given que eu preencha o payload dto da proposta limite especial com:
            | PropostaDTO.VlrSolicitado                                 | 840105.59      |
            | PropostaDTO.VlrTAC                                        | 15020.81       |
            | PropostaDTO.VlrOutrasDespesas                             | 180.10         |
            | PropostaDTO.VlrOutrosServicos                             | 100.63         |
            | PropostaDTO.DtPrimeiroVencto                              | 2026-08-14     |
            | PropostaDTO.DtInclusao                                    | 2026-08-01     |
            | PropostaDTO.DocumentoCliente                              | <PDocFedCli>   |
            | PropostaDTO.PercJurosMensal                               | 1              |
            | PropostaDTO.IdTransacao                                   | {{$guid}}      |
            | PropostaDTO.CodigoOperacao                                | {{$guid}}      |
            | PropostaDTO.PropostaContaPagamentoDTO.NumeroBanco         | <PCPNrBnc>     |
            | PropostaDTO.PropostaContaPagamentoDTO.TipoConta           | <PCPTpCnt>     |
            | PropostaDTO.PropostaContaPagamentoDTO.Agencia             | <PCPAg>        |
            | PropostaDTO.PropostaContaPagamentoDTO.AgenciaDig          | <PCPAgDig>     |
            | PropostaDTO.PropostaContaPagamentoDTO.Conta               | <PCPConta>     |
            | PropostaDTO.PropostaContaPagamentoDTO.ContaDig            | <PCPContDig>   |
            | PropostaDTO.PropostaLancamentoDTO.CampoID                 | <PLCpID>       |
            | PropostaDTO.PropostaLancamentoDTO.VlrTransacao            | <PLVlrTr>      |
            | PropostaDTO.PropostaLancamentoDTO.NumeroBanco             | <PLNrBnc>      |
            | PropostaDTO.PropostaLancamentoDTO.TipoConta               | <PLTpCont>     |
            | PropostaDTO.PropostaLancamentoDTO.Agencia                 | <PLTpAg>       |
            | PropostaDTO.PropostaLancamentoDTO.AgenciaDig              | <PLTpAgDig>    |
            | PropostaDTO.PropostaLancamentoDTO.Conta                   | <PLCont>       |
            | PropostaDTO.PropostaLancamentoDTO.ContaDig                | <PLContDig>    |
            | PropostaDTO.PropostaLancamentoDTO.NomePagamento           | <PLNomePag>    |
            | PropostaDTO.PropostaLancamentoDTO.DocumentoFederal        | <PLDocFed>     |
            | PropostaDTO.PropostaLancamentoDTO.DocumentoFederalCedente | <PLDocFedCed>  |
            | PropostaDTO.PropostaLancamentoDTO.NomeCedente             | <PLNomeCed>    |
            | ParceiroDTO.CNPJ                                          | 05277654000180 |
        When eu envio uma requisição POST para o cadastro de uma proposta limite especial
        Then recebo status 200

        # Examples for: Incluir proposta - varia PIX e Conta Pagamento
        Examples: Varia PIX e Conta Pagamento
            | PCPNrBnc | PCPTpCnt | PCPAg | PCPAgDig | PCPConta     | PCPContDig | PLCpID   | PLVlrTr  | PLNrBnc | PLTpCont | PLTpAg | PLTpAgDig | PLCont   | PLContDig | PLNomePag | PLDocFed         | PLDocFedCed          | PLNomeCed            | CodigoBanco | Conta    | TipoConta | Agencia | AgenciaDig | ContaDig | NumeroBanco | DocumentoFederalPagamento | NomePagamento |
            | 531      | 1        | 0005  | 2        | 613754177034 | 1          | LE2      | 100.00   | 747     | 1        | 9891   | 5         | 87654321 | 0         | PAGAMENTO | 118.622.010-48   | 38.862.103/0001-33   | TESTE LOJA ARIANE    | 001         | 12345678 | 1         | 9891    | 5          | 1        | 747         | 60.317.935/0001-28        | PAGAMENTO     |