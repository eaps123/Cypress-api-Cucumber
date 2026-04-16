Feature: Teste automatizado para cancelamento em uma parcela.

    @lancamentoParcela
    Scenario: Utilizar o CancelarCobrancas para cancelamento de cobrança
    Given que eu tenha uma agenda previamene criada com cobrança gerada
    When eu informo o codigo da cobrança na api de cancelamento e envio a requisição
    Then a api de lançamento retorna sucesso e a cobrança não se encontra mais ativa e vinculada a agenda

