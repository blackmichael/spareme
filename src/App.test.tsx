import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('score entry flow', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('starts a game and advances after a strike', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    expect(screen.getByText('Now bowling')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /new game/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /strike/i }))
    expect(screen.getByText('Frame 2', { exact: false })).toBeInTheDocument()
    expect(localStorage.getItem('lane-ten:v1')).toContain('Ada')
  })

  it('treats ten pins after a first-roll miss as a spare', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    await user.click(screen.getByRole('button', { name: /miss/i }))

    const spareButton = screen.getByText('Spare').closest('button') as HTMLElement
    expect(spareButton).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /strike/i })).not.toBeInTheDocument()
    await user.click(spareButton)
    expect(screen.getByRole('button', { name: /edit Ada, frame 1/i })).toBeInTheDocument()
  })

  it('edits a populated frame from recent frames', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    await user.click(screen.getByRole('button', { name: /strike/i }))
    await user.click(screen.getByRole('button', { name: /edit Ada, frame 1/i }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    await user.click(within(dialog).getAllByRole('button', { name: '5 pins' })[0])
    const rollSections = dialog.querySelectorAll('.edit-roll')
    await user.click(within(rollSections[1] as HTMLElement).getByRole('button', { name: 'Spare' }))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(screen.getByText('Frame 2', { exact: false })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('edits a populated frame from the active scorecard', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    await user.click(screen.getByRole('button', { name: /strike/i }))
    await user.click(screen.getByRole('button', { name: /edit Ada, frame 1/i }))

    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getAllByRole('button', { name: '8 pins' })[0])
    const rollSections = dialog.querySelectorAll('.edit-roll')
    await user.click(within(rollSections[1] as HTMLElement).getByRole('button', { name: 'Spare' }))
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }))

    expect(screen.getByRole('button', { name: /edit Ada, frame 1/i })).toBeInTheDocument()
    expect(localStorage.getItem('lane-ten:v1')).toContain('[[8,2]')
  })

  it('supports adding players and changing modes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /add player/i }))
    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.type(screen.getByLabelText('Player 2 name'), 'Grace')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    expect(screen.queryByRole('button', { name: 'Enter scores' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Scorecard' })).not.toBeInTheDocument()

    expect(screen.getByRole('table', { name: 'Bowling scorecard' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: /Ada/ })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: /Grace/ })).toBeInTheDocument()
  })

  it('adds a player when Enter is pressed in a name field', async () => {
    const user = userEvent.setup()
    render(<App />)

    const firstPlayer = screen.getByLabelText('Player 1 name')
    await user.type(firstPlayer, 'Ada')
    await user.keyboard('{Enter}')

    expect(screen.getByLabelText('Player 2 name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Ada')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Who's bowling?" })).toBeInTheDocument()
  })

  it('offers a rematch with the previous lineup', async () => {
    const user = userEvent.setup()
    const rendered = render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    for (let roll = 0; roll < 20; roll += 1) {
      await user.click(screen.getByRole('button', { name: /miss/i }))
    }
    await user.click(screen.getByRole('button', { name: /start another/i }))

    expect(screen.getByLabelText('Player 1 name')).toHaveValue('')
    await user.click(screen.getByRole('button', { name: /rematch/i }))
    expect(screen.getByDisplayValue('Ada')).toBeInTheDocument()
    rendered.unmount()
    render(<App />)
    expect(screen.getByLabelText('Player 1 name')).toHaveValue('')
    await user.click(screen.getByRole('button', { name: /rematch/i }))
    expect(screen.getByDisplayValue('Ada')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument()
  })

  it('confirms and removes an abandoned game', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    await user.click(screen.getByRole('button', { name: /abandon game/i }))

    expect(window.confirm).toHaveBeenCalledWith('Abandon this game? All scores will be permanently erased.')
    expect(screen.getByRole('heading', { name: "Who's bowling?" })).toBeInTheDocument()
    expect(localStorage.getItem('lane-ten:v1')).toContain('"activeGame":null')
    vi.restoreAllMocks()
  })

  it('keeps the game when abandoning is cancelled', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    await user.click(screen.getByRole('button', { name: /strike/i }))
    await user.click(screen.getByRole('button', { name: /abandon game/i }))

    expect(screen.getByText('Now bowling')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument()
    expect(localStorage.getItem('lane-ten:v1')).toContain('"activeGame"')
    vi.restoreAllMocks()
  })

  it('uses the logo to return home without abandoning an active game', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    await user.click(screen.getByRole('button', { name: /spare me home/i }))
    expect(screen.getByRole('heading', { name: 'Back to bowling' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resume game/i })).toBeInTheDocument()
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('0', { selector: 'strong' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /resume game/i }))
    await user.click(screen.getByRole('button', { name: /strike/i }))
    await user.click(screen.getByRole('button', { name: /spare me home/i }))
    expect(screen.getByRole('button', { name: /resume game/i })).toBeInTheDocument()
    expect(localStorage.getItem('lane-ten:v1')).toContain('"activeGame"')
  })

  it('returns home from a completed game without abandoning its saved score', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    for (let roll = 0; roll < 20; roll += 1) {
      await user.click(screen.getByRole('button', { name: /miss/i }))
    }

    expect(screen.queryByText(/high game/i)).not.toBeInTheDocument()

    const confirm = vi.spyOn(window, 'confirm')
    await user.click(screen.getByRole('button', { name: /spare me home/i }))

    expect(confirm).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: "Who's bowling?" })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ada/ })).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('toggles and persists the theme outside active score entry', async () => {
    const user = userEvent.setup()
    const rendered = render(<App />)

    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /spare me home/i }).closest('.app-shell')).toHaveAttribute('data-theme', 'dark')

    await user.click(screen.getByRole('button', { name: /switch to light mode/i }))
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /spare me home/i }).closest('.app-shell')).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem('lane-ten:v1')).toContain('"theme":"light"')

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    expect(screen.queryByRole('button', { name: /switch to light mode/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /spare me home/i }))
    rendered.unmount()
    render(<App />)
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument()
  })

  it('opens the about page from the footer and returns home', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('© 2026 Spare Me. All rights reserved.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /source code/i })).toHaveAttribute('href', 'https://github.com/blackmichael/spareme')
    await user.click(screen.getByRole('link', { name: 'About' }))
    expect(screen.getByRole('heading', { name: /a better way to keep score/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/about')
    expect(document.title).toBe('About | spare me')

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: "Who's bowling?" })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('preserves an active game while browsing about', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    window.history.pushState({}, '', '/about')
    fireEvent(window, new PopStateEvent('popstate'))

    expect(screen.getByRole('heading', { name: /a better way to keep score/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Now bowling')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument()
  })

  it('restores an active game after the app is reloaded', async () => {
    const user = userEvent.setup()
    const rendered = render(<App />)

    await user.type(screen.getByLabelText('Player 1 name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /start bowling/i }))
    await user.click(screen.getByRole('button', { name: /strike/i }))
    rendered.unmount()
    render(<App />)

    expect(screen.getByText('Now bowling')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument()
    expect(screen.getByText('Frame 2', { exact: false })).toBeInTheDocument()
  })
})
