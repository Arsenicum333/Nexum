import db from '@adonisjs/lucid/services/db'
import User from '#models/user'

const seedUsers = [
  {
    firstName: 'Demo',
    lastName: 'User',
    username: 'demo',
    email: 'demo@example.com',
    password: 'password123'
  },
  {
    firstName: 'Alex',
    lastName: 'Morgan',
    username: 'alex',
    email: 'alex@example.com',
    password: 'password123'
  },
  {
    firstName: 'Mariya',
    lastName: 'Stone',
    username: 'mariya',
    email: 'mariya@example.com',
    password: 'password123'
  }
]

const seedChannels = [
  { name: 'general', type: 'PUBLIC' as const },
  { name: 'random', type: 'PUBLIC' as const },
  { name: 'developers', type: 'PRIVATE' as const }
]

export default class DatabaseSeeder {
  async run() {
    const users = new Map<string, User>()
    for (const data of seedUsers) {
      let user = await User.findBy('username', data.username)
      if (!user) {
        user = await User.create({
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: `${data.firstName} ${data.lastName}`,
          username: data.username,
          email: data.email,
          passwordHash: data.password
        })
      }
      users.set(data.username, user)
    }

    const owner = users.get('demo')!
    const alex = users.get('alex')!
    const mariya = users.get('mariya')!

    let workspace = await db.from('workspaces').where('name', 'Nexum').first()
    if (!workspace) {
      const [createdWorkspace] = await db
        .insertQuery()
        .table('workspaces')
        .insert({ name: 'Nexum', owner_id: owner.id })
        .returning(['id', 'name'])
      workspace = createdWorkspace
    }

    for (const user of [owner, alex, mariya]) {
      await db
        .insertQuery()
        .table('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: String(user.id) === String(owner.id) ? 'OWNER' : 'MEMBER'
        })
        .onConflict(['workspace_id', 'user_id'])
        .ignore()
    }

    await db
      .from('channels')
      .whereNull('workspace_id')
      .update({ workspace_id: workspace.id })

    for (const data of seedChannels) {
      let channel = await db
        .from('channels')
        .where('name', data.name)
        .whereNull('deleted_at')
        .first()
      if (!channel) {
        const [createdChannel] = await db
          .insertQuery()
          .table('channels')
          .insert({
            name: data.name,
            channel_type: data.type,
            workspace_id: workspace.id,
            owner_id: owner.id,
            last_activity_at: new Date()
          })
          .returning(['id', 'name'])
        channel = createdChannel
      } else if (!channel.workspace_id) {
        await db
          .from('channels')
          .where('id', channel.id)
          .update({ workspace_id: workspace.id })
        channel.workspace_id = workspace.id
      }

      const members =
        data.name === 'developers' ? [owner, mariya] : [owner, alex, mariya]
      for (const user of members) {
        await db
          .insertQuery()
          .table('channel_members')
          .insert({
            channel_id: channel.id,
            user_id: user.id,
            role: String(user.id) === String(owner.id) ? 'OWNER' : 'MEMBER',
            membership_status: 'ACTIVE',
            joined_at: new Date()
          })
          .onConflict(['channel_id', 'user_id'])
          .merge({ membership_status: 'ACTIVE', left_at: null })
      }

      const messages =
        data.name === 'general'
          ? [
              { author: owner, content: 'Welcome to Nexum! @alex say hello.' },
              {
                author: alex,
                content: 'Hi everyone, the database seed is working.'
              },
              {
                author: mariya,
                content: 'The channel is ready for development.'
              }
            ]
          : data.name === 'random'
            ? [{ author: alex, content: 'Random thoughts belong here.' }]
            : [
                {
                  author: mariya,
                  content: 'Private developer channel is ready.'
                }
              ]

      for (const message of messages) {
        const existingMessage = await db
          .from('messages')
          .where('channel_id', channel.id)
          .where('author_id', String(message.author.id))
          .where('content', message.content)
          .first()
        if (existingMessage) continue

        const [createdMessage] = await db
          .insertQuery()
          .table('messages')
          .insert({
            channel_id: channel.id,
            author_id: message.author.id,
            content: message.content,
            created_at: new Date()
          })
          .returning(['id'])

        const mentionedUsername = message.content.match(/@([a-zA-Z0-9_]+)/)?.[1]
        if (mentionedUsername) {
          const mentionedUser = users.get(mentionedUsername.toLowerCase())
          if (mentionedUser) {
            await db
              .insertQuery()
              .table('message_mentions')
              .insert({
                message_id: createdMessage.id,
                mentioned_user_id: mentionedUser.id
              })
              .onConflict(['message_id', 'mentioned_user_id'])
              .ignore()
          }
        }
      }
    }
  }
}
