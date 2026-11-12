import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEventHandler } from "react";
import {
    createExercise,
    EXERCISE_CATEGORIES,
    updateExercise,
    type ExerciseCategory,
} from "../../lib/exercises";
import { LuX } from "react-icons/lu";

interface ExerciseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingExercise?: {
        id: string;
        name: string;
        category: ExerciseCategory | string | null;
    };
}

export const ExerciseFormModal = ({
    isOpen,
    onClose,
    existingExercise,
}: ExerciseFormModalProps) => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState<ExerciseCategory | "">("");
    const [error, setError] = useState("");

    const queryClient = useQueryClient();

    // Reset the form whenever the modal opens or the exercise being edited changes.
    // Adjusting state during render avoids a setState-in-effect cascade.
    const [syncedFor, setSyncedFor] = useState<{ isOpen: boolean; exercise: typeof existingExercise } | null>(null);
    if (!syncedFor || syncedFor.isOpen !== isOpen || syncedFor.exercise !== existingExercise) {
        setSyncedFor({ isOpen, exercise: existingExercise });
        if (isOpen) {
            setName(existingExercise?.name ?? "");
            setCategory((existingExercise?.category as ExerciseCategory | undefined) ?? "");
            setError("");
        }
    }

    const createMutation = useMutation({
        mutationFn: ({ name, category }: { name: string; category: ExerciseCategory }) =>
            createExercise(name, category),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exercises"] });
            onClose();
        },
        onError: (mutationError: Error) => {
            setError(mutationError.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates:{ name: string; category: ExerciseCategory }}) =>
            updateExercise(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exercises"] });
            onClose();
        },
        onError: (mutationError: Error) => {
            setError(mutationError.message);
        },
    });

    const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        if (!name.trim() || !category) {
            setError("Name and category are required.");
            return;
        }

        setError("");
        if(existingExercise){
            updateMutation.mutate({
                id: existingExercise.id,
                updates: {
                    name: name.trim(),
                    category
                }
            })
        }else{
            createMutation.mutate({
                name: name.trim(),
                category,
            });
        }
        
    };

    const handleClose = () => {
        setName("");
        setCategory("");
        setError("");
        onClose();
    };

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
                        <label htmlFor="exercise-name">Name</label>
                        <input
                            id="exercise-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Incline dumbbell press"
                        />

                        <label htmlFor="exercise-category">Category</label>
                        <select
                            id="exercise-category"
                            value={category}
                            onChange={(e) =>
                                setCategory(e.target.value as ExerciseCategory)
                            }
                        >
                            <option value="" disabled>
                                Select a category
                            </option>

                            {EXERCISE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        {error && <p className="error-text">{error}</p>}

                        <button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending
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
    );
};