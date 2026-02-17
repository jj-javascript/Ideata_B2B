import { render, screen } from "@testing-library/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { VideoRoom } from "../../components/VideoRoom";

const convex = new ConvexReactClient("https://test.convex.cloud");

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

describe("VideoRoom", () => {
  it("renders join button when not connected", () => {
    render(
      <Wrapper>
        <VideoRoom
          roomName="test-room"
          participantName="Test User"
          participantIdentity="test-identity"
        />
      </Wrapper>
    );
    expect(screen.getByText(/Connecting to video room/i)).toBeInTheDocument();
  });
});
