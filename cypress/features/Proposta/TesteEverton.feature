Feature: Testes automatizados para criação de uma Proposta. As propostas geradas por esse teste nascem com o status "Em analise".

    # ============================
    # MODIFICADO
    # ============================
    @IncluirProposta @Success
    Scenario: Incluir proposta - mínimo aceitável (campos obrigatórios)
        Given que eu preencha o payload dto da Proposta2:
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And que eu valide o Calculo da Proposta
            | PropostaModelo     | 2          |
            | PmtDesejada        | 1000       |
            | VlrParcela         | 88         |
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 800.59     |
            | VlrTAC             | 5.50       |
            | DtPrimVencimento   | 2027-11-05 |
            | TipoPessoa         | 2          |
            | DtContratacao      | 2027-11-04 |
        And defina parametros Proposta MODIFICADO2:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        When eu envio uma requisição POST para criação de proposta2
            | TipoDeProposta |
            | Proposta       |
        Then recebo status Proposta2 200

    # ============================
    # SUCESSO - REGISTRO PIX
    # ============================
    @IncluirProposta @Success
    Scenario Outline: Registrar request e response após inclusão PIX bem sucedida (<ChavePIX>)
        Given que eu preencha o payload dto da Proposta2:
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And que eu valide o Calculo da Proposta
            | PropostaModelo     | 2          |
            | PmtDesejada        | 1000       |
            | VlrParcela         | 88         |
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 800.59     |
            | VlrTAC             | 5.50       |
            | DtPrimVencimento   | 2027-11-05 |
            | TipoPessoa         | 2          |
            | DtContratacao      | 2027-11-04 |
        And defina parametros Proposta MODIFICADO2:
            | Nome                | Valor |
            | Proposta_IsentarIOF | true  |
        And que eu valide o metodo de pagamento pix DTO com a chave2: "<ChavePIX>"
            | ChavePIX | <ChavePIX> |
        When eu envio uma requisição POST para criação de proposta2
            | TipoDeProposta |
            | Proposta       |
        Then recebo status Proposta2 200

        Examples:
            | ChavePIX                             |
            | jonas@pix.teste                      |
            | 11122233301                          |
            | 47991194747                          |
            | +5547991194747                       |
            | b6295ee1-f054-47d1-9e90-ee57b74f60d9 |
            | 97023168000154                       |

    # ============================
    # SUCESSO - REGISTRO CONTA
    # ============================
    @IncluirProposta @Success
    Scenario: Registrar request e response após inclusão Conta bem sucedida
        Given que eu preencha o payload dto da Proposta2:
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And que eu valide o Calculo da Proposta
            | PropostaModelo     | 2          |
            | PmtDesejada        | 1000       |
            | VlrParcela         | 88         |
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 800.59     |
            | VlrTAC             | 5.50       |
            | DtPrimVencimento   | 2027-11-05 |
            | TipoPessoa         | 2          |
            | DtContratacao      | 2027-11-04 |
        And defina parametros Proposta MODIFICADO2:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        And que eu valide o metodo de pagamento como conta DTO
            | CodigoBanco               | 001                |
            | Conta                     | 12345678           |
            | TipoConta                 | 1                  |
            | Agencia                   | 9891               |
            | AgenciaDig                | 5                  |
            | ContaDig                  | 9                  |
            | NumeroBanco               | 747                |
            | DocumentoFederalPagamento | 60.317.935/0001-28 |
            | NomePagamento             | PAGAMENTO          |
        When eu envio uma requisição POST para criação de proposta2
            | TipoDeProposta |
            | Proposta       |
        Then recebo status Proposta2 200

    # ============================
    # MODIFICADO
    # ============================
    @IncluirProposta @Success
    Scenario: Incluir proposta - mínimo aceitável (campos obrigatórios)
        Given que eu preencha o payload dto da Proposta2:
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And que eu valide o Calculo da Proposta
            | PropostaModelo     | 2          |
            | PmtDesejada        | 1000       |
            | VlrParcela         | 88         |
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 800.59     |
            | VlrTAC             | 5.50       |
            | DtPrimVencimento   | 2027-11-05 |
            | TipoPessoa         | 2          |
            | DtContratacao      | 2027-11-04 |
        And defina parametros Proposta MODIFICADO2:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        When eu envio uma requisição POST para criação de proposta2
            | TipoDeProposta |
            | Proposta       |
        Then recebo status Proposta2 200