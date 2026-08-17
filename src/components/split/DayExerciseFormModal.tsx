import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EXERCISE_CATEGORIES, fetchExercises, type ExerciseCategory } from "../../lib/exercises";
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

    const [exerciseId, setExerciseId] = useState('');
    const [category, setCategory] = useState<ExerciseCategory | "">("");
    const [error, setError] = useState("");

    const { data, isPending, isError } = useQuery({
        queryKey: ["exercises"],
        queryFn: fetchExercises,
    });

    const filteredExercises = category
        ? data?.filter((exercise) => exercise.category === category)
        : data;

    useEffect(() => {
        if (existingExercise) {
            const matchedExercise = data?.find((exercise) => exercise.id === existingExercise.exerciseId);
            setCategory((matchedExercise?.category as ExerciseCategory | undefined) ?? "");
            setExerciseId(existingExercise.exerciseId);
        } else if (data?.length) {
            setCategory("");
            setExerciseId(data[0].id);
        }
    }, [existingExercise, isOpen, data]);

    const handleCategoryChange = (nextCategory: ExerciseCategory | "") => {
        setCategory(nextCategory);
        const nextExercises = nextCategory
            ? data?.filter((exercise) => exercise.category === nextCategory)
            : data;
        setExerciseId(nextExercises?.[0]?.id ?? "");
    };

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: ({ id, templateId }: { id: string; templateId: string }) =>
            addExerciseToTemplate(id, templateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates", splitId] });
            onClose();
        },
        onError: (mutationError: Error) => {
            setError(mutationError.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, exerciseId, templateId }: { id: string; exerciseId: string, templateId: string }) =>
            updateExerciseInTemplate(id, exerciseId, templateId),
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
        if (!exerciseId) {
            setError("Exercise is required.");
            return;
        }

        setError("");
        if (existingExercise) {
            updateMutation.mutate({
                id: existingExercise.id,
                exerciseId: exerciseId,
                templateId: templateId
            })
        } else {
            createMutation.mutate({
                id: exerciseId,
                templateId: templateId
            });
        }

    };

    const handleClose = () => {
        setExerciseId('');
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
                        <label htmlFor="exercise-category">Category</label>
                        <select
                            id="exercise-category"
                            value={category}
                            onChange={(e) =>
                                handleCategoryChange(e.target.value as ExerciseCategory | "")
                            }
                        >
                            <option value="">All categories</option>

                            {EXERCISE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

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

                            {filteredExercises?.map((exercise) => (
                                <option key={exercise.id} value={exercise.id}>
                                    {exercise.name}
                                </option>
                            ))}
                        </select>

                        {!filteredExercises?.length && (
                            <p className="error-text">No exercises in this category.</p>
                        )}

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