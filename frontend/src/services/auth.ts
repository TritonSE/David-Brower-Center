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

export async function signUp({ email, password }: AuthParams) {
  // check if email is already in use
  const result = await supabase.rpc<boolean>("check_email_exists", {
    input_email: email,
  });
  const userData = result.data;
  const usersError = result.error;
  if (usersError) throw new Error("Unable to verify email");
  if (userData) throw new Error("Email already in use");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) throw new Error("Sign-up did not create a user.");
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}
