import type { AppData } from './types'

const STORAGE_KEY = 'lane-ten:v1'
const EMPTY_DATA: AppData = { activeGame: null, history: [], theme: 'light' }

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_DATA
    const parsed = JSON.parse(raw) as AppData
    if (!Array.isArray(parsed.history)) return EMPTY_DATA
    return {
      ...parsed,
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      lastPlayers: parsed.lastPlayers?.length
        ? parsed.lastPlayers
        : parsed.history[0]?.players.map((player) => player.name),
    }
  } catch {
    return EMPTY_DATA
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
