import Link from "next/link";

export default function SignInButton() {
  return (
    <Link
      href="/signIn"
      className="h-12 rounded-full border border-slate-300 bg-slate-100 px-8 text-lg font-medium text-teal-600 flex items-center"
    >
      Sign In
    </Link>
  );
}
