Feature: Teste automatizado imprimir CCB de cada tipo de proposta.

    # ============================
    # Incluir Proposta Manual Simplificada - Cenários com base em exemplos reais
    # ============================
    @IncluirPropostaManualSimplificada @CCB @Success
    Scenario Outline: Incluir proposta simplificada - cenários reais
        Given que eu preencha o payload dto da proposta manual simplificada com:
            | DocumentoCliente                | 007.031.609-07         |
            | DocumentoParceiroCorrespondente | 358.638.490-45         |
            | ObservacoesVendedor             | <ObservacoesVendedor>  |
            | CodigoOperacao                  | {{$guid}}              |
            | TipoContrato                    | CSG                    |
            | DtPrimeiroVencto                | 2026-08-14             |
            | VlrParcela                      | 200                    |
            | VlrIOF                          | 200                    |
            | PercIOF                         | 1                      |
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
        And eu defina parametros:
            | Proposta_IsentarIOF | <Proposta_IsentarIOF> |
        When eu envio uma requisição POST para o cadastro de uma proposta manual simplificada
        And que seja feita a impressão da proposta <propostaCodigo><tipo>
        Then recebo status 200

        Examples:
            | ObservacoesVendedor     | TipoIndiceFinanceiro | PercIndiceFinanceiro | VlrProdutoBem | AnoBase | NroDiasAcrescimo | Prazo | PercJurosNegociado | VlrSolicitado | VlrTAC   | VlrOutrasDespesas | VlrOutrosServicos | VlrSeguro | VlrAvaliacao | VlrDespachante | VlrRegistro | VlrBlindagem | VlrAcessorios | VlrVistoria | VlrCertiDocs | VlrTxAdmMensal | VlrSeguroMensal1 | PercSeguroMensal1 | VlrSeguroMensal2 | PercSeguroMensal2 | Proposta_IsentarIOF |
            | Venda balcão - popular  | 1                    | 120                  | 30000         | 365     | 0                | 36    | 1.10               | 25000         | 350.00   | 150.00            | 100.00            | 350.00    | 800.00       | 0.00           | 0.00        | 0.00         | 500.00        | 0.00        | 50.00        | 20.00          | 5.00             | 15.00             | 2.50             | 0.058             | true                |
            | Seminovo - médio valor  | 3                    | 120                  | 80000         | 365     | 2                | 60    | 1.25               | 70000         | 1200.00  | 300.00            | 200.00            | 900.00    | 1200.00      | 200.00         | 150.00      | 0.00         | 1200.00       | 0.00        | 120.00       | 60.00          | 0.021            | 50.00             | 0.050            | 0.12              | true                |
            | Veículo alto padrão     | 5                    | 120                  | 3500000       | 365     | 4                | 12    | 1.27               | 840105.59     | 15020.81 | 180.10            | 100.63            | 799.19    | 245.15       | 345.09         | 180.70      | 99.99        | 81.34         | 42.28       | 1000.01      | 25.80          | 71.19            | 0.021             | 58.25            | 0.050             | false               |
            | Crédito pessoal curto   | 1                    | 120                  | 0             | 365     | 0                | 12    | 1.50               | 5000.00       | 45.00    | 0.00              | 0.00              | 0.00      | 0.00         | 0.00           | 0.00        | 0.00         | 0.00          | 0.00        | 0.00         | 0.00           | 0.00             | 0.00              | 0.00             | 0.080             | true                |
            | Financiamento longo doc | 6                    | 120                  | 2500000       | 365     | 3                | 99    | 1.90               | 2000000.00    | 18000.00 | 500.00            | 300.00            | 2500.00   | 1500.00      | 400.00         | 200.00      | 0.00         | 250.00        | 100.00      | 1200.00      | 100.00         | 0.021            | 80.00             | 0.050            | 0.022             | true                |
            | Oferta promocional IOF  | 3                    | 120                  | 120000        | 365     | 1                | 24    | 1.10               | 100000.00     | 800.00   | 200.00            | 150.00            | 600.00    | 900.00       | 150.00         | 90.00       | 0.00         | 250.00        | 50.00       | 300.00       | 40.00          | 0.021            | 35.00             | 0.050            | 0.078             | true                |

    # ============================
    # Incluir Proposta Manual - Cenários com base em exemplos reais
    # Falta fazer do Fluxo irregular e Limite Especial
    # Incluir proposta, so vai funcionar com simplificada que já está na situação aprovada 
    # (Validar no swagger se tem mais)
    # ============================
    
    #@IncluirPropostaManualSAC @Success @CCB
    #Scenario Outline: Incluir proposta - cenários reais
    #    Given que eu preencha o payload dto da proposta com SAC:
    #        | DocumentoCliente                | 007.031.609-07         |
    #        | DocumentoParceiroCorrespondente | 358.638.490-45         |
    #        | ObservacoesVendedor             | <ObservacoesVendedor>  |
    #        | CodigoOperacao                  | {{$guid}}              |
    #        | TipoContrato                    | CSG                    |
    #        | TipoIndiceFinanceiro            | <TipoIndiceFinanceiro> |
    #        | PercIndiceFinanceiro            | <PercIndiceFinanceiro> |
    #        | VlrProdutoBem                   | <VlrProdutoBem>        |
    #        | AnoBase                         | <AnoBase>              |
    #        | NroDiasAcrescimo                | <NroDiasAcrescimo>     |
    #        | Prazo                           | <Prazo>                |
    #        | PercJurosNegociado              | <PercJurosNegociado>   |
    #        | VlrSolicitado                   | <VlrSolicitado>        |
    #        | VlrTAC                          | <VlrTAC>               |
    #        | VlrOutrasDespesas               | <VlrOutrasDespesas>    |
    #        | VlrOutrosServicos               | <VlrOutrosServicos>    |
    #        | VlrSeguro                       | <VlrSeguro>            |
    #        | VlrAvaliacao                    | <VlrAvaliacao>         |
    #        | VlrDespachante                  | <VlrDespachante>       |
    #        | VlrRegistro                     | <VlrRegistro>          |
    #        | VlrBlindagem                    | <VlrBlindagem>         |
    #        | VlrAcessorios                   | <VlrAcessorios>        |
    #        | VlrVistoria                     | <VlrVistoria>          |
    #        | VlrCertiDocs                    | <VlrCertiDocs>         |
    #        | VlrTxAdmMensal                  | <VlrTxAdmMensal>       |
    #        | VlrSeguroMensal1                | <VlrSeguroMensal1>     |
    #        | PercSeguroMensal1               | <PercSeguroMensal1>    |
    #        | VlrSeguroMensal2                | <VlrSeguroMensal2>     |
    #        | PercSeguroMensal2               | <PercSeguroMensal2>    |
    #    And eu defina parametros SAC:
    #        | Proposta_IsentarIOF         | <Proposta_IsentarIOF>         |
    #        | SITUACAOPROPOSTAEMDIGITACAO | <SITUACAOPROPOSTAEMDIGITACAO> |
    #    When eu envio uma requisição POST para proposta SAC
    #    And que seja feita a impressão da proposta <propostaCodigo><tipo>
    #    Then recebo status SAC 200

    #    Examples:
    #        | ObservacoesVendedor     | TipoIndiceFinanceiro | PercIndiceFinanceiro | VlrProdutoBem | AnoBase | NroDiasAcrescimo | Prazo | PercJurosNegociado | VlrSolicitado | VlrTAC   | VlrOutrasDespesas | VlrOutrosServicos | VlrSeguro | VlrAvaliacao | VlrDespachante | VlrRegistro | VlrBlindagem | VlrAcessorios | VlrVistoria | VlrCertiDocs | VlrTxAdmMensal | VlrSeguroMensal1 | PercSeguroMensal1 | VlrSeguroMensal2 | PercSeguroMensal2 | Proposta_IsentarIOF | SITUACAOPROPOSTAEMDIGITACAO |
    #        | Venda balcão - popular  | 1                    | 120                  | 30000         | 365     | 0                | 36    | 1.10               | 25000         | 350.00   | 150.00            | 100.00            | 350.00    | 800.00       | 0.00           | 0.00        | 0.00         | 500.00        | 0.00        | 50.00        | 20.00          | 5.00             | 15.00             | 2.50             | 0.058             | true                | false                       |
    #        | Seminovo - médio valor  | 3                    | 120                  | 80000         | 365     | 2                | 60    | 1.25               | 70000         | 1200.00  | 300.00            | 200.00            | 900.00    | 1200.00      | 200.00         | 150.00      | 0.00         | 1200.00       | 0.00        | 120.00       | 60.00          | 0.021            | 50.00             | 0.050            | 0.12              | true                | false                       |
    #        | Veículo alto padrão     | 5                    | 120                  | 3500000       | 365     | 4                | 12    | 1.27               | 840105.59     | 15020.81 | 180.10            | 100.63            | 799.19    | 245.15       | 345.09         | 180.70      | 99.99        | 81.34         | 42.28       | 1000.01      | 25.80          | 71.19            | 0.021             | 58.25            | 0.050             | false               | false                       |
    #        | Crédito pessoal curto   | 1                    | 120                  | 0             | 365     | 0                | 12    | 1.50               | 5000.00       | 45.00    | 0.00              | 0.00              | 0.00      | 0.00         | 0.00           | 0.00        | 0.00         | 0.00          | 0.00        | 0.00         | 0.00           | 0.00             | 0.00              | 0.00             | 0.080             | true                | false                       |
    #        | Financiamento longo doc | 6                    | 120                  | 2500000       | 365     | 3                | 99    | 1.90               | 2000000.00    | 18000.00 | 500.00            | 300.00            | 2500.00   | 1500.00      | 400.00         | 200.00      | 0.00         | 250.00        | 100.00      | 1200.00      | 100.00         | 0.021            | 80.00             | 0.050            | 0.022             | true                | false                       |
    #        | Oferta promocional IOF  | 3                    | 120                  | 120000        | 365     | 1                | 24    | 1.10               | 100000.00     | 800.00   | 200.00            | 150.00            | 600.00    | 900.00       | 150.00         | 90.00       | 0.00         | 250.00        | 50.00       | 300.00       | 40.00          | 0.021            | 35.00             | 0.050            | 0.078             | true                | false                       |