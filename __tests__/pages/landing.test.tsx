import { render, screen } from "@testing-library/react";
import Home from "../../app/page";

describe("Landing page", () => {
  it("renders the Ideata heading", () => {
    render(<Home />);
    expect(screen.getByText("Ideata")).toBeInTheDocument();
  });

  it("renders the main headline", () => {
    render(<Home />);
    expect(
      screen.getByText(/Turn team ideas into outcomes/i)
    ).toBeInTheDocument();
  });

  it("renders the Get started link", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /Get started/i })).toBeInTheDocument();
  });

  it("renders How it works section", () => {
    render(<Home />);
    expect(screen.getByText(/Simple, focused collaboration/i)).toBeInTheDocument();
  });
});
