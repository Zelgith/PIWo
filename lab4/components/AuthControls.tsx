"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { signOutUser } from "@/lib/auth";

export function AuthControls() {
  const { user, loading, hasFirebaseConfig } = useAuth();
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const userLabel = user?.displayName || user?.email || "Użytkownik";

  async function handleSignOut() {
    try {
      setError("");
      setIsSigningOut(true);
      await signOutUser();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Nie udało się wylogować.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  if (!hasFirebaseConfig) {
    return <span className="header-note">Uzupełnij konfigurację Firebase.</span>;
  }

  if (loading) {
    return <span className="header-note">Sprawdzanie logowania...</span>;
  }

  if (!user) {
    return (
      <div className="header-actions">
        <Link href="/login" className="button button--secondary">
          Zaloguj się
        </Link>
      </div>
    );
  }

  return (
    <div className="header-actions">
      <Link href="/games/new" className="button button--primary">
        Dodaj grę
      </Link>
      <span className="header-user" title={userLabel}>
        {userLabel}
      </span>
      <button
        type="button"
        className="button button--light"
        disabled={isSigningOut}
        onClick={handleSignOut}
      >
        Wyloguj
      </button>
      {error ? <span className="header-error">{error}</span> : null}
    </div>
  );
}
