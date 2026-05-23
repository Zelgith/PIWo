import type { User } from "firebase/auth";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  documentId,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { fetchBoardGames } from "@/lib/fetchBoardGames";
import { db } from "@/lib/firebase";
import { BoardGame, BoardGameDraft } from "@/lib/types";

const GAMES_COLLECTION = "games";
const PAGE_SIZE = 10;
const DEMO_SELLER = {
  id: "demo-seller",
  name: "Sprzedawca demo",
  email: "demo@example.com",
};

let legacyOwnersNormalized = false;
let legacyOwnersNormalizationPromise: Promise<void> | null = null;

function requireDb() {
  if (!db) {
    throw new Error("Brak konfiguracji Firebase. Uzupełnij plik .env.local.");
  }

  return db;
}

function getUserName(user: Pick<User, "displayName" | "email">) {
  return user.displayName || user.email || "Użytkownik";
}

function mapGameDoc(
  gameDoc: QueryDocumentSnapshot<DocumentData> | Awaited<ReturnType<typeof getDoc>>,
): BoardGame {
  const data = gameDoc.data() as Record<string, unknown>;

  return {
    id: gameDoc.id,
    title: typeof data.title === "string" ? data.title : "",
    images: Array.isArray(data.images)
      ? data.images.filter((image): image is string => typeof image === "string")
      : [],
    description: Array.isArray(data.description)
      ? data.description.filter(
          (paragraph): paragraph is string => typeof paragraph === "string",
        )
      : [],
    min_players: Number(data.min_players) || 1,
    max_players: Number(data.max_players) || 1,
    avg_play_time_minutes: Number(data.avg_play_time_minutes) || 0,
    publisher: typeof data.publisher === "string" ? data.publisher : "",
    is_expansion: Boolean(data.is_expansion),
    price_pln: Number(data.price_pln) || 0,
    type: typeof data.type === "string" ? data.type : "",
    sellerId: typeof data.sellerId === "string" ? data.sellerId : "",
    sellerName: typeof data.sellerName === "string" ? data.sellerName : "",
    sellerEmail: typeof data.sellerEmail === "string" ? data.sellerEmail : "",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
    isSold: Boolean(data.isSold),
    buyerId: typeof data.buyerId === "string" ? data.buyerId : null,
    buyerName: typeof data.buyerName === "string" ? data.buyerName : null,
    soldAt: data.soldAt instanceof Timestamp ? data.soldAt : null,
    isAuction: Boolean(data.isAuction),
    currentBidPln:
      typeof data.currentBidPln === "number" ? data.currentBidPln : null,
    highestBidderId:
      typeof data.highestBidderId === "string" ? data.highestBidderId : null,
    highestBidderName:
      typeof data.highestBidderName === "string" ? data.highestBidderName : null,
    bidCount: Number(data.bidCount) || 0,
  };
}

function mapDraftToFirestoreData(draft: BoardGameDraft) {
  return {
    title: draft.title.trim(),
    images: draft.images,
    description: draft.description,
    min_players: draft.min_players,
    max_players: draft.max_players,
    avg_play_time_minutes: draft.avg_play_time_minutes,
    publisher: draft.publisher.trim(),
    is_expansion: draft.is_expansion,
    price_pln: draft.price_pln,
    type: draft.type.trim(),
    isAuction: draft.isAuction,
  };
}

async function normalizeLegacyOwners() {
  if (legacyOwnersNormalized) {
    return;
  }

  if (legacyOwnersNormalizationPromise) {
    return legacyOwnersNormalizationPromise;
  }

  legacyOwnersNormalizationPromise = (async () => {
    const firestore = requireDb();
    const legacyGamesQuery = query(
      collection(firestore, GAMES_COLLECTION),
      where(documentId(), ">=", "legacy-"),
      where(documentId(), "<=", "legacy-\uf8ff"),
      limit(100),
    );
    const legacyGamesSnapshot = await getDocs(legacyGamesQuery);

    if (legacyGamesSnapshot.empty) {
      legacyOwnersNormalized = true;
      legacyOwnersNormalizationPromise = null;
      return;
    }

    const batch = writeBatch(firestore);
    let hasChanges = false;

    legacyGamesSnapshot.docs.forEach((gameDoc) => {
      const game = mapGameDoc(gameDoc);
      const shouldNormalize =
        game.sellerId !== DEMO_SELLER.id ||
        game.sellerName !== DEMO_SELLER.name ||
        game.sellerEmail !== DEMO_SELLER.email;

      if (!shouldNormalize) {
        return;
      }

      hasChanges = true;
      batch.update(gameDoc.ref, {
        sellerId: DEMO_SELLER.id,
        sellerName: DEMO_SELLER.name,
        sellerEmail: DEMO_SELLER.email,
      });
    });

    if (hasChanges) {
      await batch.commit();
    }

    legacyOwnersNormalized = true;
    legacyOwnersNormalizationPromise = null;
  })().catch((error) => {
    legacyOwnersNormalizationPromise = null;
    throw error;
  });

  return legacyOwnersNormalizationPromise;
}

