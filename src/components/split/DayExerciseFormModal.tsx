import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchExercises } from "../../lib/exercises";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState, type FormEventHandler } from "react";
import { LuX } from "react-icons/lu";
import { addExerciseToTemplate, updateExerciseInTemplate } from "../../lib/splits";

interface DayExerciseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateId: string;
    splitId: string;
    existingExercise?: {
        id: string;
        exerciseId: string;
        name: string;
        exercise_order: number;
    };
}

export const DayExerciseFormModal = ({
    isOpen,
    onClose,
    templateId,
    splitId,
    existingExercise,
}: DayExerciseFormModalProps) => {

    const [order, setOrder] = useState(0);
    const [exerciseId, setExerciseId] = useState("");
    const [error, setError] = useState("");

    const { data, isPending, isError } = useQuery({
        queryKey: ["exercises"],
        queryFn: fetchExercises,
    });

    useEffect(() => {
        if (existingExercise) {
            setOrder(existingExercise.exercise_order);
            setExerciseId(existingExercise.exerciseId);
        } else if (data?.length) {
            setOrder(0);
            setExerciseId(data[0].id);
        }
    }, [existingExercise, isOpen, data]);

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: ({ id, order, templateId }: { id: string; order: number, templateId: string }) =>
            addExerciseToTemplate(id, order, templateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates", splitId] });
            onClose();
        },
        onError: (mutationError: Error) => {
            setError(mutationError.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, exerciseId, order, templateId }: { id: string; exerciseId: string, order: number, templateId: string }) =>
            updateExerciseInTemplate(id, exerciseId, order, templateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates", splitId] });
            onClose();
        },
        onError: (mutationError: Error) => {
            setError(mutationError.message);
        },
    });


    const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        console.log(exerciseId, order)
        if (!exerciseId || order == 0) {
            setError("Exercise and Order is required.");
            return;
        }

        setError("");
        if (existingExercise) {
            updateMutation.mutate({
                id: existingExercise.id,
                exerciseId: exerciseId,
                order: order,
                templateId: templateId
            })
        } else {
            createMutation.mutate({
                id: exerciseId,
                order: order,
                templateId: templateId
            });
        }

    };

    const handleClose = () => {
        setExerciseId("");
        onClose();
    };

    if (isPending) {
        return <div className="exercises-state">Loading exercises...</div>;
    }

    if (isError) {
        return <div className="exercises-state error">Error: {error}</div>;
    }

    if (!data?.length) {
        return <div className="exercises-state">No exercises found.</div>;
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="modal-overlay" />
                <Dialog.Content className="modal-content">
                    <div className="modal-header">
                        <Dialog.Title>
                            {existingExercise ? "Edit exercise" : "Add exercise"}
                        </Dialog.Title>

                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="modal-close"
                                aria-label="Close"
                            >
                                <LuX />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <label htmlFor="exercise-name">Exercise</label>
                        <select
                            id="exercise-name"
                            value={exerciseId}
                            onChange={(e) =>
                                setExerciseId(e.target.value)
                            }
                        >
                            <option value="" disabled>
                                Select an Exercise
                            </option>

                            {data.map((exercise) => (
                                <option key={exercise.id} value={exercise.id}>
                                    {exercise.name}
                                </option>
                            ))}
                        </select>

                        <label htmlFor="exercise-order">Order</label>
                        <input
                            id="exercise-order"
                            type="text"
                            value={order}
                            onChange={(e) => setOrder(parseInt(e.target.value))}
                            placeholder="1"
                        />

                        {error && <p className="error-text">{error}</p>}

                        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending
                                ? existingExercise
                                    ? "Saving..."
                                    : "Adding..."
                                : existingExercise
                                    ? "Save changes"
                                    : "Add exercise"}
                        </button>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}