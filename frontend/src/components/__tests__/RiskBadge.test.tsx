import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RiskBadge from '../RiskBadge'

describe('RiskBadge component', () => {
  it('renders high risk badge with vector icon, label, and role="status"', () => {
    const { container } = render(<RiskBadge severity="high" />)
    const badge = screen.getByRole('status')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('High risk')
    expect(badge).toHaveClass('severity-high')
    expect(badge).toHaveAttribute('aria-label', 'High risk')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders medium risk badge correctly', () => {
    const { container } = render(<RiskBadge severity="medium" />)
    const badge = screen.getByRole('status')
    expect(badge).toHaveTextContent('Medium risk')
    expect(badge).toHaveClass('severity-medium')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders low risk badge correctly', () => {
    const { container } = render(<RiskBadge severity="low" />)
    const badge = screen.getByRole('status')
    expect(badge).toHaveTextContent('Low risk')
    expect(badge).toHaveClass('severity-low')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders info risk badge correctly', () => {
    const { container } = render(<RiskBadge severity="info" />)
    const badge = screen.getByRole('status')
    expect(badge).toHaveTextContent('Info')
    expect(badge).toHaveClass('severity-info')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
