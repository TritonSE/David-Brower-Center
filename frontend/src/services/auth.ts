import { supabase } from "./supabase";

type AuthParams = {
  email: string;
  password: string;
};

export async function signIn({ email, password }: AuthParams) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}
