import { LegacyTaskCard } from '../../../components/LegacyTaskCard'
import type { Task, TaskStatus } from '../model/task'
import styles from './TaskColumn.module.css'

interface TaskColumnProps {
  status: TaskStatus
  tasks: Task[]
  onEdit(task: Task): void
  onMove(task: Task): void
  onDelete(task: Task): void
}

const titles: Record<TaskStatus, string> = { todo: 'Запланировано', 'in-progress': 'В работе', done: 'Готово' }

export function TaskColumn({ status, tasks, onEdit, onMove, onDelete }: TaskColumnProps) {
  const title = titles[status]
  return (
    <section className={styles.column} aria-label={title}>
      <h2>{title}</h2>
      <div className={styles.tasks}>
        {tasks.map((task) => <LegacyTaskCard key={task.id} task={task} onEdit={onEdit} onMove={onMove} onDelete={onDelete} />)}
      </div>
    </section>
  )
}
