import { Before, BeforeAll } from "@badeball/cypress-cucumber-preprocessor";

BeforeAll({ tags: "@agenda" }, () => {


  cy.log("Geração de agenda");
});

Before({ tags: "@agenda" }, () => {
  cy.log("Before rodando só para cenários @agenda");
});