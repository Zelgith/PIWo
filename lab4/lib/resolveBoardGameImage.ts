const BOARD_GAME_IMAGE_BASE_URL =
  "https://szandala.github.io/piwo-api/images/board-games/";

const IMAGE_PATH_MAP: Record<string, string> = {
  "img/catan.webp": `${BOARD_GAME_IMAGE_BASE_URL}catan.webp`,
  "img/catan2.webp": `${BOARD_GAME_IMAGE_BASE_URL}catan2.jpg`,
  "img/catan-exp.webp": `${BOARD_GAME_IMAGE_BASE_URL}catan-exp.webp`,
  "img/gloomhaven.webp": `${BOARD_GAME_IMAGE_BASE_URL}gloomhaven.webp`,
  "img/gloomhaven2.webp": `${BOARD_GAME_IMAGE_BASE_URL}gloomhaven2.webp`,
  "img/pociagi-europa/webp": `${BOARD_GAME_IMAGE_BASE_URL}pociag-europa.webp`,
  "img/pociagi-szwajcaria.webp": `${BOARD_GAME_IMAGE_BASE_URL}pociagi-szwajcaria.jpg`,
  "img/dixit.webp": `${BOARD_GAME_IMAGE_BASE_URL}dixit.webp`,
  "img/dixit2.webp": `${BOARD_GAME_IMAGE_BASE_URL}dixit2.webp`,
  "img/dixit-odyseja.webp": `${BOARD_GAME_IMAGE_BASE_URL}dixit-odyseja.webp`,
  "img/nemesis.webp": `${BOARD_GAME_IMAGE_BASE_URL}nemesis.webp`,
};

function buildFallbackImageUrl(relativePath: string) {
  const normalizedPath = relativePath
    .replace(/^img\//, "")
    .replace(/^images\/board-games\//, "")
    .replace(/\/webp$/, ".webp");

  if (!normalizedPath) {
    return null;
  }

  return new URL(normalizedPath, BOARD_GAME_IMAGE_BASE_URL).toString();
}

export function resolveBoardGameImage(image: unknown) {
  if (typeof image !== "string") {
    return null;
  }

  const trimmedImage = image.trim();

  if (!trimmedImage) {
    return null;
  }

  if (trimmedImage.startsWith(BOARD_GAME_IMAGE_BASE_URL)) {
    return trimmedImage;
  }

  if (trimmedImage.startsWith("http://") || trimmedImage.startsWith("https://")) {
    return trimmedImage;
  }

  if (IMAGE_PATH_MAP[trimmedImage]) {
    return IMAGE_PATH_MAP[trimmedImage];
  }

  return buildFallbackImageUrl(trimmedImage);
}

export function isResolvedImage(image: string | null): image is string {
  return typeof image === "string" && image.length > 0;
}
