import posthog from 'posthog-js'

export function usePostHog() {
  if (import.meta.env.DEV) {
    return { posthog: { identify: () => {}, capture: () => {} } as any }
  }

  posthog.init('phc_89YQtquUpUpaWuDxTb1uxJditPpumWPM5vVdLNoP3BI', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-01-30' as any
  })

  return { posthog }
}
