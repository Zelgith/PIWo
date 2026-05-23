import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

function requireAuth() {
  if (!auth) {
    throw new Error("Brak konfiguracji Firebase. Uzupełnij plik .env.local.");
  }

  return auth;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  return signInWithPopup(requireAuth(), provider);
}

export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(requireAuth(), email, password);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(requireAuth(), email, password);
}

export async function signOutUser() {
  return signOut(requireAuth());
}
