import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'

import routes from './routes.js'
import { authApi } from '@/services/authApi'
import { userStore } from '@/store/userStore'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  })

  Router.beforeEach(async to => {
    const isAuthRoute = to.path.startsWith('/auth/')

    if (!authApi.hasSession()) {
      userStore.clear()
      return isAuthRoute
        ? true
        : { path: '/auth/login', query: { redirect: to.fullPath } }
    }

    if (isAuthRoute) return { path: '/chat/general' }
    if (!userStore.authenticated) {
      try {
        userStore.update(await authApi.profile())
        userStore.setAuthenticated(true)
      } catch {
        userStore.clear()
        return { path: '/auth/login', query: { redirect: to.fullPath } }
      }
    }

    return true
  })

  Router.afterEach(to => {
    if (
      typeof window !== 'undefined' &&
      !to.path.startsWith('/auth/') &&
      to.path !== '/'
    ) {
      localStorage.setItem('nexum:last-route', to.fullPath)
    }
  })

  return Router
})
