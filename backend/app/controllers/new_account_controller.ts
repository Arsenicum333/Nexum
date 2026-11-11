import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import db from '@adonisjs/lucid/services/db'

export default class NewAccountController {
  async store({ request, response, serialize }: HttpContext) {
    const { firstName, lastName, username, email, password } =
      await request.validateUsing(signupValidator)

    const existingUsername = await db
      .from('users')
      .whereRaw('LOWER(username) = LOWER(?)', [username])
      .first()
    if (existingUsername) {
      return response.conflict({ message: 'A user with this username already exists' })
    }

    let user: User
    try {
      user = await User.create({
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        username,
        email,
        passwordHash: password,
      })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        return response.conflict({
          message: 'A user with this username or email already exists',
        })
      }
      throw error
    }

    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
