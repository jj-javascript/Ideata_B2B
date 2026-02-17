import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brown-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg border border-brown-200",
          },
          variables: {
            colorPrimary: "#2C1810",
            colorBackground: "#F7F3ED",
            colorInputBackground: "#EDE6DC",
            colorInputText: "#2C1810",
            borderRadius: "0.5rem",
          },
        }}
      />
    </div>
  );
}
