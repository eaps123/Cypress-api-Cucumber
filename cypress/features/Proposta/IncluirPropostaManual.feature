Feature: Testes automatizados para inclusão de proposta manual

    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================
    @IncluirPropostaManual @Success
    Scenario: Incluir proposta manual  - mínimo aceitável (campos obrigatórios)
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual         |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
            | TipoIndiceFinanceiro            | 5              |
            | PercIndiceFinanceiro            | 120            |
            | DtPrimeiroVencto                | 2026-08-14     |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 200

    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================
    @IncluirPropostaManual @Success
    Scenario: Incluir proposta manual  - com todos os campos preenchidos
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual             |
            | DocumentoCliente                | 007.031.609-07     |
            | DocumentoParceiroCorrespondente | 358.638.490-45     |
            | ObservacoesVendedor             | teste automatizado |
            | TipoContrato                    | CSG                |
            | TipoIndiceFinanceiro            | 5                  |
            | PercIndiceFinanceiro            | 120                |
            | VlrProdutoBem                   | 3500000            |
            | AnoBase                         | 365                |
            | NroDiasAcrescimo                | 4                  |
            | Prazo                           | 12                 |
            | PercJurosNegociado              | 1.27               |
            | VlrSolicitado                   | 840105.59          |
            | VlrTAC                          | 15020.81           |
            | VlrOutrasDespesas               | 180.10             |
            | VlrOutrosServicos               | 100.63             |
            | VlrSeguro                       | 799.19             |
            | VlrAvaliacao                    | 245.15             |
            | VlrDespachante                  | 345.09             |
            | VlrRegistro                     | 180.70             |
            | VlrBlindagem                    | 99.99              |
            | VlrAcessorios                   | 81.34              |
            | VlrVistoria                     | 42.28              |
            | VlrCertiDocs                    | 1000.01            |
            | VlrTxAdmMensal                  | 25.80              |
            | VlrSeguroMensal1                | 71.19              |
            | PercSeguroMensal1               | 0.021              |
            | VlrSeguroMensal2                | 58.25              |
            | PercSeguroMensal2               | 0.050              |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 200

    # ============================
    # SUCESSO - BORDAS / EDGE CASES / Extremos
    # ============================
    @IncluirPropostaManual @Edge
    Scenario Outline: Incluir proposta  - casos extremos
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual               |
            | Prazo                           | <Prazo>              |
            | PercJurosNegociado              | <PercJurosNegociado> |
            | VlrSolicitado                   | <VlrSolicitado>      |
            | DocumentoCliente                | 007.031.609-07       |
            | DocumentoParceiroCorrespondente | 358.638.490-45       |
            | ObservacoesVendedor             | teste automatizado   |
            | TipoContrato                    | CSG                  |
            | TipoIndiceFinanceiro            | 5                    |
            | PercIndiceFinanceiro            | 90                   |
            | VlrProdutoBem                   | <VlrProdutoBem>      |
            | AnoBase                         | 365                  |
            | NroDiasAcrescimo                | 4                    |
            | VlrTAC                          | 15020.81             |
            | VlrOutrasDespesas               | 180.10               |
            | VlrOutrosServicos               | 100.63               |
            | VlrSeguro                       | 799.19               |
            | VlrAvaliacao                    | 245.15               |
            | VlrDespachante                  | 345.09               |
            | VlrRegistro                     | 180.70               |
            | VlrBlindagem                    | 99.99                |
            | VlrAcessorios                   | 81.34                |
            | VlrVistoria                     | 42.28                |
            | VlrCertiDocs                    | 1000.01              |
            | VlrTxAdmMensal                  | 25.80                |
            | VlrSeguroMensal1                | 71.19                |
            | PercSeguroMensal1               | 0.021                |
            | VlrSeguroMensal2                | 58.25                |
            | PercSeguroMensal2               | 0.050                |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 200

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | VlrProdutoBem |
            | 1     | 1.0                | 150000        | 100           |
            | 50    | 1.5                | 320000        | 380000        |
            | 12    | 1.99               | 180000        | 800000        |
            | 20    | 1.2                | 40000         | 1500000       |

    # ============================
    # SUCESSO - Quando IncluirCorrecaoPos = true, validar variações do TipoIndiceFinanceiro: 0,1,3,5,6
    # ============================
    @IncluirPropostaManual @Success
    Scenario Outline: Incluir proposta - varia TipoIndiceFinanceiro e IOF
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual                 |
            | TipoIndiceFinanceiro            | <TipoIndiceFinanceiro> |
            | PercIndiceFinanceiro            | 120                    |
            | Prazo                           | 12                     |
            | PercJurosNegociado              | 1.27                   |
            | VlrSolicitado                   | 840105.59              |
            | VlrTAC                          | 15020.81               |
            | DocumentoCliente                | 007.031.609-07         |
            | DocumentoParceiroCorrespondente | 358.638.490-45         |
            | NroDiasAcrescimo                | 4                      |
        And 1defina parametros Proposta:
            | Nome                | Valor   |
            | Proposta_IsentarIOF | <Valor> |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 200

        Examples:
            | TipoIndiceFinanceiro | Valor |
            | 1                    | false |
            | 3                    | false |
            | 5                    | false |
            | 6                    | false |
            | 1                    | true  |
            | 3                    | true  |
            | 5                    | true  |
            | 6                    | true  |

    # ============================
    # SUCESSO - Cenários com base em exemplos reais
    # ============================
    @IncluirPropostaManual @Success
    Scenario Outline: Incluir proposta - cenários reais
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual                 |
            | DocumentoCliente                | 007.031.609-07         |
            | DocumentoParceiroCorrespondente | 358.638.490-45         |
            | ObservacoesVendedor             | <ObservacoesVendedor>  |
            | TipoContrato                    | CSG                    |
            | TipoIndiceFinanceiro            | <TipoIndiceFinanceiro> |
            | PercIndiceFinanceiro            | <PercIndiceFinanceiro> |
            | VlrProdutoBem                   | <VlrProdutoBem>        |
            | AnoBase                         | <AnoBase>              |
            | NroDiasAcrescimo                | <NroDiasAcrescimo>     |
            | Prazo                           | <Prazo>                |
            | PercJurosNegociado              | <PercJurosNegociado>   |
            | VlrSolicitado                   | <VlrSolicitado>        |
            | VlrTAC                          | <VlrTAC>               |
            | VlrOutrasDespesas               | <VlrOutrasDespesas>    |
            | VlrOutrosServicos               | <VlrOutrosServicos>    |
            | VlrSeguro                       | <VlrSeguro>            |
            | VlrAvaliacao                    | <VlrAvaliacao>         |
            | VlrDespachante                  | <VlrDespachante>       |
            | VlrRegistro                     | <VlrRegistro>          |
            | VlrBlindagem                    | <VlrBlindagem>         |
            | VlrAcessorios                   | <VlrAcessorios>        |
            | VlrVistoria                     | <VlrVistoria>          |
            | VlrCertiDocs                    | <VlrCertiDocs>         |
            | VlrTxAdmMensal                  | <VlrTxAdmMensal>       |
            | VlrSeguroMensal1                | <VlrSeguroMensal1>     |
            | PercSeguroMensal1               | <PercSeguroMensal1>    |
            | VlrSeguroMensal2                | <VlrSeguroMensal2>     |
            | PercSeguroMensal2               | <PercSeguroMensal2>    |
            | NroDiasAcrescimo                | 4                      |
        And 1defina parametros Proposta:
            | Nome                | Valor   |
            | Proposta_IsentarIOF | <Valor> |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 200

        Examples:
            | ObservacoesVendedor     | TipoIndiceFinanceiro | PercIndiceFinanceiro | VlrProdutoBem | AnoBase | NroDiasAcrescimo | Prazo | PercJurosNegociado | VlrSolicitado | VlrTAC   | VlrOutrasDespesas | VlrOutrosServicos | VlrSeguro | VlrAvaliacao | VlrDespachante | VlrRegistro | VlrBlindagem | VlrAcessorios | VlrVistoria | VlrCertiDocs | VlrTxAdmMensal | VlrSeguroMensal1 | PercSeguroMensal1 | VlrSeguroMensal2 | PercSeguroMensal2 | Valor |
            | Venda balcão - popular  | 1                    | 120                  | 30000         | 365     | 0                | 36    | 1.10               | 25000         | 350.00   | 150.00            | 100.00            | 350.00    | 800.00       | 0.00           | 0.00        | 0.00         | 500.00        | 0.00        | 50.00        | 20.00          | 5.00             | 15.00             | 2.50             | 0.058             | true  |
            | Seminovo - médio valor  | 3                    | 120                  | 80000         | 365     | 2                | 60    | 1.25               | 70000         | 1200.00  | 300.00            | 200.00            | 900.00    | 1200.00      | 200.00         | 150.00      | 0.00         | 1200.00       | 0.00        | 120.00       | 60.00          | 0.021            | 50.00             | 0.050            | 0.12              | true  |
            | Veículo alto padrão     | 5                    | 120                  | 3500000       | 365     | 4                | 12    | 1.27               | 840105.59     | 15020.81 | 180.10            | 100.63            | 799.19    | 245.15       | 345.09         | 180.70      | 99.99        | 81.34         | 42.28       | 1000.01      | 25.80          | 71.19            | 0.021             | 58.25            | 0.050             | false |
            | Crédito pessoal curto   | 1                    | 120                  | 0             | 365     | 0                | 12    | 1.50               | 5000.00       | 45.00    | 0.00              | 0.00              | 0.00      | 0.00         | 0.00           | 0.00        | 0.00         | 0.00          | 0.00        | 0.00         | 0.00           | 0.00             | 0.00              | 0.00             | 0.080             | true  |
            | Financiamento longo doc | 6                    | 120                  | 2500000       | 365     | 3                | 99    | 1.90               | 2000000.00    | 18000.00 | 500.00            | 300.00            | 2500.00   | 1500.00      | 400.00         | 200.00      | 0.00         | 250.00        | 100.00      | 1200.00      | 100.00         | 0.021            | 80.00             | 0.050            | 0.022             | true  |
            | Oferta promocional IOF  | 3                    | 120                  | 120000        | 365     | 1                | 24    | 1.10               | 100000.00     | 800.00   | 200.00            | 150.00            | 600.00    | 900.00       | 150.00         | 90.00       | 0.00         | 250.00        | 50.00       | 300.00       | 40.00          | 0.021            | 35.00             | 0.050            | 0.078             | true  |

    # ============================
    # SUCESSO - REGISTRO PIX
    # ============================
    @IncluirPropostaManual @Success
    Scenario Outline: Registrar request e response após inclusão PIX bem sucedida
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual         |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | VlrIOF                          | 200            |
            | PercIOF                         | 1              |
            | VlrParcela                      | 200            |
            | PercIOFAdicional                | 10             |
            | TipoIndiceFinanceiro            | 5              |
            | PercIndiceFinanceiro            | 120            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | DtPrimeiroVencto                | 2026-08-14     |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
        And 1defina parametros Proposta:
            | Nome                | Valor   |
            | Proposta_IsentarIOF | <Valor> |
        And 1que eu valide o metodo de pagamento pix DTO com a chave: "<ChavePIX>"
            | ChavePIX | <ChavePIX> |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 200

        Examples: Pagamento via PIX
            | ChavePIX                             | Valor |
            | jonas@pix.teste                      | true  |
            | 11122233301                          | true  |
            | 47991194747                          | true  |
            | +5547991194747                       | true  |
            | b6295ee1-f054-47d1-9e90-ee57b74f60d9 | true  |
            | 97023168000154                       | true  |

    # ============================
    # SUCESSO - REGISTRO CONTA
    # ============================
    @IncluirPropostaManual @Success
    Scenario Outline: Registrar request e response após inclusão Conta bem sucedida
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual         |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | VlrIOF                          | 200            |
            | PercIOF                         | 1              |
            | VlrParcela                      | 200            |
            | PercIOFAdicional                | 10             |
            | TipoIndiceFinanceiro            | 5              |
            | PercIndiceFinanceiro            | 120            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | DtPrimeiroVencto                | 2026-08-14     |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        And 1que eu valide o metodo de pagamento como conta DTO:
            | CodigoBanco               | <CodigoBanco>               |
            | Conta                     | <Conta>                     |
            | TipoConta                 | <TipoConta>                 |
            | Agencia                   | <Agencia>                   |
            | AgenciaDig                | <AgenciaDig>                |
            | ContaDig                  | <ContaDig>                  |
            | NumeroBanco               | <NumeroBanco>               |
            | DocumentoFederalPagamento | <DocumentoFederalPagamento> |
            | NomePagamento             | <NomePagamento>             |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 200

        Examples: Pagamento via Conta
            | CodigoBanco | Conta    | TipoConta | Agencia | AgenciaDig | ContaDig | NumeroBanco | DocumentoFederalPagamento | NomePagamento |
            | 001         | 12345678 | 1         | 9891    | 5          | 9        | 747         | 60.317.935/0001-28        | PAGAMENTO     |

    # ============================
    # FALHAS - REGISTRO PIX
    # ============================
    @IncluirProposta @Failure
    Scenario Outline: Registrar request e response com valores inválidos PIX (<ChavePIX>)
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual         |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | VlrIOF                          | 200            |
            | PercIOF                         | 1              |
            | VlrParcela                      | 200            |
            | PercIOFAdicional                | 10             |
            | TipoIndiceFinanceiro            | 5              |
            | PercIndiceFinanceiro            | 120            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | DtPrimeiroVencto                | 2026-08-14     |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | true  |
        And 1que eu valide o metodo de pagamento pix DTO com a chave: "<ChavePIX>"
            | ChavePIX | <ChavePIX> |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 400
            | erroEsperado | true |

        Examples: Pagamento via PIX
            | ChavePIX                         |
            | jonaspix.com.br                  |
            | jonas@pix                        |
            | 17.832.733/0001-95               |
            | 1112223330                       |
            | 384.639.730-00                   |
            | 4791194747                       |
            | +554791194747                    |
            | 554791194747                     |
            | 5547991194747                    |
            | +55 47 9 9119-4747               |
            | b6295ee1f05447d19e90ee57b74f60d9 |

    # ============================
    # FALHAS - Campos obrigatórios ausentes
    # ============================
    @IncluirPropostaManual @Failure
    Scenario Outline: Incluir proposta - campo obrigatório ausente (<campo_ausente>)
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual         |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | VlrIOF                          | 200            |
            | PercIOF                         | 1              |
            | VlrParcela                      | 200            |
            | PercIOFAdicional                | 10             |
            | TipoIndiceFinanceiro            | 5              |
            | PercIndiceFinanceiro            | 120            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | DtPrimeiroVencto                | 2026-08-14     |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
        And 1remova os campos obrigatórios do DTO Proposta: "<campo_ausente>"
        And 1defina parametros Proposta:
            | Nome                | Valor   |
            | Proposta_IsentarIOF | <Valor> |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 400
            | erroEsperado | true |

        Examples:
            | campo_ausente        | Valor |
            | DocumentoCliente     | false |
            | VlrSolicitado        | true  |
            | CodigoOperacao       | true  |
            | TipoContrato         | false |

    # ============================
    # FALHAS - Valores inválidos / negativos / tipos
    # ============================
    @IncluirPropostaManual @Failure
    Scenario Outline: Incluir proposta - valores inválidos -> erro esperado (<campo_invalido>)
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual                            |
            | TipoIndiceFinanceiro            | <TipoIndiceFinanceiro>            |
            | PercIndiceFinanceiro            | <PercIndiceFinanceiro>            |
            | Prazo                           | <Prazo>                           |
            | PercJurosNegociado              | <PercJurosNegociado>              |
            | VlrSolicitado                   | <VlrSolicitado>                   |
            | VlrTAC                          | <VlrTAC>                          |
            | DocumentoCliente                | <DocumentoCliente>                |
            | DocumentoParceiroCorrespondente | <DocumentoParceiroCorrespondente> |
            | TipoContrato                    | CSG                               |
            | VlrParcela                      | 200                               |
            | NroDiasAcrescimo                | 4                                 |
            | VlrIOF                          | 200                               |
            | PercIOF                         | 1                                 |
            | PercIOFAdicional                | 1                                 |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 400
            | erroEsperado | true |

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | VlrTAC | TipoIndiceFinanceiro | DocumentoCliente | DocumentoParceiroCorrespondente | PercIndiceFinanceiro | campo_invalido                  |
            | -10   | 1.0                | 150000        | 1500   | 1                    | 007.031.609-07   | 358.638.490-45                  | 2                    | Prazo                           |
            | 10    | -2                 | 320000        | 1500   | 3                    | 007.031.609-07   | 358.638.490-45                  | 2                    | PercJurosNegociado              |
            | 20    | 1.5                | -320000       | 1500   | 5                    | 007.031.609-07   | 358.638.490-45                  | 2                    | VlrSolicitado                   |
            | 10    | 1.5                | 320000        | texto  | 6                    | 007.031.609-07   | 358.638.490-45                  | 2                    | VlrTAC                          |
            | 11    | 1.5                | 320000        | 1500   | texto                | 007.031.609-07   | 358.638.490-45                  | 2                    | TipoIndiceFinanceiro            |
            | 08    | 1.5                | 320000        | 1500   | 1                    | 000.000.000-01   | 358.638.490-45                  | 2                    | DocumentoCliente                |
            | 05    | 1.5                | 320000        | 1500   | 3                    | 007.031.609-07   | 000.000.000-01                  | 2                    | DocumentoParceiroCorrespondente |
            | 05    | 1.5                | 320000        | 1500   | 3                    | 007.031.609-07   | 358.638.490-45                  | -2                   | PercIndiceFinanceiro            |
