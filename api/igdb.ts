// api/igdb.ts
const CLIENT_ID = process.env.EXPO_PUBLIC_IGDB_CLIENT_ID;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_IGDB_CLIENT_SECRET;

let accessToken = '';

/**
 * Récupère le jeton d'accès OAuth de Twitch requis pour IGDB
 */
async function getAccessToken() {
  if (accessToken) return accessToken;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Identifiants IGDB manquants dans le fichier .env");
  }

  try {
    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
      { method: 'POST' }
    );

    const data = await response.json();

    if (data.access_token) {
      accessToken = data.access_token;
      return accessToken;
    } else {
      console.error("Erreur Twitch Auth :", data);
      throw new Error("Impossible d'obtenir le jeton d'accès Twitch");
    }
  } catch (error) {
    console.error("Erreur réseau Auth :", error);
    throw error;
  }
}

/**
 * Recherche des jeux sur IGDB avec tous les champs nécessaires pour la collection
 */
export const searchGames = async (query: string) => {
  try {
    const token = await getAccessToken();
    
    // Définition des champs à récupérer
    const fields = [
      'name',
      'summary',
      'total_rating',
      'cover.url',
      'screenshots.url',
      'genres.name',
      'platforms.name',
      'version_parent',
      'game_modes.name',
      'game_engines.name',
      'involved_companies.company.name',
      'involved_companies.developer',
      'involved_companies.publisher'
    ].join(', ');

    const body = `search "${query}"; fields ${fields}; platforms.name; limit 10;`;

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur réponse IGDB :", errorData);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de l'appel searchGames :", error);
    return [];
  }
};