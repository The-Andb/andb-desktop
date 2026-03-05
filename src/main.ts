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

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
