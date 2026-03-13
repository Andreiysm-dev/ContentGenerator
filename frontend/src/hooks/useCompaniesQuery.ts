import { useQuery } from '@tanstack/react-query';

export function useCompaniesQuery(authedFetch: any, backendBaseUrl: string, enabled: boolean) {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await authedFetch(`${backendBaseUrl}/api/company`);
      if (!res.ok) throw new Error('Failed to fetch companies');
      const data = await res.json();
      const list = data.companies || data;
      return Array.isArray(list) ? list : [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
