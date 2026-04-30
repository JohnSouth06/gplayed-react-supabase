import { Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Inscription : Auth + Création du profil avec Username
export const signUpUser = async (email: string, pass: string, username: string) => {
  // On passe le username dans les métadonnées (options.data)
  // Ainsi, le trigger SQL sur Supabase pourra le récupérer.
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password: pass,
    options: {
      data: {
        username: username 
      }
    }
  });

  if (error) throw error;

  // IMPORTANT : On a supprimé le bloc "insert" manuel dans 'profiles'.
  // C'est désormais le trigger SQL qui s'occupe de créer la ligne 
  // dans la table profiles de manière sécurisée et automatique.

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

// Mise à jour du mot de passe après clic sur le lien dans l'email
export const updateUserPassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
};

// Déconnexion
export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Connexion avec un provider (Google, GitHub, etc.)
export const signInWithOAuth = async (provider: Provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: 'gplayed://auth', 
    },
  });
  if (error) throw error;
  return data;
};

// Supprimer un compte
export const deleteAccount = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (profileError) throw profileError;
  
  await supabase.auth.signOut();
};