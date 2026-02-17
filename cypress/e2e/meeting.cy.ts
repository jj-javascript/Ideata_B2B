describe("Meeting page", () => {
  it("shows not found for invalid meeting id", () => {
    cy.visit("/meeting/invalid-meeting-id");
    cy.contains("Meeting not found").should("be.visible");
  });

  it("shows join form for valid meeting", () => {
    cy.visit("/meeting/meetings:test123");
    cy.contains("Join the brainstorming meeting").should("be.visible");
    cy.get('input[placeholder="Your name"]').should("exist");
    cy.contains("Join with video").should("be.visible");
  });
});
