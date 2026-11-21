import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settings'
import './assets/main.css'

const pinia = createPinia()
const app = createApp(App).use(pinia).use(router)

useSettingsStore(pinia) // applies the saved theme before the first screen shows

app.mount('#app')
