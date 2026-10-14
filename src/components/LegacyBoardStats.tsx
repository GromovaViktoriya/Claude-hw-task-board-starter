import styles from './LegacyBoardStats.module.css'
import { isOverdue, toLocalDateKey, type Task } from '../features/tasks/model/task'

interface LegacyBoardStatsProps {
  tasks: readonly Task[]
}

export function LegacyBoardStats({ tasks }: LegacyBoardStatsProps) {
  const today = toLocalDateKey(new Date())
  const total = tasks.length
  const inProgress = tasks.filter((task) => task.status === 'in-progress').length
  const done = tasks.filter((task) => task.status === 'done').length
  const overdue = tasks.filter((task) => isOverdue(task, today)).length

  return (
    <section className={styles.stats} aria-label="Статистика доски">
      <div className={styles.stat}>Всего задач: {total}</div>
      <div className={styles.stat}>В работе: {inProgress}</div>
      <div className={styles.stat}>Готово: {done}</div>
      <div className={styles.stat}>Просрочено: {overdue}</div>
    </section>
  )
}
