import { supabase } from '../lib/supabase';
import { fetchFromIGDB } from './igdb';

// ─── CONSTANTES DE MAPPING (Base de données <-> UI) ─────────────
export const MAP_FORMAT_TO_SQL = { 'Physique': 'physical', 'Numérique': 'digital' } as const;
export const MAP_SQL_TO_FORMAT = { 'physical': 'Physique', 'digital': 'Numérique' } as const;

export const MAP_STATUS_TO_SQL = {
  'A faire': 'todo',
  'En cours': 'in_progress',
  'Terminé': 'finished',
  'Platiné - 100%': 'platinum',
  'Abandonné': 'abandoned'
} as const;

export const MAP_SQL_TO_STATUS = {
  'todo': 'A faire',
  'in_progress': 'En cours',
  'finished': 'Terminé',
  'platinum': 'Platiné - 100%',
  'abandoned': 'Abandonné'
} as const;

// ─── TYPAGES ────────────────────────────────────────────────────
interface AddGameToCollectionParams {
  userId: string;
  gameData: any;
  preferences: {
    format: 'digital' | 'physical';
    status: 'todo' | 'in_progress' | 'finished' | 'platinum' | 'abandoned';
    platform: string;
    priority: string;
  };
}

// ─── FONCTIONS UTILISATEUR ──────────────────────────────────────
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    return null; 
  }
  return user;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// ─── FONCTIONS COLLECTION ─
/**
 * 1. Ajoute un jeu au catalogue global ET à la collection de l'utilisateur
 */
