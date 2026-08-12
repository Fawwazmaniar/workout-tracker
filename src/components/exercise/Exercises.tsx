import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteExercise, fetchExercises } from "../../lib/exercises";
import { LuDumbbell, LuPencil, LuPlus, LuTrash } from "react-icons/lu";
import { useAuthStore } from "../../lib/useAuthStore";
import { ExerciseFormModal } from "./ExerciseFormModal";
import { NotificationModal } from "../../shared/NotificationModal";
import { useState } from "react";

export const Exercises = () => {
    const { data, isPending, isError, error } = useQuery({
        queryKey: ["exercises"],
        queryFn: fetchExercises,
    });

    const { role } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [action, setAction] = useState('');
    const [title, setTitle] = useState('');
    const [mutationError, setMutationError] = useState("");

    const queryClient = useQueryClient();

    const [selectedExercise, setSelectedExercise] = useState(null);

    const handleAddExercise = () => setIsModalOpen(true)

    const handleDeleteExercise = (id: string): void => {
        const foundExercise = data?.find((item) => item.id === id);

        if (!foundExercise) return;
        setIsNotificationOpen(true);
        setSelectedExercise(foundExercise);
        setAction('Delete');
        setTitle('Delete Exercise');
    }

    const handleEditExercise = (id: string): void => {
        const foundExercise = data?.find((item) => item.id === id);

        if (!foundExercise) return;
        setSelectedExercise(foundExercise);
        setIsModalOpen(true);
        setAction('Edit');
        setTitle('Edit Exercise');
    }

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteExercise(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exercises"] });
        },
        onError: (e: Error) => {
            setMutationError(e.message);
        },
    });

    const handleConfirmDelete = () => {
        if (selectedExercise) {
            deleteMutation.mutate(selectedExercise.id);
            setIsNotificationOpen(false);
        }
    };


    if (isPending) {
        return <div className="exercises-state">Loading exercises...</div>;
    }

    if (isError) {
        return <div className="exercises-state error">Error: {error.message}</div>;
    }

    if (!data?.length) {
        return <div className="exercises-state">No exercises found.</div>;
    }

    const grouped = data.reduce<Record<string, typeof data>>((acc, exercise) => {
        const key = exercise.category ?? "Other";

        if (!acc[key]) {
            acc[key] = [];
        }

        acc[key].push(exercise);
        return acc;
    }, {});
    return (
        <div className="exercises-page">
            <div className="exercises-header">
                <h1>Exercises</h1>
                <p>{data.length} movements</p>
            </div>

            {mutationError && <p className="error-text">{mutationError}</p>}

            {!data?.length ? (
                <div className="exercises-state">No exercises found.</div>
            ) : (
                <div className="exercise-groups">
                    {Object.entries(grouped).map(([category, exercises]: [string, typeof data], idx) => (
                        <section className={`exercise-group-card ${idx === 0 ? 'is-primary' : ''}`} key={category}>
                            <div className="exercise-group-head">
                                <h2>{category}</h2>
                                <span>{exercises.length}</span>
                            </div>

                            <ul className="exercise-list">
                                {exercises.map((exercise) => (
                                    <li className="exercise-item" key={exercise.id}>
                                        <div className="row-main">
                                            <LuDumbbell className="exercise-icon" aria-hidden="true" />
                                            <span className="exercise-name">{exercise.name}</span>

                                            {role === "admin" && (
                                                <span className="exercise-actions">
                                                    <button
                                                        type="button"
                                                        className="exercise-action-btn delete-action"
                                                        onClick={() => handleDeleteExercise(exercise.id)}
                                                        aria-label={`Delete ${exercise.name}`}
                                                    >
                                                        <LuTrash className="exercise-action-icon" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="exercise-action-btn edit-action"
                                                        onClick={() => handleEditExercise(exercise.id)}
                                                        aria-label={`Edit ${exercise.name}`}
                                                    >
                                                        <LuPencil className="exercise-action-icon" aria-hidden="true" />
                                                    </button>
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
            {role === 'admin' && <div className="exercises-fab-wrap">
                <button className="fab-add" type="button" aria-label="Add exercise" onClick={handleAddExercise}>
                    <LuPlus className="footer-icon" aria-hidden="true" />
                </button>
            </div>}
            <ExerciseFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedExercise(null);
                }}
                existingExercise={selectedExercise ?? undefined}
            />
            <NotificationModal
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                action={action}
                title={title}
                onConfirm={handleConfirmDelete}
            />
        </div>

    );
};

