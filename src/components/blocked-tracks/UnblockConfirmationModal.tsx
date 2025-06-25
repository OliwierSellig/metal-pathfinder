import * as React from "react";
import type { BlockedTrackViewModel } from "../../types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

// =============================================================================
// TYPES
// =============================================================================

interface UnblockConfirmationModalProps {
  /** Kontroluje widoczność modala */
  isOpen: boolean;
  /** Callback wywoływany przy zmianie stanu otwarcia modala */
  onOpenChange: (isOpen: boolean) => void;
  /** Callback wywoływany po potwierdzeniu odblokowania */
  onConfirm: () => void;
  /** Utwór do odblokowania - null gdy modal jest zamknięty */
  track: BlockedTrackViewModel | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Modal dialogowy (oparty na Dialog z Shadcn/ui) proszący użytkownika
 * o potwierdzenie chęci odblokowania utworu.
 *
 * Zgodnie z planem implementacji obsługuje:
 * - Kliknięcie przycisku "Potwierdź" wywołuje onConfirm
 * - Zamknięcie modalu (przez przycisk "Anuluj", "X" lub klawisz Esc) wywołuje onOpenChange(false)
 */
const UnblockConfirmationModal: React.FC<UnblockConfirmationModalProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  track,
}) => {
  // Handler dla potwierdzenia - wywołuje onConfirm i zamyka modal
  const handleConfirm = React.useCallback(() => {
    onConfirm();
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  // Handler dla anulowania - zamyka modal
  const handleCancel = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unblock Track</DialogTitle>
          <DialogDescription>
            Are you sure you want to unblock this track? It will start appearing in your AI recommendations again.
          </DialogDescription>
        </DialogHeader>

        {/* Informacje o utworze do odblokowania */}
        {track && (
          <div className="flex items-center space-x-3 py-4">
            <div className="flex-shrink-0">
              {track.album.images.length > 0 ? (
                <img
                  src={track.album.images[0].url}
                  alt={track.album.name}
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{track.name}</div>
              <div className="text-sm text-gray-500 truncate">
                {track.artists.map((artist) => artist.name).join(", ")}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Unblock Track
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnblockConfirmationModal;
