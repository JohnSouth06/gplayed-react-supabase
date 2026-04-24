import { supabase } from '../lib/supabase';

// Inscription : Auth + Création du profil avec Username
export const signUpUser = async (email: string, pass: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password: pass });
  
  if (error) throw error;
  
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, username }]);
    if (profileError) throw profileError;
  }
  return data;
};

// Connexion classique
export const signInUser = async (email: string, pass: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) throw error;
  return data;
};

// Réinitialisation du mot de passe par email
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'gplayed://reset-password',
  });
  if (error) throw error;
};