/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [controllers.Workspaces, 'index'])
        router.post('', [controllers.Workspaces, 'store'])
      })
      .prefix('workspaces')
      .as('workspaces')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('channels', [controllers.Channels, 'index'])
        router.post('channels', [controllers.Channels, 'store'])
        router.post('channels/join', [controllers.Channels, 'joinPublic'])
        router.get('channels/:id/members', [controllers.Channels, 'members'])
        router.post('channels/:id/leave', [controllers.Channels, 'leave'])
        router.delete('channels/:id', [controllers.Channels, 'destroy'])
        router.post('channels/:id/invitations', [
          controllers.Channels,
          'invite'
        ])
        router.post('channels/:id/revocations', [
          controllers.Channels,
          'revoke'
        ])
        router.post('channels/:id/kicks', [controllers.Channels, 'kick'])
        router.post('channels/:id/invitations/accept', [
          controllers.Channels,
          'acceptInvitation'
        ])
        router.post('channels/:id/invitations/decline', [
          controllers.Channels,
          'declineInvitation'
        ])
        router.get('channels/:id/messages', [controllers.Channels, 'messages'])
        router.post('channels/:id/messages', [
          controllers.Channels,
          'sendMessage'
        ])
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
