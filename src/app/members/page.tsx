
import { Suspense } from "react";
import { getMembers } from "@/lib/sheets";
import { Member } from "@/lib/types";
import AddMemberForm from "./AddMemberForm";
import DeleteMemberButton from "./DeleteMemberButton";

const MY_NAME = "ぎんじ";

async function MemberList() {
  let members: Member[] = [];
  try {
    members = await getMembers();
  } catch {
    // 接続失敗時は空
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-10 text-gray-600">
        <p>メンバーがいません</p>
        <p className="text-sm mt-1">上から追加してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member.id} className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
              {member.name[0]}
            </div>
            <span className="font-medium text-white">{member.name}</span>
            {member.name === MY_NAME && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">あなた</span>
            )}
          </div>
          {member.name !== MY_NAME && <DeleteMemberButton memberId={member.id} />}
        </div>
      ))}
    </div>
  );
}

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">メンバー管理</h1>
        <p className="text-gray-500 text-sm mt-1">練習に参加するメンバーを登録</p>
      </div>
      <AddMemberForm />
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">登録メンバー</h2>
        <Suspense fallback={
          <div className="space-y-2 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-900 rounded-xl border border-gray-800" />)}
          </div>
        }>
          <MemberList />
        </Suspense>
      </div>
    </div>
  );
}
