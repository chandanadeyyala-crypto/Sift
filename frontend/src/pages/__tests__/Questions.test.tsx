import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Questions from '../Questions'

vi.mock('../../lib/api', () => ({
  submitAnswers: vi.fn().mockResolvedValue({}),
}))

describe('Questions page', () => {
  it('renders progressbar, step indicator, and first question heading', () => {
    render(
      <MemoryRouter initialEntries={['/questions/sess-123']}>
        <Routes>
          <Route path="/questions/:sessionId" element={<Questions />} />
        </Routes>
      </MemoryRouter>
    )

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H1')

    const stepLabel = screen.getByLabelText(/progress: step 2 of 3/i)
    expect(stepLabel).toBeInTheDocument()
  })

  it('selects an option and enables the next button', () => {
    render(
      <MemoryRouter initialEntries={['/questions/sess-123']}>
        <Routes>
          <Route path="/questions/:sessionId" element={<Questions />} />
        </Routes>
      </MemoryRouter>
    )

    const nextBtn = screen.getByRole('button', { name: /next/i })
    expect(nextBtn).toBeDisabled()

    // Find radio option and click
    const radioInputs = screen.getAllByRole('radio')
    expect(radioInputs.length).toBeGreaterThan(0)
    fireEvent.click(radioInputs[0])

    expect(nextBtn).toBeEnabled()
  })
})
