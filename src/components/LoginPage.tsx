// src/components/LoginPage.tsx
import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase'; // Import auth and googleProvider
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup // For Google Sign-in
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom'; // To redirect after login
import { UserIcon, LockClosedIcon, GoogleIcon } from './icons'; // Assuming you'll add GoogleIcon

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false); // To toggle between login/signup forms
  const navigate = useNavigate(); // Hook for navigation

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    try {
      if (isRegistering) {
        // Sign Up
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Account created successfully! You are now logged in.');
      } else {
        // Log In
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in successfully!');
      }
      navigate('/'); // Redirect to home page on success
    } catch (err: any) {
      // Firebase errors have a 'code' and 'message'
      setError(err.message || 'An unknown authentication error occurred.');
      console.error("Auth Error:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null); // Clear previous errors
    try {
      await signInWithPopup(auth, googleProvider); // Use googleProvider here
      alert('Logged in with Google successfully!');
      navigate('/'); // Redirect to home page on success
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
      console.error("Google Auth Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-surface rounded-xl shadow-lg border border-border-color animate-fade-in-up">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-base">
            {isRegistering ? 'Create Your Account' : 'Sign in to Your Account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <div className="relative">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border-color placeholder-text-muted text-text-base bg-input-bg focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border-color placeholder-text-muted text-text-base bg-input-bg focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <LockClosedIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-fg bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              {isRegistering ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="relative flex justify-center text-sm">
            <span className="bg-surface px-2 text-text-muted">Or continue with</span>
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border-color" aria-hidden="true"></div>
        </div>

        <div>
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex justify-center items-center py-2 px-4 border border-border-color text-sm font-medium rounded-md text-text-base bg-surface hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;