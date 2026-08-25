import { createContext, useContext } from 'react';

export interface GuideState {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** True until the visitor has opened the guide once. */
  firstVisit: boolean;
}

export const GuideContext = createContext<GuideState | null>(null);

export function useGuide(): GuideState {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error('useGuide must be used inside <GuideProvider>');
  return ctx;
}
