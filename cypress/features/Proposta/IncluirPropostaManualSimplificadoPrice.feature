Feature: Testes automatizados para inclusão de proposta manual simplificado Price

    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================
    @IncluirPropostaManualSimplificadoPrice @Success
    Scenario: Incluir proposta manual simplificado - mínimo aceitável (campos obrigatórios)
        Given que eu preencha o payload dto da proposta com Price:
        When eu envio uma requisição POST para proposta Simplificado Price
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | TipoIndiceFinanceiro            | 5              |
            | PercIndiceFinanceiro            | 120            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
            | CodigoOperacao                  | {{$guid}}      |
        Then recebo status Price 200

    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================
    @IncluirPropostaManualSimplificadoPrice @Success
    Scenario: Incluir proposta manual simplificado - com todos os campos preenchidos
        Given que eu preencha o payload dto da proposta com Price:
        When eu envio uma requisição POST para proposta Simplificado Price
            | DocumentoCliente                | 007.031.609-07     |
            | DocumentoParceiroCorrespondente | 358.638.490-45     |
            | ObservacoesVendedor             | automatizado Price |
            | CodigoOperacao                  | {{$guid}}          |
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
        Then recebo status Price 200

    # ============================
    # SUCESSO - BORDAS / EDGE CASES / Extremos
    # ============================
    @IncluirPropostaManualSimplificadoPrice @Edge
    Scenario Outline: Incluir proposta simplificado - casos extremos
        Given que eu preencha o payload dto da proposta com Price:
        When eu envio uma requisição POST para proposta Simplificado Price
            | Prazo                           | <Prazo>              |
            | PercJurosNegociado              | <PercJurosNegociado> |
            | VlrSolicitado                   | <VlrSolicitado>      |
            | DocumentoCliente                | 007.031.609-07       |
            | DocumentoParceiroCorrespondente | 358.638.490-45       |
            | ObservacoesVendedor             | automatizado Price   |
            | CodigoOperacao                  | {{$guid}}            |
            | TipoContrato                    | CSG                  |
            | TipoIndiceFinanceiro            | 5                    |
            | PercIndiceFinanceiro            | 120                  |
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
        Then recebo status Price 200

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | VlrProdutoBem |
            | 1     | 1.0                | 150000        | 100           |
            | 50    | 1.5                | 320000        | 380000        |
            | 12    | 1.99               | 180000        | 800000        |
            | 20    | 1.2                | 40000         | 1500000       |

    # ============================
    # SUCESSO - Quando IncluirCorrecaoPos = true, validar variações do TipoIndiceFinanceiro: 0,1,3,5,6
    # ============================
    @IncluirPropostaManualSimplificadoPrice @Success
    Scenario Outline: Incluir proposta simplificado - varia TipoIndiceFinanceiro e IOF
        Given que eu preencha o payload dto da proposta com Price:
        When eu envio uma requisição POST para proposta Simplificado Price
            | TipoIndiceFinanceiro            | <TipoIndiceFinanceiro>  |
            | PercIndiceFinanceiro            | 120                     |
            | Prazo                           | 12                      |
            | PercJurosNegociado              | 1.27                    |
            | VlrSolicitado                   | 840105.59               |
            | VlrTAC                          | 15020.81                |
            | CodigoOperacao                  | {{$guid}}               |
            | DocumentoCliente                | 007.031.609-07          |
            | DocumentoParceiroCorrespondente | 358.638.490-45          |
            | FluxoIrregular                  | <FluxoIrregular>        |
            | NroDiasIntervaloPrazo           | <NroDiasIntervaloPrazo> |
        Then recebo status Price 200

        Examples:
            | TipoIndiceFinanceiro | FluxoIrregular | NroDiasIntervaloPrazo |
            | 1                    | false          | null                  |
            | 3                    | false          | null                  |
            | 5                    | false          | null                  |
            | 6                    | false          | null                  |
            | 1                    | true           | 25                    |
            | 3                    | true           | 25                    |
            | 5                    | true           | 25                    |
            | 6                    | true           | 25                    |

    # ============================
    # SUCESSO - Cenários com base em exemplos reais
    # ============================
    @IncluirPropostaManualSimplificadoPrice @Success
    Scenario Outline: Incluir proposta simplificado - cenários reais
        Given que eu preencha o payload dto da proposta com Price:
        When eu envio uma requisição POST para proposta Simplificado Price
            | DocumentoCliente                | 007.031.609-07          |
            | DocumentoParceiroCorrespondente | 358.638.490-45          |
            | ObservacoesVendedor             | <ObservacoesVendedor>   |
            | CodigoOperacao                  | {{$guid}}               |
            | TipoContrato                    | CSG                     |
            | FluxoIrregular                  | <FluxoIrregular>        |
            | NroDiasIntervaloPrazo           | <NroDiasIntervaloPrazo> |
            | TipoIndiceFinanceiro            | <TipoIndiceFinanceiro>  |
            | PercIndiceFinanceiro            | <PercIndiceFinanceiro>  |
            | VlrProdutoBem                   | <VlrProdutoBem>         |
            | AnoBase                         | <AnoBase>               |
            | NroDiasAcrescimo                | <NroDiasAcrescimo>      |
            | Prazo                           | <Prazo>                 |
            | PercJurosNegociado              | <PercJurosNegociado>    |
            | VlrSolicitado                   | <VlrSolicitado>         |
            | VlrTAC                          | <VlrTAC>                |
            | VlrOutrasDespesas               | <VlrOutrasDespesas>     |
            | VlrOutrosServicos               | <VlrOutrosServicos>     |
            | VlrSeguro                       | <VlrSeguro>             |
            | VlrAvaliacao                    | <VlrAvaliacao>          |
            | VlrDespachante                  | <VlrDespachante>        |
            | VlrRegistro                     | <VlrRegistro>           |
            | VlrBlindagem                    | <VlrBlindagem>          |
            | VlrAcessorios                   | <VlrAcessorios>         |
            | VlrVistoria                     | <VlrVistoria>           |
            | VlrCertiDocs                    | <VlrCertiDocs>          |
            | VlrTxAdmMensal                  | <VlrTxAdmMensal>        |
            | VlrSeguroMensal1                | <VlrSeguroMensal1>      |
            | PercSeguroMensal1               | <PercSeguroMensal1>     |
            | VlrSeguroMensal2                | <VlrSeguroMensal2>      |
            | PercSeguroMensal2               | <PercSeguroMensal2>     |
        Then recebo status Price 200

        Examples:
            | ObservacoesVendedor     | TipoIndiceFinanceiro | PercIndiceFinanceiro | VlrProdutoBem | AnoBase | NroDiasAcrescimo | Prazo | PercJurosNegociado | VlrSolicitado | VlrTAC   | VlrOutrasDespesas | VlrOutrosServicos | VlrSeguro | VlrAvaliacao | VlrDespachante | VlrRegistro | VlrBlindagem | VlrAcessorios | VlrVistoria | VlrCertiDocs | VlrTxAdmMensal | VlrSeguroMensal1 | PercSeguroMensal1 | VlrSeguroMensal2 | PercSeguroMensal2 | FluxoIrregular | NroDiasIntervaloPrazo |
            | Venda balcão - popular  | 1                    | 120                  | 30000         | 365     | 0                | 36    | 1.10               | 25000         | 350.00   | 150.00            | 100.00            | 350.00    | 800.00       | 0.00           | 0.00        | 0.00         | 500.00        | 0.00        | 50.00        | 20.00          | 5.00             | 15.00             | 2.50             | 0.058             | true           | 25                    |
            | Seminovo - médio valor  | 3                    | 120                  | 80000         | 365     | 2                | 60    | 1.25               | 70000         | 1200.00  | 300.00            | 200.00            | 900.00    | 1200.00      | 200.00         | 150.00      | 0.00         | 1200.00       | 0.00        | 120.00       | 60.00          | 0.021            | 50.00             | 0.050            | 0.12              | true           | 25                    |
            | Veículo alto padrão     | 5                    | 120                  | 3500000       | 365     | 4                | 12    | 1.27               | 840105.59     | 15020.81 | 180.10            | 100.63            | 799.19    | 245.15       | 345.09         | 180.70      | 99.99        | 81.34         | 42.28       | 1000.01      | 25.80          | 71.19            | 0.021             | 58.25            | 0.050             | false          | null                  |
            | Crédito pessoal curto   | 1                    | 120                  | 0             | 365     | 0                | 12    | 1.50               | 5000.00       | 45.00    | 0.00              | 0.00              | 0.00      | 0.00         | 0.00           | 0.00        | 0.00         | 0.00          | 0.00        | 0.00         | 0.00           | 0.00             | 0.00              | 0.00             | 0.080             | true           | 25                    |
            | Financiamento longo doc | 6                    | 120                  | 2500000       | 365     | 3                | 99    | 1.90               | 2000000.00    | 18000.00 | 500.00            | 300.00            | 2500.00   | 1500.00      | 400.00         | 200.00      | 0.00         | 250.00        | 100.00      | 1200.00      | 100.00         | 0.021            | 80.00             | 0.050            | 0.022             | true           | 25                    |
            | Oferta promocional IOF  | 3                    | 120                  | 120000        | 365     | 1                | 24    | 1.10               | 100000.00     | 800.00   | 200.00            | 150.00            | 600.00    | 900.00       | 150.00         | 90.00       | 0.00         | 250.00        | 50.00       | 300.00       | 40.00          | 0.021            | 35.00             | 0.050            | 0.078             | true           | 25                    |

    # ============================
    # SUCESSO - REGISTRO PIX
    # ============================
    @IncluirPropostaManualSimplificadoPrice @Success
    Scenario Outline: Registrar request e response após inclusão PIX bem sucedida
        Given que eu preencha o payload dto da proposta com Price:
        And defina parametros Price:
            | SITUACAOPROPOSTAEMDIGITACAO | <SITUACAOPROPOSTAEMDIGITACAO> |
        And que eu valide o metodo de pagamento Price:
            | PaymentType | <PaymentType> |
            | ChavePIX    | <ChavePIX>    |
        When eu envio uma requisição POST para proposta Simplificado Price
            | DocumentoParceiroCorrespondente | 358.638.490-45   |
            | DocumentoCliente                | 007.031.609-07   |
            | TipoContrato                    | CSG              |
            | VlrIOF                          | 200              |
            | PercIOF                         | 1                |
            | VlrParcela                      | 200              |
            | PercIOFAdicional                | 10               |
            | TipoIndiceFinanceiro            | 5                |
            | PercIndiceFinanceiro            | 120              |
            | Prazo                           | 12               |
            | PercJurosNegociado              | 1.27             |
            | DtPrimeiroVencto                | 2026-08-14       |
            | VlrSolicitado                   | 840105.59        |
            | VlrTAC                          | 15020.81         |
            | CodigoOperacao                  | {{$guid}}        |
            | FluxoIrregular                  | <FluxoIrregular> |
        Then recebo status Price 200

        Examples: Pagamento via PIX
            | PaymentType | CodigoOperacao | ChavePIX                             | FluxoIrregular | SITUACAOPROPOSTAEMDIGITACAO |
            | PIX         | {{$guid}}      | jonas@pix.teste                      | true           | true                        |
            | PIX         | {{$guid}}      | 11122233301                          | true           | true                        |
            | PIX         | {{$guid}}      | 47991194747                          | true           | true                        |
            | PIX         | {{$guid}}      | +5547991194747                       | true           | true                        |
            | PIX         | {{$guid}}      | b6295ee1-f054-47d1-9e90-ee57b74f60d9 | true           | true                        |
            | PIX         | {{$guid}}      | 97023168000154                       | true           | true                        |

    # ============================
    # SUCESSO - REGISTRO CONTA
    # ============================
    @IncluirPropostaManualSimplificadoPrice @Success
    Scenario Outline: Registrar request e response após inclusão Conta bem sucedida
        Given que eu preencha o payload dto da proposta com Price:
        And defina parametros Price:
            | SITUACAOPROPOSTAEMDIGITACAO | <SITUACAOPROPOSTAEMDIGITACAO> |
        And que eu valide o metodo de pagamento Price:
            | PaymentType               | <PaymentType>               |
            | CodigoBanco               | <CodigoBanco>               |
            | Conta                     | <Conta>                     |
            | TipoConta                 | <TipoConta>                 |
            | Agencia                   | <Agencia>                   |
            | AgenciaDig                | <AgenciaDig>                |
            | ContaDig                  | <ContaDig>                  |
            | NumeroBanco               | <NumeroBanco>               |
            | DocumentoFederalPagamento | <DocumentoFederalPagamento> |
            | NomePagamento             | <NomePagamento>             |
        When eu envio uma requisição POST para proposta Simplificado Price
            | DocumentoParceiroCorrespondente | 358.638.490-45   |
            | DocumentoCliente                | 007.031.609-07   |
            | TipoContrato                    | CSG              |
            | VlrIOF                          | 200              |
            | VlrParcela                      | 200              |
            | PercIOF                         | 1                |
            | PercIOFAdicional                | 10               |
            | TipoIndiceFinanceiro            | 5                |
            | PercIndiceFinanceiro            | 120              |
            | Prazo                           | 12               |
            | PercJurosNegociado              | 1.27             |
            | DtPrimeiroVencto                | 2026-08-14       |
            | VlrSolicitado                   | 840105.59        |
            | VlrTAC                          | 15020.81         |
            | CodigoOperacao                  | {{$guid}}        |
            | FluxoIrregular                  | <FluxoIrregular> |
        Then recebo status Price 200

        Examples: Pagamento via Conta
            | PaymentType | CodigoOperacao | CodigoBanco | Conta    | TipoConta | Agencia | AgenciaDig | ContaDig | NumeroBanco | DocumentoFederalPagamento | NomePagamento | FluxoIrregular | SITUACAOPROPOSTAEMDIGITACAO |
            | CONTA       | {{$guid}}      | 001         | 12345678 | 1         | 9891    | 5          | 9        | 747         | 60.317.935/0001-28        | PAGAMENTO     | true           | true                        |

    # ============================
    # FALHAS - REGISTRO PIX
    # ============================
    @IncluirProposta @Failure
    Scenario Outline: Registrar request e response com valores inválidos PIX (<ChavePIX>)
        Given que eu preencha o payload dto da proposta com Price:
        And defina parametros Price:
            | Proposta_IsentarIOF | false |
        And que eu valide o metodo de pagamento Price:
            | PaymentType | <PaymentType> |
            | ChavePIX    | <ChavePIX>    |
        When eu envio uma requisição POST para proposta Simplificado Price
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | VlrParcela                      | 200            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | DtPrimeiroVencto                | 2026-08-14     |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
            | CodigoOperacao                  | {{$guid}}      |
        Then recebo status Price 400
            | erroEsperado | true |

        Examples: Pagamento via PIX
            | PaymentType | CodigoOperacao | ChavePIX                         | Proposta_IsentarIOF |
            | PIX         | {{$guid}}      | jonaspix.com.br                  | true                |
            | PIX         | {{$guid}}      | jonas@pix                        | true                |
            | PIX         | {{$guid}}      | 17.832.733/0001-95               | true                |
            | PIX         | {{$guid}}      | 1112223330                       | true                |
            | PIX         | {{$guid}}      | 384.639.730-00                   | true                |
            | PIX         | {{$guid}}      | 4791194747                       | true                |
            | PIX         | {{$guid}}      | +554791194747                    | true                |
            | PIX         | {{$guid}}      | 554791194747                     | true                |
            | PIX         | {{$guid}}      | 5547991194747                    | true                |
            | PIX         | {{$guid}}      | +55 47 9 9119-4747               | true                |
            | PIX         | {{$guid}}      | b6295ee1f05447d19e90ee57b74f60d9 | true                |

    # ============================
    # FALHAS - Campos obrigatórios ausentes
    # ============================
    @IncluirPropostaManualSimplificadoPrice @Failure
    Scenario Outline: Incluir proposta simplificado - campo obrigatório ausente (<campo_ausente>)
        Given que eu preencha o payload dto da proposta com Price:
        And remova os campos obrigatórios do DTO Price "<campo_ausente>"
        And que eu valide o metodo de pagamento Price:
            | PaymentType | <PaymentType> |
        When eu envio uma requisição POST para proposta Simplificado Price
            | FluxoIrregular        | <FluxoIrregular>        |
            | NroDiasIntervaloPrazo | <NroDiasIntervaloPrazo> |
        Then recebo status Price 400
            | erroEsperado | true |

        Examples:
            | PaymentType | campo_ausente         | FluxoIrregular | NroDiasIntervaloPrazo |
            | PIX         | DocumentoCliente      | false          | null                  |
            | PIX         | VlrSolicitado         | false          | null                  |
            | PIX         | CodigoOperacao        | false          | null                  |
            | PIX         | TipoContrato          | false          | null                  |
            | PIX         | NroDiasIntervaloPrazo | false          | null                  |
            | PIX         | ChavePIX              | false          | null                  |
            | CONTA       | CodigoBanco           | false          | null                  |
            | CONTA       | Conta                 | false          | null                  |

    # ============================
    # FALHAS - Valores inválidos / negativos / tipos
    # ============================
    @IncluirPropostaManualSimplificadaPrice @Failure
    Scenario Outline: Incluir proposta simplificado - valores inválidos -> erro esperado
        Given que eu preencha o payload dto da proposta com Price:
        And que eu valide o metodo de pagamento Price:
            | PaymentType | <PaymentType> |
        When eu envio uma requisição POST para proposta Simplificado Price
            | TipoIndiceFinanceiro            | <TipoIndiceFinanceiro>            |
            | PercIndiceFinanceiro            | <PercIndiceFinanceiro>            |
            | Prazo                           | <Prazo>                           |
            | PercJurosNegociado              | <PercJurosNegociado>              |
            | VlrSolicitado                   | <VlrSolicitado>                   |
            | VlrTAC                          | <VlrTAC>                          |
            | CodigoOperacao                  | {{$guid}}                         |
            | DocumentoCliente                | <DocumentoCliente>                |
            | DocumentoParceiroCorrespondente | <DocumentoParceiroCorrespondente> |
        Then recebo status Price <status_invalido>
            | erroEsperado | true |

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | VlrTAC  | TipoIndiceFinanceiro | DocumentoCliente | DocumentoParceiroCorrespondente | status_invalido | campo_invalido                  |
            | -10   | 1.0                | 150000        | 1500    | 1                    | 007.031.609-07   | 358.638.490-45                  | 200             | Prazo                           |
            | 10    | -2                 | 320000        | 1500    | 3                    | 007.031.609-07   | 358.638.490-45                  | 200             | PercJurosNegociado              |
            | 20    | 1.5                | -320000       | 1500    | 5                    | 007.031.609-07   | 358.638.490-45                  | 200             | VlrSolicitado                   |
            | 10    | 1.5                | 320000        | "texto" | 6                    | 007.031.609-07   | 358.638.490-45                  | 200             | VlrTAC                          |
            | 11    | 1.5                | 320000        | 1500    | "texto"              | 007.031.609-07   | 358.638.490-45                  | 200             | TipoIndiceFinanceiro            |
            | 08    | 1.5                | 320000        | 1500    | 1                    | 000.000.000-01   | 358.638.490-45                  | 200             | DocumentoCliente                |
            | 05    | 1.5                | 320000        | 1500    | 3                    | 007.031.609-07   | 000.000.000-01                  | 200             | DocumentoParceiroCorrespondente |
