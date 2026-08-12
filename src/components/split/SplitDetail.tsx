import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchSplitById, fetchTemplatesWithExercises, removeExerciseFromTemplate } from "../../lib/splits";
import { LuArrowLeft, LuDumbbell, LuLayers, LuPencil, LuPlus, LuTrash } from "react-icons/lu";
import { NotificationModal } from "../../shared/NotificationModal";
import { useState } from "react";
import { DayExerciseFormModal } from "./DayExerciseFormModal";
import { DayFormModal } from "./DayFormModal";

type EditableExercise = {
    id: string;
    exerciseId: string;
    name: string;
    exercise_order: number;
};

export const SplitDetail = () => {

    const { splitId } = useParams();

    const { data: split, isPending: splitPending } = useQuery({
        queryKey: ["split", splitId],
        queryFn: () => fetchSplitById(splitId!),
        enabled: !!splitId,
    });

    const { data: templates, isPending: templatesPending } = useQuery({
        queryKey: ["templates", splitId],
        queryFn: () => fetchTemplatesWithExercises(splitId!),
        enabled: !!splitId,
    });

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [title, setTitle] = useState('');

    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<EditableExercise | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<NonNullable<typeof templates>[number] | null>(null);

    const queryClient = useQueryClient();

    const handleOnDeleteExercise = (id: string) => {
        setIsNotificationOpen(true);
        setSelectedExerciseId(id);
        setAction('Delete');
        setTitle('Delete Exercise');
    }

    const deleteMutation = useMutation({
        mutationFn: (id: string) => removeExerciseFromTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates", splitId] });
        },
    });

    const handleConfirmDelete = () => {
        if (selectedExerciseId) {
            deleteMutation.mutate(selectedExerciseId);
            setIsNotificationOpen(false);
        }
    };

    const handleOnAddEditExercise = (templateId: string, exercise: EditableExercise | null = null) => {
        setSelectedTemplateId(templateId);
        setSelectedExercise(exercise);
        setIsExerciseModalOpen(true);
    };

    const handleAddDay = () => {
        setSelectedTemplate(null);
        setIsDayModalOpen(true);
    };

    const handleEditDay = (template: NonNullable<typeof templates>[number]) => {
        setSelectedTemplate(template);
        setIsDayModalOpen(true);
    };

    if (splitPending || templatesPending) {
        return <div className="split-detail-state">Loading split...</div>;
    }

    if (!split) {
        return <div className="split-detail-state">No split found.</div>;
    }

    return (
        <section className="split-detail-page">
            <Link className="split-detail-back" to="/splits">
                <LuArrowLeft aria-hidden="true" />
                All splits
            </Link>

            <header className="split-detail-header">
                <div>
                    <p className="split-detail-eyebrow">Training split</p>
                    <h1>{split.name}</h1>
                </div>
                <div className="split-detail-actions">
                    <span className="split-detail-count">
                        <LuLayers aria-hidden="true" />
                        {templates?.length ?? 0} days
                    </span>
                    <button className="split-detail-add-day" onClick={handleAddDay} type="button">
                        <LuPlus aria-hidden="true" />
                        Add day
                    </button>
                </div>
            </header>

            {templates?.length ? (
                <div className="split-template-list">
                    {templates.map((template, index) => {
                        const exercises = [...template.workout_template_exercises]
                            .sort((first, second) => first.exercise_order - second.exercise_order);

                        return (
                            <section className="split-template-card" key={template.id}>
                                <div className="split-template-head">
                                    <div>
                                        <p className="split-template-order">Day {index + 1}</p>
                                        <h2>{template.name}</h2>
                                    </div>
                                    <div className="split-template-actions">
                                        <span>{exercises.length} exercises</span>
                                        <div className="split-template-controls">
                                            <button className="split-template-add-exercise" onClick={() => handleOnAddEditExercise(template.id)} type="button">
                                                <LuPlus aria-hidden="true" />
                                                Add exercise
                                            </button>
                                            <button
                                                className="split-template-edit-day"
                                                type="button"
                                                onClick={() => handleEditDay(template)}
                                                aria-label={`Edit ${template.name}`}
                                                title={`Edit ${template.name}`}
                                            >
                                                <LuPencil aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {exercises.length ? (
                                    <ol className="split-exercise-list">
                                        {exercises.map((templateExercise, exerciseIndex) => {
                                            const relation = templateExercise.exercises as unknown as
                                                | { id?: string; name?: string }
                                                | Array<{ id?: string; name?: string }>;
                                            const exercise = Array.isArray(relation) ? relation[0] : relation;

                                            return (
                                                <li className="split-exercise-row" key={templateExercise.id}>
                                                    <span className="split-exercise-number">{exerciseIndex + 1}</span>
                                                    <LuDumbbell className="split-exercise-icon" aria-hidden="true" />
                                                    <span className="split-exercise-name">
                                                        {exercise?.name ?? "Unnamed exercise"}
                                                    </span>
                                                    <span className="split-exercise-actions">
                                                        <button
                                                            className="split-exercise-action split-exercise-edit"
                                                            type="button"
                                                            onClick={() => handleOnAddEditExercise(template.id, {
                                                                id: templateExercise.id,
                                                                exerciseId: exercise?.id ?? "",
                                                                name: exercise?.name ?? "",
                                                                exercise_order: templateExercise.exercise_order,
                                                            })}
                                                            aria-label={`Edit ${exercise?.name ?? "exercise"}`}
                                                        >
                                                            <LuPencil aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            className="split-exercise-action split-exercise-delete"
                                                            type="button"
                                                            onClick={() => handleOnDeleteExercise(templateExercise.id)}
                                                            aria-label={`Delete ${exercise?.name ?? "exercise"}`}
                                                        >
                                                            <LuTrash aria-hidden="true" />
                                                        </button>
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                ) : (
                                    <p className="split-template-empty">No exercises assigned yet.</p>
                                )}
                            </section>
                        );
                    })}
                </div>
            ) : (
                <div className="split-detail-empty">
                    <LuDumbbell aria-hidden="true" />
                    <p>No training days have been added to this split yet.</p>
                </div>
            )}

            <NotificationModal
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                action={action}
                title={title}
                onConfirm={handleConfirmDelete}
            />

            <DayExerciseFormModal
                isOpen={isExerciseModalOpen}
                onClose={() => setIsExerciseModalOpen(false)}
                existingExercise={selectedExercise ?? undefined}
                templateId={selectedTemplateId ?? undefined}
                splitId={splitId!}
            />

            <DayFormModal
                isOpen={isDayModalOpen}
                onClose={() => setIsDayModalOpen(false)}
                splitId={splitId!}
                nextDayOrder={(templates?.length ?? 0) + 1}
                existingTemplate={selectedTemplate ?? undefined}
            />

        </section>

    )
}