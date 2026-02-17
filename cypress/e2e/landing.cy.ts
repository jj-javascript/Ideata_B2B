describe("Landing page", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("renders the Ideata heading", () => {
    cy.contains("Ideata").should("be.visible");
  });

  it("renders the main headline", () => {
    cy.contains("Turn team ideas into outcomes").should("be.visible");
  });

  it("has a link to signup", () => {
    cy.get('a[href="/signup"]').should("exist");
  });

  it("has a link to dashboard in nav when navigating", () => {
    cy.get('a[href="#how-it-works"]').click();
    cy.contains("Simple, focused collaboration").should("be.visible");
  });
});
