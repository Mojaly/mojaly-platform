import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { RafikiAuthClient } from './rafiki-auth.client.js'

const paramsSchema = z.object({
  interactionId: z.string().min(1),
  nonce: z.string().min(1)
})

const querySchema = z.object({
  interactId: z.string().min(1),
  nonce: z.string().min(1),
  clientName: z.string().optional(),
  clientUri: z.string().optional()
})

const responseSchema = z.object({
  response: z.enum(['accept', 'reject'])
})

const client = new RafikiAuthClient(env)

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function wantsHtml(acceptHeader: unknown): boolean {
  return typeof acceptHeader === 'string' && acceptHeader.includes('text/html')
}

function formatAccess(access: unknown): string {
  if (!Array.isArray(access)) {
    return 'Payment authorization request'
  }

  return access
    .map((item) => {
      const type = typeof item?.type === 'string' ? item.type : 'access'
      const amount = item?.limits?.debitAmount

      if (amount?.value && amount?.assetCode) {
        return `${type}: ${amount.value} ${amount.assetCode}`
      }

      return type
    })
    .join(', ')
}

function renderGrantPage(input: {
  interactionId: string
  nonce: string
  clientName: string | undefined
  clientUri: string | undefined
  grant: unknown
}): string {
  const clientName = input.clientName || 'Client'
  const grantDetails = input.grant as { access?: unknown }
  const grantAccess = formatAccess(grantDetails.access)
  const approveUrl = `/grant-interactions/${input.interactionId}/${input.nonce}`
  const finishUrl = `${env.RAFIKI_AUTH_DOMAIN}/interact/${input.interactionId}/${input.nonce}/finish`

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mojaly Grant Approval</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #f7f7f4; color: #17202a; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      section { width: min(520px, 100%); background: #fff; border: 1px solid #ddd7cc; border-radius: 8px; padding: 28px; box-shadow: 0 12px 40px rgba(0,0,0,.08); }
      h1 { margin: 0 0 12px; font-size: 24px; }
      p { line-height: 1.55; color: #40505f; }
      .meta { margin: 18px 0; padding: 14px; background: #f2f6f6; border-radius: 6px; font-size: 14px; }
      .actions { display: flex; gap: 12px; margin-top: 24px; }
      button { border: 0; border-radius: 6px; padding: 11px 16px; font-weight: 700; cursor: pointer; }
      .accept { background: #f26a21; color: #fff; }
      .reject { background: #e8e8e8; color: #17202a; }
      #status { margin-top: 16px; font-size: 14px; color: #40505f; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Approve Payment Access</h1>
        <p><strong>${escapeHtml(clientName)}</strong> is requesting permission to create an outgoing payment from this wallet.</p>
        <div class="meta">
          <div><strong>Request:</strong> ${escapeHtml(grantAccess)}</div>
          <div><strong>Client URI:</strong> ${escapeHtml(input.clientUri ?? 'Not provided')}</div>
        </div>
        <div class="actions">
          <button class="accept" data-response="accept">Approve</button>
          <button class="reject" data-response="reject">Reject</button>
        </div>
        <div id="status"></div>
      </section>
    </main>
    <script>
      const status = document.getElementById('status')
      const buttons = document.querySelectorAll('button[data-response]')
      buttons.forEach((button) => {
        button.addEventListener('click', async () => {
          const response = button.dataset.response
          buttons.forEach((item) => item.disabled = true)
          status.textContent = response === 'accept' ? 'Approving request...' : 'Rejecting request...'

          const result = await fetch('${approveUrl}', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response })
          })

          if (!result.ok) {
            const body = await result.text()
            status.textContent = 'Could not complete request: ' + body
            buttons.forEach((item) => item.disabled = false)
            return
          }

          window.location.href = '${finishUrl}'
        })
      })
    </script>
  </body>
</html>`
}

export async function grantInteractionRoutes(app: FastifyInstance) {
  app.get('/grant-interactions', async (request, reply: FastifyReply) => {
    const query = querySchema.parse(request.query)
    const grant = await client.getGrantByInteraction(query.interactId, query.nonce)

    if (wantsHtml(request.headers.accept)) {
      reply.type('text/html')
      return renderGrantPage({
        interactionId: query.interactId,
        nonce: query.nonce,
        clientName: query.clientName,
        clientUri: query.clientUri,
        grant
      })
    }

    return {
      data: grant,
      interaction: {
        id: query.interactId,
        nonce: query.nonce,
        clientName: query.clientName,
        clientUri: query.clientUri
      },
      approval: {
        method: 'PATCH',
        url: `/grant-interactions/${query.interactId}/${query.nonce}`,
        body: {
          response: 'accept'
        }
      }
    }
  })

  app.get('/grant-interactions/:interactionId/:nonce', async (request) => {
    const params = paramsSchema.parse(request.params)
    const grant = await client.getGrantByInteraction(
      params.interactionId,
      params.nonce
    )

    return {
      data: grant
    }
  })

  app.patch('/grant-interactions/:interactionId/:nonce', async (request) => {
    const params = paramsSchema.parse(request.params)
    const body = responseSchema.parse(request.body)

    const grant = await client.setInteractionResponse(
      params.interactionId,
      params.nonce,
      body.response
    )

    return {
      data: grant
    }
  })
}


