import { useEffect, useRef, useState } from 'react'
import { createGame, frameScores, isFrameComplete, maxPinsForFrame, recordRoll, replaceFrame, rollMark, totalScore, undoRoll } from './scoring'
import { loadData, saveData } from './storage'
import type { AppData, Frame, Game } from './types'
import { Wordmark } from './brand/Wordmark'

type Page = 'app' | 'about'

function AboutPage() {
  return (
    <main className="about-page content">
      <section className="about-hero">
        <h1 aria-label="A better way to keep score.">A better way<br />to keep score.</h1>
        <p className="lede">spare me tracks your bowling scores so you can focus on the pins.</p>
      </section>
      <div className="about-grid">
        <section className="about-card panel">
          <p className="eyebrow">Score a game</p>
          <h2>Keep the game moving</h2>
          <p>Enter each roll, and spare me calculates frame totals and running scores.</p>
          <p>Undo a roll when you tap too quickly. Review completed games in the archive or start a rematch.</p>
        </section>
        <section className="about-card panel">
          <p className="eyebrow">Bowling rules</p>
          <h2>How scoring works</h2>
          <dl className="scoring-guide">
            <div><dt>Open frame</dt><dd>Add the pins from both rolls. The frame score ranges from 0 to 9.</dd></div>
            <div><dt><span className="score-symbol" aria-hidden="true">/</span> Spare</dt><dd>Knock down 10 pins in 2 rolls, then add your next roll.</dd></div>
            <div><dt><span className="score-symbol" aria-hidden="true">X</span> Strike</dt><dd>Knock down all 10 pins on your first roll, then add your next 2 rolls.</dd></div>
            <div><dt>Frame 10</dt><dd>A spare earns 1 bonus roll. A strike earns 2. The highest possible score is 30.</dd></div>
          </dl>
        </section>
      </div>
      <section className="about-note">
        <strong>Perfect game: 300</strong>
        <span>A perfect game requires 10 strikes and 2 bonus strikes in the tenth frame.</span>
      </section>
    </main>
  )
}

function SiteFooter({ onAbout, theme, onToggleTheme }: { onAbout: () => void, theme: 'light' | 'dark', onToggleTheme: () => void }) {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <nav className="footer-nav" aria-label="Footer navigation">
          <a href="/about" onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            event.preventDefault()
            onAbout()
          }}>About</a>
          <a href="https://github.com/blackmichael/spareme">
            Source code
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </a>
        </nav>
        <div className="footer-actions">
          <button className="theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'} onClick={onToggleTheme}>
            <span className="theme-track-icons" aria-hidden="true">
              <svg className="sun-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.28 5.28 6.7 6.7M17.3 17.3l1.42 1.42M5.28 18.72 6.7 17.3M17.3 6.7l1.42-1.42" /></svg>
              <svg className="moon-icon" viewBox="0 0 24 24"><path d="M18.8 15.9A7.8 7.8 0 0 1 8.1 5.2a7.8 7.8 0 1 0 10.7 10.7Z" /><path className="moon-star" d="m17.8 4 .45 1.05 1.05.45-1.05.45L17.8 7l-.45-1.05-1.05-.45 1.05-.45L17.8 4Z" /></svg>
            </span>
            <span className="theme-thumb" aria-hidden="true">
              <svg className="thumb-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.28 5.28 6.7 6.7M17.3 17.3l1.42 1.42M5.28 18.72 6.7 17.3M17.3 6.7l1.42-1.42" /></svg>
              <svg className="thumb-moon" viewBox="0 0 24 24"><path d="M18.8 15.9A7.8 7.8 0 0 1 8.1 5.2a7.8 7.8 0 1 0 10.7 10.7Z" /><path className="moon-star" d="m17.8 4 .45 1.05 1.05.45-1.05.45L17.8 7l-.45-1.05-1.05-.45 1.05-.45L17.8 4Z" /></svg>
            </span>
          </button>
        </div>
      </div>
      <p className="footer-copyright">© 2026 Spare Me. All rights reserved.</p>
    </footer>
  )
}

