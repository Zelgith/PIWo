import { GameDetailsClient } from "@/components/GameDetailsClient";

type GameDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GameDetailsPage({
  params,
}: GameDetailsPageProps) {
  const { id } = await params;

  return <GameDetailsClient gameId={Number(id)} />;
}
