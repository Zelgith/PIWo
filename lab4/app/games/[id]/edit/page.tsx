import { GameForm } from "@/components/GameForm";

type EditGamePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditGamePage({ params }: EditGamePageProps) {
  const { id } = await params;

  return <GameForm mode="edit" gameId={id} />;
}
