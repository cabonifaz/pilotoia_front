import { useQuery } from '@tanstack/react-query';
import { getPhoneCodes } from '../api/phoneCodesApi';

export const useGetPhoneCodes = () => {
  return useQuery({
    queryKey: ['phoneCodes'],
    queryFn: async () => {
      return await getPhoneCodes();
    },
    retry: false,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - phone codes don't change often
  });
};
