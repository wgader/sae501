"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FormField from "@/components/ui/FormField";
import ButtonView from "@/components/ui/ButtonView";
import BackButton from "@/components/ui/BackButton";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = formData.get("identifier");

    if (!identifier || !password) {
      setSubmitError(
        "Veuillez renseigner votre identifiant et votre mot de passe.",
      );
      return;
    }

    setSubmitError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost"}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: identifier, password }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Identifiants incorrects");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        if (data.user?.nomAssociation) {
          localStorage.setItem("association_name", data.user.nomAssociation);
        }
        if (data.user?.prenom) {
          localStorage.setItem("user_prenom", data.user.prenom);
        }
        if (data.user?.nom) {
          localStorage.setItem("user_nom", data.user.nom);
        }
        if (data.user?.prenom || data.user?.nom) {
          const fullName = [data.user.prenom, data.user.nom].filter(Boolean).join(" ");
          if (fullName) localStorage.setItem("user_name", fullName);
        }
        window.dispatchEvent(new Event("auth-change"));
      }

      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Une erreur est survenue lors de la connexion");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-row font-sans text-ink">
      <aside className="hidden min-h-screen w-[clamp(18.75rem,32vw,27.5rem)] shrink-0 flex-col bg-primary px-[clamp(1.5rem,3vw,3.5rem)] pt-8 text-white lg:flex">
        <BackButton />

        <div className="mt-[clamp(2.5rem,6vh,4rem)] flex items-center gap-2.5">
          <span
            className="h-0.5 w-6 rounded-full bg-accent"
            aria-hidden="true"
          />
          <p className="text-label font-bold uppercase tracking-section text-white">
            Espace associations
          </p>
        </div>

        <h2 className="mt-6 max-w-85 text-[clamp(2.125rem,3.2vw,3rem)] font-black leading-[1.05] tracking-display text-white">
          <span className="block">Accéder à mon</span>
          <span className="block text-accent">espace.</span>
        </h2>

        <p className="mt-5 max-w-85 text-body leading-copy text-white/90">
          Retrouvez toutes vos démarches auprès de la mairie de Feytiat, suivez
          leur avancement et échangez directement avec les services municipaux.
        </p>
      </aside>

      <main className="flex min-w-0 flex-1 items-center justify-center bg-white px-6 py-10 sm:px-12 lg:px-16">
        <section className="w-full max-w-lg">
          <div className="mb-6 lg:hidden">
            <BackButton className="text-ink" />
          </div>

          <header className="mb-8">
            <h1 className="text-[clamp(1.75rem,2.8vw,2.5rem)] font-black leading-[1.08] tracking-display text-ink">
              Se connecter
            </h1>
            <p className="mt-2 text-body-sm leading-normal text-muted">
              Renseignez vos identifiants pour accéder à votre tableau de bord
              association.
            </p>
          </header>

          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={handleSubmit}
          >
            <FormField
              label="Votre adresse électronique "
              type="email"
              name="identifier"
              placeholder="exemple : contact@association.fr"
              autoComplete="username"
              required
            />

            <FormField
              label="Votre mot de passe"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="********"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setSubmitError("");
              }}
              required
            >
              <ButtonView
                type="button"
                variant={showPassword ? "selected" : "unselected"}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3.5" />
                  {showPassword ? (
                    <path d="M3 3L21 21" strokeLinecap="round" />
                  ) : null}
                </svg>
              </ButtonView>
            </FormField>

            {submitError && (
              <p
                className="rounded-lg border-l-4 border-danger bg-red-50/60 p-3 text-xs leading-5 text-danger"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <div className="flex flex-col items-end gap-2.5 pt-1 text-body-sm">
              <Link
                href="/inscription"
                className="font-bold text-ink underline underline-offset-4 transition-colors hover:text-primary"
              >
                Pas encore de compte ? Créer un compte
              </Link>
              <Link
                href="/mot-de-passe-oublie"
                className="font-semibold text-muted underline underline-offset-4 transition-colors hover:text-ink"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <div className="mt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center rounded-control bg-primary px-6 text-xs font-bold uppercase tracking-label text-white shadow-xs transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
