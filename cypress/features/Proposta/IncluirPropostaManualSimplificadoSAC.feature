Feature: Testes automatizados para inclusão de proposta manual simplificado SAC

    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================
    @IncluirPropostaManualSimplificadaSAC @Success
    Scenario: Incluir proposta manual simplificado - mínimo aceitável (campos obrigatórios)
        Given que eu preencha o payload dto da proposta com Simplificado SAC:
        And defina parametros Simplificado SAC:
            | Proposta_IsentarIOF | false |
        When eu envio uma requisição POST para proposta Simplificado SAC
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
        Then recebo status Simplificado SAC 200

    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================
    @IncluirPropostaManualSimplificadaSAC @Success
    Scenario: Incluir proposta manual simplificado - com todos os campos preenchidos
        Given que eu preencha o payload dto da proposta com Simplificado SAC:
        And defina parametros Simplificado SAC:
            | Proposta_IsentarIOF | false |
        When eu envio uma requisição POST para proposta Simplificado SAC
            | DocumentoCliente                | 007.031.609-07         |
            | DocumentoParceiroCorrespondente | 358.638.490-45         |
            | ObservacoesVendedor             | teste automatizado sac |
            | CodigoOperacao                  | {{$guid}}              |
            | TipoContrato                    | CSG                    |
            | TipoIndiceFinanceiro            | 5                      |
            | PercIndiceFinanceiro            | 120                    |
            | VlrProdutoBem                   | 3500000                |
            | AnoBase                         | 365                    |
            | NroDiasAcrescimo                | 4                      |
            | Prazo                           | 12                     |
            | PercJurosNegociado              | 1.27                   |
            | VlrSolicitado                   | 840105.59              |
            | VlrTAC                          | 15020.81               |
            | VlrOutrasDespesas               | 180.10                 |
            | VlrOutrosServicos               | 100.63                 |
            | VlrSeguro                       | 799.19                 |
            | VlrAvaliacao                    | 245.15                 |
            | VlrDespachante                  | 345.09                 |
            | VlrRegistro                     | 180.70                 |
            | VlrBlindagem                    | 99.99                  |
            | VlrAcessorios                   | 81.34                  |
            | VlrVistoria                     | 42.28                  |
            | VlrCertiDocs                    | 1000.01                |
            | VlrTxAdmMensal                  | 25.80                  |
            | VlrSeguroMensal1                | 71.19                  |
            | PercSeguroMensal1               | 0.021                  |
            | VlrSeguroMensal2                | 58.25                  |
            | PercSeguroMensal2               | 0.050                  |
        Then recebo status Simplificado SAC 200

    # ============================
    # SUCESSO - BORDAS / EDGE CASES / Extremos
    # ============================
    @IncluirPropostaManualSimplificadaSAC @Edge
    Scenario Outline: Incluir proposta simplificado - casos extremos
        Given que eu preencha o payload dto da proposta com Simplificado SAC:
        When eu envio uma requisição POST para proposta Simplificado SAC
            | Prazo                           | <Prazo>                |
            | PercJurosNegociado              | <PercJurosNegociado>   |
            | VlrSolicitado                   | <VlrSolicitado>        |
            | DocumentoCliente                | 007.031.609-07         |
            | DocumentoParceiroCorrespondente | 358.638.490-45         |
            | ObservacoesVendedor             | teste automatizado sac |
            | CodigoOperacao                  | {{$guid}}              |
            | TipoContrato                    | CSG                    |
            | TipoIndiceFinanceiro            | 5                      |
            | PercIndiceFinanceiro            | 120                    |
            | VlrProdutoBem                   | <VlrProdutoBem>        |
            | AnoBase                         | 365                    |
            | NroDiasAcrescimo                | 4                      |
            | VlrTAC                          | 15020.81               |
            | VlrOutrasDespesas               | 180.10                 |
            | VlrOutrosServicos               | 100.63                 |
            | VlrSeguro                       | 799.19                 |
            | VlrAvaliacao                    | 245.15                 |
            | VlrDespachante                  | 345.09                 |
            | VlrRegistro                     | 180.70                 |
            | VlrBlindagem                    | 99.99                  |
            | VlrAcessorios                   | 81.34                  |
            | VlrVistoria                     | 42.28                  |
            | VlrCertiDocs                    | 1000.01                |
            | VlrTxAdmMensal                  | 25.80                  |
            | VlrSeguroMensal1                | 71.19                  |
            | PercSeguroMensal1               | 0.021                  |
            | VlrSeguroMensal2                | 58.25                  |
            | PercSeguroMensal2               | 0.050                  |
        Then recebo status Simplificado SAC <status_esperado>

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | VlrProdutoBem | status_esperado |
            | 1     | 1.0                | 150000        | 100           | 200             |
            | 50    | 1.5                | 320000        | 380000        | 200             |
            | 12    | 1.99               | 180000        | 800000        | 200             |
            | 20    | 1.2                | 40000         | 1500000       | 200             |

    # ============================
    # SUCESSO - Quando IncluirCorrecaoPos = true, validar variações do TipoIndiceFinanceiro: 0,1,3,5,6
    # ============================
    @IncluirPropostaManualSimplificadaSAC @Success
    Scenario Outline: Incluir proposta simplificado - varia TipoIndiceFinanceiro e IOF
        Given que eu preencha o payload dto da proposta com Simplificado SAC:
        And defina parametros Simplificado SAC:
            | Proposta_IsentarIOF | <Proposta_IsentarIOF> |
        When eu envio uma requisição POST para proposta Simplificado SAC
            | TipoIndiceFinanceiro            | <TipoIndiceFinanceiro> |
            | PercIndiceFinanceiro            | 120                    |
            | Prazo                           | 12                     |
            | PercJurosNegociado              | 1.27                   |
            | VlrSolicitado                   | 840105.59              |
            | VlrTAC                          | 15020.81               |
            | CodigoOperacao                  | {{$guid}}              |
            | DocumentoCliente                | 007.031.609-07         |
            | DocumentoParceiroCorrespondente | 358.638.490-45         |
        Then recebo status SAC 200

        Examples:
            | TipoIndiceFinanceiro | Proposta_IsentarIOF |
            | 1                    | false               |
            | 3                    | false               |
            | 5                    | false               |
            | 6                    | false               |
            | 1                    | true                |
            | 3                    | true                |
            | 5                    | true                |
            | 6                    | true                |

    # ============================
    # SUCESSO - Cenários com base em exemplos reais
    # ============================
    @IncluirPropostaManualSimplificadoSAC @Success
    Scenario Outline: Incluir proposta simplificado - cenários reais
        Given que eu preencha o payload dto da proposta com Simplificado SAC:
        And defina parametros Simplificado SAC:
            | Proposta_IsentarIOF | <Proposta_IsentarIOF> |
        When eu envio uma requisição POST para proposta Simplificado SAC
            | DocumentoCliente                | 007.031.609-07         |
            | DocumentoParceiroCorrespondente | 358.638.490-45         |
            | ObservacoesVendedor             | <ObservacoesVendedor>  |
            | CodigoOperacao                  | {{$guid}}              |
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
        Then recebo status Simplificado SAC 200

        Examples:
            | ObservacoesVendedor     | TipoIndiceFinanceiro | PercIndiceFinanceiro | VlrProdutoBem | AnoBase | NroDiasAcrescimo | Prazo | PercJurosNegociado | VlrSolicitado | VlrTAC   | VlrOutrasDespesas | VlrOutrosServicos | VlrSeguro | VlrAvaliacao | VlrDespachante | VlrRegistro | VlrBlindagem | VlrAcessorios | VlrVistoria | VlrCertiDocs | VlrTxAdmMensal | VlrSeguroMensal1 | PercSeguroMensal1 | VlrSeguroMensal2 | PercSeguroMensal2 | Proposta_IsentarIOF |
            | Venda balcão - popular  | 1                    | 120                  | 30000         | 365     | 0                | 36    | 1.10               | 25000         | 350.00   | 150.00            | 100.00            | 350.00    | 800.00       | 0.00           | 0.00        | 0.00         | 500.00        | 0.00        | 50.00        | 20.00          | 5.00             | 15.00             | 2.50             | 0.058             | true                |
            | Seminovo - médio valor  | 3                    | 120                  | 80000         | 365     | 2                | 60    | 1.25               | 70000         | 1200.00  | 300.00            | 200.00            | 900.00    | 1200.00      | 200.00         | 150.00      | 0.00         | 1200.00       | 0.00        | 120.00       | 60.00          | 0.021            | 50.00             | 0.050            | 0.12              | true                |
            | Veículo alto padrão     | 5                    | 120                  | 3500000       | 365     | 4                | 12    | 1.27               | 840105.59     | 15020.81 | 180.10            | 100.63            | 799.19    | 245.15       | 345.09         | 180.70      | 99.99        | 81.34         | 42.28       | 1000.01      | 25.80          | 71.19            | 0.021             | 58.25            | 0.050             | false               |
            | Crédito pessoal curto   | 1                    | 120                  | 0             | 365     | 0                | 12    | 1.50               | 5000.00       | 45.00    | 0.00              | 0.00              | 0.00      | 0.00         | 0.00           | 0.00        | 0.00         | 0.00          | 0.00        | 0.00         | 0.00           | 0.00             | 0.00              | 0.00             | 0.080             | true                |
            | Financiamento longo doc | 6                    | 120                  | 2500000       | 365     | 3                | 99    | 1.90               | 2000000.00    | 18000.00 | 500.00            | 300.00            | 2500.00   | 1500.00      | 400.00         | 200.00      | 0.00         | 250.00        | 100.00      | 1200.00      | 100.00         | 0.021            | 80.00             | 0.050            | 0.022             | true                |
            | Oferta promocional IOF  | 3                    | 120                  | 120000        | 365     | 1                | 24    | 1.10               | 100000.00     | 800.00   | 200.00            | 150.00            | 600.00    | 900.00       | 150.00         | 90.00       | 0.00         | 250.00        | 50.00       | 300.00       | 40.00          | 0.021            | 35.00             | 0.050            | 0.078             | true                |

    # ============================
    # SUCESSO - REGISTRO PIX
    # ============================
    @IncluirPropostaManualSimplificadaSAC @Success
    Scenario Outline: Registrar request e response após inclusão PIX bem sucedida
        Given que eu preencha o payload dto da proposta com Simplificado SAC:
        And defina parametros Simplificado SAC:
            | Proposta_IsentarIOF | false |
        And que eu valide o metodo de pagamento Simplificado SAC:
            | PaymentType | <PaymentType> |
            | ChavePIX    | <ChavePIX>    |
        When eu envio uma requisição POST para proposta Simplificado SAC
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
            | CodigoOperacao                  | {{$guid}}      |
        Then recebo status Simplificado SAC 200

        Examples: Pagamento via PIX
            | PaymentType | CodigoOperacao | ChavePIX                             | Proposta_IsentarIOF | SITUACAOPROPOSTAEMDIGITACAO |
            | PIX         | {{$guid}}      | jonas@pix.teste                      | true                | true                        |
            | PIX         | {{$guid}}      | 11122233301                          | true                | true                        |
            | PIX         | {{$guid}}      | 47991194747                          | true                | true                        |
            | PIX         | {{$guid}}      | +5547991194747                       | true                | true                        |
            | PIX         | {{$guid}}      | b6295ee1-f054-47d1-9e90-ee57b74f60d9 | true                | true                        |
            | PIX         | {{$guid}}      | 97023168000154                       | true                | true                        |

    # ============================
    # SUCESSO - REGISTRO CONTA
    # ============================
    @IncluirPropostaManualSimplificadaSAC @Success
    Scenario Outline: Registrar request e response após inclusão Conta bem sucedida
        Given que eu preencha o payload dto da proposta com Simplificado SAC:
        And defina parametros Simplificado SAC:
            | Proposta_IsentarIOF | false |
        And que eu valide o metodo de pagamento Simplificado SAC:
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
        When eu envio uma requisição POST para proposta Simplificado SAC
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | VlrIOF                          | 200            |
            | VlrParcela                      | 200            |
            | PercIOF                         | 1              |
            | PercIOFAdicional                | 10             |
            | TipoIndiceFinanceiro            | 5              |
            | PercIndiceFinanceiro            | 120            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | DtPrimeiroVencto                | 2026-08-14     |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
            | CodigoOperacao                  | {{$guid}}      |
        Then recebo status Simplificado SAC 200

        Examples: Pagamento via Conta
            | PaymentType | CodigoOperacao | CodigoBanco | Conta    | TipoConta | Agencia | AgenciaDig | ContaDig | NumeroBanco | DocumentoFederalPagamento | NomePagamento | Proposta_IsentarIOF | SITUACAOPROPOSTAEMDIGITACAO |
            | CONTA       | {{$guid}}      | 001         | 12345678 | 1         | 9891    | 5          | 9        | 747         | 60.317.935/0001-28        | PAGAMENTO     | true                | true                        |

    # ============================
    # FALHAS - REGISTRO PIX
    # ============================
    @IncluirProposta @Failure
    Scenario Outline: Registrar request e response com valores inválidos PIX (<ChavePIX>)
        Given que eu preencha o payload dto da proposta com Simplificado SAC:
        And defina parametros Simplificado SAC:
            | Proposta_IsentarIOF | false |
        And que eu valide o metodo de pagamento Simplificado SAC:
            | PaymentType | <PaymentType> |
            | ChavePIX    | <ChavePIX>    |
        When eu envio uma requisição POST para proposta Simplificado SAC
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
        Then recebo status Simplificado SAC 400
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
    @IncluirPropostaManualSimplificadaSAC @Failure
    Scenario Outline: Incluir proposta simplificado - campo obrigatório ausente (<campo_ausente>)
        Given que eu preencha o payload dto da proposta com Simplificado SAC:
        And remova os campos obrigatórios do DTO Simplificado SAC "<campo_ausente>"
        And que eu valide o metodo de pagamento Simplificado SAC:
            | PaymentType | <PaymentType> |
        And defina parametros Simplificado SAC:
            | Proposta_IsentarIOF | <Proposta_IsentarIOF> |
        When eu envio uma requisição POST para proposta Simplificado SAC
        Then recebo status Simplificado SAC 200
            | erroEsperado | true |

        Examples:
            | PaymentType | campo_ausente    | Proposta_IsentarIOF |
            | PIX         | DocumentoCliente | false               |
            | PIX         | VlrSolicitado    | true                |
            | PIX         | CodigoOperacao   | true                |
            | PIX         | ChavePIX         | true                |
            | CONTA       | Conta            | true                |

    # ============================
    # FALHAS - Valores inválidos / negativos / tipos
    # ============================
    @IncluirPropostaManualSimplificadaSAC @Failure
    Scenario Outline: Incluir proposta simplificado - valores inválidos -> erro esperado
        Given que eu preencha o payload dto da proposta com Simplificado SAC:
        And que eu valide o metodo de pagamento Simplificado SAC:
            | PaymentType | <PaymentType> |
        When eu envio uma requisição POST para proposta Simplificado SAC
            | TipoIndiceFinanceiro            | <TipoIndiceFinanceiro>            |
            | PercIndiceFinanceiro            | <PercIndiceFinanceiro>            |
            | Prazo                           | <Prazo>                           |
            | PercJurosNegociado              | <PercJurosNegociado>              |
            | VlrSolicitado                   | <VlrSolicitado>                   |
            | VlrTAC                          | <VlrTAC>                          |
            | CodigoOperacao                  | {{$guid}}                         |
            | DocumentoCliente                | <DocumentoCliente>                |
            | DocumentoParceiroCorrespondente | <DocumentoParceiroCorrespondente> |
        Then recebo status Simplificado SAC 200
            | erroEsperado | true |

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | VlrTAC  | TipoIndiceFinanceiro | DocumentoCliente | DocumentoParceiroCorrespondente | campo_invalido                  |
            | -10   | 1.0                | 150000        | 1500    | 1                    | 007.031.609-07   | 358.638.490-45                  | Prazo                           |
            | 10    | -2                 | 320000        | 1500    | 3                    | 007.031.609-07   | 358.638.490-45                  | PercJurosNegociado              |
            | 20    | 1.5                | -320000       | 1500    | 5                    | 007.031.609-07   | 358.638.490-45                  | VlrSolicitado                   |
            | 10    | 1.5                | 320000        | "texto" | 6                    | 007.031.609-07   | 358.638.490-45                  | VlrTAC                          |
            | 11    | 1.5                | 320000        | 1500    | "texto"              | 007.031.609-07   | 358.638.490-45                  | TipoIndiceFinanceiro            |
            | 08    | 1.5                | 320000        | 1500    | 1                    | 000.000.000-01   | 358.638.490-45                  | DocumentoCliente                |
            | 05    | 1.5                | 320000        | 1500    | 3                    | 007.031.609-07   | 000.000.000-01                  | DocumentoParceiroCorrespondente |
