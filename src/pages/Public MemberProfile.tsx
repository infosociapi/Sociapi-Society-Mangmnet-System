import { useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Avatar, Badge, Card } from "../components/ui";
import { BadgeCheck } from "lucide-react";

export default function PublicMemberProfile() {
  const { memberId } = useParams();
  const { users } = useApp();
  const member = users.find(u => u.memberId === memberId);

  if (!member) return <div className="p-10 text-center">Member not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <Card className="w-full max-w-md p-6 text-center">
        <Avatar name={member.name} gradient={member.avatar} size={120} src={member.photoUrl} />
        <h1 className="text-2xl font-bold mt-4">{member.name}</h1>
        <Badge tone="indigo" className="mt-1">{member.memberId}</Badge>
        
        <div className="mt-6 text-left space-y-3">
          <Detail label="Department" value={member.department} />
          <Detail label="Position" value={member.position} />
          <Detail label="Status" value={member.status} />
          <Detail label="Join Date" value={new Date(member.joinDate).toLocaleDateString()} />
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-200">
          <Badge tone="emerald" className="gap-1"><BadgeCheck className="h-4 w-4" /> Verified Sociapi Member</Badge>
        </div>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string, value: string }) {
  return <div className="flex justify-between border-b pb-2"><span className="text-slate-500">{label}</span><span className="font-semibold">{value}</span></div>;
}
