Feature: Teste automatizado para lançamento em uma parcela.

    @agenda
    Scenario Outline: Utilizar o LancamentoParcela com diferentes parâmetros e valores
    Given que eu tenha uma agenda com o parâmetro Descapitalização: "<Descapitalizacao>"
    When eu realizo o lancamento na parcela com Desconto: "<Desconto>" para "<Modalidade>"
    Then a api de lançamento retorna sucesso e a agenda e parcelas afetadas são atualizadas corretamente

    Examples:
    | Descapitalizacao | Desconto                     | Modalidade          |                    
    | true             | true                         | Liquidacao          |                        
    | true             | true                         | Pagamento Parcial   |            
    | true             | false                        | Liquidacao          |     
    | true             | false                        | Pagamento Parcial   |        
    | false            | false                        | Liquidacao          |   
    | false            | false                        | Pagamento Parcial   |  
    | false            | true                         | Liquidacao          |   
    | false            | true                         | Pagamento Parcial   | 

    @agenda
    Scenario Outline: Utilizar o LancamentoMultiplasParcelas com diferentes parâmetros e valores
    Given que eu tenha uma agenda com o parâmetro Descapitalização: "<Descapitalizacao>" 
    When eu realizo o lancamento nas parcelas com Desconto: "<Desconto>" para "<Modalidade>"
    Then a api de lançamentos retorna sucesso e a agenda e parcelas afetadas são atualizadas corretamente

    Examples:
    | Descapitalizacao | Desconto                     | Modalidade          |                    
    | true             | true                         | Liquidacao          |                        
    | true             | true                         | Pagamento Parcial   |            
    | true             | false                        | Liquidacao          |     
    | true             | false                        | Pagamento Parcial   |        
    | false            | false                        | Liquidacao          |   
    | false            | false                        | Pagamento Parcial   |  
    | false            | true                         | Liquidacao          |   
    | false            | true                         | Pagamento Parcial   | 

    
    @agenda
    Scenario Outline: Utilizar o LancamentoMultiplasParcelas com diferentes motivos baixas
    Given que eu tenha uma agenda criada previamente
    When eu realizo o lancamento nas parcelas com o motivo baixa "<MotivoBaixa>"
    Then a situação da agenda é definida para "<Situacao>"

    Examples:
    | MotivoBaixa      | Situacao       |
   # | Cancelamento     | Liquidada      |
    | Fraude           | Liquidada      |
    | Óbito            | Liquidada      |
    | Renegociação     | Liquidada      |
    | Alienação        | Liquidada      |

