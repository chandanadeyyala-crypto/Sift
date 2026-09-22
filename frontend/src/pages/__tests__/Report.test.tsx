import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Report from '../Report'

// Window print mock
window.print = vi.fn()

describe('Report page', () => {
  it('renders sample report with semantic outline and risk cards', async () => {
    render(
      <MemoryRouter initialEntries={['/report/sample']}>
        <Routes>
          <Route path="/report/:sessionId" element={<Report />} />
        </Routes>
      </MemoryRouter>
    )

    // Check main container
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')

    // Check semantic H1
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/contract analysis report/i)

    // Check sample banner
    expect(screen.getByText(/sample report/i)).toBeInTheDocument()

    // Check language options
    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hindi/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /telugu/i })).toBeInTheDocument()
  })
})
