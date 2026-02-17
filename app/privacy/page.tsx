import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brown-50">
      <header className="border-b border-brown-200 bg-brown-50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-brown-900"
          >
            Ideata
          </Link>
          <Link
            href="/"
            className="text-sm text-brown-600 hover:text-brown-900"
          >
            Back to home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-brown-900">Privacy Policy</h1>
        <p className="mt-4 text-sm text-brown-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="mt-8 space-y-6 text-brown-700">
          <section>
            <h2 className="text-lg font-medium text-brown-900">
              Information we collect
            </h2>
            <p className="mt-2">
              Ideata collects information you provide when you create an account,
              including your name, email address, and profile information. We also
              collect usage data to improve our services.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-brown-900">
              How we use your information
            </h2>
            <p className="mt-2">
              We use your information to provide and improve Ideata, to
              communicate with you, and to ensure the security of our platform.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-brown-900">
              Data sharing
            </h2>
            <p className="mt-2">
              We do not sell your personal information. We may share data with
              service providers who assist in operating our platform, subject to
              confidentiality agreements.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-brown-900">Contact</h2>
            <p className="mt-2">
              For privacy-related questions, contact us at privacy@ideata.app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
