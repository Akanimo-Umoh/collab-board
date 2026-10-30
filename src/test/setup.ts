import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Tells React it runs under a test runner, so updates are wrapped in act().
const reactEnvironment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
reactEnvironment.IS_REACT_ACT_ENVIRONMENT = true

// jsdom does not implement these browser APIs, which the app calls.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
})
