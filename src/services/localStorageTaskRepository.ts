import { SEED_TASKS } from '../features/tasks/data/seedTasks'
import type {
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from '../features/tasks/model/task'
import {
  TaskRepositoryError,
  type TaskLoadResult,
  type TaskRepository,
} from './taskRepository'

export const TASK_STORAGE_KEY = 'redev-task-board:v1'

const STORAGE_VERSION = 1
const taskStatuses: readonly TaskStatus[] = ['todo', 'in-progress', 'done']
const taskPriorities: readonly TaskPriority[] = ['low', 'medium', 'high']

export interface TaskRepositoryDependencies {
  createId(): string
  now(): string
}

interface StoredTasks {
  version: number
  tasks: Task[]
}

const defaultDependencies: TaskRepositoryDependencies = {
  createId: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
}

function cloneTasks(tasks: readonly Task[]): Task[] {
  return tasks.map((task) => ({ ...task }))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    taskStatuses.includes(value.status as TaskStatus) &&
    taskPriorities.includes(value.priority as TaskPriority) &&
    (value.dueDate === undefined || typeof value.dueDate === 'string')
  )
}

function isStoredTasks(value: unknown): value is StoredTasks {
  return (
    isRecord(value) &&
    value.version === STORAGE_VERSION &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask)
  )
}

function storageError(error: unknown): TaskRepositoryError {
  return new TaskRepositoryError(
    error instanceof Error ? error.message : 'Unable to access task storage',
  )
}

export function createLocalStorageTaskRepository(
  storage: Storage,
  dependencies: TaskRepositoryDependencies = defaultDependencies,
): TaskRepository {
  function persist(tasks: readonly Task[]): void {
    try {
      const envelope: StoredTasks = {
        version: STORAGE_VERSION,
        tasks: cloneTasks(tasks),
      }
      storage.setItem(TASK_STORAGE_KEY, JSON.stringify(envelope))
    } catch (error) {
      throw storageError(error)
    }
  }

  async function load(): Promise<TaskLoadResult> {
    let stored: string | null

    try {
      stored = storage.getItem(TASK_STORAGE_KEY)
    } catch (error) {
      throw storageError(error)
    }

    if (stored === null) {
      const tasks = cloneTasks(SEED_TASKS)
      persist(tasks)
      return { tasks, recovered: false }
    }

    try {
      const parsed: unknown = JSON.parse(stored)
      if (isStoredTasks(parsed)) {
        return { tasks: cloneTasks(parsed.tasks), recovered: false }
      }
    } catch {
      // Invalid persisted data is recovered below.
    }

    const tasks = cloneTasks(SEED_TASKS)
    persist(tasks)
    return { tasks, recovered: true }
  }

  return {
    load,

    async create(input: CreateTaskInput): Promise<Task> {
      const { tasks } = await load()
      const timestamp = dependencies.now()
      const task: Task = {
        id: dependencies.createId(),
        title: input.title,
        description: input.description,
        status: input.status ?? 'todo',
        priority: input.priority,
        ...(input.dueDate === undefined ? {} : { dueDate: input.dueDate }),
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      tasks.push(task)
      persist(tasks)
      return { ...task }
    },

    async update(id: string, input: UpdateTaskInput): Promise<Task> {
      const { tasks } = await load()
      const index = tasks.findIndex((task) => task.id === id)

      if (index === -1) {
        throw new TaskRepositoryError(`Task not found: ${id}`)
      }

      const updated: Task = {
        ...tasks[index],
        ...input,
        updatedAt: dependencies.now(),
      }
      tasks[index] = updated
      persist(tasks)
      return { ...updated }
    },

    async remove(id: string): Promise<void> {
      const { tasks } = await load()
      const index = tasks.findIndex((task) => task.id === id)

      if (index === -1) {
        throw new TaskRepositoryError(`Task not found: ${id}`)
      }

      tasks.splice(index, 1)
      persist(tasks)
    },

    async reset(): Promise<TaskLoadResult> {
      const tasks = cloneTasks(SEED_TASKS)
      persist(tasks)
      return { tasks, recovered: false }
    },
  }
}
