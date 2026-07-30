import { z } from 'zod'

const resultParameterSchema = z.object({
  Key: z.string(),
  Value: z.union([z.string(), z.number()])
})

export const safaricomB2cCallbackSchema = z.object({
  Result: z.object({
    ResultType: z.number().optional(),
    ResultCode: z.number(),
    ResultDesc: z.string(),
    OriginatorConversationID: z.string().optional(),
    ConversationID: z.string().optional(),
    TransactionID: z.string().optional(),
    ResultParameters: z
      .object({
        ResultParameter: z.array(resultParameterSchema).optional()
      })
      .optional(),
    ReferenceData: z
      .object({
        ReferenceItem: z.array(resultParameterSchema).optional()
      })
      .optional()
  })
})

export type SafaricomB2cCallbackInput = z.infer<
  typeof safaricomB2cCallbackSchema
>
