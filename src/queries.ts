import type { Ref } from 'vue';
import { unref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import ky from 'ky';

export async function get<T>(target: string): Promise<T> {
  return await ky
    .get(target, {
      retry: 0,
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
  return await ky
    .post(target, {
      json: data,
      retry: 0,
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

export async function del(target: string): Promise<void> {
  await ky.delete(target, {
    retry: 0,
    hooks: {
      afterResponse: [
        (_request, _options, response) => {
          if (response.status === 401) {
            window.location.href = '/'; // hard redirect
          }
        },
      ],
    },
  });
}

export async function put<T>(target: string, data?: unknown): Promise<T> {
  return await ky
    .put(target, {
      json: data,
      retry: 0,
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
  assignee_id: number | null;
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
  description: string;
  state: TaskState;
  user: number;
  assignee: number | null;
}
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation(
    ({ board, title, description, state, user, assignee }: CreateTaskPayload) =>
      post<Task>(`/api/boards/${board}/tasks`, {
        title,
        description,
        state,
        user,
        assignee,
      }),
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

interface DeleteTaskPayload {
  board: number;
  task: number;
}
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation(
    ({ board, task }: DeleteTaskPayload) =>
      del(`/api/boards/${board}/tasks/${task}`),
    {
      onSuccess: (_, { board, task }) => {
        queryClient.setQueriesData<Task[]>(['tasks', board], (tasks) => {
          if (!tasks) {
            return undefined;
          }
          return tasks.filter((t) => t.id !== task);
        });
      },
    }
  );
}

interface UpdateTaskPayload {
  board: number;
  task: number;
  title: string;
  description: string;
  state: TaskState;
  assignee: number | null;
}
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation(
    ({ board, task, title, description, state, assignee }: UpdateTaskPayload) =>
      put<Task>(`/api/boards/${board}/tasks/${task}`, {
        title,
        description,
        state,
        assignee,
      }),
    {
      onSuccess: (updatedTask, { board, task }) => {
        queryClient.setQueriesData<Task[]>(['tasks', board], (tasks) => {
          if (!tasks) {
            return undefined;
          }
          const newTasks = tasks.slice();
          const oldTaskIndex = newTasks.findIndex((t) => t.id === task);
          if (oldTaskIndex === -1) {
            throw new Error('Unable to find task after update!');
          }
          newTasks[oldTaskIndex] = updatedTask;

          return newTasks;
        });
        return queryClient.invalidateQueries(['boards', board]);
      },
    }
  );
}

export interface User {
  id: number;
  username: string;
}

export function useBoardUsers<T = User[]>(
  board: MaybeRef<number>,
  select?: (u: User[]) => T
) {
  return useQuery(
    ['users', board],
    () => get<User[]>(`/api/boards/${unref(board)}/users`),
    { select }
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
