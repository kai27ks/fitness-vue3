import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import './styles/admin.css'
import './styles/moments.css'

createApp(App).use(router).mount('#app')
