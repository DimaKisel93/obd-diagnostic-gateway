import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import History from '../views/History.vue'
import Sessions from '../views/Sessions.vue'
import Settings from '../views/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
  },
  {
    path: '/history',
    name: 'history',
    component: History,
  },
  {
    path: '/sessions',
    name: 'sessions',
    component: Sessions,
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router