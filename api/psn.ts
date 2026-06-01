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
    const accessCode = await exchangeNpssoForCode(process.env.BOT_PSN_NPSSO as string);
    const authorization = await exchangeCodeForAccessToken(accessCode);

    // NOUVEAU : On s'assure que le jeu existe dans la table globale avant d'ajouter ses trophées !
    await supabase.from('psn_games').upsert({
      np_communication_id: game.np_communication_id,
      game_name: game.game_name,
      game_image_url: game.game_image_url
    }, { onConflict: 'np_communication_id' });

    const { data: existingTrophies } = await supabase
      .from('psn_trophies')
      .select('trophy_id')
      .eq('np_communication_id', game.np_communication_id)
      .limit(1);

    if (!existingTrophies || existingTrophies.length === 0) {
      const { trophies: baseTrophies } = await getTitleTrophies(authorization, game.np_communication_id, "all");
      
      const trophiesToInsert = baseTrophies.map(t => ({
        np_communication_id: game.np_communication_id,
        trophy_id: t.trophyId,
        trophy_name: t.trophyName,
        trophy_description: t.trophyDetail,
        trophy_icon_url: t.trophyIconUrl,
        trophy_type: t.trophyType
      }));

      await supabase.from('psn_trophies').insert(trophiesToInsert);
    }

    const profile = await getProfileFromUserName(authorization, psnId);
    const { trophies: userEarned } = await getUserTrophiesEarnedForTitle(
      authorization, 
      profile.profile.accountId, 
      game.np_communication_id, 
      "all"
    );

    const userTrophiesToUpsert = userEarned.map(t => ({
      user_id: userId,
      np_communication_id: game.np_communication_id,
      trophy_id: t.trophyId,
      earned: t.earned
    }));

    await supabase.from('user_psn_trophies').upsert(userTrophiesToUpsert, { 
      onConflict: 'user_id, np_communication_id, trophy_id' 
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error);
    return { success: false, error };
  }
};