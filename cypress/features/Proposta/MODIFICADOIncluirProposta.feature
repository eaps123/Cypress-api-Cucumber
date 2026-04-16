Feature: Testes automatizados para criação de uma Proposta. As propostas geradas por esse teste nascem com o status "Em analise".

    # ============================
    # MODIFICADO
    # ============================
    @IncluirProposta @Success
    Scenario: Incluir proposta - mínimo aceitável (campos obrigatórios)
        Given que eu preencha o payload dto da Proposta MODIFICADO:
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
        And defina parametros Proposta MODIFICADO:
            | Nome                | Valor  |
            | Proposta_IsentarIOF | false  |
        When eu envio uma requisição POST para Proposta MODIFICADO
        Then recebo status Proposta 200
    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================
    @IncluirProposta @Success
    Scenario: Incluir proposta - com todos os campos preenchidos
         Given que eu preencha o payload dto da Proposta MODIFICADO:
            | DocumentoCliente                | 007.031.609-07           |
            | DocumentoParceiroCorrespondente | 358.638.490-45           |
            | TipoContrato                    | CSG                      |
            | CodigoVersaoCCB                 | 5318                     |
            | NumeroCCB                       | 531                      |
            | PropostaModelo                  | 2                        |
            | PmtDesejada                     | 1000                     |
            | Prazo                           | 12                       |
            | PercJurosNegociado              | 1.27                     |
            | VlrParcela                      | 88                       |
            | VlrSolicitado                   | 840105.59                |
            | VlrTAC                          | 15020.81                 |
            | DtPrimVencimento                | 2027-11-05T22:03:06.554Z |
            | TipoPessoa                      | 2                        |
            | DtContratacao                   | 2027-11-04               |
            | CodigoBanco                     | 80                       |
            | TipoConta                       | 2                        |
            | Agencia                         | 9891                     |
            | AgenciaDig                      | 5                        |
            | Conta                           | 95387342                 |
            | ContaDig                        | 9                        |
            | NumeroBanco                     | 747                      |
            | DocumentoFederalPagamento       | 60.317.935/0001-28       |
            | NomePagamento                   | Nome PAGAMENTO           |
        And defina parametros Proposta MODIFICADO:
            | Nome                        | Valor |
            | Proposta_IsentarIOF         | false |
            | SITUACAOPROPOSTAEMDIGITACAO | true  |
        When eu envio uma requisição POST para Proposta MODIFICADO
        Then recebo status Proposta 200
 

    # ============================
    # SUCESSO - BORDAS / EDGE CASES / Extremos
    # ============================
    @IncluirProposta @Edge
    Scenario Outline: Incluir proposta - casos extremos
        Given que eu preencha o payload dto da Proposta MODIFICADO:
            | Prazo                           | <Prazo>              |
            | PercJurosNegociado              | <PercJurosNegociado> |
            | VlrSolicitado                   | <VlrSolicitado>      |
            | DocumentoCliente                | 007.031.609-07       |
            | DocumentoParceiroCorrespondente | 358.638.490-45       |
            | TipoContrato                    | CSG                  |
        When eu envio uma requisição POST para Proposta MODIFICADO
        Then recebo status Proposta <status_esperado>

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | status_esperado |
            | 1     | 1.0                | 150000        | 200             |
            | 50    | 1.5                | 320000        | 200             |
            | 12    | 1.99               | 180000        | 200             |
            | 20    | 1.2                | 40000         | 200             |

    # ============================
    # SUCESSO - Quando IncluirCorrecaoPos = true, validar variações do TipoIndiceFinanceiro: 0,1,3,5,6
    # ============================
    @IncluirProposta @Success
    Scenario Outline: Incluir proposta - varia TipoIndiceFinanceiro e IOF
        Given que eu preencha o payload dto da Proposta MODIFICADO:
            | TipoIndiceFinanceiro            | <TipoIndiceFinanceiro> |
            | PercIndiceFinanceiro            | 120                    |
            | Prazo                           | 12                     |
            | PercJurosNegociado              | 1.27                   |
            | VlrSolicitado                   | 840105.59              |
            | VlrTAC                          | 15020.81               |
            | DocumentoCliente                | 007.031.609-07         |
            | DocumentoParceiroCorrespondente | 358.638.490-45         |
        And defina parametros Proposta MODIFICADO:
            | Nome                        | Valor                  |
            | Proposta_IsentarIOF         | <Proposta_IsentarIOF>  |
        When eu envio uma requisição POST para Proposta MODIFICADO
        Then recebo status Proposta 200

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
    @IncluirProposta @Success
    Scenario Outline: Incluir proposta - cenários reais
        Given que eu preencha o payload dto da Proposta MODIFICADO:
            | DocumentoCliente                | 007.031.609-07        |
            | DocumentoParceiroCorrespondente | 358.638.490-45        |
            | ObservacoesVendedor             | <ObservacoesVendedor> |
            | TipoContrato                    | CSG                   |
            | Prazo                           | <Prazo>               |
            | PercJurosNegociado              | <PercJurosNegociado>  |
            | VlrSolicitado                   | <VlrSolicitado>       |
            | VlrTAC                          | <VlrTAC>              |
            | TipoPessoa                      | <TipoPessoa>          |
            | CodigoVersaoCCB                 | <CodigoVersaoCCB>     |
            | NumeroCCB                       | <NumeroCCB>           |
            | PropostaModelo                  | <PropostaModelo>      |
            | PmtDesejada                     | <PmtDesejada>         |
            | VlrParcela                      | <VlrParcela>          |
            | DtPrimVencimento                | <DtPrimVencimento>    |
            | DtContratacao                   | <DtContratacao>       |
        And defina parametros Proposta MODIFICADO:
            | Nome                        | Valor                  |
            | Proposta_IsentarIOF         | <Proposta_IsentarIOF>  |
        When eu envio uma requisição POST para Proposta MODIFICADO
        Then recebo status Proposta 200

        Examples:
            | ObservacoesVendedor     | Prazo | TipoPessoa | PercJurosNegociado | VlrSolicitado | VlrTAC  | DocumentoCliente | DocumentoParceiroCorrespondente | CodigoVersaoCCB | TipoContrato | NumeroCCB | PropostaModelo | PmtDesejada | VlrParcela | DtPrimVencimento | DtContratacao |
            | Venda balcão - popular  | 10    | 1          | 2.0                | 150000        | 1500.31 | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 5088.25    | "2027-11-13"     | "2027-11-04"  |
            | Seminovo - médio valor  | 10    | 2          | 1.1                | 20000         | 500     | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 288.25     | "2027-11-13"     | "2027-11-04"  |
            | Veículo alto padrão     | 10    | 2          | 2.5                | 315000        | 2000.99 | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 1288.25    | "2027-11-13"     | "2027-11-04"  |
            | Crédito pessoal curto   | 10    | 1          | 1.4                | 29900.99      | 450     | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 1288.25    | "2027-11-13"     | "2027-11-04"  |
            | Financiamento longo doc | 10    | 2          | 1.3                | 13300.29      | 220.84  | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  |
            | Oferta promocional IOF  | 10    | 1          | 1.0                | 5000          | 130     | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 28.25      | "2027-11-13"     | "2027-11-04"  |

    # ============================
    # SUCESSO - REGISTRO PIX
    # ============================
    @IncluirProposta @Success
    Scenario Outline: Registrar request e response após inclusão PIX bem sucedida (<ChavePIX>)
        Given que eu preencha o payload dto da Proposta MODIFICADO:
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | VlrParcela                      | 200            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | DtPrimeiroVencto                | 2026-08-14     |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
        And defina parametros Proposta MODIFICADO:
            | Nome                        | Valor |
            | Proposta_IsentarIOF         | true  |
        And que eu valide o metodo de pagamento pix com a chave: "<ChavePIX>"
        When eu envio uma requisição POST para Proposta MODIFICADO
        Then recebo status Proposta 200

     Examples: 
            | ChavePIX                             | 
            | jonas@pix.teste                      | 
            | 11122233301                          | 
            | 47991194747                          | 
            | +5547991194747                       | 
            | b6295ee1-f054-47d1-9e90-ee57b74f60d9 | 
            | 97023168000154                       | 

    # ============================
    # FALHAS - REGISTRO PIX
    # ============================
    @IncluirProposta @Failure
    Scenario Outline: Registrar request e response com valores inválidos PIX (<ChavePIX>)
        Given que eu preencha o payload dto da Proposta MODIFICADO:
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | VlrParcela                      | 200            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | DtPrimeiroVencto                | 2026-08-14     |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
        And defina parametros Proposta MODIFICADO:
            | Nome                        | Valor |
            | Proposta_IsentarIOF         | false |
        And que eu valide o metodo de pagamento pix com a chave: "<ChavePIX>"
        When eu envio uma requisição POST para Proposta MODIFICADO
        Then recebo status Proposta 400
            | erroEsperado | true |

     Examples: 
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
    # SUCESSO - REGISTRO CONTA
    # ============================
    @IncluirProposta @Success
    Scenario: Registrar request e response após inclusão Conta bem sucedida
        Given que eu preencha o payload dto da Proposta MODIFICADO:
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | VlrParcela                      | 200            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | DtPrimeiroVencto                | 2026-08-14     |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
        And defina parametros Proposta MODIFICADO:
            | Nome                        | Valor |
            | Proposta_IsentarIOF         | false |
        And que eu valide o metodo de pagamento como conta
            | CodigoBanco               | 001                |
            | Conta                     | 12345678           |
            | TipoConta                 | 1                  |
            | Agencia                   | 9891               |
            | AgenciaDig                | 5                  |
            | ContaDig                  | 9                  |
            | NumeroBanco               | 747                |
            | DocumentoFederalPagamento | 60.317.935/0001-28 |
            | NomePagamento             | PAGAMENTO          |
        When eu envio uma requisição POST para Proposta MODIFICADO
        Then recebo status Proposta 200

    # ============================
    # FALHAS - Campos obrigatórios ausentes
    # ============================
    @IncluirProposta @Failure
    Scenario Outline: Incluir proposta - campo obrigatório ausente (<campo_ausente>)
        Given que eu preencha o payload dto da Proposta MODIFICADO:
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | VlrParcela                      | 200            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | DtPrimeiroVencto                | 2026-08-14     |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
        And remova os campos obrigatórios do DTO Proposta "<campo_ausente>"
        When eu envio uma requisição POST para Proposta MODIFICADO
        Then recebo status Proposta 400
            | erroEsperado | true |

     Examples: 
            | campo_ausente                   |
            | Prazo                           |
            | PercJurosNegociado              |
            | VlrSolicitado                   |
            | VlrTAC                          |
            | CodigoOperacao                  |
            | DocumentoCliente                |
            | DocumentoParceiroCorrespondente |
            | TipoPessoa                      |
            | CodigoVersaoCCB                 |
            | TipoContrato                    |
            | NumeroCCB                       |
            | PropostaModelo                  |

      # ============================
    # FALHAS - Valores inválidos / negativos
    # ============================
    @IncluirProposta @Failure
    Scenario Outline: Incluir proposta - valores inválidos / negativos (<campo_invalido>)
        Given que eu preencha o payload dto da Proposta MODIFICADO:         
            | Prazo                           | <Prazo>                           |
            | PercJurosNegociado              | <PercJurosNegociado>              |
            | VlrSolicitado                   | <VlrSolicitado>                   |
            | VlrTAC                          | <VlrTAC>                          |
            | DocumentoCliente                | <DocumentoCliente>                |
            | DocumentoParceiroCorrespondente | <DocumentoParceiroCorrespondente> |
            | TipoPessoa                      | <TipoPessoa>                      |
            | CodigoVersaoCCB                 | <CodigoVersaoCCB>                 |
            | TipoContrato                    | <TipoContrato>                    |
            | NumeroCCB                       | <NumeroCCB>                       |
            | PropostaModelo                  | <PropostaModelo>                  |
            | PmtDesejada                     | <PmtDesejada>                     |
            | VlrParcela                      | <VlrParcela>                      |
            | DtPrimVencimento                | <DtPrimVencimento>                |
            | DtContratacao                   | <DtContratacao>                   |
        When eu envio uma requisição POST para Proposta MODIFICADO
        Then recebo status Proposta 400
        | erroEsperado | true |
            
