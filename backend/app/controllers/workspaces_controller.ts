import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { createWorkspaceValidator } from '#validators/workspace'

export default class WorkspacesController {
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const workspaces = await db
      .from('workspaces')
      .join(
        'workspace_members',
        'workspace_members.workspace_id',
        'workspaces.id'
      )
      .where('workspace_members.user_id', String(user.id))
      .select(
        'workspaces.id',
        'workspaces.name',
        'workspaces.owner_id as ownerId'
      )
      .orderBy('workspaces.name')

    return serialize(
      workspaces.map(workspace => ({
        id: String(workspace.id),
        name: workspace.name,
        ownerId: String(workspace.ownerId)
      }))
    )
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name } = await request.validateUsing(createWorkspaceValidator)

    try {
      const workspace = await db.transaction(async trx => {
        const [createdWorkspace] = await trx
          .insertQuery()
          .table('workspaces')
          .insert({ name, owner_id: String(user.id) })
          .returning(['id', 'name', 'owner_id as ownerId'])

        await trx
          .insertQuery()
          .table('workspace_members')
          .insert({
            workspace_id: createdWorkspace.id,
            user_id: String(user.id),
            role: 'OWNER'
          })

        return createdWorkspace
      })

      return response.created(
        await serialize({
          id: String(workspace.id),
          name: workspace.name,
          ownerId: String(workspace.ownerId)
        })
      )
    } catch (error) {
      if ((error as { code?: string } | null)?.code === '23505') {
        return response.conflict({
          message: 'A workspace with this name already exists'
        })
      }
      throw error
    }
  }
}
