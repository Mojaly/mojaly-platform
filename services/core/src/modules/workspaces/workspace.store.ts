import type { Workspace, WorkspaceKybSubmission } from './workspace.types.js'

const workspaces = new Map<string, Workspace>()
const kybSubmissions = new Map<string, WorkspaceKybSubmission>()

export function saveWorkspace(workspace: Workspace): Workspace {
  workspaces.set(workspace.id, workspace)
  return workspace
}

export function getWorkspaceById(id: string): Workspace | undefined {
  return workspaces.get(id)
}

export function listWorkspaces(): Workspace[] {
  return [...workspaces.values()]
}

export function saveKybSubmission(
  submission: WorkspaceKybSubmission
): WorkspaceKybSubmission {
  kybSubmissions.set(submission.workspaceId, submission)
  return submission
}

export function getKybSubmission(
  workspaceId: string
): WorkspaceKybSubmission | undefined {
  return kybSubmissions.get(workspaceId)
}
