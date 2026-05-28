import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ensure stripe secret is present in .env
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    // let event;
    // try {
    //   event = stripe.webhooks.constructEvent(body, sig, endpointSecret!);
    // } catch (err: any) {
    //   return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    // }

    // Mocking the event parsing for the scaffold
    const event = JSON.parse(body);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Find company by customer ID
        const tenant = await prisma.tenantSubscription.findUnique({
          where: { stripe_customer_id: subscription.customer }
        });

        if (tenant) {
            await prisma.tenantSubscription.update({
                where: { id: tenant.id },
                data: {
                    stripe_subscription_id: subscription.id,
                    status: subscription.status,
                    current_period_end: new Date(subscription.current_period_end * 1000)
                }
            });
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Mark subscription as canceled
        await prisma.tenantSubscription.updateMany({
            where: { stripe_subscription_id: subscription.id },
            data: { status: 'canceled' }
        });
        break;
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
