import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nav from '../Nav'

// Mock useAuth
const mockLogout = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    logout: mockLogout,
    login: vi.fn(),
    signup: vi.fn(),
    loginWithGoogle: vi.fn(),
  })),
}))

import { useAuth } from '../../hooks/useAuth'

describe('Nav component', () => {
  it('renders logo with link to home and skip-to-content link', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )

    const skipLink = screen.getByText(/skip to main content/i)
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')

    const logo = screen.getByLabelText(/sift home/i)
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('href', '/')
  })

  it('renders step dots when step prop is provided', () => {
    render(
      <MemoryRouter>
        <Nav step={2} />
      </MemoryRouter>
    )

    const step1 = screen.getByLabelText(/step 1 \(complete\)/i)
    const step2 = screen.getByLabelText(/step 2 \(current\)/i)
    const step3 = screen.getByLabelText(/step 3/i)

    expect(step1).toBeInTheDocument()
    expect(step2).toBeInTheDocument()
    expect(step3).toBeInTheDocument()
  })

  it('renders login and signup buttons when unauthenticated', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /analyse/i })).toBeInTheDocument()
  })

  it('renders user badge and sign out button when authenticated', () => {
    vi.mocked(useAuth).mockReturnValueOnce({
      user: { uid: 'u1', email: 'test@example.com', displayName: 'Jane Freelancer' } as any,
      loading: false,
      authError: null,
      setAuthError: vi.fn(),
      logout: mockLogout,
      login: vi.fn(),
      signup: vi.fn(),
      loginWithGoogle: vi.fn(),
    } as any)

    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )

    expect(screen.getByText('Jane Freelancer')).toBeInTheDocument()
    const signOutBtn = screen.getByRole('button', { name: /sign out/i })
    expect(signOutBtn).toBeInTheDocument()

    fireEvent.click(signOutBtn)
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('opens auth modal when clicking log in', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )

    const loginBtn = screen.getByRole('button', { name: /log in/i })
    fireEvent.click(loginBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/sign in to sift/i)).toBeInTheDocument()
  })
})
