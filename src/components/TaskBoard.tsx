import { useEffect, useState } from 'react'
import type { CreateTaskInput, Task, TaskStatus, UpdateTaskInput } from '../features/tasks/model/task'
import { ConfirmDialog } from '../features/tasks/components/ConfirmDialog'
import { TaskColumn } from '../features/tasks/components/TaskColumn'
import { TaskForm } from '../features/tasks/components/TaskForm'
import type { TaskRepository } from '../services/taskRepository'
import { LegacyBoardStats } from './LegacyBoardStats'
import styles from '../app/App.module.css'

interface TaskBoardProps {
  repository: TaskRepository
}

type ActiveForm = 'create' | Task | null
type PendingConfirmation = { kind: 'delete'; task: Task } | { kind: 'reset' } | null

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: 'in-progress',
  'in-progress': 'done',
  done: 'todo',
}

export function TaskBoard({ repository }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeForm, setActiveForm] = useState<ActiveForm>(null)
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>(null)
  const [recovered, setRecovered] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [operationError, setOperationError] = useState<string>()

  useEffect(() => {
    let active = true
    repository.load()
      .then((result) => {
        if (!active) return
        setTasks(result.tasks)
        setRecovered(result.recovered)
      })
      .catch(() => {
        if (active) setOperationError('Не удалось загрузить задачи')
      })
    return () => { active = false }
  }, [repository])

  async function saveTask(input: CreateTaskInput | UpdateTaskInput) {
    setFormError(undefined)
    setOperationError(undefined)
    try {
      if (activeForm === 'create') {
        const created = await repository.create(input as CreateTaskInput)
        setTasks((current) => [...current, created])
      } else if (activeForm) {
        const updated = await repository.update(activeForm.id, input as UpdateTaskInput)
        setTasks((current) => current.map((item) => item.id === updated.id ? updated : item))
      }
      setActiveForm(null)
    } catch {
      setFormError('Не удалось сохранить задачу')
    }
  }

  async function moveTask(task: Task) {
    setOperationError(undefined)
    try {
      const updated = await repository.update(task.id, { status: nextStatus[task.status] })
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch {
      setOperationError('Не удалось сохранить задачу')
    }
  }

  async function confirmAction() {
    if (!pendingConfirmation) return
    setOperationError(undefined)
    try {
      if (pendingConfirmation.kind === 'delete') {
        await repository.remove(pendingConfirmation.task.id)
        setTasks((current) => current.filter((task) => task.id !== pendingConfirmation.task.id))
      } else {
        const result = await repository.reset()
        setTasks(result.tasks)
        setRecovered(result.recovered)
      }
      setPendingConfirmation(null)
    } catch {
      setOperationError('Не удалось выполнить действие')
    }
  }

  function openCreateForm() {
    setFormError(undefined)
    setActiveForm('create')
  }

  function openEditForm(task: Task) {
    setFormError(undefined)
    setActiveForm(task)
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Рабочий процесс</p>
          <h1 className={styles.title}>Командная доска</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryButton} type="button" onClick={openCreateForm}>Новая <span>задача</span></button>
          <button className={styles.secondaryButton} type="button" onClick={() => setPendingConfirmation({ kind: 'reset' })}>
          Восстановить пример
        </button>
        </div>
      </header>
      <LegacyBoardStats tasks={tasks} />
      {recovered && <p className={styles.notice} role="status">Сохранённые данные были повреждены. Мы восстановили пример.</p>}
      {operationError && <p className={styles.error} role="alert">{operationError}</p>}
      <div className={styles.board}>
        <TaskColumn status="todo" tasks={tasks.filter((task) => task.status === 'todo')} onEdit={openEditForm} onMove={moveTask} onDelete={(task) => setPendingConfirmation({ kind: 'delete', task })} />
        <TaskColumn status="in-progress" tasks={tasks.filter((task) => task.status === 'in-progress')} onEdit={openEditForm} onMove={moveTask} onDelete={(task) => setPendingConfirmation({ kind: 'delete', task })} />
        <TaskColumn status="done" tasks={tasks.filter((task) => task.status === 'done')} onEdit={openEditForm} onMove={moveTask} onDelete={(task) => setPendingConfirmation({ kind: 'delete', task })} />
      </div>
      {activeForm && (
        <TaskForm task={activeForm === 'create' ? undefined : activeForm} onSubmit={saveTask} onCancel={() => setActiveForm(null)} error={formError} />
      )}
      {pendingConfirmation?.kind === 'delete' && (
        <ConfirmDialog title="Удалить задачу" description={`Задача «${pendingConfirmation.task.title}» будет удалена без возможности восстановления.`} confirmLabel="Удалить задачу" tone="danger" onConfirm={confirmAction} onCancel={() => setPendingConfirmation(null)} />
      )}
      {pendingConfirmation?.kind === 'reset' && (
        <ConfirmDialog title="Восстановить пример" description="Текущие задачи будут заменены примером." confirmLabel="Восстановить задачи" tone="default" onConfirm={confirmAction} onCancel={() => setPendingConfirmation(null)} />
      )}
    </main>
  )
}
