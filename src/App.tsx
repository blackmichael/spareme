import { useEffect, useRef, useState } from 'react'
import { createGame, frameScores, isFrameComplete, maxPinsForFrame, recordRoll, replaceFrame, rollMark, totalScore, undoRoll } from './scoring'
import { loadData, saveData } from './storage'
import type { AppData, Frame, Game } from './types'
import { Wordmark } from './brand/Wordmark'

type Route =
  | { kind: 'home' }
  | { kind: 'about' }
  | { kind: 'game' }
  | { kind: 'history', id: string }
  | { kind: 'not-found' }

function parseRoute(pathname: string): Route {
  if (pathname === '/') return { kind: 'home' }
  if (pathname === '/about') return { kind: 'about' }
  if (pathname === '/game') return { kind: 'game' }
  const match = pathname.match(/^\/games\/([^/]+)$/)
  if (match) {
    try {
      return { kind: 'history', id: decodeURIComponent(match[1]) }
    } catch {
      return { kind: 'not-found' }
    }
  }
  return { kind: 'not-found' }
}

function routePath(route: Route): string {
  if (route.kind === 'about') return '/about'
  if (route.kind === 'game') return '/game'
  if (route.kind === 'history') return `/games/${encodeURIComponent(route.id)}`
  return '/'
}

