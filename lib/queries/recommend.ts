import { useQuery } from '@tanstack/react-query';
import { RecommendInput, RecommendedPackage } from '../recommend/types';
import { ofetch } from 'ofetch';

interface RecommendResponse {
  packages: RecommendedPackage[];
  success?: boolean;
  error?: string;
}

export function useRecommendation(input: RecommendInput) {
  return useQuery<RecommendResponse>({
    queryKey: ['recommend', input.lang, input.cityCode, input.visitForm, input.interests.join(','), input.transportMode, input.freeTextQuery],
    queryFn: async () => {
      // client-side fetching to the Next.js API Route
      const response = await ofetch<RecommendResponse>('/api/recommend', {
        method: 'POST',
        body: input,
      });
      return response;
    },
    enabled: !!input.cityCode && !!input.visitForm && (input.interests.length > 0 || (input.freeTextQuery ? input.freeTextQuery.trim().length > 0 : false)),
    staleTime: 0, // Force fetch on mount instead of aggressive 5 min cache
  });
}
