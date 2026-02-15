import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './components/ui/button'

describe('Button Component', () => {
  it('renders correctly with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
