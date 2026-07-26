import axios from 'axios'
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
) {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status ?? 502
    const responseBody = error.response?.data

    return reply.code(statusCode).send(
      responseBody ?? {
        error: {
          code: 'UPSTREAM_ERROR',
          message: error.message
        }
      }
    )
  }

  return reply.code(error.statusCode ?? 500).send({
    error: {
      code: error.code ?? 'INTERNAL_SERVER_ERROR',
      message: error.message
    }
  })
}