function AboutPage() {
  return (
    <main id="main-content" className="about-page content">
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

function NotFoundPage({ game }: { game: boolean }) {
  return (
    <main id="main-content" className="not-found-page content">
      <section className="not-found-card panel">
        <p className="eyebrow">Gutter ball</p>
        <h1>{game ? 'Game not found' : 'Page not found'}</h1>
        <p className="not-found-copy">
          {game
            ? 'This game isn’t available on this device. spare me stores games locally, so sharing its URL doesn’t share the score. Open it on the device where you played, or return home to start a new game.'
            : 'That page request went straight into the gutter. Check the web address or return home.'}
        </p>
        <a className="button primary not-found-action" href="/">Back home <span>→</span></a>
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

function Setup({ history, activeGame, onStart, onResume, onAbandon, onViewHistory, initialNames }: {
  history: Game[]
  activeGame: Game | null
  onStart: (names: string[]) => void
  onResume: () => void
  onAbandon: () => void
  onViewHistory: (id: string) => void
  initialNames?: string[]
}) {
  const [names, setNames] = useState([''])
  const nameInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const pendingFocusIndex = useRef<number | null>(null)

  useEffect(() => {
    if (pendingFocusIndex.current === null) return
    nameInputRefs.current[pendingFocusIndex.current]?.focus()
    pendingFocusIndex.current = null
  }, [names.length])

  const updateName = (index: number, value: string) => {
    setNames((current) => current.map((name, i) => i === index ? value : name))
  }

  const addPlayer = (focusNewPlayer = false) => {
    if (names.length >= 10) return
    if (focusNewPlayer) pendingFocusIndex.current = names.length
    setNames([...names, ''])
  }

  const start = () => {
    const playerNames = names.map((name, index) => name.trim() || `Player ${index + 1}`)
    onStart(playerNames)
  }

  return (
    <main id="main-content" className="setup-layout">
       <section className="setup-card panel">
        <div className="setup-intro">
          <h1>{activeGame?.status === 'active' ? 'Back to bowling' : "Who's bowling?"}</h1>
          {activeGame?.status !== 'active' ? (
            <div className="setup-subline">
              <p className="lede">Add up to 10 players.</p>
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
          ) : null}
        </div>
        {activeGame?.status === 'active' ? (
          <div className="setup-resume">
            <p className="eyebrow">Game in progress</p>
            <ul>
              {activeGame.players.map((player) => (
                <li key={player.id}>
                  <span>{player.name}</span>
                  <strong><span className="sr-only">Score: </span>{totalScore(player)}</strong>
                </li>
              ))}
            </ul>
            <button className="button primary" onClick={onResume}>Resume game <span>→</span></button>
            <button className="abandon-game-button" onClick={onAbandon}>Abandon game</button>
          </div>
        ) : (
          <>
            <div className="player-fields">
              {names.map((name, index) => (
                <div className="player-field" key={index}>
                  <span className="player-number">{String(index + 1).padStart(2, '0')}</span>
                  <input
                    aria-label={`Player ${index + 1} name`}
                    autoComplete="off"
                    maxLength={24}
                    name={`playerName${index + 1}`}
                    onChange={(event) => updateName(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return
                      event.preventDefault()
                      addPlayer(true)
                    }}
                    placeholder={`Player ${index + 1}`}
                    ref={(element) => { nameInputRefs.current[index] = element }}
                    value={name}
                  />
                  {names.length > 1 && (
                    <button className="icon-button" aria-label={`Remove player ${index + 1}`} onClick={() => setNames(names.filter((_, i) => i !== index))}>×</button>
                  )}
                </div>
              ))}
            </div>
            <div className="setup-actions">
              <button className="button secondary" disabled={names.length >= 10} onClick={() => addPlayer()}>+ Add player</button>
              <button className="button primary" onClick={start}>Start bowling <span>→</span></button>
            </div>
          </>
        )}
      </section>
        <aside className="history-rail">
          <div className="section-heading">
            <h2>Past games</h2>
          </div>
        {history.length === 0 ? (
          <div className="empty-history">Completed games appear here. Select one to review it or start a rematch.</div>
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
  const [expanded, setExpanded] = useState(false)
  const scorecardWrapRef = useRef<HTMLDivElement>(null)
  const activeFrameRef = useRef<HTMLTableCellElement>(null)
  const canCollapse = game.status === 'active' && game.players.length > 3
  const isCollapsed = canCollapse && !expanded

  useEffect(() => {
    if (game.status !== 'active' || !activeFrameRef.current || !scorecardWrapRef.current) return

    const container = scorecardWrapRef.current
    const activeFrame = activeFrameRef.current
    const bowlerColumn = container.querySelector<HTMLElement>('.scorecard tbody th')
    const reservedWidth = bowlerColumn?.offsetWidth ?? 0
    const visibleWidth = container.clientWidth - reservedWidth
    const targetScrollLeft = activeFrame.offsetLeft - reservedWidth - (visibleWidth - activeFrame.offsetWidth) / 2
    const activeRow = activeFrame.closest('tr')
    const tableHead = container.querySelector<HTMLElement>('thead')
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const left = Math.max(0, targetScrollLeft)
    const viewportPadding = 16
    let top = container.scrollTop

    if (activeRow) {
      const rowBounds = activeRow.getBoundingClientRect()
      const containerBounds = container.getBoundingClientRect()
      const viewportTop = containerBounds.top + (tableHead?.offsetHeight ?? 0) + viewportPadding
      const viewportBottom = containerBounds.bottom - viewportPadding
      const verticalDelta = rowBounds.top < viewportTop
        ? rowBounds.top - viewportTop
        : rowBounds.bottom > viewportBottom
          ? rowBounds.bottom - viewportBottom
          : 0
      top = Math.max(0, container.scrollTop + verticalDelta)
    }

    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ left, top, behavior: reduceMotion ? 'auto' : 'smooth' })
    } else {
      container.scrollLeft = left
      container.scrollTop = top
    }
  }, [expanded, game.status, game.currentFrame, game.currentPlayer])

  return (
    <div className="scorecard-block">
      {canCollapse && (
        <div className="scorecard-toolbar">
          <span className="eyebrow">Scorecard</span>
          <button className="text-button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Show fewer players' : 'Show all players'}
          </button>
        </div>
      )}
      <div className={`scorecard-wrap${isCollapsed ? ' is-collapsed' : ''}`} ref={scorecardWrapRef}>
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
    </div>
  )
}

function EntryMode({ game, onRoll, onUndo, onAbandon, onEdit }: { game: Game, onRoll: (pins: number) => void, onUndo: () => void, onAbandon: () => void, onEdit: (playerIndex: number, frameIndex: number) => void }) {
  const player = game.players[game.currentPlayer]
  const frame = player.frames[game.currentFrame]
  const maxPins = maxPinsForFrame(frame, game.currentFrame)
  const strikeAvailable = frame.length === 0 || (game.currentFrame === 9 && frame.length > 0 && (frame[0] === 10 || frame.length === 2))
  const showStrike = strikeAvailable && maxPins === 10
  const numericPins = Array.from({ length: 9 }, (_, index) => index + 1)
  const lastRoll = game.rollLog.at(-1)
  const frameMarks = frame.map((_, index) => rollMark(frame, index, game.currentFrame)).join(' ')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement
      if (target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return
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
      <div className="entry-primary">
        <section className="entry-console panel" aria-label="Record knocked down pins">
          <div className="turn-strip">
            <div className="current-player">
              <p className="eyebrow">Now bowling</p>
              <h1 title={player.name}>{player.name}</h1>
            </div>
            <div className="turn-meta" aria-label={`Frame ${game.currentFrame + 1} of 10, ball ${frame.length + 1}`}>
              <span>Frame <strong>{game.currentFrame + 1}</strong> <i>·</i> Ball <strong>{frame.length + 1}</strong></span>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">Frame {game.currentFrame + 1}, ball {frame.length + 1}. Now bowling {player.name}.</p>
          <div className="turn-context">
            <div className="frame-summary" aria-label={`This frame ${frameMarks || 'not started'}`}>
              <span>This frame</span>
              <strong>{frameMarks || '—'}</strong>
            </div>
            <button className="text-button undo-button" aria-label={lastRoll ? 'Undo last roll' : 'Undo'} disabled={game.rollLog.length === 0} onClick={onUndo}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 14-5-5 5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
              </svg>
              Undo
            </button>
          </div>
          <div className="quick-outcomes">
            {showStrike ? (
              <button className="outcome strike" aria-label="Strike" onClick={() => onRoll(10)}><strong aria-hidden="true">X</strong><span aria-hidden="true">Strike</span></button>
            ) : (
              <button className="outcome spare" aria-label="Spare" onClick={() => onRoll(maxPins)}><strong aria-hidden="true">/</strong><span aria-hidden="true">Spare</span></button>
            )}
            <button className="outcome miss" aria-label="Miss" onClick={() => onRoll(0)}><strong aria-hidden="true">–</strong><span aria-hidden="true">Miss</span></button>
          </div>
          <div className="pin-counts">
            <span aria-label={`Pins left ${maxPins}`}>Pins left <strong>{maxPins}</strong></span>
            <div className="pin-options">
              {numericPins.map((pins) => {
                const available = pins < maxPins
                return <button aria-label={`${pins} pins`} className={available ? '' : 'unavailable'} disabled={!available} key={pins} onClick={() => onRoll(pins)}>{pins}</button>
              })}
            </div>
          </div>
        </section>

        <section className="active-scorecard" aria-label="Bowling scorecard">
          <Scorecard game={game} onEdit={onEdit} />
        </section>
      </div>

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
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname))
  const [editingFrame, setEditingFrame] = useState<{ playerIndex: number, frameIndex: number } | null>(null)
  const activeGame = data.activeGame
  const selectedHistoryId = route.kind === 'history' ? route.id : null
  const displayedGame = selectedHistoryId ? data.history.find((game) => game.id === selectedHistoryId) : activeGame

  useEffect(() => saveData(data), [data])

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    const title = route.kind === 'about'
      ? 'About | spare me'
      : route.kind === 'not-found'
        ? 'Page not found | spare me'
        : route.kind === 'history' && !displayedGame
          ? 'Game not found | spare me'
          : 'spare me'
    document.title = title
  }, [route.kind, displayedGame])

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', data.theme === 'light' ? '#f3ead8' : '#102628')
  }, [data.theme])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  useEffect(() => {
    if (route.kind !== 'game' || activeGame?.status === 'active') return
    window.history.replaceState({}, '', '/')
    setRoute({ kind: 'home' })
  }, [activeGame?.status, route.kind])

  const navigate = (nextRoute: Route, replace = false) => {
    const path = routePath(nextRoute)
    if (replace) window.history.replaceState({}, '', path)
    else window.history.pushState({}, '', path)
    setRoute(nextRoute)
  }

  const startGame = (names: string[]) => {
    setData((current) => ({ ...current, activeGame: createGame(names) }))
    navigate({ kind: 'game' })
  }

  const addRoll = (pins: number) => {
    if (!activeGame) return
    const updated = recordRoll(activeGame, pins)
    setData((current) => {
      if (!current.activeGame || current.activeGame.id !== activeGame.id) return current
      const justCompleted = current.activeGame.status === 'active' && updated.status === 'completed'
      return {
        ...current,
        activeGame: updated,
        history: justCompleted ? [updated, ...current.history.filter((game) => game.id !== updated.id)] : current.history,
        lastPlayers: justCompleted ? updated.players.map((player) => player.name) : current.lastPlayers,
      }
    })
    if (updated.status === 'completed') navigate({ kind: 'history', id: updated.id })
  }

  const undo = () => {
    setData((current) => {
      if (!current.activeGame) return current
      const game = undoRoll(current.activeGame)
      return { ...current, activeGame: game, history: current.history.filter((saved) => saved.id !== game.id) }
    })
  }

  const saveFrameEdit = (playerIndex: number, frameIndex: number, frame: Frame) => {
    if (!activeGame) return
    const updated = replaceFrame(activeGame, playerIndex, frameIndex, frame)
    if (updated === activeGame) return
    setData((current) => {
      if (!current.activeGame || current.activeGame.id !== activeGame.id) return current
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
    if (updated.status === 'completed') navigate({ kind: 'history', id: updated.id })
  }

  const newGame = () => {
    if (activeGame?.status === 'active' && activeGame.rollLog.length > 0 && !window.confirm('Abandon this game and start a new one?')) return
    setData((current) => ({
      ...current,
      activeGame: null,
      lastPlayers: activeGame?.players.map((player) => player.name) ?? current.lastPlayers,
    }))
    navigate({ kind: 'home' })
  }

  const abandonGame = () => {
    if (!activeGame || !window.confirm('Abandon this game? All scores will be permanently erased.')) return
    setData((current) => ({
      ...current,
      activeGame: null,
      history: current.history.filter((game) => game.id !== activeGame.id),
      lastPlayers: current.lastPlayers,
    }))
    navigate({ kind: 'home' })
  }

  const goHome = () => {
    navigate({ kind: 'home' })
  }

  const deleteGame = (id: string) => {
    if (!window.confirm('Delete this game from the archive?')) return
    setData((current) => ({
      ...current,
      activeGame: current.activeGame?.id === id ? null : current.activeGame,
      history: current.history.filter((game) => game.id !== id),
    }))
    navigate({ kind: 'home' })
  }

  const viewHistory = (id: string) => {
    navigate({ kind: 'history', id })
  }

  const selectHistory = (id: string | null) => {
    if (id) viewHistory(id)
    else navigate({ kind: 'home' })
  }

  const toggleTheme = () => {
    setData((current) => ({
      ...current,
      theme: (current.theme ?? 'dark') === 'light' ? 'dark' : 'light',
    }))
  }

  const backFromHeader = () => window.history.back()

  const isCurrentCompletedGame = route.kind === 'history'
    && activeGame?.status === 'completed'
    && displayedGame?.id === activeGame.id

   return (
       <div className={`app-shell ${route.kind === 'game' ? 'game-shell' : ''}`} data-theme={data.theme ?? 'dark'}>
       <a className="skip-link" href="#main-content">Skip to main content</a>
       <header className="site-header">
        <div className="header-leading">
          {(route.kind === 'about' || selectedHistoryId) ? <button className="header-back" aria-label="Back" onClick={backFromHeader}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
          </button> : <span aria-hidden="true" />}
        </div>
        <button className="brand" onClick={goHome} aria-label="spare me home">
          <Wordmark />
        </button>
        <div className="header-actions" />
      </header>

      {route.kind === 'about' ? (
        <AboutPage />
      ) : route.kind === 'not-found' ? (
        <NotFoundPage game={false} />
      ) : route.kind === 'history' && displayedGame ? (
        <main id="main-content" className="content">
          {isCurrentCompletedGame && <div className="complete-banner"><span>Game complete</span><button className="button primary" onClick={newGame}>Start another →</button></div>}
          <ScorecardMode game={displayedGame} history={data.history} onSelectGame={selectHistory} onDelete={deleteGame} onEdit={isCurrentCompletedGame ? (playerIndex, frameIndex) => setEditingFrame({ playerIndex, frameIndex }) : undefined} isArchiveView={!isCurrentCompletedGame} />
        </main>
      ) : route.kind === 'history' ? (
        <NotFoundPage game />
      ) : route.kind === 'home' ? (
        <Setup history={data.history} activeGame={activeGame} initialNames={data.lastPlayers} onStart={startGame} onResume={() => navigate({ kind: 'game' })} onAbandon={abandonGame} onViewHistory={viewHistory} />
      ) : route.kind === 'game' && activeGame?.status === 'active' ? (
        <main id="main-content" className="content entry-content"><EntryMode game={activeGame} onRoll={addRoll} onUndo={undo} onAbandon={abandonGame} onEdit={(playerIndex, frameIndex) => setEditingFrame({ playerIndex, frameIndex })} /></main>
      ) : (
        <Setup history={data.history} activeGame={activeGame} initialNames={data.lastPlayers} onStart={startGame} onResume={() => navigate({ kind: 'game' })} onAbandon={abandonGame} onViewHistory={viewHistory} />
      )}
      {editingFrame && activeGame?.status === 'active' && <FrameEditor game={activeGame} playerIndex={editingFrame.playerIndex} frameIndex={editingFrame.frameIndex} onSave={saveFrameEdit} onClose={() => setEditingFrame(null)} />}
      <SiteFooter onAbout={() => navigate({ kind: 'about' })} theme={data.theme ?? 'dark'} onToggleTheme={toggleTheme} />
    </div>
  )
}
