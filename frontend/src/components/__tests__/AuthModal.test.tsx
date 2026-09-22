import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AuthModal from '../AuthModal'

const mockLogin = vi.fn()
const mockSignup = vi.fn()
const mockLoginWithGoogle = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    login: mockLogin,
    signup: mockSignup,
    loginWithGoogle: mockLoginWithGoogle,
  })),
}))

describe('AuthModal component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<AuthModal isOpen={false} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders modal dialog with accessible attributes when isOpen is true', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'auth-modal-title')

    expect(screen.getByRole('heading', { name: /sign in to sift/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(<AuthModal isOpen={true} onClose={handleClose} />)

    const closeBtn = screen.getByLabelText(/close dialog/i)
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn()
    render(<AuthModal isOpen={true} onClose={handleClose} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('renders sign up form elements when initialMode is signup', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="signup" />)

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
  })
})
