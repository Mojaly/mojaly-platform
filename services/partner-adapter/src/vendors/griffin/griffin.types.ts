export interface GriffinPayeeResponse {
  'payee-url': string
  'payee-status'?: string
  [key: string]: unknown
}

export interface GriffinPaymentResponse {
  'payment-url': string
  'latest-submission-url'?: string
  [key: string]: unknown
}

export interface GriffinSubmissionResponse {
  'payment-submission-url'?: string
  'submission-status'?: string
  [key: string]: unknown
}