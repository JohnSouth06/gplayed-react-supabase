import {
  exchangeCodeForAccessToken,
  exchangeNpssoForCode,
  getProfileFromUserName,
  getTitleTrophies,
  getUserTrophiesEarnedForTitle
} from "psn-api";
import { supabase } from '../lib/supabase';

export const syncGameTrophies = async (userId: string, psnId: string, npCommunicationId: string) => {
  try {
    // 1. Auth Bot (tu peux extraire ça dans une fonction utilitaire pour ne pas le répéter)
    const accessCode = await exchangeNpssoForCode(process.env.BOT_PSN_NPSSO as string);
    const authorization = await exchangeCodeForAccessToken(accessCode);

    // 2. Vérifier si les trophées du jeu existent déjà dans la base globale
    const { data: existingTrophies } = await supabase
      .from('psn_trophies')
      .select('trophy_id')
      .eq('np_communication_id', npCommunicationId)
      .limit(1);

    // S'ils n'existent pas, on récupère la liste complète via PSN et on l'enregistre pour tout le monde
    if (!existingTrophies || existingTrophies.length === 0) {
      const { trophies: baseTrophies } = await getTitleTrophies(authorization, npCommunicationId, "all");
      
      const trophiesToInsert = baseTrophies.map(t => ({
        np_communication_id: npCommunicationId,
        trophy_id: t.trophyId,
        trophy_name: t.trophyName,
        trophy_description: t.trophyDetail,
        trophy_icon_url: t.trophyIconUrl,
        trophy_type: t.trophyType
      }));

      await supabase.from('psn_trophies').insert(trophiesToInsert);
    }

    // 3. Récupérer les trophées OBTENUS par l'utilisateur spécifique
    const profile = await getProfileFromUserName(authorization, psnId);
    const { trophies: userEarned } = await getUserTrophiesEarnedForTitle(
      authorization, 
      profile.profile.accountId, 
      npCommunicationId, 
      "all"
    );

    // Enregistrer la progression de l'utilisateur
    const userTrophiesToUpsert = userEarned.map(t => ({
      user_id: userId,
      np_communication_id: npCommunicationId,
      trophy_id: t.trophyId,
      earned: t.earned
    }));

    await supabase.from('user_psn_trophies').upsert(userTrophiesToUpsert, { 
      onConflict: 'user_id, np_communication_id, trophy_id' 
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la récupération des trophées:", error);
    return { success: false, error };
  }
};