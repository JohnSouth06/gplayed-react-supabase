import { searchGames } from './igdb';

const SCANDEX_API_KEY = process.env.EXPO_PUBLIC_SCANDEX_API_KEY;
const SCANDEX_BASE_URL = 'https://scandex.gamery.app/api/v1';

interface ScanDexResult {
  id: number;
  is_suggestion: boolean;
  title: string;
  platform: string;
  igdb_metadata: {
    id: number;
    platform_id: number;
  };
}

/**
 * Recherche un jeu via son code-barres EAN/UPC sur ScanDex,
 * puis récupère les détails complets depuis IGDB.
 */
export const lookupBarcode = async (barcode: string) => {
  if (!SCANDEX_API_KEY) {
    throw new Error("Clé API ScanDex manquante. Vérifiez EXPO_PUBLIC_SCANDEX_API_KEY dans votre .env");
  }

  // 1. Requête ScanDex pour résoudre le code-barres
  const response = await fetch(`${SCANDEX_BASE_URL}/lookup?ean=${barcode}`, {
    headers: {
      'Authorization': `Bearer ${SCANDEX_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (response.status === 404) {
    throw new Error('Jeu introuvable pour ce code-barres.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || `Erreur ScanDex (${response.status})`);
  }

  const result: ScanDexResult = await response.json();

  // 2. On récupère les détails complets depuis IGDB via l'igdb_id
  const igdbId = result.igdb_metadata?.id;
  const platformName = result.platform;

  if (!igdbId) {
    throw new Error('Correspondance IGDB introuvable pour ce jeu.');
  }

  // On utilise fetchFromIGDB directement pour récupérer par ID
  const { fetchFromIGDB } = await import('./igdb');

  const fields = [
    'name', 'summary', 'total_rating', 'cover.url', 'screenshots.url',
    'first_release_date', 'genres.name', 'platforms.name', 'version_parent',
    'game_modes.name', 'game_engines.name',
    'involved_companies.company.name',
    'involved_companies.developer',
    'involved_companies.publisher',
  ].join(', ');

  const query = `fields ${fields}; where id = ${igdbId};`;
  const games = await fetchFromIGDB(query);

  if (!Array.isArray(games) || games.length === 0) {
    throw new Error('Impossible de récupérer les détails du jeu depuis IGDB.');
  }

  const game = games[0];

  // On pré-sélectionne la plateforme remontée par ScanDex si elle existe dans la liste IGDB
  const matchedPlatform = game.platforms?.find(
    (p: any) => p.name?.toLowerCase() === platformName?.toLowerCase()
  );

  return {
    ...game,
    selectedPlatform: matchedPlatform?.name ?? game.platforms?.[0]?.name ?? platformName,
    uniqueSearchId: `${game.id}-scan`,
  };
};
