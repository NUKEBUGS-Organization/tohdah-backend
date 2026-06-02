/**
 * Normalize MongoDB ids from strings, ObjectIds, or populated subdocuments.
 */
export function toId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj._id != null) return String(obj._id);
    if (typeof obj.toString === 'function' && obj.constructor?.name === 'ObjectId') {
      return obj.toString();
    }
    if (typeof obj.toString === 'function') {
      const s = obj.toString();
      if (s !== '[object Object]') return s;
    }
  }
  return String(value);
}

export function isSameId(a: unknown, b: unknown): boolean {
  if (!a || !b) return false;
  return toId(a) === toId(b);
}

/** True if userId matches at least one party ref on the booking. */
export function isBookingParty(
  userId: string,
  requesterId: unknown,
  travelerId: unknown,
): boolean {
  return isSameId(requesterId, userId) || isSameId(travelerId, userId);
}
