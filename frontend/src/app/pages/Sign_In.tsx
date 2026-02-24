"use client";
import Image from "next/image";
import { useState } from "react";

import styles from "../Sign_In.module.css";

function GoogleIcon() {
  return (
    <Image
      src="/Sign_In/svgs/icons8-google-1.svg"
      alt="Google"
      width={20}
      height={20}
      className={styles.authIconGoogle}
      aria-hidden
    />
  );
}

function EyeIcon({ show }: { show: boolean }) {
  if (show) {
    return (
      <svg
        className={styles.authIconEye}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    );
  }
  return (
    <Image
      src="/Sign_In/svgs/Mask.svg"
      alt=""
      width={24}
      height={24}
      className={styles.authIconEye}
      aria-hidden
    />
  );
}

function ErrorIcon() {
  return (
    <svg className={styles.authIconError} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PasswordValidIcon() {
  return (
    <span className={styles.authIconSuccess} aria-hidden>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8" cy="8" r="8" fill="#16a34a" />
        <path
          d="M5 8l2.5 2.5L11 6"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

type AuthMode = "signin" | "signup" | "signup-success";

export default function SignIn() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpTouched, setSignUpTouched] = useState(false);

  const emailError = signUpTouched && !signUpEmail.trim();
  const passwordError = signUpTouched && signUpPassword.length < 8;

  function handleSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSignUpTouched(true);
    if (!signUpEmail.trim() || signUpPassword.length < 8) return;
    // TODO: call sign-up API; on success show confirmation
    setSignUpEmail("");
    setSignUpPassword("");
    setSignUpTouched(false);
    setMode("signup-success");
  }

  if (mode === "signup-success") {
    return (
      <div className={styles.confirmationView}>
        <div className={styles.confirmationCard}>
          <h1 className={styles.confirmationHeading}>
            We&apos;ve received your
            <br />
            account creation!
          </h1>
          <p className={styles.confirmationBody}>
            You will be notified by email if your account is approved.
          </p>
          <p className={styles.confirmationFooter}>
            Haven&apos;t received a response yet?{" "}
            <a href="#" className={styles.confirmationLink}>
              Contact us
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        {mode === "signin" ? (
          <>
            <h1 className={styles.authHeading}>Sign in</h1>
            <p className={styles.authSubheading}>Welcome back to DBC Database!</p>

            <form className={styles.authForm} onSubmit={(e) => e.preventDefault()}>
              <div className={styles.authFieldGroup}>
                <label htmlFor="email" className={styles.authLabel}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className={styles.authInput}
                  placeholder="email@address.com"
                />
              </div>

              <div className={styles.authFieldGroup}>
                <div className={styles.authLabelRow}>
                  <label htmlFor="password" className={styles.authLabel}>
                    Password
                  </label>
                  <a href="#" className={styles.authLink}>
                    Forgot?
                  </a>
                </div>
                <div className={styles.authInputWrapper}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className={`${styles.authInput} ${styles.authInputPassword}`}
                    placeholder="password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.authPasswordToggle}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.authBtnPrimary}>
                Sign in
              </button>
            </form>

            <p className={styles.authFooterText}>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setSignInEmail("");
                  setSignInPassword("");
                  setMode("signup");
                }}
                className={styles.authLink}
              >
                Sign up
              </button>
            </p>

            <div className={styles.authDivider}>
              <div className={styles.authDividerLine} />
              <div className={styles.authDividerText}>
                <span>or</span>
              </div>
            </div>

            <button type="button" className={styles.authBtnGoogle}>
              <GoogleIcon />
              Sign in with Google
            </button>
          </>
        ) : (
          <>
            <h1 className={styles.authHeading}>Create account</h1>
            <p className={styles.authSubheading}>Welcome to DBC Database!</p>

            <form className={styles.authForm} onSubmit={handleSignUpSubmit}>
              <div className={styles.authFieldGroup}>
                <label htmlFor="signup-email" className={styles.authLabel}>
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className={`${styles.authInput} ${emailError ? styles.authInputError : ""}`}
                  placeholder="email@address.com"
                />
                {emailError && <p className={styles.authError}>This field is required</p>}
              </div>

              <div className={styles.authFieldGroup}>
                <label htmlFor="signup-password" className={styles.authLabel}>
                  Password
                </label>
                <div className={styles.authInputWrapper}>
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className={`${styles.authInput} ${styles.authInputPassword} ${passwordError ? styles.authInputError : signUpPassword.length >= 8 ? styles.authInputSuccess : ""}`}
                    placeholder="password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.authPasswordToggle}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
                {passwordError && (
                  <p className={styles.authErrorWithIcon}>
                    <ErrorIcon />
                    Your password must contain 8 or more characters
                  </p>
                )}
                {signUpPassword.length >= 8 && (
                  <p className={styles.authSuccessWithIcon}>
                    <PasswordValidIcon />
                    <span className={styles.authSuccessText}>
                      Your password meets all the necessary requirements.
                    </span>
                  </p>
                )}
              </div>

              <button type="submit" className={styles.authBtnPrimary}>
                Create account
              </button>
            </form>

            <p className={styles.authFooterText}>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setSignUpEmail("");
                  setSignUpPassword("");
                  setSignUpTouched(false);
                  setMode("signin");
                }}
                className={styles.authLink}
              >
                Sign in
              </button>
            </p>

            <div className={styles.authDivider}>
              <div className={styles.authDividerLine} />
              <div className={styles.authDividerText}>
                <span>or</span>
              </div>
            </div>

            <button type="button" className={styles.authBtnGoogle}>
              <GoogleIcon />
              Sign up with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
