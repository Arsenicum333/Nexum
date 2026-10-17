const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: () => {
          if (typeof window === 'undefined') return '/chat/general'
          return localStorage.getItem('nexum:last-route') || '/chat/general'
        }
      },
      { path: 'chat/:channelName', component: () => import('@/pages/ChatPage.vue') },
      {
        path: 'account/edit',
        component: () => import('@/pages/AccountSettingsPage.vue')
      }
    ]
  },

  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: 'login', component: () => import('@/pages/LoginPage.vue') },
      { path: 'register', component: () => import('@/pages/RegisterPage.vue') }
    ]
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue')
  }
]

export default routes
