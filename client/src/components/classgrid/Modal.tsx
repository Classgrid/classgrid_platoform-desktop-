import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl";

type CgModalProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
};

/**
 * CgModal — Dialog/modal wrapper.
 *
 * Usage:
 *   <CgModal open={isOpen} onOpenChange={setIsOpen}>
 *     <CgModalContent title="Add Student">
 *       <form>...</form>
 *     </CgModalContent>
 *   </CgModal>
 */
export function CgModal({ open, onOpenChange, onClose, title, description, size, children }: CgModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) onClose?.();
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={handleOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="cg-modal__overlay" />
        {title ? (
          <CgModalContent title={title} description={description} size={size}>
            {children}
          </CgModalContent>
        ) : children}
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/* ── Modal Content ── */
type CgModalContentProps = {
  title?: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  className?: string;
};

export function CgModalContent({
  title,
  description,
  size = "md",
  children,
  className = "",
}: CgModalContentProps) {
  const cls = [
    "cg-modal",
    size !== "md" ? `cg-modal--${size}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <RadixDialog.Content className={`${cls} data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200`}>
      <div className="cg-modal__header">
        <div>
          <RadixDialog.Title className="cg-modal__title">{title ?? ""}</RadixDialog.Title>
          {description ? (
            <RadixDialog.Description className="cg-modal__description">
              {description}
            </RadixDialog.Description>
          ) : null}
        </div>
        <RadixDialog.Close className="cg-modal__close transition-transform hover:scale-110 active:scale-95 hover:bg-muted/50 rounded-full p-1" aria-label="Close">
          <X size={16} />
        </RadixDialog.Close>
      </div>
      <div className="cg-modal__body">{children}</div>
    </RadixDialog.Content>
  );
}

/* ── Modal Footer (optional, for action buttons) ── */
type CgModalFooterProps = {
  children: ReactNode;
  className?: string;
};

export function CgModalFooter({ children, className = "" }: CgModalFooterProps) {
  return (
    <div className={`cg-modal__footer ${className}`.trim()}>
      {children}
    </div>
  );
}
