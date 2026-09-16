import { useEffect, useState } from 'react';
import { getToday } from '../utils/date';

const refreshToday = (current: Date): Date => {
  const next = getToday();
  return next.getTime() === current.getTime() ? current : next;
};

export function useToday(): Date {
  const [today, setToday] = useState<Date>(getToday);

  useEffect(() => {
    const updateToday = () => setToday((current) => refreshToday(current));

    const intervalId = window.setInterval(updateToday, 60_000);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateToday();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', updateToday);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', updateToday);
    };
  }, []);

  return today;
}