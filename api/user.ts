import { supabase } from '@/lib/supabase';

export async function updateAvatarUrl(userId: string, publicUrl: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)
    .select(); // On force le retour pour vérifier si la ligne a été touchée

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Aucun profil trouvé à mettre à jour. Vérifiez vos politiques RLS.");
  }
  return data[0];
}