export const addGameToCollection = async ({ userId, gameData, preferences }: AddGameToCollectionParams) => {
  try {
    // --- ÉTAPE 1 : Gérer le catalogue global (Table 'games') ---
    
    // On extrait les entreprises (développeurs / éditeurs)
    const developer = gameData.involved_companies?.find((c: any) => c.developer)?.company.name || null;
    const publisher = gameData.involved_companies?.find((c: any) => c.publisher)?.company.name || null;

    // On prépare l'objet pour la table games
    const catalogEntry = {
      igdb_id: gameData.id,
      title: gameData.name,
      genres: gameData.genres?.map((g: any) => g.name) || [],
      rating_igdb: gameData.total_rating || null,
      developer: developer,
      publisher: publisher,
      game_modes: gameData.game_modes?.map((m: any) => m.name) || [],
      engine: gameData.game_engines?.[0]?.name || null,
      description: gameData.summary || null,
      screenshots: gameData.screenshots?.map((s: any) => `https:${s.url.replace('t_thumb', 't_1080p')}`) || [],
      cover_url: gameData.cover?.url ? `https:${gameData.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      platforms_list: gameData.platforms?.map((p: any) => p.name) || [],
      // IGDB donne un timestamp en secondes, on convertit en date ISO
      release_date: gameData.first_release_date ? new Date(gameData.first_release_date * 1000).toISOString() : null,
    };

    // Upsert dans le catalogue (si le igdb_id existe, on met à jour, sinon on crée)
    const { error: catalogError } = await supabase
      .from('games')
      .upsert(catalogEntry, { onConflict: 'igdb_id' });

    if (catalogError) throw new Error(`Erreur catalogue: ${catalogError.message}`);

    // --- ÉTAPE 2 : Ajouter à la collection personnelle ---
    const { data: collectionData, error: collectionError } = await supabase
      .from('user_collection')
      .insert([
        {
          user_id: userId,
          game_id: gameData.id, // Fait référence à igdb_id du catalogue
          format: preferences.format,
          status: preferences.status,
          platform: preferences.platform,
          priority: preferences.priority,
          playtime: 0,
        }
      ])
      .select();

    if (collectionError) {
      // Si l'erreur est liée à la contrainte d'unicité (l'utilisateur a déjà ce jeu)
      if (collectionError.code === '23505') {
        throw new Error('Ce jeu est déjà dans votre collection.');
      }
      throw new Error(`Erreur collection: ${collectionError.message}`);
    }

    return collectionData[0];

  } catch (error) {
    console.error("Erreur addGameToCollection:", error);
    throw error;
  }
};

/**
 * 2. Récupère la collection complète de l'utilisateur (avec les infos du jeu jointes)
 */
export const getUserCollection = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_collection')
    .select(`
      *,
      game:games (
        title,
        cover_url,
        genres,
        rating_igdb,
        platforms_list,
        release_date,
        developer,
        publisher,
        game_modes,
        engine,
        description,
        screenshots
      )
    `)
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * 3. Met à jour les préférences d'un jeu dans la collection (ex: changer de statut, rajouter du temps de jeu)
 */
export const updateCollectionEntry = async (collectionId: string, updates: Partial<AddGameToCollectionParams['preferences'] & { playtime: number }>) => {
  const { data, error } = await supabase
    .from('user_collection')
    .update(updates)
    .eq('id', collectionId)
    .select();

  if (error) throw error;
  return data[0];
};

/**
 * 4. Supprime un jeu de la collection
 */
export const removeGameFromCollection = async (collectionId: string) => {
  const { error } = await supabase
    .from('user_collection')
    .delete()
    .eq('id', collectionId);

  if (error) throw error;
};

/**
 * 5. Récupère des suggestions personnalisées pour la wishlist
 */
export const getWishlistSuggestions = async (userId: string) => {
  try {
    // 1. Récupérer les jeux terminés ou platinés depuis Supabase
    const { data: refGames, error: refError } = await supabase
      .from('user_collection')
      .select('game_id')
      .eq('user_id', userId)
      .in('status', ['finished', 'platinum'])
      .limit(5);

    if (refError || !refGames || refGames.length === 0) return [];
    const referenceIds = refGames.map(game => game.game_id);

    // 2. Récupérer toute la collection pour exclure les jeux déjà possédés ou déjà en wishlist
    const { data: allGames } = await supabase
      .from('user_collection')
      .select('game_id')
      .eq('user_id', userId);
    const ownedIds = allGames ? allGames.map(g => g.game_id) : [];

    // 3. Demander à IGDB les jeux similaires aux jeux de référence
    const similarQuery = `fields similar_games; where id = (${referenceIds.join(',')}); limit 5;`;
    const igdbResponse = await fetchFromIGDB(similarQuery);
    
    if (!Array.isArray(igdbResponse)) return [];
    
    // Extraire et fusionner tous les IDs de jeux similaires
    let suggestedIds: number[] = [];
    igdbResponse.forEach((game: any) => {
      if (game.similar_games) {
        suggestedIds = [...suggestedIds, ...game.similar_games];
      }
    });

    // Filtrer les doublons et retirer les jeux que l'utilisateur possède déjà
    const uniqueSuggestedIds = [...new Set(suggestedIds)].filter(id => !ownedIds.includes(id));
    if (uniqueSuggestedIds.length === 0) return [];

    // 4. Récupérer les détails des jeux suggérés filtrés (Nom, Cover)
    const finalQuery = `fields name, cover.url, total_rating; where id = (${uniqueSuggestedIds.slice(0, 10).join(',')}); sort total_rating desc;`;
    const finalSuggestions = await fetchFromIGDB(finalQuery);
    
    if (!Array.isArray(finalSuggestions)) return [];

    // 5. Formater les objets pour l'UI de l'application
    return finalSuggestions.map((game: any) => {
      // On transforme l'url miniature d'IGDB (t_thumb) en format jaquette (t_cover_big) si disponible
      const coverUrl = game.cover?.url 
        ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` 
        : null;

      return {
        id: game.id,
        name: game.name,
        cover_url: coverUrl
      };
    });

  } catch (error) {
    console.error("Erreur getWishlistSuggestions:", error);
    return [];
  }
};

// ─── FONCTIONS ADDITIONNELLES ─
// Typage pour l'ajout d'un jeu
interface AddGameToCollectionParams {
  userId: string;
  gameData: any; // Les données complètes qui viennent d'IGDB (celles retournées par ton api/igdb.ts)
  preferences: {
    format: 'digital' | 'physical';
    status: 'todo' | 'in_progress' | 'finished' | 'platinum' | 'abandoned';
    platform: string;
    priority: string; // Ex: 'Basse', 'Moyenne', 'Haute'
  };
}
