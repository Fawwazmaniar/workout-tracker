import { LuChevronRight, LuDumbbell, LuHistory, LuLayoutDashboard, LuNotebookPen, LuPencilLine, LuTrash2 } from 'react-icons/lu';
import { useAuthStore } from './lib/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteWorkout, fetchActiveSplit, fetchDashboardStats, fetchWorkoutHistory, unwrapExerciseRelation } from './lib/logs';
import { Link } from 'react-router-dom';
import { WorkoutDetailModal } from './components/log/WorkoutDetail';
import { useState } from 'react';
import { NotificationModal } from './shared/NotificationModal';


export const Dashboard = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const { data: history, isPending: historyPending } = useQuery({
        queryKey: ["workoutHistory", user?.id],
        queryFn: () => fetchWorkoutHistory(user!.id, 8),
        enabled: !!user?.id,
    });

    const { data: stats, isPending: statsPending } = useQuery({
        queryKey: ["dashboardStats", user?.id],
        queryFn: () => fetchDashboardStats(user!.id),
        enabled: !!user?.id,
    });

    const { data: activeSplit, isPending: splitPending } = useQuery({
        queryKey: ["activeSplit", user?.id],
        queryFn: () => fetchActiveSplit(user!.id),
        enabled: !!user?.id,
    });

    const [isWorkoutDetailOpen, setIsWorkoutDetailOpen] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState('');
    const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);

    const deleteWorkoutMutation = useMutation({
        mutationFn: deleteWorkout,
        onSuccess: async (_, deletedWorkoutId) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['workoutHistory', user?.id] }),
                queryClient.invalidateQueries({ queryKey: ['dashboardStats', user?.id] }),
            ]);

            if (selectedWorkout === deletedWorkoutId) {
                setSelectedWorkout('');
                setIsWorkoutDetailOpen(false);
            }

            setWorkoutToDelete(null);
        },
    });
    
    if (splitPending || statsPending || historyPending) {
        return <div className="log-state">Loading workout setup...</div>;
    }

    const formatPerformedAt = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(date);
    };

    const HandleWorkoutDetailOpen = (workoutId: string): void => {
        if(!workoutId) return;
        setSelectedWorkout(workoutId);
        setIsWorkoutDetailOpen(true);
    }

    return (
        <section className="surface-page">
            <article className="surface-card">
                <header className="section-head">
                    <div>
                        <p className="section-title">Dashboard</p>
                        <p className="section-subtitle">Training summary and active plan</p>
                    </div>
                    <div className="dashboard-head-actions">
                        <span className="badge success">{activeSplit ? 'Active split set' : 'No active split'}</span>
                        <Link to="/log" className="dashboard-start-log-btn">
                            Start logging
                        </Link>
                    </div>
                </header>

                <ul className="row-list">
                    <li className="row-item">
                        <div className="row-main">
                            <LuLayoutDashboard className="row-icon" aria-hidden="true" />
                            <span className="row-text">Total workouts</span>
                        </div>
                        <span className="row-meta">{stats?.totalWorkouts ?? 0}</span>
                    </li>
                    <li className="row-item">
                        <div className="row-main">
                            <LuHistory className="row-icon" aria-hidden="true" />
                            <span className="row-text">Workouts in last 7 days</span>
                        </div>
                        <span className="row-meta">{stats?.weekWorkouts ?? 0}</span>
                    </li>
                    <li className="row-item">
                        <div className="row-main">
                            <LuNotebookPen className="row-icon" aria-hidden="true" />
                            <span className="row-text">Current active split</span>
                        </div>
                        <span className="row-meta">{activeSplit?.name ?? 'Not set'}</span>
                    </li>
                </ul>
            </article>

            <article className="surface-card">
                <header className="section-head">
                    <div>
                        <p className="section-title">Recent sessions</p>
                        <p className="section-subtitle">Most recent logged workouts</p>
                    </div>
                    <span className="badge">{history?.length ?? 0} shown</span>
                </header>

                {!history?.length ? (
                    <p className="auth-only-text">No workouts logged yet.</p>
                ) : (
                    <ul className="row-list">
                        {history.map((item) => {
                            const template = unwrapExerciseRelation(item.workout_templates) as { name?: string } | undefined;
                            return (
                                <li key={item.id} className="row-item">
                                    <div className="row-main">
                                        <LuDumbbell className="row-icon" aria-hidden="true" />
                                        <span className="row-text">{template?.name ?? 'Workout session'}</span>
                                    </div>
                                    <div className="dashboard-session-meta">
                                        <span className="row-meta">{formatPerformedAt(item.performed_at)}</span>
                                        <div className="dashboard-session-actions">
                                            <Link
                                                to={`/log?editWorkoutId=${item.id}`}
                                                className="dashboard-edit-workout-btn"
                                                aria-label="Edit workout"
                                            >
                                                <LuPencilLine aria-hidden="true" />
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                className="dashboard-open-details-btn"
                                                onClick={() => HandleWorkoutDetailOpen(item.id)}
                                            >
                                                Open details
                                                <LuChevronRight aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                className="dashboard-delete-workout-btn"
                                                onClick={() => setWorkoutToDelete(item.id)}
                                                aria-label="Delete workout"
                                                disabled={deleteWorkoutMutation.isPending}
                                            >
                                                <LuTrash2 aria-hidden="true" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                </li>
                            );
                        })}
                    </ul>
                )}
            </article>
            <WorkoutDetailModal  isOpen={isWorkoutDetailOpen}
               onClose={() => {
                    setIsWorkoutDetailOpen(false);
                    setSelectedWorkout("");
                }}
                workoutId={selectedWorkout} />
            <NotificationModal
                isOpen={!!workoutToDelete}
                onClose={() => {
                    if (!deleteWorkoutMutation.isPending) {
                        setWorkoutToDelete(null);
                    }
                }}
                title="Delete this workout?"
                message="This will permanently remove the workout, sets, and notes."
                action="Delete"
                confirmLabel={deleteWorkoutMutation.isPending ? 'Deleting…' : 'Delete workout'}
                onConfirm={() => {
                    if (workoutToDelete && !deleteWorkoutMutation.isPending) {
                        deleteWorkoutMutation.mutate(workoutToDelete);
                    }
                }}
            />
        </section>

        
    );
};