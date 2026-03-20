import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type AuthError,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// Map Firebase error codes to user-friendly messages (prevents user enumeration)
function friendlyAuthError(err: unknown): string {
  const code = (err as AuthError)?.code;
  switch (code) {
    case 'auth/email-already-in-use':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export async function signUp(email: string, password: string, displayName: string) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return cred.user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

export async function signIn(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

export async function signInWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (err) {
    throw new Error(friendlyAuthError(err));
  }
}

export async function signOut() {
  await firebaseSignOut(auth);
}
