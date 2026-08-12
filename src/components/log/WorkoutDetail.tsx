import { useQuery } from "@tanstack/react-query";
import { fetchWorkoutDetail, unwrapExerciseRelation } from "../../lib/logs";
import * as Dialog from "@radix-ui/react-dialog";
import { LuX } from "react-icons/lu";


interface WorkoutDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    workoutId: string;

}

export const WorkoutDetailModal = ({
    isOpen,
    onClose,
    workoutId
}: WorkoutDetailModalProps) => {

    const { data: workoutDetail, isPending } = useQuery({
        queryKey: ["workoutDetail", workoutId],
        queryFn: () => fetchWorkoutDetail(workoutId),
        enabled: isOpen && !!workoutId,
    });

    const handleClose = () => {
        onClose();
    };

    const noteMap = new Map((workoutDetail?.notes ?? []).map((n) => [n.exercise_id, n.note]));

    const groupedSets = (workoutDetail?.sets ?? []).reduce<Record<string, typeof workoutDetail.sets>>((acc, item) => {
        const key = item.exercise_id;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {});

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="modal-overlay" />
                <Dialog.Content className="modal-content workout-detail-modal">
                    <div className="modal-header">
                        <Dialog.Title>
                            Workout Details
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button type="button" className="modal-close" aria-label="Close">
                                <LuX />
                            </button>
                        </Dialog.Close>
                    </div>
                    {isPending ? (
                        <div className="workout-detail-state">Loading details...</div>
                    ) : !workoutDetail?.sets?.length ? (
                        <div className="workout-detail-state">No sets found for this workout.</div>
                    ) : (
                        <div className="workout-detail-body">
                            {Object.entries(groupedSets).map(([exerciseId, sets]) => {
                                const exercise = unwrapExerciseRelation(sets[0]?.exercises) as { name?: string } | undefined;
                                const note = noteMap.get(exerciseId);

                                return (
                                    <section key={exerciseId} className="workout-detail-card">
                                        <div className="workout-detail-head">
                                            <h3 className="workout-detail-name">{exercise?.name ?? 'Exercise'}</h3>
                                            <span className="badge">{sets.length} sets</span>
                                        </div>

                                        {!!note?.trim() && (
                                            <p className="workout-detail-note">{note}</p>
                                        )}

                                        <div className="workout-detail-set-list">
                                            {sets.map((item) => (
                                                <div key={item.id} className="workout-detail-set-row">
                                                    <span className="workout-detail-set-index">Set {item.set_number}</span>
                                                    <span>{item.weight} lbs</span>
                                                    <span>{item.reps} reps</span>
                                                    <span>{item.is_warmup ? 'Warm-up' : 'Working'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}