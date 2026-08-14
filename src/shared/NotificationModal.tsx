import * as Dialog from "@radix-ui/react-dialog";
import { LuTriangleAlert, LuX } from "react-icons/lu";

interface NotificationModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    action: string;
    onConfirm?: () => void;
    message?: string;
    confirmLabel?: string;
}

export const NotificationModal = ({
    title,
    isOpen,
    onClose,
    action,
    onConfirm,
    message,
    confirmLabel,
}: NotificationModalProps) => {
    const isDeleteAction = action.toLowerCase() === "delete";
    const description = message ?? `Are you sure you want to ${action.toLowerCase()} this item?${isDeleteAction ? " This cannot be undone." : ""}`;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="modal-overlay" />

                <Dialog.Content className="modal-content notification-modal">
                    <div className="modal-header">
                        <Dialog.Title>{title}</Dialog.Title>

                        <Dialog.Close asChild>
                            <button className="modal-close" type="button" aria-label="Close">
                                <LuX />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="notification-message">
                        <LuTriangleAlert className="notification-icon" aria-hidden="true" />
                        <p>{description}</p>
                    </div>

                    <div className="notification-actions">
                        <Dialog.Close asChild>
                            <button type="button" className="notification-cancel-btn">
                                Cancel
                            </button>
                        </Dialog.Close>

                        <button
                            type="button"
                            className={isDeleteAction ? "notification-confirm-btn danger" : "notification-confirm-btn"}
                            onClick={onConfirm}
                        >
                            {confirmLabel ?? action}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};