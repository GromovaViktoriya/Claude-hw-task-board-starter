export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export type CreateTaskInput = Pick<Task, 'title' | 'description' | 'priority'> & {
  status?: TaskStatus
  dueDate?: string
}

export type UpdateTaskInput = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate'>
>
