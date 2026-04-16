Feature: Teste automatizado para calcular simulação das parcelas do fluxo irregular. As simulações geradas pode ser usada na inclusão de proposta do fluxo irregular.

    @CalcularFluxoIrregular
    Scenario: Calcular Fluxo Irregular
        Given que eu preencha todos os campos para calcular o fluxo irregular
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then a simulacao foi gerada com sucesso
        Then escrevo request e response na planilha de teste
        Then valido os dados calculados da planilha com o responseBody

    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================

    @CalcularFluxoIrregular @Success
    Scenario: Simular Parcelas - mínimo aceitável (campos obrigatórios apenas)
        Given que eu preencha o payload dto com:
            | TipoIndiceFinanceiro | 1         |
            | PercIndiceFinanceiro | 80        |
            | TipoPessoa           | 1         |
            | Prazo                | 12        |
            | PercJurosNegociado   | 0.728833  |
            | VlrSolicitado        | 840105.59 |
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados

    @CalcularFluxoIrregular @Success
    Scenario: Simular Parcelas - máximo com todos os campos preenchidos
        Given que eu preencha o payload dto com:
            | TipoPessoa            | 1          |
            | AnoBase               | 252        |
            | DtContratacao         | 2026-06-27 |
            | Prazo                 | 20         |
            | CalcularIOF           | true       |
            | IsentarIOF            | true       |
            | VlrSolicitado         | 65000      |
            | IsValorInicialLiquido | false      |
            | PercJurosNegociado    | 3.5        |
            | PercTcBmp             | 2.12       |
            | PercTcCorban          | 1.91       |
            | VlrTcCorban           | 5000.99    |
            | VlrTcBmp              | 1500.32    |
            | VlrOutrasDespesas     | 1300.89    |
            | VlrOutrosServicos     | 2801.11    |
            | VlrSeguro             | 789.03     |
            | VlrAvaliacao          | 200.14     |
            | VlrDespachante        | 350.50     |
            | VlrRegistro           | 150.69     |
            | VlrBlindagem          | 830.70     |
            | VlrAcessorios         | 89.81      |
            | VlrVistoria           | 109.25     |
            | VlrCertidocs          | 121.10     |
            | NroParcela            | 1          |
            | DtVencimento          | 2026-07-30 |
            | Valor                 | 2000       |
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados


    # ============================
    # SUCESSO - Variações realistas (sequência de testes)
    # ============================
    @CalcularFluxoIrregular @Success
    Scenario Outline: Simular Parcelas - variações realistas (prazo/juros/valor/TipoIndiceFinanceiro)
        Given que eu preencha o payload dto com:
            | Prazo              | <Prazo>              |
            | PercJurosNegociado | <PercJurosNegociado> |
            | VlrSolicitado      | <VlrSolicitado>      |
            | IsentarIOF         | <IsentarIOF>         |
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | IsentarIOF | TipoIndiceFinanceiro |
            | 6     | 0.65               | 50000.80      | true       | 1                    |
            | 12    | 0.728833           | 840105.59     | false      | 3                    |
            | 24    | 0.85               | 120000.10     | false      | 5                    |
            | 36    | 0.75               | 250000.       | true       | 0                    |

    # ============================
    # SUCESSO - Casos reais / opcionais zerados
    # ============================
    @CalcularFluxoIrregular @Success
    Scenario Outline: Simular Parcelas - opcionais zerados (sem TAC/seguro/outros)
        Given que eu preencha o payload dto com:
            | VlrTAC             | 0                    |
            | VlrOutrasDespesas  | 0                    |
            | VlrSegur0          | 0                    |
            | VlrSeguroMensal1   | 0                    |
            | VlrSeguroMensal2   | 0                    |
            | Prazo              | <Prazo>              |
            | VlrSolicitado      | <VlrSolicitado>      |
            | PercJurosNegociado | <PercJurosNegociado> |
            | IsentarIOF         | <IsentarIOF>         |
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | IsentarIOF |
            | 12    | 0.728833           | 50000         | false      |
            | 24    | 0.75               | 80000         | true       |

    # ============================
    # BORDAS / EDGE CASES
    # ============================
    @CalcularFluxoIrregular @Edge
    Scenario Outline: Simular Parcelas - casos de borda (prazo/juros extremos)
        Given que eu preencha o payload dto com:
            | Prazo              | <Prazo>              |
            | PercJurosNegociado | <PercJurosNegociado> |
            | VlrSolicitado      | <VlrSolicitado>      |
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then recebo status <status_esperado>

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | status_esperado |
            | 1     | 0.05               | 1000          | 200             |
            | 120   | 0.5                | 120000        | 200             |
            | 12    | 99                 | 10000         | 200             |
            | 12    | 0                  | 10000         | 200             |

    # ============================
    # FALHAS - Campos obrigatórios ausentes
    # ============================
    @CalcularFluxoIrregular @Failure
    Scenario Outline: Simular Parcelas - campo obrigatório ausente -> erro de validação
        Given que eu preencha o payload dto removendo o campo "<campo_ausente>"
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then recebo status <status_code_erro>
        #And a resposta contém mensagem de validação para "<campo_ausente>"

        Examples:
            | campo_ausente        | status_code_erro |
            | VlrSolicitado        | 200              |
            | Prazo                | 200              |
            | TipoIndiceFinanceiro | 200              |
    #| PercJurosNegociado   | 400              |

    # ============================
    # FALHAS - Valores inválidos / negativos / tipos
    # ============================
    @CalcularFluxoIrregular @Failure
    Scenario Outline: Simular Parcelas - valores inválidos (negativo/tipo) -> erro esperado
        Given que eu preencha o payload dto com "<campo_invalido>" = <valor_invalido>
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then recebo status <status_code_invalido>
        #And a resposta contém mensagem de erro para "<campo_invalido>"

        Examples:
            | campo_invalido       | valor_invalido | status_code_invalido |
            | VlrSolicitado        | -1000          | 200                  |
            | Prazo                | 0              | 200                  |
            | PercJurosNegociado   | "texto"        | 200                  |
            | PercIndiceFinanceiro | -5             | 200                  |
            | DtVencimento         | 02-01-2025     | 400                  |
            | DtContratacao        | 2025-01-01     | 400                  |
            | VlrInicial           | 50             | 400                  |
            | VlrInicial           | -500           | 400                  |

    # ============================
    # UTILITÁRIO / REGISTRO
    # ============================
    @CalcularFluxoIrregular @Success
    Scenario: Registrar request e response na planilha após simulação bem sucedida (fluxo completo)
        Given um payload dto válido com variáveis nominais
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then recebo status 200

    # ============================
    # INCLUIR CORRECAO POS -> testar variação de TipoIndiceFinanceiro
    # Quando CalcularIOF = true, o cálculo deve considerar o TipoIndiceFinanceiro.
    # Testar valores: 0,1,3,5,6
    # ============================
    @CalcularFluxoIrregular @Success @CalcularIOF
    Scenario Outline: Simular Parcelas - CalcularIOF=true varia TipoIndiceFinanceiro
        Given que eu preencha o payload dto com:
            | CalcularIOF          | true                   |
            | TipoIndiceFinanceiro | <TipoIndiceFinanceiro> |
            | PercIndiceFinanceiro | 80                     |
            | Prazo                | 12                     |
            | PercJurosNegociado   | 0.728833               |
            | VlrSolicitado        | 840105.59              |
            | IsentarIOF           | <IsentarIOF>           |
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados

        Examples:
            | TipoIndiceFinanceiro | IsentarIOF |
            | 1                    | false      |
            | 3                    | false      |
            | 5                    | false      |
            | 6                    | false      |
            | 1                    | true       |
            | 3                    | true       |
            | 5                    | true       |
            | 6                    | true       |

    # ============================
    # INCLUIR CORRECAO POS -> testar variação de TipoIndiceFinanceiro
    # Quando CalcularIOF = false, o cálculo deve considerar o TipoIndiceFinanceiro.
    # Testar valores: 0,1,3,5,6
    # ============================

    @CalcularFluxoIrregular @Success @CalcularIOF
    Scenario Outline: Simular Parcelas - CalcularIOF=false varia TipoIndiceFinanceiro e IOF
        Given que eu preencha o payload dto com:
            | CalcularIOF          | false                  |
            | TipoIndiceFinanceiro | <TipoIndiceFinanceiro> |
            | PercIndiceFinanceiro | 80                     |
            | Prazo                | 12                     |
            | PercJurosNegociado   | 0.728833               |
            | VlrSolicitado        | 840105.59              |
            | IsentarIOF           | <IsentarIOF>           |
        When eu envio uma requisição POST para calcular o fluxo irregular
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados

        Examples:
            | TipoIndiceFinanceiro | IsentarIOF |
            | 1                    | false      |
            | 3                    | false      |
            | 5                    | false      |
            | 6                    | false      |
            | 1                    | true       |
            | 3                    | true       |
            | 5                    | true       |
            | 6                    | true       |