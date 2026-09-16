import { getToday, toDateInputValue } from './date';

export interface NaturalDateResult {
  dueDate: string;
  rest: string;
}

const WEEKDAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const resolveWeekday = (today: Date, targetIndex: number): Date => {
  const date = new Date(today);
  const current = date.getDay();
  let diff = (targetIndex - current + 7) % 7;
  if (diff === 0) {
    diff = 7;
  }
  date.setDate(date.getDate() + diff);
  return date;
};

/**
 * Attempts to recognise a natural-language due date inside a piece of text.
 * Returns the parsed ISO-ish date (YYYY-MM-DD) plus the remaining text with
 * the matched phrase removed, or `null` if no phrase was detected.
 */
export function parseNaturalDate(
  input: string,
  today: Date = getToday(),
): NaturalDateResult | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  const strip = (regex: RegExp): string =>
    trimmed.replace(regex, '').replace(/\s+/g, ' ').trim();

  if (/\btoday\b/.test(lower)) {
    return { dueDate: toDateInputValue(today), rest: strip(/\btoday\b/i) };
  }

  if (/\btomorrow\b/.test(lower)) {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return {
      dueDate: toDateInputValue(date),
      rest: strip(/\btomorrow\b/i),
    };
  }

  if (/\bday after tomorrow\b/.test(lower)) {
    const date = new Date(today);
    date.setDate(date.getDate() + 2);
    return {
      dueDate: toDateInputValue(date),
      rest: strip(/\bday after tomorrow\b/i),
    };
  }

  const nextMatch = lower.match(
    /\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  );
  if (nextMatch) {
    const weekday = nextMatch[1]!;
    const index = WEEKDAY_NAMES.indexOf(weekday);
    const date = resolveWeekday(today, index);
    return {
      dueDate: toDateInputValue(date),
      rest: strip(new RegExp(`\\bnext\\s+${weekday}\\b`, 'i')),
    };
  }

  const onMatch = lower.match(
    /\b(?:on|this)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  );
  if (onMatch) {
    const weekday = onMatch[1]!;
    const index = WEEKDAY_NAMES.indexOf(weekday);
    const date = resolveWeekday(today, index);
    return {
      dueDate: toDateInputValue(date),
      rest: strip(new RegExp(`\\b(?:on|this)\\s+${weekday}\\b`, 'i')),
    };
  }

  const inMatch = lower.match(
    /\bin\s+(\d+)\s+(day|days|week|weeks|month|months)\b/,
  );
  if (inMatch) {
    const amount = Number.parseInt(inMatch[1]!, 10);
    const unit = inMatch[2]!;
    const date = new Date(today);
    if (unit.startsWith('day')) {
      date.setDate(date.getDate() + amount);
    } else if (unit.startsWith('week')) {
      date.setDate(date.getDate() + amount * 7);
    } else {
      date.setMonth(date.getMonth() + amount);
    }
    return {
      dueDate: toDateInputValue(date),
      rest: strip(new RegExp(`\\bin\\s+${inMatch[1]}\\s+${unit}\\b`, 'i')),
    };
  }

  return null;
}