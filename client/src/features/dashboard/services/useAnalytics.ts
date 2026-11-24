import { useEffect, useState } from 'react';
import { analyticsService } from '@/features/dashboard/services/analyticsService';
import type { AnalyticsDTO, AnalyticsRange } from '@/shared/types';
import type { Role } from '@/features/auth/store/authSlice';

export function useAnalytics(role: Role) {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [result, setResult] = useState<{ range: AnalyticsRange; data: AnalyticsDTO | null; error: string }>({ range: '30d', data: null, error: '' });
  useEffect(() => {
    let active = true;
    analyticsService.get(role, range).then((data) => { if (active) setResult({ range, data, error: '' }); })
      .catch((reason: unknown) => { if (active) setResult({ range, data: null, error: reason instanceof Error ? reason.message : 'Could not load analytics.' }); });
    return () => { active = false; };
  }, [role, range]);
  return { data: result.range === range ? result.data : null, busy: result.range !== range, error: result.range === range ? result.error : '', range, setRange };
}
