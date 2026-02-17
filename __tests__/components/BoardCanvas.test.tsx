import { render, screen } from "@testing-library/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BoardCanvas } from "../../components/BoardCanvas";

const convex = new ConvexReactClient("https://test.convex.cloud");

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

describe("BoardCanvas", () => {
  it("renders loading state when board is loading", () => {
    render(
      <Wrapper>
        <BoardCanvas
          boardId={"boards:test123" as any}
        />
      </Wrapper>
    );
    expect(screen.getByText(/Loading board/i)).toBeInTheDocument();
  });
});
