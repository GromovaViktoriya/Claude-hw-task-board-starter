import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SEED_TASKS } from '../features/tasks/data/seedTasks'
import { TaskRepositoryError } from './taskRepository'
import {
  TASK_STORAGE_KEY,
  createLocalStorageTaskRepository,
} from './localStorageTaskRepository'

const dependencies = {
  createId: () => 'task-new',
  now: () => '2026-09-08T12:00:00.000Z',
}

describe('localStorageTaskRepository', () => {
  beforeEach(() => localStorage.clear())

  it('seeds empty storage and returns six tasks', async () => {
    const repository = createLocalStorageTaskRepository(localStorage, dependencies)
    const result = await repository.load()

    expect(result).toEqual({ tasks: SEED_TASKS, recovered: false })
    expect(JSON.parse(localStorage.getItem(TASK_STORAGE_KEY)!)).toEqual({
      version: 1,
      tasks: SEED_TASKS,
    })
  })

  it('creates a task and persists the versioned envelope', async () => {
    const repository = createLocalStorageTaskRepository(localStorage, dependencies)
    await repository.load()
    const created = await repository.create({
      title: 'Новая задача',
      description: 'Проверить сохранение',
      priority: 'medium',
    })

    expect(created).toMatchObject({
      id: 'task-new',
      title: 'Новая задача',
      status: 'todo',
      createdAt: dependencies.now(),
    })
    expect(JSON.parse(localStorage.getItem(TASK_STORAGE_KEY)!).tasks).toContainEqual(created)
  })

  it('updates status without dropping the other fields', async () => {
    const repository = createLocalStorageTaskRepository(localStorage, dependencies)
    await repository.load()
    const updated = await repository.update('task-release', { status: 'done' })

    expect(updated).toMatchObject({
      id: 'task-release',
      title: 'Подготовить релиз',
      status: 'done',
      updatedAt: dependencies.now(),
    })
  })

  it('removes only the selected task', async () => {
    const repository = createLocalStorageTaskRepository(localStorage, dependencies)
    await repository.load()
    await repository.remove('task-copy')

    const { tasks } = await repository.load()
    expect(tasks).toHaveLength(SEED_TASKS.length - 1)
    expect(tasks.some((task) => task.id === 'task-copy')).toBe(false)
  })

  it('recovers from invalid JSON and marks the result as recovered', async () => {
    localStorage.setItem(TASK_STORAGE_KEY, '{broken')
    const repository = createLocalStorageTaskRepository(localStorage, dependencies)

    await expect(repository.load()).resolves.toEqual({
      tasks: SEED_TASKS,
      recovered: true,
    })
  })

  it('wraps storage write failures in TaskRepositoryError', async () => {
    const failingStorage: Storage = {
      length: 0,
      clear: vi.fn(),
      getItem: vi.fn(() => null),
      key: vi.fn(() => null),
      removeItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new DOMException('Quota exceeded')
      }),
    }
    const repository = createLocalStorageTaskRepository(failingStorage, dependencies)

    await expect(repository.load()).rejects.toBeInstanceOf(TaskRepositoryError)
  })

  it('resets only the starter storage key to the seed data', async () => {
    localStorage.setItem('unrelated', 'keep-me')
    const repository = createLocalStorageTaskRepository(localStorage, dependencies)
    await repository.load()
    await repository.remove('task-copy')
    const result = await repository.reset()

    expect(result).toEqual({ tasks: SEED_TASKS, recovered: false })
    expect(localStorage.getItem('unrelated')).toBe('keep-me')
  })
})
