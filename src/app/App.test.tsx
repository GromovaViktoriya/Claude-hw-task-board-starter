import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Task } from '../features/tasks/model/task'
import { createLocalStorageTaskRepository, TASK_STORAGE_KEY } from '../services/localStorageTaskRepository'
import type { TaskRepository } from '../services/taskRepository'
import { App } from './App'

const activeTask: Task = {
  id: 'task-release',
  title: 'Подготовить релиз',
  description: 'Проверить сценарии',
  status: 'in-progress',
  priority: 'high',
  dueDate: '2026-09-12',
  createdAt: '2026-09-03T09:00:00.000Z',
  updatedAt: '2026-09-05T12:00:00.000Z',
}

function createRepositoryDouble(overrides: Partial<TaskRepository> = {}): TaskRepository {
  return {
    load: vi.fn().mockResolvedValue({ tasks: [activeTask], recovered: false }),
    create: vi.fn().mockResolvedValue({
      ...activeTask,
      id: 'task-new',
      title: 'Новая задача',
      status: 'todo',
    }),
    update: vi.fn().mockImplementation(async (id, input) => ({
      ...activeTask,
      ...input,
      id,
    })),
    remove: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue({ tasks: [activeTask], recovered: false }),
    ...overrides,
  }
}

describe('App', () => {
  it('reports board totals from persisted data', async () => {
    const user = userEvent.setup()
    const repository = createLocalStorageTaskRepository(localStorage, {
      createId: () => 'task-new',
      now: () => '2026-09-08T12:00:00.000Z',
    })
    await repository.reset()
    render(<App repository={repository} />)

    expect(await screen.findByText('Всего задач: 6')).toBeInTheDocument()
    expect(screen.getByText('В работе: 2')).toBeInTheDocument()
    expect(screen.getByText('Готово: 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Переместить: Подготовить релиз' }))

    expect(await screen.findByText('В работе: 1')).toBeInTheDocument()
    expect(screen.getByText('Готово: 3')).toBeInTheDocument()
  })

  it('shows zero stats for an invalid persisted envelope', async () => {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify({ version: 1, tasks: [{ status: 'todo' }] }))
    render(<App repository={createRepositoryDouble()} />)

    expect(screen.getByText('Всего задач: 0')).toBeInTheDocument()
    expect(screen.getByText('В работе: 0')).toBeInTheDocument()
    expect(screen.getByText('Готово: 0')).toBeInTheDocument()
  })

  it('renders tasks in their status columns after loading', async () => {
    render(<App repository={createRepositoryDouble()} />)

    const column = await screen.findByRole('region', { name: 'В работе' })
    expect(within(column).getByText('Подготовить релиз')).toBeInTheDocument()
  })

  it('creates a task from the dialog', async () => {
    const user = userEvent.setup()
    const repository = createRepositoryDouble()
    render(<App repository={repository} />)
    await screen.findByText('Подготовить релиз')

    await user.click(screen.getByRole('button', { name: 'Новая задача' }))
    await user.type(screen.getByRole('textbox', { name: 'Название' }), 'Новая задача')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Приоритет' }), 'medium')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Новая задача',
      priority: 'medium',
    }))
    expect(await screen.findByText('Новая задача')).toBeInTheDocument()
  })

  it('edits the title and priority of an existing task', async () => {
    const user = userEvent.setup()
    const repository = createRepositoryDouble()
    render(<App repository={repository} />)
    await screen.findByText('Подготовить релиз')

    await user.click(screen.getByRole('button', { name: 'Редактировать: Подготовить релиз' }))
    const title = screen.getByRole('textbox', { name: 'Название' })
    await user.clear(title)
    await user.type(title, 'Выпустить обновление')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Приоритет' }), 'low')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(repository.update).toHaveBeenCalledWith('task-release', expect.objectContaining({
      title: 'Выпустить обновление',
      priority: 'low',
    }))
  })

  it('clears an existing due date when editing a task', async () => {
    const user = userEvent.setup()
    const repository = createRepositoryDouble()
    render(<App repository={repository} />)
    await screen.findByText('Подготовить релиз')

    await user.click(screen.getByRole('button', { name: 'Редактировать: Подготовить релиз' }))
    await user.clear(screen.getByLabelText('Срок'))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(repository.update).toHaveBeenCalledWith('task-release', expect.objectContaining({
      dueDate: undefined,
    }))
    expect(await screen.findByText('Подготовить релиз')).toBeInTheDocument()
    expect(screen.queryByText('Срок: 2026-09-12')).not.toBeInTheDocument()
  })

  it('moves a task to the next status with an accessible button', async () => {
    const user = userEvent.setup()
    const repository = createRepositoryDouble()
    render(<App repository={repository} />)
    await screen.findByText('Подготовить релиз')

    await user.click(screen.getByRole('button', { name: 'Переместить: Подготовить релиз' }))

    expect(repository.update).toHaveBeenCalledWith('task-release', { status: 'done' })
  })

  it('deletes a task only after confirmation', async () => {
    const user = userEvent.setup()
    const repository = createRepositoryDouble()
    render(<App repository={repository} />)
    await screen.findByText('Подготовить релиз')

    await user.click(screen.getByRole('button', { name: 'Удалить: Подготовить релиз' }))
    expect(repository.remove).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Удалить задачу' }))

    expect(repository.remove).toHaveBeenCalledWith('task-release')
  })

  it('resets the board only after confirmation', async () => {
    const user = userEvent.setup()
    const repository = createRepositoryDouble()
    render(<App repository={repository} />)
    await screen.findByText('Подготовить релиз')

    await user.click(screen.getByRole('button', { name: 'Восстановить пример' }))
    expect(repository.reset).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Восстановить задачи' }))

    expect(repository.reset).toHaveBeenCalledOnce()
  })

  it('shows a recovery notice returned by the repository', async () => {
    const repository = createRepositoryDouble({
      load: vi.fn().mockResolvedValue({ tasks: [activeTask], recovered: true }),
    })
    render(<App repository={repository} />)

    expect(await screen.findByText('Сохранённые данные были повреждены. Мы восстановили пример.')).toBeInTheDocument()
  })

  it('shows an error and keeps the dialog open when saving fails', async () => {
    const user = userEvent.setup()
    const repository = createRepositoryDouble({
      create: vi.fn().mockRejectedValue(new Error('write failed')),
    })
    render(<App repository={repository} />)
    await screen.findByText('Подготовить релиз')

    await user.click(screen.getByRole('button', { name: 'Новая задача' }))
    await user.type(screen.getByRole('textbox', { name: 'Название' }), 'Новая задача')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось сохранить задачу')
    expect(screen.getByRole('dialog', { name: 'Новая задача' })).toBeInTheDocument()
  })
})
