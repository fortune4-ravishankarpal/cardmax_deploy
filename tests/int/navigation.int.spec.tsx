import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Navbar } from '@/app/(frontend)/components/Navbar'
import { Footer } from '@/app/(frontend)/components/Footer'

// Mock next/navigation
let currentPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

describe('Navbar Component', () => {
  beforeEach(() => {
    currentPathname = '/'
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders brand title and desktop navigation links for guest user', () => {
    render(<Navbar initialUser={null} />)

    // Brand logo
    expect(screen.getByLabelText('CardMax Home')).toBeDefined()
    expect(screen.getByText('Card')).toBeDefined()
    expect(screen.getByText('Max')).toBeDefined()

    // Navigation links
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Wallet')).toBeDefined()
    expect(screen.getByText('Max Pro')).toBeDefined()
    expect(screen.getByText('Profile')).toBeDefined()

    // Guest sign in button
    expect(screen.getByText('Sign In')).toBeDefined()
  })

  it('renders user profile trigger and opens dropdown for free user', () => {
    const freeUser = {
      id: 'user-1',
      email: 'alex@example.com',
      name: 'Alex Johnson',
      isPro: false,
    }

    render(<Navbar initialUser={freeUser} />)

    // User profile trigger button
    const profileTrigger = screen.getByLabelText('User Profile Menu')
    expect(profileTrigger).toBeDefined()
    expect(screen.getByText('Alex Johnson')).toBeDefined()
    expect(screen.getByText('Free Tier')).toBeDefined()

    // Open dropdown
    fireEvent.click(profileTrigger)

    // Assert dropdown content
    expect(screen.getByText('alex@example.com')).toBeDefined()
    expect(screen.getByText('Free Member')).toBeDefined()
    expect(screen.getByText('My Cards & Wallet')).toBeDefined()
    expect(screen.getByText('Consent & Privacy')).toBeDefined()
    expect(screen.getByText('Sign Out')).toBeDefined()
  })

  it('renders PRO badge for Max Pro subscriber', () => {
    const proUser = {
      id: 'user-2',
      email: 'pro@example.com',
      name: 'Sarah Pro',
      isPro: true,
    }

    render(<Navbar initialUser={proUser} />)

    const profileTrigger = screen.getByLabelText('User Profile Menu')
    expect(screen.getAllByText('Max Pro').length).toBeGreaterThanOrEqual(2)

    // Open dropdown
    fireEvent.click(profileTrigger)

    expect(screen.getByText('Max Pro Subscriber')).toBeDefined()
    expect(screen.getByText('Max Pro Perks')).toBeDefined()
  })

  it('hides completely on login and onboarding routes', () => {
    currentPathname = '/login'
    const { container: loginContainer } = render(<Navbar initialUser={null} />)
    expect(loginContainer.firstChild).toBeNull()

    currentPathname = '/consent-onboarding'
    const { container: consentContainer } = render(<Navbar initialUser={null} />)
    expect(consentContainer.firstChild).toBeNull()

    currentPathname = '/logout'
    const { container: logoutContainer } = render(<Navbar initialUser={null} />)
    expect(logoutContainer.firstChild).toBeNull()
  })

  it('toggles mobile drawer when hamburger button is clicked', () => {
    render(<Navbar initialUser={null} />)

    const hamburgerBtn = screen.getByLabelText('Toggle navigation menu')
    expect(hamburgerBtn).toBeDefined()

    // Initially mobile drawer is not rendered
    expect(screen.queryByLabelText('Mobile Navigation')).toBeNull()

    // Click hamburger button
    fireEvent.click(hamburgerBtn)

    // Mobile drawer should now be visible
    expect(screen.getByLabelText('Mobile Navigation')).toBeDefined()
    expect(screen.getByText('Sign In to CardMax')).toBeDefined()
  })
})

describe('Footer Component', () => {
  beforeEach(() => {
    currentPathname = '/'
  })

  it('renders brand statement, security disclaimer, and policy links', () => {
    render(<Footer />)

    // Brand statement
    expect(screen.getByText(/smart credit card optimization platform/i)).toBeDefined()

    // Security disclaimer
    expect(screen.getByText('Bank-Grade Security')).toBeDefined()
    expect(screen.getByText(/ISO\/IEC 27001-aligned architecture/i)).toBeDefined()

    // Legal and policy links
    expect(screen.getByText('Terms & Conditions')).toBeDefined()
    expect(screen.getByText('Privacy Policy')).toBeDefined()
    expect(screen.getByText('Consent Settings')).toBeDefined()

    // System operational badge
    expect(screen.getByText('Systems Operational')).toBeDefined()
  })

  it('hides completely on login route', () => {
    currentPathname = '/login'
    const { container } = render(<Footer />)
    expect(container.firstChild).toBeNull()
  })
})
