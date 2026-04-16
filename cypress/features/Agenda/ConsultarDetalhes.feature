Feature: Teste automatizado para consulta de uma agenda recebível.


    @consultaAgenda
    Scenario Outline: Consultar situação de uma agenda de recebível
    Given que eu tenha uma agenda criada previamente
    When eu realizo lancamento na agenda a fim de alterar sua situação para "<Situacao>"
    Then a situação da agenda é definida para "<Situacao>"

    Examples:
    | Situacao         |
    | Aberta           |
    | Liquidada        |
 
 
    @consultaAgenda
    Scenario: Consultar uma agenda de recebível
    Given que eu tenha uma agenda criada previamente
    When eu envio uma requisição POST para a consulta de uma agenda
    Then a agenda é consultada com sucesso