export type Frame = number[]
export type Theme = 'light' | 'dark'

export interface Player {
  id: string
  name: string
  frames: Frame[]
}

export interface RollEntry {
  playerIndex: number
  frameIndex: number
  pins: number
}

export interface Game {
  id: string
  createdAt: string
  completedAt?: string
  players: Player[]
  currentPlayer: number
  currentFrame: number
  rollLog: RollEntry[]
  status: 'active' | 'completed'
}

export interface AppData {
  activeGame: Game | null
  history: Game[]
  lastPlayers?: string[]
  theme?: Theme
  hasSeenNux?: boolean
}
