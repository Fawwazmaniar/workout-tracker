import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteSplit, fetchSplits, setActiveSplit } from "../../lib/splits";
import { fetchActiveSplit } from "../../lib/logs";
import { useAuthStore } from "../../lib/useAuthStore";
import { LuChevronRight, LuPencil, LuPlus, LuTrash } from "react-icons/lu";
import { NotificationModal } from "../../shared/NotificationModal";
import { useState } from "react";
import { SplitsFormModal } from "./SplitsFormModal";
import { Link } from "react-router-dom";

type SelectedSplit = {
    id: string;
    name: string;
    user_id: string;
    created_at?: string;
    createdAt?: string;
};

export const Splits = () => {

    const { user } = useAuthStore();
    const { data, isPending, isError, error } = useQuery({
        queryKey: ["splits", user?.id],
        queryFn: () => fetchSplits(user!.id),
        enabled: !!user?.id,
    });

    const { data: activeSplit } = useQuery({
        queryKey: ["activeSplit", user?.id],
        queryFn: () => fetchActiveSplit(user!.id),
        enabled: !!user?.id,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [action, setAction] = useState('');
    const [title, setTitle] = useState('');
    const [mutationError, setMutationError] = useState("");

    const queryClient = useQueryClient();

    const [selectedSplit, setSelectedSplit] = useState<SelectedSplit | null>(null);

    const handleAddSplit = () => {
        setSelectedSplit(null);
        setIsModalOpen(true);
    }

    const handleDeleteSplit = (id: string): void => {
        const foundSplit = data?.find((item) => item.id === id);

        if (!foundSplit) return;
        setIsNotificationOpen(true);
        setSelectedSplit(foundSplit);
        setAction('Delete');
        setTitle('Delete Split');
    }

    const handleEditSplit = (id: string): void => {
        const foundSplit = data?.find((item) => item.id === id);

        if (!foundSplit) return;
        setSelectedSplit(foundSplit);
        setIsModalOpen(true);
        setAction('Edit');
        setTitle('Edit Split');
    }

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteSplit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["splits"] });
        },
        onError: (e: Error) => {
            setMutationError(e.message);
        },
    });

    const handleConfirmDelete = () => {
        if (selectedSplit) {
            deleteMutation.mutate(selectedSplit.id);
            setIsNotificationOpen(false);
        }
    };

    const activeSplitMutation = useMutation({
        mutationFn: (splitId: string) => setActiveSplit(user!.id, splitId),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["activeSplit", user?.id] }),
                queryClient.invalidateQueries({ queryKey: ["splits", user?.id] }),
            ]);
        },
        onError: (e: Error) => {
            setMutationError(e.message);
        },
    });

    const handleActiveSplitChange = (splitId: string) => {
        if (!splitId || splitId === activeSplit?.id) return;
        activeSplitMutation.mutate(splitId);
    };

    if (isPending) {
        return <div className="splits-state">Loading splits...</div>;
    }

    if (isError) {
        return <div className="splits-state splits-state-error">Error: {error.message}</div>;
    }

    if (!data?.length) {
        return <div className="splits-state">No splits found.</div>;
    }

    return (
        <div className="splits-page">
            <div className="splits-header">
                <h1>Splits</h1>
                <p>{data.length} splits</p>
            </div>

            <div className="splits-active-select">
                <label htmlFor="active-split">Active split</label>
                <select
                    id="active-split"
                    value={activeSplit?.id ?? ""}
                    onChange={(e) => handleActiveSplitChange(e.target.value)}
                    disabled={activeSplitMutation.isPending}
                >
                    <option value="" disabled>
                        Select an active split
                    </option>
                    {data.map((split) => (
                        <option key={split.id} value={split.id}>
                            {split.name}
                        </option>
                    ))}
                </select>
            </div>

            {mutationError && <p className="error-text">{mutationError}</p>}

            {!data?.length ? (
                <div className="splits-state">No splits found.</div>
            ) : (
                <div className="splits-list">
                    {data.map((split) => (
                        <section className="split-card" key={split.id}>
                            <div className="split-card-head">
                                <h2>{split.name}</h2>
                                <Link className="split-manage-link" to={`/splits/${split.id}`}>
                                    Manage
                                    <LuChevronRight aria-hidden="true" />
                                </Link>
                                <span className="split-actions">
                                    <button
                                        type="button"
                                        className="split-action-btn split-delete-action"
                                        onClick={() => handleDeleteSplit(split.id)}
                                        aria-label={`Delete ${split.name}`}
                                    >
                                        <LuTrash className="split-action-icon" aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        className="split-action-btn split-edit-action"
                                        onClick={() => handleEditSplit(split.id)}
                                        aria-label={`Edit ${split.name}`}
                                    >
                                        <LuPencil className="split-action-icon" aria-hidden="true" />
                                    </button>
                                </span>
                            </div>
                        </section>
                    ))}
                </div>
            )}
            <div className="splits-fab-wrap">
                <button className="split-fab-add" type="button" aria-label="Add split" onClick={handleAddSplit}>
                    <LuPlus className="split-fab-icon" aria-hidden="true" />
                </button>
            </div>
            <SplitsFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedSplit(null);
                }}
                existingSplit={selectedSplit ?? undefined}
            />
            <NotificationModal
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                action={action}
                title={title}
                onConfirm={handleConfirmDelete}
            />
        </div>
    )
}