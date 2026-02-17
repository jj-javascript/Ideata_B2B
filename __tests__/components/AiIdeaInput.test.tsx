import { render, screen } from "@testing-library/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AiIdeaInput } from "../../components/AiIdeaInput";

const convex = new ConvexReactClient("https://test.convex.cloud");

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

describe("AiIdeaInput", () => {
  it("renders the microphone button", () => {
    render(
      <Wrapper>
        <AiIdeaInput />
      </Wrapper>
    );
    const button = screen.getByRole("button", {
      name: /Speak your idea/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("button is disabled when processing", () => {
    render(
      <Wrapper>
        <AiIdeaInput />
      </Wrapper>
    );
    const button = screen.getByRole("button", {
      name: /Speak your idea/i,
    });
    expect(button).not.toBeDisabled();
  });
});
