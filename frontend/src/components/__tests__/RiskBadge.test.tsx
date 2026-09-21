import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RiskBadge from '../RiskBadge'

describe('RiskBadge component', () => {
  it('renders high risk badge with icon, label, and role="status"', () => {
    render(<RiskBadge severity="high" />)
    const badge = screen.getByRole('status')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('High risk')
    expect(badge).toHaveTextContent('🔴')
    expect(badge).toHaveClass('severity-high')
    expect(badge).toHaveAttribute('aria-label', 'High risk')
  })

  it('renders medium risk badge correctly', () => {
    render(<RiskBadge severity="medium" />)
    const badge = screen.getByRole('status')
    expect(badge).toHaveTextContent('Medium risk')
    expect(badge).toHaveTextContent('🟡')
    expect(badge).toHaveClass('severity-medium')
  })

  it('renders low risk badge correctly', () => {
    render(<RiskBadge severity="low" />)
    const badge = screen.getByRole('status')
    expect(badge).toHaveTextContent('Low risk')
    expect(badge).toHaveTextContent('🟢')
    expect(badge).toHaveClass('severity-low')
  })

  it('renders info risk badge correctly', () => {
    render(<RiskBadge severity="info" />)
    const badge = screen.getByRole('status')
    expect(badge).toHaveTextContent('Info')
    expect(badge).toHaveTextContent('ℹ️')
    expect(badge).toHaveClass('severity-info')
  })
})