function Setup({ history, onStart, onViewHistory, initialNames }: {
  history: Game[]
  onStart: (names: string[]) => void
  onViewHistory: (id: string) => void
  initialNames?: string[]
}) {
  const [names, setNames] = useState([''])

  const updateName = (index: number, value: string) => {
    setNames((current) => current.map((name, i) => i === index ? value : name))
  }

  const addPlayer = () => {
    if (names.length < 10) setNames([...names, ''])
  }

  const start = () => {
    const playerNames = names.map((name, index) => name.trim() || `Player ${index + 1}`)
    onStart(playerNames)
  }

  return (
    <main className="setup-layout">
      <section className="setup-card panel">
        <div className="setup-intro">
          <h1>Who's bowling?</h1>
          <div className="setup-subline">
            <p className="lede">Add up to ten players.</p>
            {initialNames?.length ? (
              <button className="rematch-button" onClick={() => setNames(initialNames)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Rematch
              </button>
            ) : null}
          </div>
        </div>
        <div className="player-fields">
          {names.map((name, index) => (
            <div className="player-field" key={index}>
              <span className="player-number">{String(index + 1).padStart(2, '0')}</span>
              <input
                aria-label={`Player ${index + 1} name`}
                maxLength={24}
                onChange={(event) => updateName(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  addPlayer()
                }}
                placeholder={`Player ${index + 1}`}
                value={name}
              />
              {names.length > 1 && (
                <button className="icon-button" aria-label={`Remove player ${index + 1}`} onClick={() => setNames(names.filter((_, i) => i !== index))}>×</button>
              )}
            </div>
          ))}
        </div>
        <div className="setup-actions">
          <button className="button secondary" disabled={names.length >= 10} onClick={addPlayer}>+ Add player</button>
          <button className="button primary" onClick={start}>Start bowling <span>→</span></button>
        </div>
      </section>
        <aside className="history-rail">
          <div className="section-heading">
            <h2>Past games</h2>
          </div>
        {history.length === 0 ? (
          <div className="empty-history">Completed games will wait here for the rematch.</div>
        ) : history.slice(0, 6).map((game) => (
          <button className="history-item" key={game.id} onClick={() => onViewHistory(game.id)}>
            <span>{formatDate(game.completedAt ?? game.createdAt)}</span>
            <strong>{game.players.map((player) => player.name).join(' · ')}</strong>
            <span className="history-scores">{game.players.map(totalScore).join(' / ')}</span>
          </button>
        ))}
      </aside>
    </main>
  )
}

function FrameRolls({ frame, frameIndex }: { frame: Frame, frameIndex: number }) {
  const slots = frameIndex === 9 ? 3 : 2
  const label = frame.length
    ? frame.map((_, rollIndex) => rollDescription(frame, rollIndex, frameIndex)).join(', ')
    : 'No rolls recorded'
  return (
    <div className={`frame-rolls slots-${slots}`} role="img" aria-label={label}>
      {Array.from({ length: slots }, (_, rollIndex) => (
        <span aria-hidden="true" key={rollIndex}>{rollMark(frame, rollIndex, frameIndex)}</span>
      ))}
    </div>
  )
}

function rollDescription(frame: Frame, rollIndex: number, frameIndex: number): string {
  const mark = rollMark(frame, rollIndex, frameIndex)
  if (mark === 'X') return 'Strike'
  if (mark === '/') return 'Spare'
  if (mark === '-') return 'Miss'
  return mark ? `${mark} ${mark === '1' ? 'pin' : 'pins'}` : 'Not rolled'
}

function editOptions(rolls: Frame, frameIndex: number, rollIndex: number): number[] {
  if (rollIndex > 0 && rolls[rollIndex - 1] === undefined) return []
  const maxPins = maxPinsForFrame(rolls.slice(0, rollIndex), frameIndex)
  return maxPins > 0 || (rollIndex === 0 && maxPins === 10)
    ? Array.from({ length: maxPins + 1 }, (_, pins) => pins)
    : []
}

function FrameEditor({ game, playerIndex, frameIndex, onSave, onClose }: {
  game: Game
  playerIndex: number
  frameIndex: number
  onSave: (playerIndex: number, frameIndex: number, frame: Frame) => void
  onClose: () => void
}) {
  const player = game.players[playerIndex]
  const [rolls, setRolls] = useState<Frame>(() => [...player.frames[frameIndex]])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const chooseRoll = (rollIndex: number, pins: number) => {
    setRolls([...rolls.slice(0, rollIndex), pins])
  }
  const canSave = rolls.length > 0 && (game.currentPlayer === playerIndex && game.currentFrame === frameIndex || isFrameComplete(rolls, frameIndex))

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="frame-editor panel" role="dialog" aria-modal="true" aria-labelledby="frame-editor-title">
        <div className="frame-editor-heading">
          <div>
            <p className="eyebrow">Edit frame {frameIndex + 1}</p>
            <h2 id="frame-editor-title">{player.name}</h2>
          </div>
          <button className="icon-button" autoFocus aria-label="Close frame editor" onClick={onClose}>×</button>
        </div>
        <p className="frame-editor-help">Update the rolls. Later frames will be rescored automatically.</p>
        <div className="edit-rolls">
          {Array.from({ length: frameIndex === 9 ? 3 : 2 }, (_, rollIndex) => {
            const options = editOptions(rolls, frameIndex, rollIndex)
            if (!options.length) return null
            return (
              <div className="edit-roll" key={rollIndex}>
                <span>Roll {rollIndex + 1}</span>
                <div className="edit-pin-options">
                  {options.map((pins) => {
                    const mark = rollMark([...rolls.slice(0, rollIndex), pins], rollIndex, frameIndex)
                    return <button aria-label={rollDescription([...rolls.slice(0, rollIndex), pins], rollIndex, frameIndex)} className={rolls[rollIndex] === pins ? 'selected' : ''} key={pins} onClick={() => chooseRoll(rollIndex, pins)}>{mark}</button>
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <div className="frame-editor-actions">
          <button className="button secondary" onClick={onClose}>Cancel</button>
          <button className="button primary" disabled={!canSave} onClick={() => onSave(playerIndex, frameIndex, rolls)}>Save changes <span>→</span></button>
        </div>
      </section>
    </div>
  )
}

function Scorecard({ game, onEdit }: { game: Game, onEdit?: (playerIndex: number, frameIndex: number) => void }) {
  const scorecardWrapRef = useRef<HTMLDivElement>(null)
  const activeFrameRef = useRef<HTMLTableCellElement>(null)

  useEffect(() => {
    if (game.status !== 'active' || !activeFrameRef.current || !scorecardWrapRef.current) return

    const container = scorecardWrapRef.current
    const activeFrame = activeFrameRef.current
    const bowlerColumn = container.querySelector<HTMLElement>('.scorecard tbody th')
    const reservedWidth = bowlerColumn?.offsetWidth ?? 0
    const visibleWidth = container.clientWidth - reservedWidth
    const targetScrollLeft = activeFrame.offsetLeft - reservedWidth - (visibleWidth - activeFrame.offsetWidth) / 2
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const left = Math.max(0, targetScrollLeft)

    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' })
    } else {
      container.scrollLeft = left
    }
  }, [game.status, game.currentFrame])

  return (
    <div className="scorecard-wrap" ref={scorecardWrapRef}>
      <table className="scorecard">
        <caption className="sr-only">Bowling scorecard</caption>
        <thead>
          <tr>
            <th>Bowler</th>
            {Array.from({ length: 10 }, (_, index) => <th key={index}>{index + 1}</th>)}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {game.players.map((player, playerIndex) => {
            const scores = frameScores(player)
            return (
              <tr className={game.status === 'active' && playerIndex === game.currentPlayer ? 'is-current' : ''} key={player.id}>
                <th scope="row"><span className="player-dot" />{player.name}</th>
                 {player.frames.map((frame, frameIndex) => (
                   <td className={`${game.status === 'active' && playerIndex === game.currentPlayer && frameIndex === game.currentFrame ? 'active-frame ' : ''}${onEdit && frame.length ? 'is-editable' : ''}`} key={frameIndex} ref={game.status === 'active' && playerIndex === game.currentPlayer && frameIndex === game.currentFrame ? activeFrameRef : undefined}>
                     <FrameRolls frame={frame} frameIndex={frameIndex} />
                     <strong className="frame-score">{scores[frameIndex] ?? ''}</strong>
                     {onEdit && frame.length ? <button className="frame-edit-button" aria-label={`Edit ${player.name}, frame ${frameIndex + 1}`} onClick={() => onEdit(playerIndex, frameIndex)} /> : null}
                   </td>
                 ))}
                <td className="total-cell">{totalScore(player)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EntryMode({ game, onRoll, onUndo, onAbandon, onEdit }: { game: Game, onRoll: (pins: number) => void, onUndo: () => void, onAbandon: () => void, onEdit: (playerIndex: number, frameIndex: number) => void }) {
  const player = game.players[game.currentPlayer]
  const frame = player.frames[game.currentFrame]
  const maxPins = maxPinsForFrame(frame, game.currentFrame)
  const strikeAvailable = frame.length === 0 || (game.currentFrame === 9 && frame.length > 0 && (frame[0] === 10 || frame.length === 2))
  const showStrike = strikeAvailable && maxPins === 10
  const nextPlayer = game.currentPlayer < game.players.length - 1
    ? game.players[game.currentPlayer + 1]
    : game.currentFrame < 9 ? game.players[0] : null
  const numericPins = Array.from({ length: Math.max(0, maxPins - 1) }, (_, index) => index + 1)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      const key = event.key.toLowerCase()
       if ((key === 'x' && showStrike) || (key === '/' && !showStrike && maxPins > 0)) onRoll(maxPins)
      else if (key === 'm' || key === '0') onRoll(0)
      else if (/^[1-9]$/.test(key) && Number(key) < maxPins) onRoll(Number(key))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
   }, [maxPins, onRoll, showStrike])

  return (
    <div className="entry-screen">
      <div className="entry-controls">
        <section className="now-bowling panel">
          <div className="turn-meta">
            <span>Frame {game.currentFrame + 1} <i>/ 10</i></span>
            <span>Ball {frame.length + 1}</span>
          </div>
          <div className="current-player">
            <p className="eyebrow">Now bowling</p>
            <h1>{player.name}</h1>
          </div>
          <div className="next-up" aria-live="polite">
            <span className="status-light" />
            {nextPlayer ? <span>On deck <strong>{nextPlayer.name}</strong></span> : <strong>Final rolls</strong>}
          </div>
        </section>

        <section className="pin-pad panel" aria-label="Record knocked down pins">
          <div className="pin-pad-heading">
            <div>
              <p className="eyebrow">Record the roll</p>
              <h2>What happened?</h2>
            </div>
            <button className="text-button undo-button" disabled={game.rollLog.length === 0} onClick={onUndo}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 14-5-5 5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
              </svg>
              Undo
            </button>
          </div>
          <div className="quick-outcomes">
            {showStrike ? (
              <button className="outcome strike" aria-label="Strike" onClick={() => onRoll(10)}><strong aria-hidden="true">X</strong><span aria-hidden="true">Strike</span><kbd aria-hidden="true">X</kbd></button>
            ) : (
              <button className="outcome spare" aria-label="Spare" onClick={() => onRoll(maxPins)}><strong aria-hidden="true">/</strong><span aria-hidden="true">Spare</span><kbd aria-hidden="true">/</kbd></button>
            )}
            <button className="outcome miss" aria-label="Miss" onClick={() => onRoll(0)}><strong aria-hidden="true">–</strong><span aria-hidden="true">Miss</span><kbd aria-hidden="true">0</kbd></button>
          </div>
          <div className="pin-counts">
            <span>Pins</span>
            <div>
              {Array.from({ length: 9 }, (_, index) => index + 1).map((pins) => {
                const available = numericPins.includes(pins)
                return <button className={!available ? 'unavailable' : ''} disabled={!available} key={pins} onClick={() => onRoll(pins)}>{pins}</button>
              })}
            </div>
          </div>
        </section>
      </div>

      <section className="active-scorecard" aria-label="Bowling scorecard">
        <Scorecard game={game} onEdit={onEdit} />
      </section>

      <button className="abandon-game-button" onClick={onAbandon}>Abandon game</button>
    </div>
  )
}

function ScorecardMode({ game, history, onSelectGame, onDelete, onEdit, isArchiveView = false }: {
  game: Game
  history: Game[]
  onSelectGame: (id: string | null) => void
  onDelete: (id: string) => void
  onEdit?: (playerIndex: number, frameIndex: number) => void
  isArchiveView?: boolean
}) {
  return (
    <div className={`score-mode ${isArchiveView ? 'archive-score-mode' : ''}`}>
      <section className="score-heading">
        <div>
          <h1>{formatDate(game.completedAt ?? game.createdAt)}</h1>
        </div>
      </section>
       <Scorecard game={game} onEdit={onEdit} />
      {history.length > 0 && (
        <section className="archive-section">
          <div className="section-heading"><h2>Game archive</h2></div>
          <div className="archive-list">
            {history.map((pastGame) => (
              <div className={`archive-row ${pastGame.id === game.id ? 'selected' : ''}`} key={pastGame.id}>
                <button onClick={() => onSelectGame(pastGame.id)}>
                  <span>{formatDate(pastGame.completedAt ?? pastGame.createdAt)}</span>
                  <strong>{pastGame.players.map((player) => `${player.name} ${totalScore(player)}`).join(' · ')}</strong>
                </button>
                <button className="delete-button" aria-label="Delete saved game" onClick={() => onDelete(pastGame.id)}>×</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

export default function App() {
  const [data, setData] = useState<AppData>(loadData)
  const [page, setPage] = useState<Page>(() => window.location.pathname === '/about' ? 'about' : 'app')
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [editingFrame, setEditingFrame] = useState<{ playerIndex: number, frameIndex: number } | null>(null)
  const activeGame = data.activeGame
  const displayedGame = selectedHistoryId
    ? data.history.find((game) => game.id === selectedHistoryId) ?? activeGame
    : activeGame

  useEffect(() => saveData(data), [data])

  useEffect(() => {
    const onPopState = () => setPage(window.location.pathname === '/about' ? 'about' : 'app')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    document.title = page === 'about' ? 'About | spare me' : 'spare me'
  }, [page])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page, selectedHistoryId])

  const startGame = (names: string[]) => {
    setData((current) => ({ ...current, activeGame: createGame(names) }))
    setSelectedHistoryId(null)
  }

  const addRoll = (pins: number) => {
    setData((current) => {
      if (!current.activeGame) return current
      const updated = recordRoll(current.activeGame, pins)
      const justCompleted = current.activeGame.status === 'active' && updated.status === 'completed'
      return {
        ...current,
        activeGame: updated,
        history: justCompleted ? [updated, ...current.history.filter((game) => game.id !== updated.id)] : current.history,
        lastPlayers: justCompleted ? updated.players.map((player) => player.name) : current.lastPlayers,
      }
    })
  }

  const undo = () => {
    setData((current) => {
      if (!current.activeGame) return current
      const game = undoRoll(current.activeGame)
      return { ...current, activeGame: game, history: current.history.filter((saved) => saved.id !== game.id) }
    })
  }

  const saveFrameEdit = (playerIndex: number, frameIndex: number, frame: Frame) => {
    setData((current) => {
      if (!current.activeGame) return current
      const updated = replaceFrame(current.activeGame, playerIndex, frameIndex, frame)
      if (updated === current.activeGame) return current
      const justCompleted = current.activeGame.status === 'active' && updated.status === 'completed'
      return {
        ...current,
        activeGame: updated,
        history: justCompleted
          ? [updated, ...current.history.filter((saved) => saved.id !== updated.id)]
          : current.history.map((saved) => saved.id === updated.id ? updated : saved),
        lastPlayers: justCompleted ? updated.players.map((player) => player.name) : current.lastPlayers,
      }
    })
    setEditingFrame(null)
  }

  const newGame = () => {
    if (activeGame?.status === 'active' && activeGame.rollLog.length > 0 && !window.confirm('Abandon this game and start a new one?')) return
    setData((current) => ({
      ...current,
      activeGame: null,
      lastPlayers: activeGame?.players.map((player) => player.name) ?? current.lastPlayers,
    }))
    setSelectedHistoryId(null)
  }

  const abandonGame = () => {
    if (!activeGame || !window.confirm('Abandon this game? All scores will be permanently erased.')) return
    setData((current) => ({
      ...current,
      activeGame: null,
      history: current.history.filter((game) => game.id !== activeGame.id),
      lastPlayers: current.lastPlayers,
    }))
    setSelectedHistoryId(null)
  }

  const goHome = () => {
    if (!activeGame) {
      setSelectedHistoryId(null)
      return
    }
    const shouldAbandon = activeGame.status === 'active'
    if (shouldAbandon && activeGame.rollLog.length > 0 && !window.confirm('Abandon this game? All scores will be permanently erased.')) return
    setData((current) => ({
      ...current,
      activeGame: null,
      history: shouldAbandon
        ? current.history.filter((game) => game.id !== activeGame.id)
        : current.history,
      lastPlayers: current.lastPlayers,
    }))
    setSelectedHistoryId(null)
  }

  const deleteGame = (id: string) => {
    if (!window.confirm('Delete this game from the archive?')) return
    setData((current) => ({
      ...current,
      activeGame: current.activeGame?.id === id ? null : current.activeGame,
      history: current.history.filter((game) => game.id !== id),
    }))
    setSelectedHistoryId(null)
  }

  const viewHistory = (id: string) => {
    setSelectedHistoryId(id)
  }

  const navigate = (nextPage: Page) => {
    const path = nextPage === 'about' ? '/about' : '/'
    window.history.pushState({}, '', path)
    setPage(nextPage)
  }

  const toggleTheme = () => {
    setData((current) => ({
      ...current,
      theme: (current.theme ?? 'dark') === 'light' ? 'dark' : 'light',
    }))
  }

  const backFromHeader = page === 'about'
    ? () => navigate('app')
    : () => { setSelectedHistoryId(null) }

  return (
    <div className="app-shell" data-theme={data.theme ?? 'dark'}>
      <header className="site-header">
        <div className="header-leading">
          {(page === 'about' || selectedHistoryId) ? <button className="header-back" aria-label="Back" onClick={backFromHeader}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
          </button> : <span aria-hidden="true" />}
        </div>
        <button className="brand" onClick={page === 'about' ? () => navigate('app') : goHome} aria-label="spare me home">
          <Wordmark />
        </button>
        <div className="header-actions" />
      </header>

      {page === 'about' ? (
        <AboutPage />
      ) : selectedHistoryId && displayedGame ? (
        <main className="content"><ScorecardMode game={displayedGame} history={data.history} onSelectGame={setSelectedHistoryId} onDelete={deleteGame} isArchiveView /></main>
      ) : !activeGame ? (
        <Setup history={data.history} initialNames={data.lastPlayers} onStart={startGame} onViewHistory={viewHistory} />
      ) : activeGame.status === 'completed' && !selectedHistoryId ? (
        <main className="content">
          <div className="complete-banner"><span>Game complete</span><button className="button primary" onClick={newGame}>Start another →</button></div>
          <ScorecardMode game={activeGame} history={data.history} onSelectGame={setSelectedHistoryId} onDelete={deleteGame} onEdit={(playerIndex, frameIndex) => setEditingFrame({ playerIndex, frameIndex })} />
        </main>
      ) : (
        <main className="content entry-content"><EntryMode game={activeGame} onRoll={addRoll} onUndo={undo} onAbandon={abandonGame} onEdit={(playerIndex, frameIndex) => setEditingFrame({ playerIndex, frameIndex })} /></main>
      )}
      {editingFrame && activeGame?.status === 'active' && <FrameEditor game={activeGame} playerIndex={editingFrame.playerIndex} frameIndex={editingFrame.frameIndex} onSave={saveFrameEdit} onClose={() => setEditingFrame(null)} />}
      <SiteFooter onAbout={() => navigate('about')} theme={data.theme ?? 'dark'} onToggleTheme={toggleTheme} />
    </div>
  )
}
