import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const purchase_id = searchParams.get('purchase_id')
  const action = searchParams.get('action')

  if (!purchase_id || !action) {
    return new NextResponse(`<h1>Error</h1><p>Missing parameters</p>`, { headers: { 'Content-Type': 'text/html' } })
  }

  try {
    const { data: purchase, error: pError } = await supabase
      .from('video_purchases')
      .select('*, videos(title)')
      .eq('id', purchase_id)
      .single()

    if (pError || !purchase) {
      return new NextResponse(`<h1>Error</h1><p>Purchase not found</p>`, { headers: { 'Content-Type': 'text/html' } })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const { error: updateError } = await supabase
      .from('video_purchases')
      .update({ 
        status: newStatus,
        approved_at: action === 'approve' ? new Date().toISOString() : null 
      })
      .eq('id', purchase_id)

    if (updateError) throw updateError

    // Create notification
    await supabase.from('notifications').insert({
      user_id: purchase.user_id,
      type: action === 'approve' ? 'payment_approved' : 'payment_rejected',
      title: action === 'approve' ? 'Video Purchased!' : 'Purchase Rejected',
      message: action === 'approve' 
        ? `Your purchase of "${purchase.videos.title}" has been approved. Enjoy!`
        : `Your purchase of "${purchase.videos.title}" was rejected. Please contact support.`,
      link: `/watch/${purchase.video_id}`
    })

    const emoji = action === 'approve' ? '✅' : '❌'
    const title = action === 'approve' ? 'Purchase Approved' : 'Purchase Rejected'
    const color = action === 'approve' ? '#22c55e' : '#ef4444'

    return new NextResponse(
      `<html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; text-align: center; background: #0a0a0a; color: white; }
            h1 { color: ${color}; font-size: 32px; }
            .card { background: #1a1a1a; padding: 20px; border-radius: 12px; border: 1px solid #333; max-width: 400px; margin: 20px auto; text-align: left; }
            .label { color: #888; font-size: 12px; margin-top: 10px; }
            .value { font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>${emoji} ${title}</h1>
          <div class="card">
            <div class="label">Video</div><div class="value">${purchase.videos.title}</div>
            <div class="label">User ID</div><div class="value">${purchase.user_id}</div>
            <div class="label">Method</div><div class="value">${purchase.payment_method}</div>
            <div class="label">Amount</div><div class="value">$${purchase.amount}</div>
          </div>
          <p>You can close this window now.</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )

  } catch (error: any) {
    return new NextResponse(`<h1>Error</h1><p>${error.message}</p>`, { headers: { 'Content-Type': 'text/html' } })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
