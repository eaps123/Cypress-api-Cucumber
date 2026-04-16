Feature: Teste automatizado para simulação de valores das parcelas. As simulações geradas tem o intuito de ser aplicada no endpoint Incluir Proposta Simplificado.

    @SimulacaoValorParcela
    Scenario: Simular Valor Parcela
    Given que eu preencha todos os campos para simulacao do valor da parcela
    When eu envio uma requisição POST para simular o valor da parcela
    Then sucesso a simulacao foi gerada
    