Examples:
            | Prazo | TipoPessoa | PercJurosNegociado | VlrSolicitado | VlrTAC | DocumentoCliente | DocumentoParceiroCorrespondente | CodigoVersaoCCB | TipoContrato | NumeroCCB | PropostaModelo | PmtDesejada | VlrParcela | DtPrimVencimento | DtContratacao | campo_invalido                  |
            | -10   | 1          | 1.0                | 150000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | Prazo                           |
            | 05    | -10        | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | TipoPessoa                      |
            | 10    | 2          | -2                 | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | PercJurosNegociado              |
            | 20    | 2          | 1.5                | -320000       | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | VlrSolicitado                   |
            | 10    | 2          | 1.5                | 320000        | -12500 | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | VlrTAC                          |
            | 08    | 2          | 1.5                | 320000        | 1500   | 000.000.000-01   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | DocumentoCliente                |
            | 05    | 2          | 1.5                | 320000        | 1500   | 007.031.609-07   | 000.000.000-01                  | 5318            | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | DocumentoParceiroCorrespondente |
            | 11    | 2          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | -5318           | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | CodigoVersaoCCB                 |
            | 05    | 2          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | -CSG         | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | TipoContrato                    |
            | 05    | 2          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | -531      | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | NumeroCCB                       |
            | 05    | 1          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | -2             | 1000        | 88.25      | "2027-11-13"     | "2027-11-04"  | PropostaModelo                  |
            | 05    | 1          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | -1000       | 88.25      | "2027-11-13"     | "2027-11-04"  | PmtDesejada                     |
            | 05    | 1          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | -88.25     | "2027-11-13"     | "2027-11-04"  | VlrParcela                      |
            | 05    | 2          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-27-27"     | "2027-11-04"  | DtPrimVencimento                |
            | 05    | 1          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | "CSG"        | 531       | 2              | 1000        | 88.25      | "2027-11-13"     | "2027-28-24"  | DtContratacao                   |

