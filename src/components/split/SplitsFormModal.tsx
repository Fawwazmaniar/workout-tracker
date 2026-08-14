import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEventHandler } from "react";
import { LuX } from "react-icons/lu";
import { createSplit, updateSplit } from "../../lib/splits";
import { useAuthStore } from "../../lib/useAuthStore";

interface SplitsFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingSplit?: {
        id: string;
        name: string;
        createdAt?: string;
        created_at?: string;
        user_id: string;
    };
}

export const SplitsFormModal = ({
    isOpen,
    onClose,
    existingSplit,
}: SplitsFormModalProps) => {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const { user } = useAuthStore();

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isOpen) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(existingSplit?.name ?? "");
        setError("");
    }, [isOpen, existingSplit]);

    const createMutation = useMutation({
        mutationFn: ({ name, user_id }: { name: string; user_id: string;} ) =>
            createSplit(user_id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["splits"] });
            onClose();
        },
        onError: (mutationError: Error) => {
            setError(mutationError.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ name, splitId }: { name: string; splitId: string;}) =>
            updateSplit(splitId, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["splits"] });
            onClose();
        },
        onError: (mutationError: Error) => {
            setError(mutationError.message);
        },
    });

    const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        if (!name.trim() ) {
            setError("Name is required.");
            return;
        }

        setError("");
        if(existingSplit){
            updateMutation.mutate({
                splitId: existingSplit.id,
                name: name.trim()
            })
        }else{
            if (!user) {
                setError("You must be signed in to create a split.");
                return;
            }

            createMutation.mutate({
                name: name.trim(),
                user_id: user.id,
            });
        }
        
    };

    const handleClose = () => {
        setName("");
        setError("");
        onClose();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="split-modal-overlay" />
                <Dialog.Content className="split-modal-content">
                    <div className="split-modal-header">
                        <Dialog.Title>
                            {existingSplit ? "Edit split" : "Add split"}
                        </Dialog.Title>

                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="split-modal-close"
                                aria-label="Close"
                            >
                                <LuX />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="split-modal-form">
                        <label htmlFor="split-name">Split name</label>
                        <input
                            id="split-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Upper strength"
                        />
                        {error && <p className="error-text">{error}</p>}

                        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending
                                ? existingSplit
                                    ? "Saving..."
                                    : "Adding..."
                                : existingSplit
                                    ? "Save changes"
                                    : "Add split"}
                        </button>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};