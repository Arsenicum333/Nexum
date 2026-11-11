import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('workspaces', table => {
      table.bigIncrements('id')
      table.string('name', 40).notNullable().unique()
      table
        .bigInteger('owner_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE workspaces ADD CONSTRAINT workspaces_name_check CHECK (length(trim(name)) > 0)'
    )

    this.schema.createTable('workspace_members', table => {
      table.bigIncrements('id')
      table
        .bigInteger('workspace_id')
        .notNullable()
        .references('id')
        .inTable('workspaces')
        .onDelete('CASCADE')
      table
        .bigInteger('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('role', 16).notNullable().defaultTo('MEMBER')
      table.timestamp('joined_at').notNullable().defaultTo(this.now())
      table.unique(['workspace_id', 'user_id'])
    })

    this.schema.raw(
      "ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_role_check CHECK (role IN ('OWNER', 'MEMBER'))"
    )

    this.schema.alterTable('channels', table => {
      table
        .bigInteger('workspace_id')
        .nullable()
        .references('id')
        .inTable('workspaces')
        .onDelete('CASCADE')
      table.index(['workspace_id'])
    })
  }

  async down() {
    this.schema.alterTable('channels', table => {
      table.dropIndex(['workspace_id'])
      table.dropColumn('workspace_id')
    })
    this.schema.dropTable('workspace_members')
    this.schema.dropTable('workspaces')
  }
}
