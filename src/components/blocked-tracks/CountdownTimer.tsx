import * as React from "react";

// =============================================================================
// TYPES
// =============================================================================

interface CountdownTimerProps {
  /** Data wygaśnięcia blokady w formacie ISO string lub null dla permanentnych blokad */
  expiresAt: string | null;
  /** Callback wywoływany gdy timer osiągnie zero */
  onTimerExpire: () => void;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Formatuje pozostały czas do czytelnej formy
 * @param ms - milisekundy pozostałe do wygaśnięcia
 * @returns sformatowany string typu "2d 5h 30m" lub "5h 30m 15s"
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) {
    return "Expired";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  const days = totalDays;
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  // Jeśli zostało więcej niż 1 dzień, pokazuj dni, godziny, minuty
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  // Jeśli zostało więcej niż 1 godzina, pokazuj godziny, minuty, sekundy
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  // Jeśli zostało mniej niż godzina, pokazuj minuty i sekundy
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  // Jeśli zostało mniej niż minuta, pokazuj tylko sekundy
  return `${seconds}s`;
}

/**
 * Oblicza pozostały czas w milisekundach
 * @param expiresAt - data wygaśnięcia w formacie ISO
 * @returns milisekundy pozostałe lub 0 jeśli już wygasło
 */
function calculateTimeRemaining(expiresAt: string): number {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  return Math.max(0, expiry - now);
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Komponent odpowiedzialny za logikę odliczania i wyświetlanie pozostałego czasu blokady
 * Zgodnie z planem implementacji:
 * - Używa useEffect z setInterval do aktualizacji co sekundę
 * - Oblicza różnicę między expires_at a aktualnym czasem
 * - Jeśli expires_at jest null, wyświetla tekst "Permanent"
 * - Gdy odliczanie dobiegnie końca, czyści interwał i wywołuje onTimerExpire
 */
const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, onTimerExpire }) => {
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0);
  const [hasExpired, setHasExpired] = React.useState<boolean>(false);

  // =============================================================================
  // TIMER LOGIC
  // =============================================================================

  React.useEffect(() => {
    // Jeśli blokada jest permanentna, nie robimy nic
    if (expiresAt === null) {
      return;
    }

    // Oblicz początkowy czas pozostały
    const initialTime = calculateTimeRemaining(expiresAt);
    setTimeRemaining(initialTime);

    // Jeśli już wygasło, wywołaj callback natychmiast
    if (initialTime <= 0 && !hasExpired) {
      setHasExpired(true);
      onTimerExpire();
      return;
    }

    // Ustaw interwał do aktualizacji co sekundę
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      // Jeśli osiągnęliśmy zero, wyczyść interwał i wywołaj callback
      if (remaining <= 0 && !hasExpired) {
        setHasExpired(true);
        clearInterval(interval);
        onTimerExpire();
      }
    }, 1000);

    // Cleanup przy unmount lub zmianie expiresAt
    return () => {
      clearInterval(interval);
    };
  }, [expiresAt, onTimerExpire, hasExpired]);

  // =============================================================================
  // RENDER
  // =============================================================================

  // Blokada permanentna
  if (expiresAt === null) {
    return <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">Permanent</span>;
  }

  // Blokada już wygasła
  if (hasExpired || timeRemaining <= 0) {
    return <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded">Expired</span>;
  }

  // Odliczanie aktywne
  const formattedTime = formatTimeRemaining(timeRemaining);
  const isUrgent = timeRemaining < 60 * 60 * 1000; // Mniej niż godzina

  return (
    <span
      className={`text-sm font-medium px-2 py-1 rounded ${
        isUrgent ? "text-orange-700 bg-orange-100" : "text-blue-700 bg-blue-100"
      }`}
    >
      {formattedTime}
    </span>
  );
};

export default CountdownTimer;
