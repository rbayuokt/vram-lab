import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { clearPersisted, readPersisted, writePersisted } from '@/lib/persisted';
import { GuideContext, type GuideState } from './guideContext';

/**
 * Owns whether the guide dock is showing.
 *
 * Step position is not kept here: every section starts at step 1 on arrival,
 * since landing on "step 5 of 5" reads as a bug.
 */
export function GuideProvider({ children }: { children: ReactNode }) {
  const [seen] = useState(() => {
    // an earlier build stored per-section step positions; drop them so a
    // returning visitor does not resume on "step 5 of 5"
    clearPersisted('guide.steps');
    return readPersisted('guide.seen', false);
  });
  const [open, setOpenState] = useState(() => readPersisted('guide.open', true));

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    writePersisted('guide.open', next);
    if (next) writePersisted('guide.seen', true);
  }, []);

  const value = useMemo<GuideState>(
    () => ({ open, setOpen, firstVisit: !seen }),
    [open, setOpen, seen],
  );

  return <GuideContext value={value}>{children}</GuideContext>;
}
