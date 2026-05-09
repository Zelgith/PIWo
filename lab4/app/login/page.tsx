"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, hasFirebaseConfig } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  async function handleGoogleLogin() {
    try {
      setError("");
      setIsSubmitting(true);
      await signInWithGoogle();
      router.push("/");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Nie udało się zalogować przez Google.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAuthSubmit(mode: "login" | "signup") {
    if (!email.trim() || !password.trim()) {
      setError("Email i hasło są wymagane.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      if (mode === "login") {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }

      router.push("/");
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Nie udało się wykonać logowania.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleAuthSubmit("login");
  }

  if (loading) {
    return <div className="status-box">Ładowanie logowania...</div>;
  }

  if (!hasFirebaseConfig) {
    return (
      <div className="status-box">
        <p>Brak konfiguracji Firebase.</p>
        <p className="error-text">
          Uzupełnij plik <code>.env.local</code> w folderze <code>lab4</code>.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Powrót do listy gier</Link>
      </div>

      <section className="page-section auth-card">
        <h1 className="page-title">Logowanie</h1>
        <div className="auth-stack">
          <button
            type="button"
            className="button button--secondary auth-full-width"
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
          >
            Zaloguj przez Google
          </button>

          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="form-control"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Hasło</label>
              <input
                id="password"
                className="form-control"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <div className="form-actions">
              <button type="submit" className="button button--primary" disabled={isSubmitting}>
                Zaloguj
              </button>
              <button
                type="button"
                className="button button--light"
                disabled={isSubmitting}
                onClick={() => {
                  void handleAuthSubmit("signup");
                }}
              >
                Utwórz konto
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
