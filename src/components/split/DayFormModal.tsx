import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState, type FormEventHandler } from "react";
import { LuX } from "react-icons/lu";
import { createTemplate, updateTemplate } from "../../lib/splits";

interface DayFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    splitId: string;
    nextDayOrder: number;
    existingTemplate?: {
        id: string;
        name: string;
        day_order: number;
    };
}

export const DayFormModal = ({
    isOpen,
    onClose,
    splitId,
    nextDayOrder,
    existingTemplate,
}: DayFormModalProps) => {
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const queryClient = useQueryClient();

    useEffect(() => {
        if (existingTemplate) {
            setName(existingTemplate.name);
        } else {
            setName("");
        }
    }, [existingTemplate, isOpen]);

    const createMutation = useMutation({
        mutationFn: ({ splitId, name, dayOrder }: { splitId: string; name: string; dayOrder: number }) =>
            createTemplate(splitId, name, dayOrder),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates", splitId] });
            onClose();
        },
        onError: (mutationError: Error) => {
            setError(mutationError.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            updateTemplate(id, name),
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
        if (!name.trim()) {
            setError("Day name is required.");
            return;
        }

        setError("");
        if (existingTemplate) {
            updateMutation.mutate({ id: existingTemplate.id, name: name.trim() });
        } else {
            createMutation.mutate({ splitId, name: name.trim(), dayOrder: nextDayOrder });
        }
    };

    const handleClose = () => {
        setName("");
        setError("");
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="modal-overlay" />
                <Dialog.Content className="modal-content">
                    <div className="modal-header">
                        <Dialog.Title>
                            {existingTemplate ? "Edit day" : "Add day"}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button type="button" className="modal-close" aria-label="Close">
                                <LuX />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <label htmlFor="day-name">Day name</label>
                        <input
                            id="day-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Upper A"
                        />

                        {error && <p className="error-text">{error}</p>}

                        <button type="submit" disabled={isPending}>
                            {isPending
                                ? existingTemplate ? "Saving..." : "Adding..."
                                : existingTemplate ? "Save changes" : "Add day"}
                        </button>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};