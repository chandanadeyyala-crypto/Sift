import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from '../NotFound'

describe('NotFound page', () => {
  it('renders 404 message and accessible home link', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    )

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/page not found/i)

    const homeLink = screen.getByRole('link', { name: /back to home/i })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/')
  })
})
