import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import './style.css'
import * as Sentry from '@sentry/electron/renderer'

Sentry.init({
  dsn: "https://d6ce3613be4249e82f6d9ed3f74dd98b@o4510990022344704.ingest.us.sentry.io/4510990029553664",
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// Expose Andb and stores for E2E testing
if (process.env.NODE_ENV === 'test' || (window as any).PLAYWRIGHT_TEST) {
  import('@/utils/andb').then(({ Andb }) => {
    (window as any).Andb = Andb
  })
}

app.mount('#app')
