import Link from "next/link";

export default function SignInButton() {
  return (
    <Link
      href="/sign-in"
      className="h-12 rounded-full border border-slate-300 bg-slate-100 px-8 text-lg font-medium text-teal-600 flex items-center"
    >
      Sign In
    </Link>
  );
}
