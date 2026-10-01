import { useEffect, useId, useRef, useState } from 'react'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  tone: 'default' | 'danger'
  onConfirm(): Promise<void>
  onCancel(): void
}

export function ConfirmDialog({ title, description, confirmLabel, tone, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.open = true
    return () => { if (dialog.open && typeof dialog.close === 'function') dialog.close() }
  }, [])

  async function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    try { await onConfirm() } finally { setIsPending(false) }
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onCancel={onCancel}>
      <form className={styles.form} onSubmit={handleConfirm}>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
        <div className={styles.actions}><button type="button" onClick={onCancel} disabled={isPending}>Отмена</button><button type="submit" className={tone === 'danger' ? styles.danger : undefined} disabled={isPending}>{confirmLabel}</button></div>
      </form>
    </dialog>
  )
}
