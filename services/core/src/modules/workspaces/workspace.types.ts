export type WorkspaceStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'

export type KybStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export type Workspace = {
  id: string
  businessName: string
  businessType: string
  country: string
  ownerEmail: string
  status: WorkspaceStatus
  kybStatus: KybStatus
  createdAt: string
  updatedAt: string
  tradingName?: string
  approvedAt?: string
  rejectedAt?: string
  suspendedAt?: string
  rejectionReason?: string
}

export type CreateWorkspaceInput = {
  businessName: string
  businessType: string
  country: string
  ownerEmail: string
  tradingName?: string | undefined
}

export type SubmitKybInput = {
  registrationNumber: string
  taxId?: string | undefined
  registeredAddress: string
  operatingCountries: string[]
  website?: string | undefined
  contactName: string
  contactEmail: string
}

export type WorkspaceKybSubmission = SubmitKybInput & {
  workspaceId: string
  submittedAt: string
}
