import { notFound } from "next/navigation";
import { getGoalDetails } from "@/actions/goal";
import { GoalDetailsClient } from "@/components/goals/goal-details-client";

interface PageProps {
    params: { id: string };
}

export default async function GoalDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const goal = await getGoalDetails(id);

    if (!goal) {
        return notFound();
    }

    return (
        <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            <GoalDetailsClient goal={goal} />
        </div>
    );
}
