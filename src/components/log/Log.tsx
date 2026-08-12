import { LuDumbbell, LuPlus } from 'react-icons/lu';
import { useAuthStore } from '../../lib/useAuthStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchTemplatesWithExercises } from '../../lib/splits';
import { useState } from 'react';
import { createSet, createWorkout, fetchActiveSplit, upsertExerciseNote } from '../../lib/logs';
import { useNavigate } from 'react-router-dom';

interface SetEntry {
  weight: string;
  reps: string;
  isWarmup: boolean;
}

export const Log = () => {

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: activeSplit, isPending: splitPending } = useQuery({
    queryKey: ["activeSplit", user?.id],
    queryFn: () => fetchActiveSplit(user!.id),
    enabled: !!user?.id,
  });
  
  const { data: templates, isPending: templatesPending } = useQuery({
    queryKey: ["templates", activeSplit?.id],
    queryFn: () => fetchTemplatesWithExercises(activeSplit!.id),
    enabled: !!activeSplit?.id,
  });

  const [workoutId, setWorkoutId] = useState<string | null>(null);

  const createWorkoutMutation = useMutation({
    mutationFn: (templateId: string) => createWorkout(user!.id, templateId),
    onSuccess: (workout) => {
      setWorkoutId(workout.id);
    },
  });

  const [setsByExercise, setSetsByExercise] = useState<Record<string, SetEntry[]>>({});

  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const handleSetChange = (exerciseId: string, index: number, field: keyof SetEntry, value: string | boolean) => {
    setSetsByExercise((prev) => {
      const updated = [...(prev[exerciseId] ?? [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [exerciseId]: updated };
    });
  };

  const handleAddSet = (exerciseId: string) => {
    setSetsByExercise((prev) => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] ?? []), { weight: "", reps: "", isWarmup: false }],
    }));
  };


  const finishWorkoutMutation = useMutation({
    
    mutationFn: async () => {
      const allSetInserts = Object.entries(setsByExercise).flatMap(([exerciseId, sets]) =>
        sets.map((set, index) =>
          createSet(workoutId!, exerciseId, index + 1, parseFloat(set.weight), parseInt(set.reps), set.isWarmup)
        )
      );

      const allNoteInserts = Object.entries(notesByExercise)
        .filter(([, note]) => note.trim().length > 0)
        .map(([exerciseId, note]) => upsertExerciseNote(workoutId!, exerciseId, note.trim()));

      return Promise.all([...allSetInserts, ...allNoteInserts]);
    },
    onSuccess: () => {
      setSetsByExercise({});
      setNotesByExercise({});
      setSelectedTemplateId("");
      setWorkoutId(null);
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      console.error("Failed to save workout:", error);
    },
  });

  const hasIncompleteSets = Object.values(setsByExercise)
    .flat()
    .some((set) => !set.weight || !set.reps);

  const totalSets = Object.values(setsByExercise).flat().length;
  const canFinish = totalSets > 0 && !hasIncompleteSets;

  const [notesByExercise, setNotesByExercise] = useState<Record<string, string>>({});

  if (splitPending || templatesPending) {
    return <div className="log-state">Loading workout setup...</div>;
  }

  return (
    <section className="log-page">
      <header className="log-header">
        <div>
          <h1>Log workout</h1>
          <p>Track each set and finish with clean session history.</p>
          {activeSplit && <span className="badge log-header-tag">{activeSplit.name}</span>}
        </div>
      </header>

      {!activeSplit ? (
        <div className="log-state">No active split found. Set one up from Splits first.</div>
      ) : (
        <>
          <section className="log-select-card">
            <label htmlFor="templateSelect">Choose training day</label>
            <select
              id="templateSelect"
              value={selectedTemplateId}
              onChange={(e) => {
                const templateId = e.target.value;
                setSelectedTemplateId(templateId);
                if (templateId) {
                  createWorkoutMutation.mutate(templateId);
                }
              }}
              disabled={!templates?.length || createWorkoutMutation.isPending}
            >
              <option value="" disabled>Select a day</option>
              {templates?.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </section>

          {!templates?.length && (
            <div className="log-state">No days in your active split yet.</div>
          )}

          {selectedTemplate && (
            <section className="log-template-card">
              <div className="log-template-head">
                <h2>{selectedTemplate.name}</h2>
                <span className="badge success">{totalSets} sets</span>
              </div>

              <div className="log-exercise-list">
                {selectedTemplate.workout_template_exercises.map((te) => {
                  const relation = te.exercises as unknown as { id?: string; name?: string } | Array<{ id?: string; name?: string }>;
                  const exercise = Array.isArray(relation) ? relation[0] : relation;
                  const exerciseId = exercise?.id;
                  if (!exerciseId) return null;

                  const sets = setsByExercise[exerciseId] ?? [];
                  const noteValue = notesByExercise[exerciseId] ?? "";

                  return (
                    <article key={te.id} className="log-exercise-card">
                      <div className="log-exercise-head">
                        <div className="log-exercise-title">
                          <LuDumbbell aria-hidden="true" />
                          <h3>{exercise?.name}</h3>
                        </div>
                        <span className="badge">{sets.length} sets</span>
                      </div>

                      {!sets.length && <p className="log-empty-sets">Add your first set for this exercise.</p>}

                      {sets.map((set, index) => (
                        <div key={index} className="log-set-row">
                          <span className="log-set-number">Set {index + 1}</span>
                          <input
                            type="number"
                            placeholder="Weight"
                            value={set.weight}
                            onChange={(e) => handleSetChange(exerciseId, index, "weight", e.target.value)}
                          />
                          <input
                            type="number"
                            placeholder="Reps"
                            value={set.reps}
                            onChange={(e) => handleSetChange(exerciseId, index, "reps", e.target.value)}
                          />
                          <label className="log-warmup-toggle">
                            <input
                              type="checkbox"
                              checked={set.isWarmup}
                              onChange={(e) => handleSetChange(exerciseId, index, "isWarmup", e.target.checked)}
                            />
                            Warm-up
                          </label>
                        </div>
                      ))}

                      <button type="button" className="log-add-set" onClick={() => handleAddSet(exerciseId)}>
                        <LuPlus aria-hidden="true" />
                        Add set
                      </button>
                      <div className="log-note-wrap">
                        <div className="log-note-head">
                          <label className="log-note-label" htmlFor={`note-${exerciseId}`}>Notes</label>
                          <span className="log-note-count">{noteValue.length}/240</span>
                        </div>
                        <textarea
                          id={`note-${exerciseId}`}
                          className="log-note-input"
                          value={noteValue}
                          onChange={(e) =>
                            setNotesByExercise((prev) => ({ ...prev, [exerciseId]: e.target.value }))
                          }
                          placeholder="How did this exercise feel today?"
                          maxLength={240}
                          rows={3}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>

              <button
                type="button"
                className="log-finish-btn"
                disabled={!canFinish || !workoutId || finishWorkoutMutation.isPending}
                onClick={() => finishWorkoutMutation.mutate()}
              >
                {finishWorkoutMutation.isPending ? 'Finishing...' : 'Finish workout'}
              </button>
            </section>
          )}
        </>
      )}
    </section>
  );
};
