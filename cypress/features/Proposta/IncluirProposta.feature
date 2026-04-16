Feature: Testes automatizados para criação de uma Proposta. As propostas geradas por esse teste nascem com o status "Em analise".

    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================
    @IncluirProposta @Success
    Scenario: Incluir proposta - mínimo aceitável (campos obrigatórios)
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta       |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 840105.59  |
            | VlrTAC             | 15020.81   |
            | DtContratacao      | 2027-01-04 |
            | DtPrimVencimento   | 2027-07-01 |
            | PmtDesejada        | 1000       |
            | TipoPessoa         | 2          |
            | VlrParcela         | 88         |
            | PropostaModelo     | 2          |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta |
        Then 1recebo status Proposta 200

    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================
    @IncluirProposta @Success
    Scenario: Incluir proposta - com todos os campos preenchidos
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta       |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 840105.59  |
            | VlrTAC             | 15020.81   |
            | DtContratacao      | 2027-01-04 |
            | DtPrimVencimento   | 2027-07-01 |
            | PmtDesejada        | 1000       |
            | TipoPessoa         | 2          |
            | VlrParcela         | 88         |
            | PropostaModelo     | 2          |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta |
        Then 1recebo status Proposta 200

    # ============================
    # SUCESSO - BORDAS / EDGE CASES / Extremos
    # ============================
    @IncluirProposta @Edge
    Scenario Outline: Incluir proposta - casos extremos
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta       |
            | DocumentoCliente                | 007.031.609-07 |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | TipoContrato                    | CSG            |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | <Prazo>              |
            | percJurosNegociado | <percJurosNegociado> |
            | VlrSolicitado      | <VlrSolicitado>      |
            | VlrTAC             | 15020.81             |
            | DtContratacao      | 2027-01-04           |
            | DtPrimVencimento   | 2027-07-01           |
            | PmtDesejada        | 1000                 |
            | TipoPessoa         | 2                    |
            | VlrParcela         | 88                   |
            | PropostaModelo     | 2                    |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta |
        Then 1recebo status Proposta 200

        Examples:
            | Prazo | percJurosNegociado | VlrSolicitado |
            | 1     | 1.0                | 150000        |
            | 50    | 1.5                | 320000        |
            | 12    | 1.99               | 180000        |
            | 20    | 1.2                | 40000         |

    # ============================
    # SUCESSO - Cenários com base em exemplos reais
    # ============================
    @IncluirProposta @Success
    Scenario Outline: Incluir proposta - cenários reais
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta              |
            | DocumentoCliente                | 007.031.609-07        |
            | DocumentoParceiroCorrespondente | 358.638.490-45        |
            | ObservacoesVendedor             | <ObservacoesVendedor> |
            | TipoContrato                    | CSG                   |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | <Prazo>              |
            | percJurosNegociado | <percJurosNegociado> |
            | VlrSolicitado      | <VlrSolicitado>      |
            | VlrTAC             | <VlrTAC>             |
            | TipoPessoa         | <TipoPessoa>         |
            | CodigoVersaoCCB    | <CodigoVersaoCCB>    |
            | NumeroCCB          | <NumeroCCB>          |
            | PropostaModelo     | <PropostaModelo>     |
            | PmtDesejada        | <PmtDesejada>        |
            | VlrParcela         | <VlrParcela>         |
            | DtPrimVencimento   | <DtPrimVencimento>   |
            | DtContratacao      | <DtContratacao>      |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta |
        Then 1recebo status Proposta 200

        Examples:
            | ObservacoesVendedor     | Prazo | TipoPessoa | percJurosNegociado | VlrSolicitado | VlrTAC  | DocumentoCliente | DocumentoParceiroCorrespondente | CodigoVersaoCCB | TipoContrato | NumeroCCB | PropostaModelo | PmtDesejada | VlrParcela | DtPrimVencimento | DtContratacao |
            | Venda balcão - popular  | 10    | 1          | 2.0                | 150000        | 1500.31 | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 5088.25    | 2027-11-13       | 2027-11-04    |
            | Seminovo - médio valor  | 10    | 2          | 1.1                | 20000         | 500     | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 288.25     | 2027-11-13       | 2027-11-04    |
            | Veículo alto padrão     | 10    | 2          | 2.5                | 315000        | 2000.99 | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 1288.25    | 2027-11-13       | 2027-11-04    |
            | Crédito pessoal curto   | 10    | 1          | 1.4                | 29900.99      | 450     | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 1288.25    | 2027-11-13       | 2027-11-04    |
            | Financiamento longo doc | 10    | 2          | 1.3                | 13300.29      | 220.84  | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    |
            | Oferta promocional IOF  | 10    | 1          | 1.0                | 5000          | 130     | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 28.25      | 2027-11-13       | 2027-11-04    |

    # ============================
    # SUCESSO - REGISTRO PIX
    # ============================
    @IncluirProposta @Success
    Scenario Outline: Registrar request e response após inclusão PIX bem sucedida (<ChavePIX>)
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta       |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 840105.59  |
            | VlrTAC             | 15020.81   |
            | DtContratacao      | 2027-01-04 |
            | DtPrimVencimento   | 2027-07-01 |
            | PmtDesejada        | 1000       |
            | TipoPessoa         | 2          |
            | VlrParcela         | 88         |
            | PropostaModelo     | 2          |
        And 1defina parametros Proposta:
            | Nome                | Valor   |
            | Proposta_IsentarIOF | <Valor> |
        And 1que eu valide o metodo de pagamento pix DTO com a chave: "<ChavePIX>"
            | ChavePIX | <ChavePIX> |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta |
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
    @IncluirProposta @Success
    Scenario Outline: Registrar request e response após inclusão Conta bem sucedida
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta       |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 840105.59  |
            | VlrTAC             | 15020.81   |
            | DtContratacao      | 2027-01-04 |
            | DtPrimVencimento   | 2027-07-01 |
            | PmtDesejada        | 1000       |
            | TipoPessoa         | 2          |
            | VlrParcela         | 88         |
            | PropostaModelo     | 2          |
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
            | TipoDeProposta | Proposta |
        Then 1recebo status Proposta 200

        Examples: Pagamento via Conta
            | CodigoBanco | Conta    | TipoConta | Agencia | AgenciaDig | ContaDig | NumeroBanco | DocumentoFederalPagamento | NomePagamento |
            | 001         | 12345678 | 1         | 9891    | 5          | 9        | 747         | 60.317.935/0001-28        | PAGAMENTO     |

    # ============================
    # SUCESSO - REGISTRO Lançamento
    # ============================
    @IncluirProposta @Success
    Scenario Outline: Registrar request e response após inclusão lançamento bem sucedida (<CampoID>)
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta       |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 840105.59  |
            | VlrTAC             | 15020.81   |
            | DtContratacao      | 2027-01-04 |
            | DtPrimVencimento   | 2027-07-01 |
            | PmtDesejada        | 1000       |
            | TipoPessoa         | 2          |
            | VlrParcela         | 88         |
            | PropostaModelo     | 2          |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        And 1que eu valide o Lancamento da Proposta:
            | CampoID                 | <CampoID>                 |
            | VlrTransacao            | <VlrTransacao>            |
            | CodigoBanco             | <CodigoBanco>             |
            | NumeroBanco             | <NumeroBanco>             |
            | TipoConta               | <TipoConta>               |
            | Agencia                 | <Agencia>                 |
            | AgenciaDig              | <AgenciaDig>              |
            | ContaDig                | <ContaDig>                |
            | Conta                   | <Conta>                   |
            | DocumentoFederal        | <DocumentoFederal>        |
            | NomePagamento           | <NomePagamento>           |
            | DtPagamento             | <DtPagamento>             |
            | LinhaDigitavel          | <LinhaDigitavel>          |
            | DocumentoFederalCedente | <DocumentoFederalCedente> |
            | NomeCedente             | <NomeCedente>             |
            | ChavePIX                | <ChavePIX>                |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta |
        Then 1recebo status Proposta 200

        Examples: Pagamento via Conta
            | CampoID | VlrTransacao | CodigoBanco | NumeroBanco | TipoConta | Agencia | AgenciaDig | Conta | ContaDig | DocumentoFederal | NomePagamento    | DtPagamento | DocumentoFederalCedente | NomeCedente         | ChavePIX                             | LinhaDigitavel                                  |
            | TED     | 1462.39      | 001         | 341         | 1         | 3030    | 3          | 49827 | 2        | 007.031.609-07   | PAGAMENTO TED    |             | 834.295.990-24          | Nome Cedente Split  |                                      |                                                 |
            | PIX     | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | jonas@jonas.jonas.com                |                                                 |
            | BOLETO  | 137.67       |             |             |           |         |            |       |          | 975.179.630-07   | PAGAMENTO BOLETO | 2026-03-14  | 834.295.990-24          | Nome Cedente boleto |                                      | 27490001019000001508233025109506913200000013767 |
            | PIX     | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | 11122233301                          |                                                 |
            | PIX     | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | 47991194747                          |                                                 |
            | PIX     | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | +5547991194747                       |                                                 |
            | PIX     | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | b6295ee1-f054-47d1-9e90-ee57b74f60d9 |                                                 |
            | PIX     | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | 97023168000154                       |                                                 |

    # ============================
    # FALHAS - REGISTRO Lançamento
    # ============================
    @IncluirProposta @Failure
    Scenario Outline: Registrar request e response após inclusão lançamento bem sucedida (<CampoID>)
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta       |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 840105.59  |
            | VlrTAC             | 15020.81   |
            | DtContratacao      | 2027-01-04 |
            | DtPrimVencimento   | 2027-07-01 |
            | PmtDesejada        | 1000       |
            | TipoPessoa         | 2          |
            | VlrParcela         | 88         |
            | PropostaModelo     | 2          |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        And 1que eu valide o Lancamento da Proposta:
            | CampoID                 | <CampoID>                 |
            | VlrTransacao            | <VlrTransacao>            |
            | CodigoBanco             | <CodigoBanco>             |
            | NumeroBanco             | <NumeroBanco>             |
            | TipoConta               | <TipoConta>               |
            | Agencia                 | <Agencia>                 |
            | AgenciaDig              | <AgenciaDig>              |
            | ContaDig                | <ContaDig>                |
            | Conta                   | <Conta>                   |
            | DocumentoFederal        | <DocumentoFederal>        |
            | NomePagamento           | <NomePagamento>           |
            | DtPagamento             | <DtPagamento>             |
            | LinhaDigitavel          | <LinhaDigitavel>          |
            | DocumentoFederalCedente | <DocumentoFederalCedente> |
            | NomeCedente             | <NomeCedente>             |
            | ChavePIX                | <ChavePIX>                |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta |
        Then 1recebo status Proposta 400
            | erroEsperado | true |

        Examples: Pagamento via Conta
            | CampoID  | VlrTransacao | CodigoBanco | NumeroBanco | TipoConta | Agencia | AgenciaDig | Conta | ContaDig | DocumentoFederal | NomePagamento    | DtPagamento | DocumentoFederalCedente | NomeCedente         | ChavePIX                         | LinhaDigitavel |
            | invalido | 1462.39      | 001         | 341         | 1         | 3030    | 3          | 49827 | 2        | 007.031.609-07   | PAGAMENTO TED    |             | 834.295.990-24          | Nome Cedente Split  |                                  |                |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | jonaspix.com.br                  |                |
            | BOLETO   | 137.67       |             |             |           |         |            |       |          | 975.179.630-07   | PAGAMENTO BOLETO | 2026-03-14  | 834.295.990-24          | Nome Cedente boleto |                                  | 27490001019000 |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | jonas@pix                        |                |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | 1112223330                       |                |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | 384.639.730-00                   |                |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | 4791194747                       |                |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | +554791194747                    |                |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | 554791194747                     |                |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | 5547991194747                    |                |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | +55 47 9 9119-4747               |                |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | b6295ee1f05447d19e90ee57b74f60d9 |                |
            | PIX      | 250.90       |             |             |           |         |            |       |          | 007.031.609-07   | PAGAMENTO PIX    |             |                         |                     | 17.832.733/0001-95               |                |

    # ============================
    # FALHAS - REGISTRO PIX
    # ============================
    @IncluirProposta @Failure
    Scenario Outline: Registrar request e response com valores inválidos PIX (<ChavePIX>)
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta       |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 840105.59  |
            | VlrTAC             | 15020.81   |
            | DtContratacao      | 2027-01-04 |
            | DtPrimVencimento   | 2027-07-01 |
            | PmtDesejada        | 1000       |
            | TipoPessoa         | 2          |
            | VlrParcela         | 88         |
            | PropostaModelo     | 2          |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | true  |
        And 1que eu valide o metodo de pagamento pix DTO com a chave: "<ChavePIX>"
            | ChavePIX | <ChavePIX> |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta |
        Then 1recebo status Proposta 400
            | erroEsperado | true |

        Examples: Pagamento via PIX valores inválidos
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
    @IncluirProposta @Failure
    Scenario Outline: Incluir proposta - campo obrigatório ausente (<campo_ausente>)
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta       |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | 12         |
            | percJurosNegociado | 1.27       |
            | VlrSolicitado      | 840105.59  |
            | VlrTAC             | 15020.81   |
            | DtContratacao      | 2027-01-04 |
            | DtPrimVencimento   | 2027-07-01 |
            | PmtDesejada        | 1000       |
            | TipoPessoa         | 2          |
            | VlrParcela         | 88         |
            | PropostaModelo     | 2          |
        And 1remova os campos obrigatórios do DTO Proposta: "<campo_ausente>"
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta |
        Then 1recebo status Proposta 400
            | erroEsperado | true |

        Examples:
            | campo_ausente    |
            | CodigoOperacao   |
            | DocumentoCliente |
            | CalculoProposta  |

    # ============================
    # FALHAS - Valores inválidos / negativos
    # ============================
    @IncluirProposta @Failure
    Scenario Outline: Incluir proposta - valores inválidos / negativos (<campo_invalido>)
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta                          |
            | DocumentoCliente                | <DocumentoCliente>                |
            | DocumentoParceiroCorrespondente | <DocumentoParceiroCorrespondente> |
            | CodigoVersaoCCB                 | <CodigoVersaoCCB>                 |
            | TipoContrato                    | <TipoContrato>                    |
            | NumeroCCB                       | <NumeroCCB>                       |
        And 1que eu valide o Calculo da Proposta:
            | Prazo              | <Prazo>              |
            | percJurosNegociado | <percJurosNegociado> |
            | VlrSolicitado      | <VlrSolicitado>      |
            | VlrTAC             | <VlrTAC>             |
            | TipoPessoa         | <TipoPessoa>         |
            | PropostaModelo     | <PropostaModelo>     |
            | PmtDesejada        | <PmtDesejada>        |
            | VlrParcela         | <VlrParcela>         |
            | DtPrimVencimento   | <DtPrimVencimento>   |
            | DtContratacao      | <DtContratacao>      |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta |
        Then 1recebo status Proposta 400
            | erroEsperado | true |

        Examples:
            | Prazo | TipoPessoa | percJurosNegociado | VlrSolicitado | VlrTAC | DocumentoCliente | DocumentoParceiroCorrespondente | CodigoVersaoCCB | TipoContrato | NumeroCCB | PropostaModelo | PmtDesejada | VlrParcela | DtPrimVencimento | DtContratacao | campo_invalido                  |
            | -10   | 1          | 1.0                | 150000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | Prazo                           |
            | 05    | -10        | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | TipoPessoa                      |
            | 10    | 2          | -2                 | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | PercJurosNegociado              |
            | 20    | 2          | 1.5                | -320000       | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | VlrSolicitado                   |
            | 10    | 2          | 1.5                | 320000        | -12500 | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | VlrTAC                          |
            | 08    | 2          | 1.5                | 320000        | 1500   | 000.000.000-01   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | DocumentoCliente                |
            | 05    | 2          | 1.5                | 320000        | 1500   | 007.031.609-07   | 000.000.000-01                  | 5318            | CSG          | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | DocumentoParceiroCorrespondente |
            | 11    | 2          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | -5318           | CSG          | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | CodigoVersaoCCB                 |
            | 05    | 2          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | -CSG         | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | TipoContrato                    |
            | 05    | 2          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | -531      | 2              | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | NumeroCCB                       |
            | 05    | 1          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | -2             | 1000        | 88.25      | 2027-11-13       | 2027-11-04    | PropostaModelo                  |
            | 05    | 1          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | -1000       | 88.25      | 2027-11-13       | 2027-11-04    | PmtDesejada                     |
            | 05    | 1          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | -88.25     | 2027-11-13       | 2027-11-04    | VlrParcela                      |
            | 05    | 2          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 88.25      | 2027-27-27       | 2027-11-04    | DtPrimVencimento                |
            | 05    | 1          | 1.5                | 320000        | 1500   | 007.031.609-07   | 358.638.490-45                  | 5318            | CSG          | 531       | 2              | 1000        | 88.25      | 2027-11-13       | 2027-28-24    | DtContratacao                   |
