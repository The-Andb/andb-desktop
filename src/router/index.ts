import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import SplashScreen from '@/views/SplashScreen.vue'

const routes = [
  {
    path: '/splash',
    name: 'Splash',
    component: SplashScreen
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/schema',
    name: 'Schema',
    component: () => import('@/views/Schema.vue')
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('@/views/Compare.vue')
  },
  {
    path: '/instant-compare',
    name: 'InstantCompare',
    component: () => import('@/views/compare/InstantCompareView.vue')
  },
  {
    path: '/compare/resolve/:sessionId?',
    name: 'SchemaResolve',
    component: () => import('@/views/compare/ResolveView.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue')
  },
  {
    path: '/project-settings',
    name: 'ProjectSettings',
    component: () => import('@/views/ProjectSettings.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/History.vue')
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('@/views/Projects.vue')
  },
  {
    path: '/integrations',
    name: 'Integrations',
    component: () => import('@/views/Integrations.vue')
  },
  {
    path: '/pulse',
    name: 'Pulse',
    component: () => import('@/views/Pulse.vue')
  },
  {
    path: '/beta',
    name: 'BetaRegistration',
    component: () => import('@/views/BetaRegistration.vue')
  }
]

import { usePostHog } from '@/composables/usePostHog'

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const { posthog } = usePostHog()
import { useProjectsStore } from '@/stores/projects'
import { useSettingsStore } from '@/stores/settings'

router.beforeEach(async (to, _from, next) => {
  const settingsStore = useSettingsStore()
  if (!settingsStore.settings.setupCompleted && to.path !== '/splash') {
    return next({ path: '/splash' })
  }
  if (settingsStore.settings.setupCompleted && !settingsStore.settings.betaRegistered && to.path !== '/beta') {
    return next({ path: '/beta' })
  }

  const publicPaths = ['/splash', '/beta', '/projects', '/settings', '/project-settings', '/integrations']
  if (publicPaths.includes(to.path)) {
    return next()
  }

  const projectsStore = useProjectsStore()

  if (!projectsStore.isLoaded) {
    await projectsStore.reloadData()
  }

  if (projectsStore.projects.length === 0) {
    return next({ path: '/projects' })
  }

  const currentProj = projectsStore.currentProject
  if (currentProj && (!currentProj.connectionIds || currentProj.connectionIds.length === 0)) {
    return next({
      path: '/project-settings',
      query: { cat: 'connections', no_connections: 'true' }
    })
  }

  next()
})

router.afterEach(to => {
  posthog.capture('$pageview', {
    $current_url: to.fullPath
  })
})

export default router
