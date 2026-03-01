import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoals } from "@/actions/goal";
import { getGoalStats } from "@/actions/ai-goals";
import { GoalList } from "@/components/goals/goal-list";
import { GoalModal } from "@/components/modals/goal-modal";
import { AICoalInsights } from "@/components/goals/ai-goal-insights";
import { GoalStats } from "@/components/goals/goal-stats";
import { Target } from "lucide-react";

export default async function GoalsPage() {
    const session = await getServerSession(authOptions);
    const [goals, stats] = await Promise.all([
        getGoals(),
        getGoalStats()
    ]);

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent flex items-center gap-3">
                        <Target className="h-10 w-10 text-emerald-500" /> Metas de Economia
                    </h1>
                    <p className="text-zinc-500 mt-1 text-lg font-medium">Transforme sobras em patrimônio com ajuda da nossa IA.</p>
                </div>
                <GoalModal />
            </div>

            <GoalStats totalSaved={stats.totalSaved} averageSaving={stats.averageSaving} />

            <AICoalInsights />

            <div className="grid gap-6">
                <GoalList goals={goals} />
            </div>
        </div>
    );
}
