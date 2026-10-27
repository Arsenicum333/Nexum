import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.string('first_name', 40).notNullable()
      table.string('last_name', 40).notNullable()
      table.string('display_name', 40).notNullable()
      table.string('username', 40).notNullable().unique()
      table.string('email', 255).notNullable().unique()
      table.string('password_hash', 255).notNullable()
      table.string('status', 16).notNullable().defaultTo('OFFLINE')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      "ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('ONLINE', 'DND', 'OFFLINE'))"
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
