import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-2xl font-semibold text-brown-900">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-brown-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="mt-8 space-y-6 text-brown-700">
          <section>
            <h2 className="text-lg font-medium text-brown-900">
              Acceptance of terms
            </h2>
            <p className="mt-2">
              By accessing or using Ideata, you agree to be bound by these Terms
              of Service. If you do not agree, do not use our services.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-brown-900">
              Use of the service
            </h2>
            <p className="mt-2">
              You agree to use Ideata only for lawful purposes and in accordance
              with these terms. You are responsible for maintaining the
              confidentiality of your account credentials.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-brown-900">
              User content
            </h2>
            <p className="mt-2">
              You retain ownership of content you create on Ideata. By using our
              services, you grant us a license to store, display, and process
              your content as necessary to provide the service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium text-brown-900">Contact</h2>
            <p className="mt-2">
              For questions about these terms, contact us at legal@ideata.app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
