import type { ReactNode } from 'react';
import { GuideProvider } from './GuideProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return <GuideProvider>{children}</GuideProvider>;
}
