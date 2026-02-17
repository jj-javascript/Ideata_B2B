describe("Board page", () => {
  it("shows not found for invalid board id", () => {
    cy.visit("/board/invalid-board-id");
    cy.contains("Board not found").should("be.visible");
  });

  it("has back to dashboard link", () => {
    cy.visit("/board/invalid-board-id");
    cy.contains("Back to dashboard").should("be.visible");
  });
});
