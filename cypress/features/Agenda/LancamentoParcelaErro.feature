Feature: Teste automatizado para lançamento com erro em uma parcela.

    Scenario Outline: Utilizar o LancamentoParcela para validar campo VlrPagamento
    Given que eu tenha uma agenda criada previamente
    When eu realizo o lancamento na parcela com problema no campo VlrPagamento "<ProblemaVlrPagamento>"
    Then a api de lançamento retorna erro informando a mensagem de erro "<MensagemErro>"

    Examples:
    | ProblemaVlrPagamento              | MensagemErro                             | 
    | Valor negativo                    | Valor deve ser informado                 |
   # | Valor grande                      | Valor deve ser informado                 |
   # | Valor maior que saldo             | Valor deve ser informado                 |
    | Valor e desconto maior que saldo  | Valor de desconto não pode ser superior ou igual ao saldo atual da parcela     |


    @agenda
    Scenario Outline: Utilizar o LancamentoParcela para verificar campos obrigatórios
    Given que eu tenha uma agenda criada previamente
    When eu realizo o lancamento na parcela sem o campo obrigatório "<CampoObrigatorios>"
    Then a api de lançamento retorna erro informando a mensagem de erro "<MensagemErro>"

    Examples:
    | CampoObrigatorios             | MensagemErro                             |
    | CodigoProposta                | Agenda de Recebíveis não foi encontrada  |
    | VlrPagamento                  | Valor deve ser informado                 |


 #   Scenario Outline: Utilizar o LancamentoParcela para verificar erros de descapitalização
 #   Given que eu tenha uma agenda com o parâmetro Descapitalização: "<Descapitalizacao>"
 #   When eu realizo o lancamento na parcela diferente a descapitalização parametrizada
 #   Then a api de lançamento retorna erro informando a mensagem de erro "<MensagemErro>"

#    Examples:
#    | Descapitalizacao              | MensagemErro                             | 
#    | true                          | Agenda de Recebíveis não foi encontrada  |
#    | false                         | Valor deve ser informado                 |


