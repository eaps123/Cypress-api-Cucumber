Feature: Teste automatizado para simulação das parcelas de uma Proposta SAC.

    # ============================
    # SUCESSO - Cenários mínimos e máximos
    # ============================

    @CalculaGridParcelasSimplificadoSAC @Success
    Scenario: Simular Parcelas - mínimo aceitável (campos obrigatórios apenas)
        Given que eu preencha o payload dto com:
            | TipoIndiceFinanceiro | 1         |
            | PercIndiceFinanceiro | 80        |
            | TipoPessoa           | 1         |
            | Prazo                | 12        |
            | PercJurosNegociado   | 0.728833  |
            | VlrSolicitado        | 840105.59 |
            | IncluirCorrecaoPos   | true      |
        And eu defina parametros:
            | Proposta_IsentarIOF | false |
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados

    @CalculaGridParcelasSimplificadoSAC @Success
    Scenario: Simular Parcelas - máximo com todos os campos preenchidos
        Given que eu preencha o payload dto com:
            | IncluirCorrecaoPos   | true      |
            | TipoIndiceFinanceiro | 1         |
            | PercIndiceFinanceiro | 80        |
            | VlrProdutoBem        | 3500000   |
            | TipoPessoa           | 1         |
            | AnoBase              | 365       |
            | NroDiasAcrescimo     | 28        |
            | Prazo                | 12        |
            | PercJurosNegociado   | 0.728833  |
            | VlrSolicitado        | 840105.59 |
            | VlrTAC               | 15020.81  |
            | VlrOutrasDespesas    | 180.10    |
            | VlrOutrosServicos    | 100.63    |
            | VlrSeguro            | 799.19    |
            | VlrAvaliacao         | 245.15    |
            | VlrDespachante       | 345.09    |
            | VlrRegistro          | 180.70    |
            | VlrBlindagem         | 99.99     |
            | VlrAcessorios        | 81.34     |
            | VlrVistoria          | 42.28     |
            | VlrCertidocs         | 1000.01   |
            | VlrTxAdmMensal       | 25.80     |
            | VlrSeguroMensal1     | 71.19     |
            | PercSeguroMensal1    | 0.021     |
            | VlrSeguroMensal2     | 58.25     |
            | PercSeguroMensal2    | 0.05      |
            | CalcularIOF          | true      |
        And eu defina parametros:
            | Proposta_IsentarIOF | true |
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados


    # ============================
    # SUCESSO - Variações realistas (sequência de testes)
    # ============================
    @CalculaGridParcelasSimplificadoSAC @Success
    Scenario Outline: Simular Parcelas - variações realistas (prazo/juros/valor/TipoIndiceFinanceiro)
        Given que eu preencha o payload dto com:
            | Prazo              | <Prazo>              |
            | PercJurosNegociado | <PercJurosNegociado> |
            | VlrSolicitado      | <VlrSolicitado>      |
        And eu defina parametros:
            | Proposta_IsentarIOF | <Proposta_IsentarIOF> |
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | Proposta_IsentarIOF | TipoIndiceFinanceiro |
            | 6     | 0.65               | 50000.80      | true                | 1                    |
            | 12    | 0.728833           | 840105.59     | false               | 3                    |
            | 24    | 0.85               | 120000.10     | false               | 5                    |
            | 36    | 0.75               | 250000.       | true                | 0                    |

    # ============================
    # SUCESSO - Casos reais / opcionais zerados
    # ============================
    @CalculaGridParcelasSimplificadoSAC @Success
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
        And eu defina parametros:
            | Proposta_IsentarIOF | <Proposta_IsentarIOF> |
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | Proposta_IsentarIOF |
            | 12    | 0.728833           | 50000         | false               |
            | 24    | 0.75               | 80000         | true                |

    # ============================
    # BORDAS / EDGE CASES
    # ============================
    @CalculaGridParcelasSimplificadoSAC @Edge
    Scenario Outline: Simular Parcelas - casos de borda (prazo/juros extremos)
        Given que eu preencha o payload dto com:
            | Prazo              | <Prazo>              |
            | PercJurosNegociado | <PercJurosNegociado> |
            | VlrSolicitado      | <VlrSolicitado>      |
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status <status_esperado>
        And a resposta contém validação ou cálculo consistente

        Examples:
            | Prazo | PercJurosNegociado | VlrSolicitado | status_esperado |
            | 1     | 0.05               | 1000          | 200             |
            | 120   | 0.5                | 120000        | 200             |
            | 12    | 99                 | 10000         | 200             |
            | 12    | 0                  | 10000         | 200             |

    # ============================
    # FALHAS - Campos obrigatórios ausentes
    # ============================
    @CalculaGridParcelasSimplificadoSAC @Failure
    Scenario Outline: Simular Parcelas - campo obrigatório ausente -> erro de validação
        Given que eu preencha o payload dto removendo o campo "<campo_ausente>"
        And eu defina parametros:
            | Proposta_IsentarIOF | <Proposta_IsentarIOF> |
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status <status_code_erro>
        And a resposta contém mensagem de validação para "<campo_ausente>"

        Examples:
            | campo_ausente        | Proposta_IsentarIOF | status_code_erro |
            | VlrSolicitado        | true                | 400              |
            | Prazo                | false               | 400              |
            | TipoIndiceFinanceiro | false               | 400              |
    #| PercJurosNegociado   | true                | 400              |

    # ============================
    # FALHAS - Valores inválidos / negativos / tipos
    # ============================
    @CalculaGridParcelasSimplificadoSAC @Failure
    Scenario Outline: Simular Parcelas - valores inválidos (negativo/tipo) -> erro esperado
        Given que eu preencha o payload dto com "<campo_invalido>" = <valor_invalido>
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status <status_code_invalido>
        And a resposta contém mensagem de erro para "<campo_invalido>"

        Examples:
            | campo_invalido       | valor_invalido | status_code_invalido |
            | VlrSolicitado        | -1000          | 422                  |
            | Prazo                | 0              | 400                  |
            | PercJurosNegociado   | "texto"        | 400                  |
            | PercIndiceFinanceiro | -5             | 400                  |
            | NroDiasAcrescimo     | -68            | 400                  |
            | DtContratacao        | 2025-11-01     | 400                  |
            | dtVencimento         | 2025-01-01     | 400                  |
            | VlrInicial           | -250           | 400                  |
            | VlrInicial           | 10             | 400                  |
            | CalcularIOF          | 200            | 400                  |
            | CalcularIOF          | "booleano"     | 400                  |

    # ============================
    # UTILITÁRIO / REGISTRO
    # ============================
    @CalculaGridParcelasSimplificadoSAC @Success
    Scenario: Registrar request e response na planilha após simulação bem sucedida (fluxo completo)
        Given um payload dto válido com variáveis nominais
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status 200


    # ============================
    # FLUXO COMPLETO - Integração com planilha Excel
    # Futuro aplicar o then de comparação de valores da parcela
    # ============================

    @CalculaGridParcelasSimplificadoSAC @Success
    Scenario: Rodar o teste e aplicar todos os valores na planilha para comparação com a API e o esperado PMT
        Given que eu preencha todos os campos para simulacao do valor da parcela SAC
        When eu envio uma requisição POST para simular o valor da parcela SAC
        Then sucesso a simulacao da parcela SAC foi gerada
        Then escrevo request e response na planilha do SAC

    # ============================
    # INCLUIR CORRECAO POS -> testar variação de TipoIndiceFinanceiro
    # Quando IncluirCorrecaoPos = true, o cálculo deve considerar o TipoIndiceFinanceiro.
    # Testar valores: 0,1,3,5,6
    # ============================
    @CalculaGridParcelasSimplificadoSAC @Success @IncluirCorrecaoPos
    Scenario Outline: Simular Parcelas - IncluirCorrecaoPos=true varia TipoIndiceFinanceiro
        Given que eu preencha o payload dto com:
            | IncluirCorrecaoPos   | true                   |
            | TipoIndiceFinanceiro | <TipoIndiceFinanceiro> |
            | PercIndiceFinanceiro | 80                     |
            | Prazo                | 12                     |
            | PercJurosNegociado   | 0.728833               |
            | VlrSolicitado        | 840105.59              |
            | CalcularIOF          | <CalcularIOF>          |
        And eu defina parametros:
            | Proposta_IsentarIOF | <Proposta_IsentarIOF> |
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados

        Examples:
            | TipoIndiceFinanceiro | Proposta_IsentarIOF | CalcularIOF |
            | 1                    | false               | true        |
            | 3                    | false               | true        |
            | 5                    | false               | true        |
            | 6                    | false               | true        |
            | 1                    | true                | false       |
            | 3                    | true                | false       |
            | 5                    | true                | false       |
            | 6                    | true                | false       |

    # ============================
    # INCLUIR CORRECAO POS -> testar variação de TipoIndiceFinanceiro
    # Quando IncluirCorrecaoPos = false, o cálculo deve considerar o TipoIndiceFinanceiro.
    # Testar valores: 0,1,3,5,6
    # ============================

    @CalculaGridParcelasSimplificadoSAC @Success @IncluirCorrecaoPos
    Scenario Outline: Simular Parcelas - IncluirCorrecaoPos=false varia TipoIndiceFinanceiro e IOF
        Given que eu preencha o payload dto com:
            | IncluirCorrecaoPos   | false                  |
            | TipoIndiceFinanceiro | <TipoIndiceFinanceiro> |
            | PercIndiceFinanceiro | 80                     |
            | Prazo                | 12                     |
            | PercJurosNegociado   | 0.728833               |
            | VlrSolicitado        | 840105.59              |
        And eu defina parametros:
            | Proposta_IsentarIOF | <Proposta_IsentarIOF> |
        When eu envio uma requisição POST para "/proposta/simular-parcelas-sac"
        Then recebo status 200
        And a resposta contém a grade de parcelas e totais esperados

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
