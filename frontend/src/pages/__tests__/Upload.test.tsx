import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Upload from '../Upload'

vi.mock('../../lib/api', () => ({
  uploadContract: vi.fn().mockResolvedValue({ sessionId: 'test-session-123' }),
}))

describe('Upload page', () => {
  it('renders accessible main container and heading', () => {
    render(
      <MemoryRouter>
        <Upload />
      </MemoryRouter>
    )

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/upload your contract/i)
  })

  it('renders upload dropzone with keyboard accessibility and progress indicator', () => {
    render(
      <MemoryRouter>
        <Upload />
      </MemoryRouter>
    )

    const dropzone = screen.getByRole('button', { name: /click or drag to upload/i })
    expect(dropzone).toBeInTheDocument()
    expect(dropzone).toHaveAttribute('tabIndex', '0')

    const progressBar = screen.getByLabelText(/progress: step 1 of 3/i)
    expect(progressBar).toBeInTheDocument()
  })

  it('shows error when an unsupported file type is provided', () => {
    render(
      <MemoryRouter>
        <Upload />
      </MemoryRouter>
    )

    const input = document.getElementById('contract-file-input') as HTMLInputElement
    const file = new File(['console.log("bad")'], 'script.exe', { type: 'application/x-msdownload' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByText(/please upload a pdf, image/i)).toBeInTheDocument()
  })
})
