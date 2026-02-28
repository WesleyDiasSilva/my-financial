import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoals } from "@/actions/goal";
import { GoalList } from "@/components/goals/goal-list";
import { GoalModal } from "@/components/modals/goal-modal";
import { Target } from "lucide-react";

export default async function GoalsPage() {
    const session = await getServerSession(authOptions);
    const goals = await getGoals();

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent flex items-center gap-3">
                        <Target className="h-10 w-10 text-emerald-500" /> Metas de Economia
                    </h1>
                    <p className="text-zinc-500 mt-1 text-lg font-medium">Gerencie seus objetivos financeiros e acompanhe seu progresso.</p>
                </div>
                <GoalModal />
            </div>

            <div className="grid gap-6">
                <GoalList goals={goals} />
            </div>
        </div>
    );
}
