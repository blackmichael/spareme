import type { Frame, Game, Player } from './types'
import xid from 'xid'

export function createGame(names: string[]): Game {
  const createdAt = new Date().toISOString()
  return {
    id: xid.generateId(),
    createdAt,
    players: names.map((name, index) => ({
      id: crypto.randomUUID(),
      name: name.trim() || `Player ${index + 1}`,
      frames: Array.from({ length: 10 }, () => []),
    })),
    currentPlayer: 0,
    currentFrame: 0,
    rollLog: [],
    status: 'active',
  }
}

export function isFrameComplete(frame: Frame, frameIndex: number): boolean {
  if (frameIndex < 9) return frame[0] === 10 || frame.length >= 2
  if (frame.length < 2) return false
  if (frame[0] !== 10 && frame[0] + frame[1] < 10) return true
  return frame.length >= 3
}

export function maxPinsForFrame(frame: Frame, frameIndex: number): number {
  if (frameIndex < 9) return frame.length === 0 ? 10 : 10 - frame[0]
  if (frame.length === 0) return 10
  if (frame.length === 1) return frame[0] === 10 ? 10 : 10 - frame[0]
  if (frame[0] !== 10) return frame[0] + frame[1] === 10 ? 10 : 0
  if (frame[1] === 10) return 10
  return 10 - frame[1]
}

export function recordRoll(game: Game, pins: number): Game {
  if (game.status !== 'active') return game

  const frame = game.players[game.currentPlayer].frames[game.currentFrame]
  const maxPins = maxPinsForFrame(frame, game.currentFrame)
  if (!Number.isInteger(pins) || pins < 0 || pins > maxPins) return game

  const players = structuredClone(game.players)
  players[game.currentPlayer].frames[game.currentFrame].push(pins)
  const rollLog = [...game.rollLog, {
    playerIndex: game.currentPlayer,
    frameIndex: game.currentFrame,
    pins,
  }]

  let currentPlayer = game.currentPlayer
  let currentFrame = game.currentFrame
  let status: Game['status'] = 'active'
  let completedAt = game.completedAt

  if (isFrameComplete(players[currentPlayer].frames[currentFrame], currentFrame)) {
    if (currentPlayer < players.length - 1) {
      currentPlayer += 1
    } else if (currentFrame < 9) {
      currentPlayer = 0
      currentFrame += 1
    } else {
      status = 'completed'
      completedAt = new Date().toISOString()
    }
  }

  return { ...game, players, rollLog, currentPlayer, currentFrame, status, completedAt }
}

export function undoRoll(game: Game): Game {
  const last = game.rollLog.at(-1)
  if (!last) return game
  const players = structuredClone(game.players)
  players[last.playerIndex].frames[last.frameIndex].pop()
  return {
    ...game,
    players,
    currentPlayer: last.playerIndex,
    currentFrame: last.frameIndex,
    rollLog: game.rollLog.slice(0, -1),
    status: 'active',
    completedAt: undefined,
  }
}

export function replaceFrame(game: Game, playerIndex: number, frameIndex: number, frame: Frame): Game {
  if (game.status !== 'active') return game
  const player = game.players[playerIndex]
  const currentFrame = player?.frames[frameIndex]
  if (!currentFrame?.length || frame.length === 0) return game

  let candidate: Frame = []
  for (const pins of frame) {
    const maxPins = maxPinsForFrame(candidate, frameIndex)
    if (!Number.isInteger(pins) || pins < 0 || pins > maxPins) return game
    candidate = [...candidate, pins]
  }

  const isCurrentFrame = game.currentPlayer === playerIndex && game.currentFrame === frameIndex
  if (!isCurrentFrame && !isFrameComplete(candidate, frameIndex)) return game

  const firstRoll = game.rollLog.findIndex((roll) => roll.playerIndex === playerIndex && roll.frameIndex === frameIndex)
  if (firstRoll < 0) return game
  const insertionIndex = game.rollLog.slice(0, firstRoll).filter((roll) => roll.playerIndex !== playerIndex || roll.frameIndex !== frameIndex).length
  const rollLog = game.rollLog.filter((roll) => roll.playerIndex !== playerIndex || roll.frameIndex !== frameIndex)
  rollLog.splice(insertionIndex, 0, ...candidate.map((pins) => ({ playerIndex, frameIndex, pins })))

  let replayed = createGame(game.players.map((current) => current.name))
  for (const roll of rollLog) replayed = recordRoll(replayed, roll.pins)

  return {
    ...replayed,
    id: game.id,
    createdAt: game.createdAt,
    players: replayed.players.map((current, index) => ({ ...current, id: game.players[index].id })),
  }
}

export function frameScores(player: Player): Array<number | null> {
  const rolls = player.frames.flat()
  const scores: Array<number | null> = []
  let cursor = 0
  let total = 0

  for (let frameIndex = 0; frameIndex < 10; frameIndex += 1) {
    const frame = player.frames[frameIndex]
    if (!isFrameComplete(frame, frameIndex)) {
      scores.push(null)
      cursor += frame.length
      continue
    }

    let score: number | null
    if (frameIndex === 9) {
      score = frame.reduce((sum, pins) => sum + pins, 0)
    } else if (frame[0] === 10) {
      score = rolls[cursor + 1] === undefined || rolls[cursor + 2] === undefined
        ? null
        : 10 + rolls[cursor + 1] + rolls[cursor + 2]
    } else if (frame[0] + frame[1] === 10) {
      score = rolls[cursor + 2] === undefined ? null : 10 + rolls[cursor + 2]
    } else {
      score = frame[0] + frame[1]
    }

    if (score === null) scores.push(null)
    else {
      total += score
      scores.push(total)
    }
    cursor += frame.length
  }
  return scores
}

export function totalScore(player: Player): number {
  return frameScores(player).reduce<number>((latest, score) => score ?? latest, 0)
}

export function rollMark(frame: Frame, rollIndex: number, frameIndex: number): string {
  const pins = frame[rollIndex]
  if (pins === undefined) return ''
  if (pins === 0) return '-'
  if (rollIndex === 1 && frame[0] !== 10 && frame[0] + pins === 10) return '/'
  if (pins === 10) return 'X'
  if (frameIndex === 9 && rollIndex === 2 && frame[0] === 10 && frame[1] !== 10 && frame[1] + pins === 10) return '/'
  return String(pins)
}
