import type { CreateTaskInput, Task, UpdateTaskInput } from '../features/tasks/model/task'

export interface TaskLoadResult {
  tasks: Task[]
  recovered: boolean
}

export interface TaskRepository {
  load(): Promise<TaskLoadResult>
  create(input: CreateTaskInput): Promise<Task>
  update(id: string, input: UpdateTaskInput): Promise<Task>
  remove(id: string): Promise<void>
  reset(): Promise<TaskLoadResult>
}

export class TaskRepositoryError extends Error {}
