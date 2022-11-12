import type { Ref } from 'vue';
import { unref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import ky from 'ky';

export async function get<T>(target: string): Promise<T> {
  // const response = await fetch(target, {
  //   method: 'GET',
  //   headers: {
  //     Accept: 'application/json',
  //     'Content-Type': 'application/json',
  //   },
  //   credentials: 'include',
  // });

  // if (!response.ok) {
  //   if (response.status === 401) {
  //     window.location.href = '/'; // Hard redirect
  //   }

  //   const errorResponse = await response.json();
  //   throw new Error(errorResponse.error);
  // }

  // return (await response.json()) as T;

  return await ky
    .get(target, {
      hooks: {
        afterResponse: [
          (_request, _options, response) => {
            if (response.status === 401) {
              window.location.href = '/'; // hard redirect
            }
          },
        ],
      },
    })
    .json();
}

export async function post<T>(target: string, data?: unknown): Promise<T> {
  // const response = await fetch(target, {
  //   method: 'POST',
  //   headers: {
  //     Accept: 'application/json',
  //     'Content-Type': 'application/json',
  //   },
  //   credentials: 'include',
  //   body: data ? JSON.stringify(data) : undefined,
  // });

  // if (!response.ok) {
  //   if (response.status === 401) {
  //     window.location.href = '/'; // Hard redirect
  //   }

  //   const errorResponse = await response.json();

  //   throw new Error(errorResponse.error);
  // } else if (response.status === 204) {
  //   return;
  // } else {
  //   return response.json() as T;
  // }

  return await ky
    .post(target, {
      json: data,
      hooks: {
        afterResponse: [
          (_request, _options, response) => {
            if (response.status === 401) {
              window.location.href = '/'; // hard redirect
            }
          },
        ],
      },
    })
    .json();
}

export function useUsername() {
  return useQuery(
    ['username'],
    async () => await get<string>('/api/username'),
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

  return useMutation<void, Error, LoginCredentials>(
    (credentials: LoginCredentials) => post<void>('/api/login', credentials),
    {
      onSuccess: (_serverResponse, credentials) => {
        queryClient.setQueryData(['username'], credentials.username);
      },
    }
  );
}
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>(() => post<void>('/api/logout'), {
    onSuccess: () => {
      return queryClient.invalidateQueries(['username']);
    },
  });
}
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, LoginCredentials>(
    (credentials: LoginCredentials) => post<void>('/api/register', credentials),
    {
      onSuccess: (_serverResponse, credentials) => {
        queryClient.setQueryData(['username'], credentials.username);
      },
    }
  );
}

export interface Board {
  id: number;
  owner_id: number;
  title: string;
  created_date: string;
  last_updated: string;
}

type MaybeRef<T> = T | Ref<T>;

export function useBoards() {
  return useQuery(['boards'], () => get<Board[]>('/api/boards'));
}

export function useBoard(boardId: MaybeRef<number>) {
  const queryClient = useQueryClient();

  return useQuery(
    ['boards', boardId],
    () => get<Board>(`/api/boards/${unref(boardId)}`),
    {
      initialData: () =>
        queryClient
          .getQueryData<Board[]>(['boards'])
          ?.find((b) => b.id === unref(boardId)),
    }
  );
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation((title: string) => post('/api/boards', { title }), {
    onSuccess: () => {
      return queryClient.invalidateQueries(['boards']);
    },
  });
}

export type TaskState = 'TODO' | 'WIP' | 'DONE';

export interface Task {
  id: number;
  board_id: number;
  author_id: number;
  state: TaskState;
  title: string;
  description: string;
  created_date: string;
  last_updated: string;
}

export function useTasks(board: MaybeRef<number>) {
  return useQuery(['tasks', board], () =>
    get<Task[]>(`/api/boards/${unref(board)}/tasks`)
  );
}

interface CreateTaskPayload {
  board: number;
  title: string;
}
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation(
    ({ board, title }: CreateTaskPayload) =>
      post<Task>(`/api/boards/${board}/tasks`, { title }),
    {
      onSuccess: (newTask, { board }) => {
        queryClient.setQueriesData<Task[]>(['tasks', board], (tasks) => {
          if (!tasks) {
            return [newTask];
          }
          return [...tasks, newTask];
        });
      },
    }
  );
}

export interface User {
  id: number;
  username: string;
}

export function useBoardUsers(board: MaybeRef<number>) {
  return useQuery(['users', board], () =>
    get<User[]>(`/api/boards/${unref(board)}/users`)
  );
}

interface AddBoardUserParams {
  boardId: string;
  userId: string;
}
export function useAddBoardUser() {
  const queryClient = useQueryClient();

  return useMutation(
    ({ boardId, userId }: AddBoardUserParams) =>
      post<User>(`/api/boards/${boardId}/users`, { userId }),
    {
      onSuccess: (newUser, { boardId }, _context) => {
        queryClient.setQueryData<User[]>(
          ['users', parseInt(boardId, 10)],
          (users) => {
            console.log('Adding user!');
            if (!users) {
              return [newUser];
            } else {
              return [...users, newUser].sort((a, b) =>
                a.username.localeCompare(b.username)
              );
            }
          }
        );
      },
    }
  );
}

// export function useCreateTask() {
//   const queryClient = useQueryClient();

//   return useMutation((title: string) => post('/api/boards', { title }), {
//     onSuccess: () => {
//       return queryClient.invalidateQueries(['boards']);
//     },
//   });
// }
