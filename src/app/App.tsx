import { TaskBoard } from '../components/TaskBoard'
import { createLocalStorageTaskRepository } from '../services/localStorageTaskRepository'
import type { TaskRepository } from '../services/taskRepository'

interface AppProps {
  repository?: TaskRepository
}

export function App({
  repository = createLocalStorageTaskRepository(window.localStorage),
}: AppProps) {
  return <TaskBoard repository={repository} />
}
