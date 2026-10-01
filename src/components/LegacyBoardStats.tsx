import styles from './LegacyBoardStats.module.css'
import { TASK_STORAGE_KEY } from '../services/localStorageTaskRepository'

interface StoredTask {
  status: 'todo' | 'in-progress' | 'done'
}

const emptyStats = { total: 0, inProgress: 0, done: 0 }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStoredTask(value: unknown): value is StoredTask {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    (value.status === 'todo' || value.status === 'in-progress' || value.status === 'done') &&
    (value.priority === 'low' || value.priority === 'medium' || value.priority === 'high') &&
    (value.dueDate === undefined || typeof value.dueDate === 'string')
  )
}

function getStats(): { total: number; inProgress: number; done: number } {
  try {
    const stored = localStorage.getItem(TASK_STORAGE_KEY)
    if (stored === null) return emptyStats

    const parsed: unknown = JSON.parse(stored)
    if (
      !isRecord(parsed) ||
      !('version' in parsed) ||
      parsed.version !== 1 ||
      !('tasks' in parsed) ||
      !Array.isArray(parsed.tasks) ||
      !parsed.tasks.every(isStoredTask)
    ) {
      return emptyStats
    }

    const tasks = parsed.tasks
    return {
      total: tasks.length,
      inProgress: tasks.filter((task) => task.status === 'in-progress').length,
      done: tasks.filter((task) => task.status === 'done').length,
    }
  } catch {
    return emptyStats
  }
}

export function LegacyBoardStats() {
  const { total, inProgress, done } = getStats()

  return (
    <section className={styles.stats} aria-label="Статистика доски">
      <div className={styles.stat}>Всего задач: {total}</div>
      <div className={styles.stat}>В работе: {inProgress}</div>
      <div className={styles.stat}>Готово: {done}</div>
    </section>
  )
}
