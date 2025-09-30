import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useQueryAuthContext } from '../contexts/QueryAuthContext';
import { externalApi, type ExternalLoginCredentials, type ExternalLoginResponse } from '../api/externalApi';

interface StoredExternalToken {
  token: string;
  expiresAt: number;
  loginTime: number;
  companyId: string;
}

const TOKEN_VALIDITY_HOURS = 8;

export function useExternalLogin() {
  const [error, setError] = useState<string>('');
  const { user, isAuthenticated: isMainAuthenticated } = useQueryAuthContext();
  const queryClient = useQueryClient();

  // Get current company ID from actual_company_area
  const getCurrentCompanyId = (): string => {
    const actualCompanyArea = (user as any)?.actual_company_area;
    const companyId = actualCompanyArea?.ID_EMPRESA?.toString() || '';
    return companyId;
  };

  // Get company-specific query key for TanStack Query
  const getExternalTokenQueryKey = (companyId?: string): string[] => {
    const currentCompanyId = companyId || getCurrentCompanyId();
    return ['external_token', currentCompanyId];
  };

  // Save token using TanStack Query
  const saveToken = (tokenData: ExternalLoginResponse) => {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('No company ID available');
    }

    const now = Date.now();
    const expiresAt = now + (TOKEN_VALIDITY_HOURS * 60 * 60 * 1000); // 8 hours in ms

    const storedToken: StoredExternalToken = {
      token: tokenData.token,
      expiresAt,
      loginTime: now,
      companyId
    };

    // Store token in TanStack Query cache
    queryClient.setQueryData(getExternalTokenQueryKey(companyId), storedToken);
  };

  // Get stored token for current company (returns null if expired)
  const getStoredToken = (): string | null => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) return null;

      const tokenData = queryClient.getQueryData<StoredExternalToken>(getExternalTokenQueryKey(companyId));
      if (!tokenData) return null;

      const now = Date.now();

      // Check if token is expired
      if (now > tokenData.expiresAt) {
        queryClient.removeQueries({ queryKey: getExternalTokenQueryKey(companyId) });
        return null;
      }

      // Verify token belongs to current company
      if (tokenData.companyId !== companyId) {
        queryClient.removeQueries({ queryKey: getExternalTokenQueryKey(companyId) });
        return null;
      }

      return tokenData.token;
    } catch (error) {
      const companyId = getCurrentCompanyId();
      if (companyId) {
        queryClient.removeQueries({ queryKey: getExternalTokenQueryKey(companyId) });
      }
      return null;
    }
  };

  // Clear token for current company
  const clearToken = () => {
    const companyId = getCurrentCompanyId();
    if (companyId) {
      queryClient.removeQueries({ queryKey: getExternalTokenQueryKey(companyId) });
    }
  };

  // Clear all external tokens (utility function)
  const clearAllTokens = () => {
    queryClient.removeQueries({ queryKey: ['external_token'] });
  };


  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: ExternalLoginCredentials) => externalApi.login(credentials),
    onSuccess: (data) => {
      saveToken(data);
      setError('');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  // Query to check if user has valid token for current company
  const tokenQuery = useQuery({
    queryKey: getExternalTokenQueryKey(),
    queryFn: getStoredToken,
    staleTime: 8 * 60 * 60 * 1000, // 8 hours (same as token validity)
    refetchInterval: 8 * 60 * 60 * 1000, // Check every 8 hours
    enabled: !!getCurrentCompanyId(), // Only run if we have a company ID
  });

  // Get time until token expires (in milliseconds)
  const getTimeUntilExpiry = (): number | null => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) return null;

      const tokenData = queryClient.getQueryData<StoredExternalToken>(getExternalTokenQueryKey(companyId));
      if (!tokenData) return null;

      return tokenData.expiresAt - Date.now();
    } catch {
      return null;
    }
  };

  return {
    // Login function
    login: loginMutation.mutate,
    isLoading: loginMutation.isPending,
    error: error || loginMutation.error?.message,

    // Token management
    token: tokenQuery.data,
    isAuthenticated: !!tokenQuery.data,
    clearToken,
    clearAllTokens,
    getTimeUntilExpiry,

    // Token refresh
    refetchToken: tokenQuery.refetch,

    // Company info
    currentCompanyId: getCurrentCompanyId(),
  };
}