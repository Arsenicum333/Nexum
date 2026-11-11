import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('CREATE UNIQUE INDEX users_username_lower_unique ON users (LOWER(username))')
  }

  async down() {
    this.schema.raw('DROP INDEX users_username_lower_unique')
  }
}
