export interface SafaricomTokenResponse {
  access_token: string
  expires_in: string
}

export interface SafaricomB2cResponse {
  ConversationID?: string
  OriginatorConversationID?: string
  ResponseCode?: string
  ResponseDescription?: string
  errorCode?: string
  errorMessage?: string
  [key: string]: unknown
}

export interface SafaricomResultParameter {
  Key: string
  Value: string | number
}

export interface SafaricomB2cResult {
  ResultType?: number
  ResultCode: number
  ResultDesc: string
  OriginatorConversationID?: string
  ConversationID?: string
  TransactionID?: string
  ResultParameters?: {
    ResultParameter?: SafaricomResultParameter[]
  }
  ReferenceData?: {
    ReferenceItem?: SafaricomResultParameter[]
  }
}

export interface SafaricomB2cCallback {
  Result: SafaricomB2cResult
}

export interface SafaricomTransactionStatusResponse {
  ResponseCode?: string
  ResponseDescription?: string
  ConversationID?: string
  OriginatorConversationID?: string
  ResultCode?: string
  ResultDesc?: string
  errorCode?: string
  errorMessage?: string
  [key: string]: unknown
}
