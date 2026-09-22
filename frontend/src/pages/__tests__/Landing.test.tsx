import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Landing from '../Landing'

describe('Landing page', () => {
  it('renders main landmark, hero heading, and primary CTA', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(main).toHaveAttribute('id', 'main-content')

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/before you sign/i)

    const ctaLinks = screen.getAllByRole('link', { name: /analyse a contract/i })
    expect(ctaLinks.length).toBeGreaterThan(0)
  })

  it('renders value proposition cards and sample report link', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )

    expect(screen.getAllByText(/plain-language breakdown/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/obligations map/i)).toBeInTheDocument()
    expect(screen.getByText(/what's missing/i)).toBeInTheDocument()
  })
})
