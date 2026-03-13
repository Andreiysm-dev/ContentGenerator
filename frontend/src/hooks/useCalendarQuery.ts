import { useQuery } from '@tanstack/react-query';

export function useCalendarQuery(
  authedFetch: any,
  backendBaseUrl: string,
  companyId: string | undefined,
  enabled: boolean,
  recentStatusMoves: React.MutableRefObject<Map<string, { status: string; ts: number; originalStatus?: string }>> | undefined,
  getStatusValue: (status: any) => string
) {
  return useQuery({
    queryKey: ['calendar', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/company/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch calendar');
      const data = await res.json();
      const unwrapped = data.contentCalendars || data;
      const list = Array.isArray(unwrapped) ? unwrapped : [];

      // Smart merge: preserve status for rows moved within the last 30 seconds
      const PRESERVE_MS = 30_000;
      const now = Date.now();
      
      return list.map((incoming: any) => {
        if (!recentStatusMoves?.current) return incoming;

        const id = incoming.contentCalendarId;
        const recent = recentStatusMoves.current.get(id);
        if (recent && now - recent.ts < PRESERVE_MS) {
          const incomingStatus = getStatusValue(incoming.status);
          const recentStatus = getStatusValue(recent.status);
          const originalStatus = recent.originalStatus ? getStatusValue(recent.originalStatus) : null;

          if (incomingStatus === recentStatus) {
            recentStatusMoves.current.delete(id);
            return incoming;
          }
          if (originalStatus && incomingStatus === originalStatus) {
            return { ...incoming, status: recent.status };
          }
          recentStatusMoves.current.delete(id);
        }
        return incoming;
      });
    },
    enabled: !!companyId && enabled,
    staleTime: 30 * 1000,
  });
}
