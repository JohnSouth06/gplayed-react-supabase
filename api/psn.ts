// api/psn.ts
import {
  exchangeCodeForAccessToken,
  exchangeNpssoForCode,
  getProfileFromUserName,
  getUserTitles
} from "psn-api";
import { supabase } from '../lib/supabase'; // Ajuste si nécessaire pour le client serveur

export const syncUserPsnData = async (userId: string, psnId: string) => {
  try {
    // 1. Authentification du bot
    const accessCode = await exchangeNpssoForCode(process.env.BOT_PSN_NPSSO as string);
    const authorization = await exchangeCodeForAccessToken(accessCode);

    // 2. Récupération de l'accountId de l'utilisateur
    const profile = await getProfileFromUserName(authorization, psnId);
    const accountId = profile.profile.accountId;

    // 3. Récupération de la liste des jeux
    const userGames = await getUserTitles(authorization, accountId);

    // 4. Formatage des données pour Supabase
    const gamesToInsert = userGames.trophyTitles.map((game: any) => ({
      user_id: userId,
      np_communication_id: game.npCommunicationId,
      game_name: game.trophyTitleName,
      game_image_url: game.trophyTitleIconUrl,
      earned_trophies: game.earnedTrophies.bronze + game.earnedTrophies.silver + game.earnedTrophies.gold + game.earnedTrophies.platinum,
      total_trophies: game.definedTrophies.bronze + game.definedTrophies.silver + game.definedTrophies.gold + game.definedTrophies.platinum,
      progress: game.progress
    }));

    // 5. Insertion ou mise à jour (Upsert) dans Supabase
    const { error: dbError } = await supabase
      .from('user_psn_games')
      .upsert(gamesToInsert, { onConflict: 'user_id, np_communication_id' });

    if (dbError) throw dbError;

    return { success: true, message: "Synchronisation réussie", gamesCount: gamesToInsert.length };

  } catch (error: any) {
    console.error("Erreur PSN Sync:", error);
    return { success: false, error: "Impossible de synchroniser. Le profil est-il bien public ?" };
  }
};