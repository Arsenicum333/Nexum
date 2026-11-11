import vine from '@vinejs/vine'

export const createChannelValidator = vine.create({
  name: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(40)
    .regex(/^[a-z0-9-]+$/),
  type: vine.enum(['PUBLIC', 'PRIVATE']),
})

export const inviteChannelMemberValidator = vine.create({
  username: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(40)
    .regex(/^[a-zA-Z0-9_]+$/),
})

export const joinChannelValidator = vine.create({
  name: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(40)
    .regex(/^[a-z0-9-]+$/),
  type: vine.enum(['PUBLIC', 'PRIVATE']).optional(),
})

export const createMessageValidator = vine.create({
  content: vine.string().trim().minLength(1).maxLength(4000),
})
