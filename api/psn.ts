import {
  exchangeCodeForAccessToken,
  exchangeNpssoForCode,
  getProfileFromUserName,
  getTitleTrophies,
  getUserTrophiesEarnedForTitle
} from "psn-api";
import { supabase } from '../lib/supabase';

export const syncGameTrophies = async (userId: string, psnId: string, game: any) => {
  try {
    // Prise en charge de la variable d'environnement Expo ou Node classique
    const npsso = process.env.EXPO_PUBLIC_BOT_PSN_NPSSO || process.env.BOT_PSN_NPSSO;
    
    if (!npsso) {
      throw new Error("Token NPSSO introuvable. Vérifiez vos variables d'environnement.");
    }

    const accessCode = await exchangeNpssoForCode(npsso);
    const authorization = await exchangeCodeForAccessToken(accessCode);

    // 1. Jeu global
    const { error: gameError } = await supabase.from('psn_games').upsert({
      np_communication_id: game.np_communication_id,
      game_name: game.game_name,
      game_image_url: game.game_image_url
    }, { onConflict: 'np_communication_id' });
    
    if (gameError) throw new Error(`Erreur RLS ou BD sur psn_games: ${gameError.message}`);

    // 2. Trophées globaux
    const { data: existingTrophies } = await supabase
      .from('psn_trophies')
      .select('trophy_id')
      .eq('np_communication_id', game.np_communication_id)
      .limit(1);

    if (!existingTrophies || existingTrophies.length === 0) {
      const { trophies: baseTrophies } = await getTitleTrophies(authorization, game.np_communication_id, "all");
      
      // On s'assure qu'on a bien reçu les trophées de l'API
      if (baseTrophies && baseTrophies.length > 0) {
        const trophiesToInsert = baseTrophies.map(t => ({
          np_communication_id: game.np_communication_id,
          trophy_id: t.trophyId,
          trophy_name: t.trophyName,
          trophy_description: t.trophyDetail,
          trophy_icon_url: t.trophyIconUrl,
          trophy_type: t.trophyType
        }));

        const { error: insertTrophiesError } = await supabase.from('psn_trophies').insert(trophiesToInsert);
        if (insertTrophiesError) throw new Error(`Erreur INSERT sur psn_trophies: ${insertTrophiesError.message}`);
      }
    }

    // 3. Avancée du joueur
    const profile = await getProfileFromUserName(authorization, psnId);
    if (!profile?.profile?.accountId) throw new Error(`Profil PSN introuvable pour le pseudo : ${psnId}`);

    const { trophies: userEarned } = await getUserTrophiesEarnedForTitle(
      authorization, 
      profile.profile.accountId, 
      game.np_communication_id, 
      "all"
    );

    if (userEarned && userEarned.length > 0) {
      const userTrophiesToInsert = userEarned.map(t => ({
        user_id: userId,
        np_communication_id: game.np_communication_id,
        trophy_id: t.trophyId,
        earned: t.earned
      }));

      // Suppression des anciens pour éviter les conflits d'unicité
      const { error: deleteError } = await supabase
        .from('user_psn_trophies')
        .delete()
        .eq('user_id', userId)
        .eq('np_communication_id', game.np_communication_id);

      if (deleteError) throw new Error(`Erreur DELETE sur user_psn_trophies: ${deleteError.message}`);

      const { error: userInsertError } = await supabase
        .from('user_psn_trophies')
        .insert(userTrophiesToInsert);

      if (userInsertError) throw new Error(`Erreur INSERT sur user_psn_trophies: ${userInsertError.message}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de la synchronisation:", error);
    return { success: false, error: error.message || JSON.stringify(error) };
  }
};