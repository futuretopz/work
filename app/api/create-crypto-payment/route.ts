import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_id, crypto_currency } = body

    console.log('Creating crypto payment for:', payment_id, crypto_currency)

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Call NOWPayments API
    const nowPaymentsResponse = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
      },
      body: JSON.stringify({
        price_amount: payment.amount,
        price_currency: 'usd',
        pay_currency: crypto_currency,
        order_id: payment_id,
        order_description: `${payment.plan_name} - ${payment.duration_days} days`,
        ipn_callback_url: `${request.nextUrl.origin}/api/nowpayments-webhook`,
      })
    })

    const responseText = await nowPaymentsResponse.text()
    console.log('NOWPayments response status:', nowPaymentsResponse.status)
    console.log('NOWPayments response:', responseText)

    if (!nowPaymentsResponse.ok) {
      return NextResponse.json(
        { error: `NOWPayments error: ${responseText}` },
        { status: nowPaymentsResponse.status }
      )
    }

    const nowPaymentsData = JSON.parse(responseText)

    if (!nowPaymentsData.pay_address) {
      return NextResponse.json(
        { error: 'No payment address received from NOWPayments' },
        { status: 500 }
      )
    }

    // Update payment with NOWPayments data
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        payment_data: {
          provider: 'nowpayments',
          currency: crypto_currency,
          payment_id: nowPaymentsData.payment_id,
          payment_status: nowPaymentsData.payment_status,
          pay_address: nowPaymentsData.pay_address,
          pay_amount: nowPaymentsData.pay_amount,
          pay_currency: nowPaymentsData.pay_currency,
          created_at: nowPaymentsData.created_at,
          expiration_estimate_date: nowPaymentsData.expiration_estimate_date,
        }
      })
      .eq('id', payment_id)

    if (updateError) {
      console.error('Failed to update payment:', updateError)
      return NextResponse.json(
        { error: 'Failed to save payment details' },
        { status: 500 }
      )
    }

    // Send Discord webhook
    const webhookUrl = process.env.NEXT_PUBLIC_CRYPTO_WEBHOOK_PENDING
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '🔶 Crypto Payment Created',
            color: 0xFFA500,
            fields: [
              { name: 'Payment ID', value: payment_id, inline: true },
              { name: 'Plan', value: payment.plan_name, inline: true },
              { name: 'Amount', value: `$${payment.amount}`, inline: true },
              { name: 'Crypto', value: crypto_currency.toUpperCase(), inline: true },
              { name: 'Pay Amount', value: `${nowPaymentsData.pay_amount} ${crypto_currency.toUpperCase()}`, inline: true },
              { name: 'Address', value: `\`${nowPaymentsData.pay_address}\``, inline: false },
            ],
            timestamp: new Date().toISOString(),
          }]
        })
      }).catch(err => console.error('Discord webhook error:', err))
    }

    return NextResponse.json({
      success: true,
      payment_data: nowPaymentsData
    })

  } catch (error: any) {
    console.error('Create crypto payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
