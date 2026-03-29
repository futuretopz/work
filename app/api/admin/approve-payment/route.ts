import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const payment_id = searchParams.get('payment_id')
  const action = searchParams.get('action')

  if (!payment_id || !action) {
    return new NextResponse(
      `<html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1>❌ Error</h1>
        <p>Missing payment_id or action</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  try {
    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Error</h1>
          <p>Payment not found</p>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', payment_id)

    if (updateError) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>❌ Error</h1>
          <p>Failed to update payment</p>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // If approved, update user premium status
    if (action === 'approve') {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + payment.duration_days)

      console.log('Updating premium for user:', payment.user_id)
      console.log('Expires at:', expiresAt.toISOString())

      const { error: premiumError } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString()
        })
        .eq('id', payment.user_id)

      if (premiumError) {
        console.error('Failed to update premium:', premiumError)
      } else {
        console.log('Premium updated successfully')
      }

      // Create notification for approved payment
      await createNotification(
        payment.user_id,
        'payment_approved',
        'Payment Approved!',
        `Your ${payment.plan_name} payment of $${payment.amount} has been approved. Premium access activated!`,
        '/subscriptions'
      )
    } else {
      // Create notification for rejected payment
      await createNotification(
        payment.user_id,
        'payment_rejected',
        'Payment Rejected',
        `Your ${payment.plan_name} payment of $${payment.amount} was rejected. Please contact support or try again.`,
        '/support'
      )
    }

    // Send webhook notification
    const webhookUrl = payment.payment_method === 'giftcard'
      ? (action === 'approve' ? process.env.NEXT_PUBLIC_GIFTCARD_WEBHOOK_APPROVED : process.env.NEXT_PUBLIC_GIFTCARD_WEBHOOK_REJECTED)
      : payment.payment_method === 'cashapp'
      ? (action === 'approve' ? process.env.NEXT_PUBLIC_CASHAPP_WEBHOOK_APPROVED : process.env.NEXT_PUBLIC_CASHAPP_WEBHOOK_REJECTED)
      : null

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: action === 'approve' ? '✅ Payment Approved' : '❌ Payment Rejected',
            color: action === 'approve' ? 0x00FF00 : 0xFF0000,
            fields: [
              { name: 'Payment ID', value: payment_id, inline: true },
              { name: 'Plan', value: payment.plan_name, inline: true },
              { name: 'Amount', value: `$${payment.amount}`, inline: true },
              { name: 'User ID', value: payment.user_id, inline: false },
            ],
            timestamp: new Date().toISOString(),
          }]
        })
      })
    }

    const emoji = action === 'approve' ? '✅' : '❌'
    const title = action === 'approve' ? 'Payment Approved' : 'Payment Rejected'
    const color = action === 'approve' ? '#00FF00' : '#FF0000'

    return new NextResponse(
      `<html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              text-align: center;
              background: #0a0a0a;
              color: white;
            }
            h1 { color: ${color}; font-size: 48px; margin-bottom: 20px; }
            p { font-size: 18px; color: #888; }
            .details { 
              background: #1a1a1a; 
              border: 1px solid #333; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px auto; 
              max-width: 500px;
              text-align: left;
            }
            .details div { 
              padding: 8px 0; 
              border-bottom: 1px solid #333; 
            }
            .details div:last-child { border-bottom: none; }
            .label { color: #888; font-size: 14px; }
            .value { color: white; font-size: 16px; font-weight: 500; }
          </style>
        </head>
        <body>
          <h1>${emoji} ${title}</h1>
          <p>Payment has been ${action === 'approve' ? 'approved' : 'rejected'} successfully</p>
          <div class="details">
            <div>
              <div class="label">Payment ID</div>
              <div class="value">${payment_id}</div>
            </div>
            <div>
              <div class="label">Plan</div>
              <div class="value">${payment.plan_name}</div>
            </div>
            <div>
              <div class="label">Amount</div>
              <div class="value">$${payment.amount}</div>
            </div>
            <div>
              <div class="label">Duration</div>
              <div class="value">${payment.duration_days} days</div>
            </div>
          </div>
          <p style="margin-top: 30px; font-size: 14px;">You can close this window now</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )

  } catch (error: any) {
    return new NextResponse(
      `<html><body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1>❌ Error</h1>
        <p>${error.message || 'Internal server error'}</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
