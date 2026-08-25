import { createGame, frameScores, maxPinsForFrame, recordRoll, replaceFrame, rollMark, totalScore, undoRoll } from './scoring'
import type { Game } from './types'

function rollMany(game: Game, rolls: number[]): Game {
  return rolls.reduce(recordRoll, game)
}

describe('bowling scoring', () => {
  it('scores a perfect game', () => {
    const game = rollMany(createGame(['Ada']), Array(12).fill(10))
    expect(game.status).toBe('completed')
    expect(totalScore(game.players[0])).toBe(300)
    expect(frameScores(game.players[0])).toEqual([30, 60, 90, 120, 150, 180, 210, 240, 270, 300])
  })

  it('scores spares and their bonuses', () => {
    const game = rollMany(createGame(['Ada']), [5, 5, 3, 4, ...Array(16).fill(0)])
    expect(totalScore(game.players[0])).toBe(20)
  })

  it('scores an open game', () => {
    const game = rollMany(createGame(['Ada']), Array(10).fill([9, 0]).flat())
    expect(totalScore(game.players[0])).toBe(90)
  })

  it('moves through players one frame at a time', () => {
    let game = createGame(['Ada', 'Grace'])
    game = recordRoll(game, 10)
    expect([game.currentPlayer, game.currentFrame]).toEqual([1, 0])
    game = recordRoll(game, 4)
    game = recordRoll(game, 5)
    expect([game.currentPlayer, game.currentFrame]).toEqual([0, 1])
  })

  it('handles tenth-frame pin resets', () => {
    expect(maxPinsForFrame([10], 9)).toBe(10)
    expect(maxPinsForFrame([10, 7], 9)).toBe(3)
    expect(maxPinsForFrame([7, 3], 9)).toBe(10)
    expect(maxPinsForFrame([7, 2], 9)).toBe(0)
  })

  it('marks a second-roll ten as a spare after a first-roll miss', () => {
    expect(rollMark([0, 10], 1, 0)).toBe('/')
    expect(rollMark([10, 10], 1, 0)).toBe('X')
  })

  it('undoes the last roll and restores that turn', () => {
    const game = undoRoll(rollMany(createGame(['Ada', 'Grace']), [10, 8, 1]))
    expect([game.currentPlayer, game.currentFrame]).toEqual([1, 0])
    expect(game.players[1].frames[0]).toEqual([8])
  })

  it('rejects impossible pin counts', () => {
    let game = recordRoll(createGame(['Ada']), 8)
    const unchanged = recordRoll(game, 3)
    expect(unchanged).toBe(game)
  })

  it('edits an earlier frame and preserves later rolls', () => {
    const game = rollMany(createGame(['Ada']), [10, 8, 1, ...Array(12).fill(0)])
    const edited = replaceFrame(game, 0, 0, [5, 5])

    expect(edited.players[0].frames.slice(0, 2)).toEqual([[5, 5], [8, 1]])
    expect(frameScores(edited.players[0]).slice(0, 2)).toEqual([18, 27])
    expect(edited.rollLog.slice(0, 4).map((roll) => roll.pins)).toEqual([5, 5, 8, 1])
  })

  it('inserts an edited later frame at its original turn', () => {
    const game = rollMany(createGame(['Ada', 'Grace']), [10, 8, 1, 4, 6, 2])
    const edited = replaceFrame(game, 1, 0, [3, 3])

    expect(edited.players.map((player) => player.frames[0])).toEqual([[10], [3, 3]])
    expect(edited.rollLog.slice(0, 5).map((roll) => [roll.playerIndex, roll.pins])).toEqual([[0, 10], [1, 3], [1, 3], [0, 4], [0, 6]])
  })
})
