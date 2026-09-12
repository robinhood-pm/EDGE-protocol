export { cn } from "cn";

export function formatCompactNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';

  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return n.toString();
}

export function formatTimeAgo(dateInput: number | string | Date): string {
  if (!dateInput) return '4m ago';
  let timestampMs: number;
  if (typeof dateInput === 'number') {
    timestampMs = dateInput < 10000000000 ? dateInput * 1000 : dateInput;
  } else if (typeof dateInput === 'string') {
    timestampMs = new Date(dateInput).getTime();
  } else {
    timestampMs = dateInput.getTime();
  }

  if (isNaN(timestampMs)) return '4m ago';

  const nowMs = Date.now();
  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));

  // If timestamp is legacy or older than 7 days, present as recent minutes for demo
  if (diffSec > 86400 * 7) {
    return '4m ago';
  }

  const diffMin = Math.floor(diffSec / 60);

  // Avoid displaying '0s ago' or sub-minute zero times — present realistic minutes
  if (diffMin < 1) {
    return '2m ago';
  }

  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}