export async function fetchGamesPage(
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
) {
  const firestore = requireDb();
  const gamesCollection = collection(firestore, GAMES_COLLECTION);
  const gamesQuery = cursor
    ? query(
        gamesCollection,
        orderBy("createdAt", "desc"),
        startAfter(cursor),
        limit(PAGE_SIZE),
      )
    : query(gamesCollection, orderBy("createdAt", "desc"), limit(PAGE_SIZE));

  const snapshot = await getDocs(gamesQuery);
  const games = snapshot.docs.map(mapGameDoc);

  return {
    games,
    lastVisible: snapshot.docs.at(-1) ?? null,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function fetchGameById(id: string) {
  const firestore = requireDb();
  const gameRef = doc(firestore, GAMES_COLLECTION, id);
  const gameSnapshot = await getDoc(gameRef);

  if (!gameSnapshot.exists()) {
    return null;
  }

  return mapGameDoc(gameSnapshot);
}

export async function fetchGamesByIds(ids: string[]) {
  const games = await Promise.all(ids.map((id) => fetchGameById(id)));

  return games.filter((game): game is BoardGame => game !== null);
}

export async function createGame(draft: BoardGameDraft, user: User) {
  const firestore = requireDb();
  const mappedDraft = mapDraftToFirestoreData(draft);
  const gameRef = await addDoc(collection(firestore, GAMES_COLLECTION), {
    ...mappedDraft,
    sellerId: user.uid,
    sellerName: getUserName(user),
    sellerEmail: user.email || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isSold: false,
    buyerId: null,
    buyerName: null,
    soldAt: null,
    currentBidPln: mappedDraft.isAuction ? mappedDraft.price_pln : null,
    highestBidderId: null,
    highestBidderName: null,
    bidCount: 0,
  });

  const createdGame = await fetchGameById(gameRef.id);

  if (!createdGame) {
    throw new Error("Nie udało się pobrać dodanej gry.");
  }

  return createdGame;
}

export async function updateOwnGame(id: string, draft: BoardGameDraft, user: User) {
  const firestore = requireDb();
  const gameRef = doc(firestore, GAMES_COLLECTION, id);
  const currentGame = await fetchGameById(id);

  if (!currentGame) {
    throw new Error("Nie znaleziono gry do edycji.");
  }

  if (currentGame.sellerId !== user.uid) {
    throw new Error("Możesz edytować tylko własną grę.");
  }

  if (currentGame.isSold) {
    throw new Error("Nie można edytować sprzedanej gry.");
  }

  if (currentGame.isAuction && currentGame.bidCount > 0) {
    throw new Error("Nie można edytować aukcji, która ma już oferty.");
  }

  const mappedDraft = mapDraftToFirestoreData(draft);

  await updateDoc(gameRef, {
    ...mappedDraft,
    currentBidPln: mappedDraft.isAuction ? mappedDraft.price_pln : null,
    highestBidderId: null,
    highestBidderName: null,
    bidCount: 0,
    updatedAt: serverTimestamp(),
  });

  const updatedGame = await fetchGameById(id);

  if (!updatedGame) {
    throw new Error("Nie udało się pobrać zaktualizowanej gry.");
  }

  return updatedGame;
}

export async function deleteOwnGame(id: string, user: User) {
  const firestore = requireDb();
  const currentGame = await fetchGameById(id);

  if (!currentGame) {
    throw new Error("Nie znaleziono gry do usunięcia.");
  }

  if (currentGame.sellerId !== user.uid) {
    throw new Error("Możesz usuwać tylko własne gry.");
  }

  if (currentGame.isSold) {
    throw new Error("Nie można usunąć sprzedanej gry.");
  }

  if (currentGame.isAuction && currentGame.bidCount > 0) {
    throw new Error("Nie można usunąć aukcji, która ma już oferty.");
  }

  await deleteDoc(doc(firestore, GAMES_COLLECTION, id));
}

export async function buyNow(id: string, user: User) {
  const firestore = requireDb();
  const gameRef = doc(firestore, GAMES_COLLECTION, id);

  await runTransaction(firestore, async (transaction) => {
    const gameSnapshot = await transaction.get(gameRef);

    if (!gameSnapshot.exists()) {
      throw new Error("Nie znaleziono gry.");
    }

    const game = mapGameDoc(gameSnapshot);

    if (game.isAuction) {
      throw new Error("Ta oferta jest aukcją.");
    }

    if (game.isSold) {
      throw new Error("Ta gra została już kupiona.");
    }

    if (game.sellerId === user.uid) {
      throw new Error("Nie możesz kupić własnej oferty.");
    }

    transaction.update(gameRef, {
      isSold: true,
      buyerId: user.uid,
      buyerName: getUserName(user),
      soldAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  const updatedGame = await fetchGameById(id);

  if (!updatedGame) {
    throw new Error("Nie udało się pobrać kupionej gry.");
  }

  return updatedGame;
}

export async function placeBid(id: string, amount: number, user: User) {
  const firestore = requireDb();
  const gameRef = doc(firestore, GAMES_COLLECTION, id);

  await runTransaction(firestore, async (transaction) => {
    const gameSnapshot = await transaction.get(gameRef);

    if (!gameSnapshot.exists()) {
      throw new Error("Nie znaleziono gry.");
    }

    const game = mapGameDoc(gameSnapshot);

    if (!game.isAuction) {
      throw new Error("Ta oferta nie jest aukcją.");
    }

    if (game.isSold) {
      throw new Error("Aukcja jest już zamknięta.");
    }

    if (game.sellerId === user.uid) {
      throw new Error("Nie możesz licytować własnej gry.");
    }

    const currentPrice = game.currentBidPln ?? game.price_pln;

    if (!Number.isFinite(amount) || amount <= currentPrice) {
      throw new Error("Kwota musi być większa od aktualnej ceny.");
    }

    transaction.update(gameRef, {
      currentBidPln: amount,
      highestBidderId: user.uid,
      highestBidderName: getUserName(user),
      bidCount: game.bidCount + 1,
      updatedAt: serverTimestamp(),
    });
  });

  const updatedGame = await fetchGameById(id);

  if (!updatedGame) {
    throw new Error("Nie udało się pobrać zaktualizowanej aukcji.");
  }

  return updatedGame;
}

export async function seedInitialGamesIfEmpty(user: User) {
  void user;
  const firestore = requireDb();
  const existingGames = await getDocs(
    query(collection(firestore, GAMES_COLLECTION), limit(1)),
  );

  if (!existingGames.empty) {
    await normalizeLegacyOwners();
    return false;
  }

  const sourceGames = await fetchBoardGames();
  const batch = writeBatch(firestore);
  const now = Date.now();

  sourceGames.forEach((game, index) => {
    const gameRef = doc(firestore, GAMES_COLLECTION, `legacy-${game.legacyId}`);
    const createdAt = Timestamp.fromMillis(now - index * 1000);

    batch.set(gameRef, {
      title: game.title,
      images: game.images,
      description: game.description,
      min_players: game.min_players,
      max_players: game.max_players,
      avg_play_time_minutes: game.avg_play_time_minutes,
      publisher: game.publisher,
      is_expansion: game.is_expansion,
      price_pln: game.price_pln,
      type: game.type,
      sellerId: DEMO_SELLER.id,
      sellerName: DEMO_SELLER.name,
      sellerEmail: DEMO_SELLER.email,
      createdAt,
      updatedAt: createdAt,
      isSold: false,
      buyerId: null,
      buyerName: null,
      soldAt: null,
      isAuction: game.isAuction,
      currentBidPln: game.isAuction ? game.price_pln : null,
      highestBidderId: null,
      highestBidderName: null,
      bidCount: 0,
    });
  });

  await batch.commit();
  await normalizeLegacyOwners();

  return true;
}
