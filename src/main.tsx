import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import Clarity from '@microsoft/clarity'
import './index.css'
import '@fontsource/geist-mono/index.css'
import '@fontsource-variable/fraunces/index.css'
import App from './App.tsx'

Clarity.init('vvfysno6g7')

posthog.init('phc_LxLdZ202oT4cxWm9i2Vc32d8reEGzPxexALdl6uwQPj', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'always',
    autocapture: false,
    capture_pageview: true,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
