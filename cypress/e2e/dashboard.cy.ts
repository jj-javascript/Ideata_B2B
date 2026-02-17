describe("Dashboard", () => {
  beforeEach(() => {
    cy.visit("/dashboard");
  });

  it("shows the user form when not logged in", () => {
    cy.contains("Enter your details to continue").should("be.visible");
    cy.get('input[placeholder="Your name"]').should("exist");
    cy.get('input[placeholder="you@example.com"]').should("exist");
  });

  it("can submit user form", () => {
    cy.get('input[placeholder="Your name"]').type("Test User");
    cy.get('input[placeholder="you@example.com"]').type("test@example.com");
    cy.contains("Continue").click();
    cy.url().should("include", "/dashboard");
  });
});
