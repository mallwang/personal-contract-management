import { useQuery } from '@tanstack/react-query';
import { DashboardResponseSchema, type DashboardResponse } from '@pcm/shared';

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  const json: unknown = await res.json();
  return DashboardResponseSchema.parse(json);
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 30_000,
  });
}
