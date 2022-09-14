import { useMutation, useQuery, useQueryClient } from 'vue-query';

export interface ServerActionResponse {
  message: string;
}

export interface ServerResponse<T> {
  result: T;
}

export async function get<T>(target: string) {
  const response = await fetch(target, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/'; // Hard redirect
    }

    throw new Error((await response.json()).message);
  }

  return (await response.json()) as T;
}

export async function post<T>(target: string, data: unknown) {
  const response = await fetch(target, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/'; // Hard redirect
    }

    const errorResponse = await response.json();

    throw new Error(errorResponse.error);
  }

  return response.json() as T;
}

export function useUsername() {
  return useQuery(
    ['username'],
    async () => (await get<ServerResponse<string>>('/api/username')).result,
    {
      staleTime: Number.POSITIVE_INFINITY,
      cacheTime: Number.POSITIVE_INFINITY,
    }
  );
}
interface LoginCredentials {
  username: string;
  password: string;
}
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<ServerActionResponse, Error, LoginCredentials>(
    (credentials: LoginCredentials) =>
      post<ServerActionResponse>('/api/login', credentials),
    {
      onSuccess: (_serverResponse, credentials) => {
        queryClient.setQueryData(['username'], credentials.username);
      },
    }
  );
}
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<ServerActionResponse, Error, void>(
    () => get<ServerActionResponse>('/api/logout'),
    {
      onSuccess: () => {
        return queryClient.invalidateQueries(['username']);
      },
    }
  );
}
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation<ServerActionResponse, Error, LoginCredentials>(
    (credentials: LoginCredentials) =>
      post<ServerActionResponse>('/api/register', credentials),
    {
      onSuccess: (_serverResponse, credentials) => {
        queryClient.setQueryData(['username'], credentials.username);
      },
    }
  );
}
