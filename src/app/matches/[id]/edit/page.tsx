import { Suspense } from "react";
import { getMatches, getMembers } from "@/lib/sheets";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditMatchForm from "./EditMatchForm";
import { CardSkeleton } from "@/components/Skeleton";

async function EditMatchContent({ id }: { id: string }) {
  const [matches, members] = await Promise.all([getMatches(), getMembers()]);
  const match = matches.find((m) => m.id === id);
  if (!match) notFound();

  return <EditMatchForm match={match} members={members} />;
}

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/matches" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← 試合履歴
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">試合を編集する</h1>
        <p className="text-gray-500 text-sm mt-1">記録を修正しよう</p>
      </div>
      <Suspense fallback={<CardSkeleton />}>
        <EditMatchContent id={id} />
      </Suspense>
    </div>
  );
}
