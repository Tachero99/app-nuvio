"use client";

import { Modal } from "@/components/ui/Modal";

export function ConfirmDialog({
  open,
  title = "Confirmar acción",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-slate-300">{message}</p>

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
            danger
              ? "bg-red-700 hover:bg-red-600"
              : "bg-indigo-600 hover:bg-indigo-500"
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
