Feature: Teste automatizado para validação da forma de pagamento PIX.

    # ============================
    # SUCESSO - Incluir Proposta 
    # ============================
    @PIXIncluirProposta @Success
    Scenario Outline: Adicionando forma de pagamento PIX na proposta
        Given que eu preencha o payload dto com:
            | TipoIndiceFinanceiro      | 1                           |
            | PercIndiceFinanceiro      | 80                          |
            | TipoPessoa                | 1                           |
            | Prazo                     | 12                          |
            | PercJurosNegociado        | 0.728833                    |
            | VlrSolicitado             | 840105.59                   |
            | IncluirCorrecaoPos        | true                        |
            | CodigoOperacao            | {{$guid}}                   |
            | PaymentType               | <PaymentType>               |
            | ChavePIX                  | <ChavePIX>                  |
            | CodigoBanco               | <CodigoBanco>               |
            | Conta                     | <Conta>                     |
            | TipoConta                 | <TipoConta>                 |
            | Agencia                   | <Agencia>                   |
            | AgenciaDig                | <AgenciaDig>                |
            | ContaDig                  | <ContaDig>                  |
            | NumeroBanco               | <NumeroBanco>               |
            | DocumentoFederalPagamento | <DocumentoFederalPagamento> |
            | NomePagamento             | <NomePagamento>             |
        And eu defina parametros:
            | Proposta_IsentarIOF | false |
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status 200

        # Examples for: Incluir proposta - varia PIX e Conta Pagamento
        Examples: Varia PIX e Conta Pagamento
            | CodigoOperacao | ChavePIX            | CodigoBanco | Conta    | TipoConta | Agencia | AgenciaDig | ContaDig | NumeroBanco | DocumentoFederalPagamento | NomePagamento  | Proposta_IsentarIOF | SITUACAOPROPOSTAEMDIGITACAO |
            | {{$guid}}      | jonas@pix.teste     |             |          |           |          |           |          |             |                           |                | true                | true                        |
            | {{$guid}}      | 11122233301         |             |          |           |          |           |          |             |                           |                | true                | true                        |
            | {{$guid}}      | 47991194747         |             |          |           |          |           |          |             |                           |                | true                | true                        |
            | {{$guid}}      |                     | 001         | 12345678 | 1         | 9891     | 5         | 9        | 747         | 60.317.935/0001-28        |  PAGAMENTO     | true                | true                        |
            | {{$guid}}      |                     | 468         | 1111     | 1         | 9891     | 5         | 9        | 747         | 60.317.935/0001-28        |  PAGAMENTO     | true                | true                        |
    # ============================
    # SUCESSO - Proposta Manual SAC
    # ============================
    @PIXIncluirPropostaManualSAC @Success
    Scenario Outline: Incluir proposta manual SAC com forma de pagamento PIX
        Given que eu preencha o payload dto da proposta com SAC:
            | DocumentoParceiroCorrespondente | 358.638.490-45              |
            | DocumentoCliente                | 007.031.609-07              |
            | TipoContrato                    | CSG                         |
            | VlrIOF                          | 200                         |
            | PercIOF                         | 1                           |
            | PercIOFAdicional                | 10                          |
            | TipoIndiceFinanceiro            | 5                           |
            | PercIndiceFinanceiro            | 120                         |
            | Prazo                           | 12                          |
            | PercJurosNegociado              | 1.27                        |
            | VlrSolicitado                   | 840105.59                   |
            | VlrTAC                          | 15020.81                    |
            | CodigoOperacao                  | {{$guid}}                   |
            | PaymentType                     | <PaymentType>               |
            | ChavePIX                        | <ChavePIX>                  |
            | CodigoBanco                     | <CodigoBanco>               |
            | Conta                           | <Conta>                     |
            | TipoConta                       | <TipoConta>                 |
            | Agencia                         | <Agencia>                   |
            | AgenciaDig                      | <AgenciaDig>                |
            | ContaDig                        | <ContaDig>                  |
            | NumeroBanco                     | <NumeroBanco>               |
            | DocumentoFederalPagamento       | <DocumentoFederalPagamento> |
            | NomePagamento                   | <NomePagamento>             |
        And eu defina parametros SAC:
            | Proposta_IsentarIOF         | false |
            | SITUACAOPROPOSTAEMDIGITACAO | true  |
        When eu envio uma requisição POST para proposta SAC
        Then recebo status SAC 200

        # Examples for: Incluir proposta - varia PIX e Conta Pagamento
        Examples: Varia PIX e Conta Pagamento
            | CodigoOperacao | ChavePIX            | CodigoBanco | Conta    | TipoConta | Agencia | AgenciaDig | ContaDig | NumeroBanco | DocumentoFederalPagamento | NomePagamento  | Proposta_IsentarIOF | SITUACAOPROPOSTAEMDIGITACAO |
            | {{$guid}}      | jonas@pix.teste     |             |          |           |          |           |          |             |                           |                | true                | true                        |
            | {{$guid}}      | 11122233301         |             |          |           |          |           |          |             |                           |                | true                | true                        |
            | {{$guid}}      | 47991194747         |             |          |           |          |           |          |             |                           |                | true                | true                        |
            | {{$guid}}      |                     | 001         | 12345678 | 1         | 9891     | 5         | 9        | 747         | 60.317.935/0001-28        |  PAGAMENTO     | true                | true                        |
            | {{$guid}}      |                     | 468         | 1111     | 1         | 9891     | 5         | 9        | 747         | 60.317.935/0001-28        |  PAGAMENTO     | true                | true                        |
    # ============================
    # SUCESSO - Proposta Manual
    # ============================
    @PIXPropostaManual @Success
    Scenario Outline: Inserir Proposta Manual
        Given que eu preencha o payload dto da proposta manual com:
            | DocumentoParceiroCorrespondente | 358.638.490-45              |
            | DocumentoCliente                | 007.031.609-07              |
            | TipoContrato                    | CSG                         |
            | VlrIOF                          | 200                         |
            | PercIOF                         | 1                           |
            | PercIOFAdicional                | 10                          |
            | TipoIndiceFinanceiro            | 5                           |
            | PercIndiceFinanceiro            | 120                         |
            | Prazo                           | 12                          |
            | PercJurosNegociado              | 1.27                        |
            | DtPrimeiroVencto                | 2026-08-14                  |
            | VlrSolicitado                   | 840105.59                   |
            | VlrTAC                          | 15020.81                    |
            | CodigoOperacao                  | {{$guid}}                   |
            | PaymentType                     | <PaymentType>               |
            | ChavePIX                        | <ChavePIX>                  |
            | CodigoBanco                     | <CodigoBanco>               |
            | Conta                           | <Conta>                     |
            | TipoConta                       | <TipoConta>                 |
            | Agencia                         | <Agencia>                   |
            | AgenciaDig                      | <AgenciaDig>                |
            | ContaDig                        | <ContaDig>                  |
            | NumeroBanco                     | <NumeroBanco>               |
            | DocumentoFederalPagamento       | <DocumentoFederalPagamento> |
            | NomePagamento                   | <NomePagamento>             |
        When eu envio uma requisição POST para o cadastro de uma proposta manual
        Then recebo status 200    

        # Examples for: Incluir proposta - varia PIX e Conta Pagamento
        Examples: Varia PIX e Conta Pagamento
            | CodigoOperacao | ChavePIX            | CodigoBanco | Conta    | TipoConta | Agencia | AgenciaDig | ContaDig | NumeroBanco | DocumentoFederalPagamento | NomePagamento  |
            | {{$guid}}      | jonas@pix.teste     |             |          |           |          |           |          |             |                           |                |
            | {{$guid}}      | 11122233301         |             |          |           |          |           |          |             |                           |                |
            | {{$guid}}      | 47991194747         |             |          |           |          |           |          |             |                           |                |
            | {{$guid}}      |                     | 001         | 12345678 | 1         | 9891     | 5         | 9        | 747         | 60.317.935/0001-28        |  PAGAMENTO     |
            | {{$guid}}      |                     | 468         | 1111     | 1         | 9891     | 5         | 9        | 747         | 60.317.935/0001-28        |  PAGAMENTO     |

    # ============================
    # SUCESSO - Proposta Manual Simplificada PIX
    # ============================
    @PIXIncluirPropostaManualSimplificada @Success
    Scenario Outline: Incluir proposta manual simplificada PIX
        Given que eu preencha o payload dto da proposta manual simplificada com:
            | DocumentoParceiroCorrespondente | 358.638.490-45              |
            | DocumentoCliente                | 007.031.609-07              |
            | TipoContrato                    | CSG                         |
            | VlrIOF                          | 200                         |
            | PercIOF                         | 1                           |
            | VlrParcela                      | 200                         |
            | PercIOFAdicional                | 10                          |
            | TipoIndiceFinanceiro            | 5                           |
            | PercIndiceFinanceiro            | 120                         |
            | Prazo                           | 12                          |
            | PercJurosNegociado              | 1.27                        |
            | DtPrimeiroVencto                | 2026-08-14                  |
            | VlrSolicitado                   | 840105.59                   |
            | VlrTAC                          | 15020.81                    |
            | CodigoOperacao                  | {{$guid}}                   |
            | PaymentType                     | <PaymentType>               |
            | ChavePIX                        | <ChavePIX>                  |
        
        And eu defina parametros:
            | Proposta_IsentarIOF | false |
        When eu envio uma requisição POST para o cadastro de uma proposta manual simplificada
        Then recebo status 200

         # Examples for: Incluir proposta - varia PIX e Conta Pagamento
        Examples: Varia PIX e Conta Pagamento
           | PaymentType | CodigoOperacao | ChavePIX            | Proposta_IsentarIOF | SITUACAOPROPOSTAEMDIGITACAO |
           | PIX         | {{$guid}}      | jonas@pix.teste     | true                | true                        |
           | PIX         | {{$guid}}      | 11122233301         | true                | true                        |
           | PIX         | {{$guid}}      | 47991194747         | true                | true                        |

    # ============================
    # SUCESSO - Proposta Manual Simplificada CONTA
    # ============================
    @CONTAIncluirPropostaManualSimplificada @Success
    Scenario Outline: Incluir proposta manual simplificada CONTA
        Given que eu preencha o payload dto da proposta manual simplificada com:
            | DocumentoParceiroCorrespondente | 358.638.490-45              |
            | DocumentoCliente                | 007.031.609-07              |
            | TipoContrato                    | CSG                         |
            | VlrIOF                          | 200                         |
            | VlrParcela                      | 200                         |
            | PercIOF                         | 1                           |
            | PercIOFAdicional                | 10                          |
            | TipoIndiceFinanceiro            | 5                           |
            | PercIndiceFinanceiro            | 120                         |
            | Prazo                           | 12                          |
            | PercJurosNegociado              | 1.27                        |
            | DtPrimeiroVencto                | 2026-08-14                  |
            | VlrSolicitado                   | 840105.59                   |
            | VlrTAC                          | 15020.81                    |
            | CodigoOperacao                  | {{$guid}}                   |
            | PaymentType                     | <PaymentType>               |
            | CodigoBanco                     | <CodigoBanco>               |
            | Conta                           | <Conta>                     |
            | TipoConta                       | <TipoConta>                 |
            | Agencia                         | <Agencia>                   |
            | AgenciaDig                      | <AgenciaDig>                |
            | ContaDig                        | <ContaDig>                  |
            | NumeroBanco                     | <NumeroBanco>               |
            | DocumentoFederalPagamento       | <DocumentoFederalPagamento> |
            | NomePagamento                   | <NomePagamento>             |
        And eu defina parametros:
            | Proposta_IsentarIOF | false |
        When eu envio uma requisição POST para o cadastro de uma proposta manual simplificada
        Then recebo status 200

         # Examples for: Incluir proposta - varia PIX e Conta Pagamento
        Examples: Varia PIX e Conta Pagamento
           | PaymentType | CodigoOperacao | CodigoBanco | Conta    | TipoConta | Agencia | AgenciaDig | ContaDig | NumeroBanco | DocumentoFederalPagamento | NomePagamento  | Proposta_IsentarIOF | SITUACAOPROPOSTAEMDIGITACAO |
           | CONTA       | {{$guid}}      | 001         | 12345678 | 1         | 9891     | 5         | 9        | 747         | 60.317.935/0001-28        |  PAGAMENTO     | true                | true                        |
    
    # ============================
    # SUCESSO - Proposta Manual Simplificada SAC PIX
    # ============================
    @IncluirPropostaManualSimplificadaSAC @Success
    Scenario Outline: Registrar request e response após inclusão PIX bem sucedida
        Given que eu preencha o payload dto da proposta manual simplificada com:
            | DocumentoParceiroCorrespondente | 358.638.490-45              |
            | DocumentoCliente                | 007.031.609-07              |
            | TipoContrato                    | CSG                         |
            | VlrIOF                          | 200                         |
            | PercIOF                         | 1                           |
            | VlrParcela                      | 200                         |
            | PercIOFAdicional                | 10                          |
            | TipoIndiceFinanceiro            | 5                           |
            | PercIndiceFinanceiro            | 120                         |
            | Prazo                           | 12                          |
            | PercJurosNegociado              | 1.27                        |
            | DtPrimeiroVencto                | 2026-08-14                  |
            | VlrSolicitado                   | 840105.59                   |
            | VlrTAC                          | 15020.81                    |
            | CodigoOperacao                  | {{$guid}}                   |
            | PaymentType                     | <PaymentType>               |
            | ChavePIX                        | <ChavePIX>                  |
        
        And eu defina parametros:
            | Proposta_IsentarIOF | false |
        When eu envio uma requisição POST para proposta Simplificado SAC
        Then recebo status 200

         # Examples for: Incluir proposta - varia PIX e Conta Pagamento
        Examples: Varia PIX e Conta Pagamento
           | PaymentType | CodigoOperacao | ChavePIX            | Proposta_IsentarIOF | SITUACAOPROPOSTAEMDIGITACAO |
           | PIX         | {{$guid}}      | jonas@pix.teste     | true                | true                        |
           | PIX         | {{$guid}}      | 11122233301         | true                | true                        |
           | PIX         | {{$guid}}      | 47991194747         | true                | true                        |

    # ============================
    # SUCESSO - Proposta Manual Simplificada SAC CONTA
    # ============================
    @IncluirPropostaManualSimplificadaSAC @Success
    Scenario Outline: Registrar request e response após inclusão Conta bem sucedida
        Given que eu preencha o payload dto da proposta manual simplificada com:
            | DocumentoParceiroCorrespondente | 358.638.490-45              |
            | DocumentoCliente                | 007.031.609-07              |
            | TipoContrato                    | CSG                         |
            | VlrIOF                          | 200                         |
            | VlrParcela                      | 200                         |
            | PercIOF                         | 1                           |
            | PercIOFAdicional                | 10                          |
            | TipoIndiceFinanceiro            | 5                           |
            | PercIndiceFinanceiro            | 120                         |
            | Prazo                           | 12                          |
            | PercJurosNegociado              | 1.27                        |
            | DtPrimeiroVencto                | 2026-08-14                  |
            | VlrSolicitado                   | 840105.59                   |
            | VlrTAC                          | 15020.81                    |
            | CodigoOperacao                  | {{$guid}}                   |
            | PaymentType                     | <PaymentType>               |
            | CodigoBanco                     | <CodigoBanco>               |
            | Conta                           | <Conta>                     |
            | TipoConta                       | <TipoConta>                 |
            | Agencia                         | <Agencia>                   |
            | AgenciaDig                      | <AgenciaDig>                |
            | ContaDig                        | <ContaDig>                  |
            | NumeroBanco                     | <NumeroBanco>               |
            | DocumentoFederalPagamento       | <DocumentoFederalPagamento> |
            | NomePagamento                   | <NomePagamento>             |
        And eu defina parametros:
            | Proposta_IsentarIOF | false |
        When eu envio uma requisição POST para proposta Simplificado SAC
        Then a resposta foi recebida com sucesso SAC

         # Examples for: Incluir proposta - varia PIX e Conta Pagamento
        Examples: Varia PIX e Conta Pagamento
           | PaymentType | CodigoOperacao | CodigoBanco | Conta    | TipoConta | Agencia | AgenciaDig | ContaDig | NumeroBanco | DocumentoFederalPagamento | NomePagamento  | Proposta_IsentarIOF | SITUACAOPROPOSTAEMDIGITACAO |
           | CONTA       | {{$guid}}      | 001         | 12345678 | 1         | 9891     | 5         | 9        | 747         | 60.317.935/0001-28        |  PAGAMENTO     | true                | true                        |
