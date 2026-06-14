import { LoginForm } from "../../components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--surface-canvas)] p-6">
      <section className="w-full max-w-md rounded-lg border border-[var(--border-default)] bg-white p-6 shadow-sm">
        <img src="/company-logo.png" alt="PeopleOS" className="mb-6 h-16 w-44 object-contain" />
        <h1 className="text-2xl font-semibold">Sign in to PeopleOS</h1>
        <p className="mt-1 text-sm text-muted">Use your PeopleOS account to continue.</p>
        <LoginForm />
      </section>
    </main>
  );
}
