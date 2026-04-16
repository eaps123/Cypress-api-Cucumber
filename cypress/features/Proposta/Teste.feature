Feature: Testes automatizados para criação de uma Proposta. As propostas geradas por esse teste nascem com o status "Em analise".

    # ============================
    # Teste Everton proposta
    # ============================
    @IncluirProposta @Success
    Scenario: Incluir proposta - mínimo aceitável (campos obrigatórios)
        Given 1que eu preencha o payload "proposta":
            | tipoProposta                    | proposta       |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 1.27           |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta   |
        Then 1recebo status Proposta 200

    # ============================
    # Teste Everton proposta Manual
    # ============================
    @IncluirProposta @Success
    Scenario: Incluir proposta manual - mínimo aceitável (campos obrigatórios)
        Given 1que eu preencha o payload "manual":
            | tipoProposta                    | manual         |
            | DocumentoParceiroCorrespondente | 358.638.490-45 |
            | DocumentoCliente                | 007.031.609-07 |
            | TipoContrato                    | CSG            |
            | TipoIndiceFinanceiro            | 1              |
            | PercIndiceFinanceiro            | 90             |
            | Prazo                           | 12             |
            | PercJurosNegociado              | 0.27           |
            | VlrSolicitado                   | 840105.59      |
            | VlrTAC                          | 15020.81       |
            | NroDiasAcrescimo                | 4              |
            | VlrTxAdmMensal                  | 1500           |
        And 1defina parametros Proposta:
            | Nome                | Valor |
            | Proposta_IsentarIOF | false |
        When 1eu envio uma requisição POST para criação de proposta
            | TipoDeProposta | Proposta Manual |
        Then 1recebo status Proposta 200