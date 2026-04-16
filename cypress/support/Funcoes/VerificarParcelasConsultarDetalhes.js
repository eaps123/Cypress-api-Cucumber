function VerificarParcelasConsultarDetalhes(){ 

    let proximaConsulta = {}
    let numeroParcela = 0

    if(Cypress.env('responseRepeticao') === 'next' ){
         proximaConsulta = Cypress.env('responsePrimeiraConsulta')
    }else if(Cypress.env('responseRepeticao') !== undefined){
         proximaConsulta = Cypress.env('responseRepeticao')
    }else{
        cy.log("teste ok")
    }
    

    const parcelas = proximaConsulta.body.Parcelas
  
    for (let i = 0; i < parcelas.length; i++) {
        cy.log("Entrou no for: "+ i, parcelas.length)
        if (parcelas[i].VlrTotalPago === 0) {
            Cypress.env('parcelaComSaldo', i)
            Cypress.env('agendaDisponivel', true)
            numeroParcela = i + 1
            break 
        }else{
            cy.log(`Parcela ${i+1} já utilizada`)
            
        }

        numeroParcela = i + 1

    }
    if(numeroParcela === parcelas.length) {
        cy.log('Última parcela utilizada')
        Cypress.env('agendaDisponivel', false)
        Cypress.env('responseRepeticao', 'next')
    }
}
export default VerificarParcelasConsultarDetalhes;