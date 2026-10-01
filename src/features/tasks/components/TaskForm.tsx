import { useEffect, useId, useRef, useState } from 'react'
import type { CreateTaskInput, Task, TaskPriority, UpdateTaskInput } from '../model/task'
import styles from './TaskForm.module.css'

interface TaskFormProps {
  task?: Task
  onSubmit(input: CreateTaskInput | UpdateTaskInput): Promise<void>
  onCancel(): void
  error?: string
}

const priorities: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
]

export function TaskForm({ task, onSubmit, onCancel, error }: TaskFormProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [isPending, setIsPending] = useState(false)
  const [validationError, setValidationError] = useState<string>()
  const heading = task ? 'Редактировать задачу' : 'Новая задача'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.open = true
    return () => { if (dialog.open && typeof dialog.close === 'function') dialog.close() }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 3) {
      setValidationError('Название должно содержать не менее 3 символов')
      return
    }
    setValidationError(undefined)
    setIsPending(true)
    try {
      await onSubmit({
        title: trimmedTitle,
        description,
        priority,
        ...(dueDate ? { dueDate } : task ? { dueDate: undefined } : {}),
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onCancel={onCancel}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 id={titleId}>{heading}</h2>
        <label>Название<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Описание<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>Приоритет<select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>{priorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Срок<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
        {(validationError || error) && <p role="alert">{validationError || error}</p>}
        <div className={styles.actions}><button type="button" onClick={onCancel} disabled={isPending}>Отмена</button><button type="submit" disabled={isPending}>{task ? 'Сохранить' : 'Создать'}</button></div>
      </form>
    </dialog>
  )
}
