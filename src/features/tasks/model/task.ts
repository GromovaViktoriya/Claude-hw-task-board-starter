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

// Локальная дата в формате YYYY-MM-DD — так же хранится dueDate из <input type="date">.
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isOverdue(task: Task, today: string): boolean {
  if (task.status === 'done' || !task.dueDate) return false
  return task.dueDate < today
}
