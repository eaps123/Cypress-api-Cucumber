Feature: Teste automatizado para geração de uma cobrança na agenda recebível.

  @geracaoCobranca
  Scenario Outline: Geracao de cobrança de parcial em uma agenda de recebível
    Given que eu tenha uma agenda criada previamente
    And que eu preencha todos os campos para geração de cobrança "<Modalidade>" parcial com desconto: "<Desconto>"
    When eu envio uma requisição POST para a geração de cobrança em uma agenda
    Then a cobrança é gerada na agenda

    Examples:
      | Modalidade | Desconto  |
      | Pix        | true      |
      | Boleto     | true      |
      | Pix        | false     |
      | Boleto     | false     |
      
  @geracaoCobranca
  Scenario Outline: Geracao de cobrança de liquidacao em uma agenda de recebível
    Given que eu tenha uma agenda criada previamente
    And que eu preencha todos os campos para geração de cobrança "<Modalidade>" com desconto: "<Desconto>"
    When eu envio uma requisição POST para a geração de cobrança em uma agenda
    Then a cobrança é gerada na agenda

    Examples:
      | Modalidade | Desconto  |
      | Pix        | true      |
      | Boleto     | true      |
      | Pix        | false     |
      | Boleto     | false     |
