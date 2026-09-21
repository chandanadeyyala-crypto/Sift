import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FlowingLeaf from '../FlowingLeaf'

describe('FlowingLeaf component', () => {
  it('renders the flowing leaf container with title', () => {
    render(<FlowingLeaf />)
    const element = screen.getByTitle(/Sift.*Fresh contract clarity/i)
    expect(element).toBeInTheDocument()
    expect(element).toHaveClass('flowing-leaf-container')
  })

  it('renders the leaf SVG icon inside', () => {
    const { container } = render(<FlowingLeaf />)
    const svg = container.querySelector('svg.flowing-leaf-icon')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })
})
