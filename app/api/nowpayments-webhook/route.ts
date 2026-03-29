import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const WEBHOOKS = {
  approved: "https://discord.com/api/webhooks/1484066303345033256/KiHU4zD3Tg2AuqN1TNIRkxtqpc3W3-xgFvqPebJyEiFrpqVl1CRpXvoLRXMiJ_gR329J",
  pending: "https://discord.com/api/webhooks/1484066385192812696/HHaYckSnC5cnb6-sHxguaEnDgVAYudm_DdGUyLLMjAiXJcdWat_QZg75HsQLL_Z-boHe",
  rejected: "https://discord.com/api/webhooks/1484066459943440464/sj8F2QK9CGXCLCRhJ5npdnNdnMXk01NFAuH-abM_1HZytfADy2hBovnq5oD-WedNwAF9"
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    const {
      payment_status,
      order_id,
      price_amount,
      actually_paid,
      pay_currency,
      payment_id
    } = payload

    console.log('NOWPayments webhook received:', payload)

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, profiles(*)')
      .eq('id', order_id)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found:', order_id)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    let webhookUrl = ""
    let embedColor = 0xFFA500
    let embedTitle = "⏳ Crypto Payment Pending"
    
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      webhookUrl = WEBHOOKS.approved
      embedColor = 0x00FF00
      embedTitle = "✅ Crypto Payment Confirmed"
      
      await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          payment_data: { 
            ...payment.payment_data,
            nowpayments_id: payment_id,
            pay_currency,
            actually_paid
          }
        })
        .eq('id', order_id)

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + payment.duration_days)

      await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString()
        })
        .eq('id', payment.user_id)

    } else if (payment_status === 'failed' || payment_status === 'expired') {
      webhookUrl = WEBHOOKS.rejected
      embedColor = 0xFF0000
      embedTitle = "❌ Crypto Payment Failed"
      
      await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', order_id)
    } else {
      webhookUrl = WEBHOOKS.pending
    }

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: embedTitle,
            color: embedColor,
            fields: [
              { name: "User", value: payment.profiles?.username || "Unknown", inline: true },
              { name: "Plan", value: payment.plan_name, inline: true },
              { name: "Amount", value: `$${payment.amount}`, inline: true },
              { name: "Status", value: payment_status, inline: true },
              { name: "Currency", value: pay_currency?.toUpperCase() || "N/A", inline: true },
              { name: "Paid", value: `${actually_paid || 0}`, inline: true },
              { name: "Payment ID", value: payment_id || "N/A", inline: false },
            ],
            timestamp: new Date().toISOString(),
          }]
        })
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
