import express, { Router } from "express"
import { UserOrdersModel } from "../models"
import {} from "stripe"

const router = Router()

router.post("/", express.json({ type: "application/json" }), async (request, response) => {
	const event = request.body

	// Handle the event
	switch (event.type) {
		case "payment_intent.succeeded":
			const paymentIntent = event.data.object
			// Then define and call a method to handle the successful payment intent.
			// handlePaymentIntentSucceeded(paymentIntent);
			// const order = await UserOrdersModel.upsert(
			// 	{
			// 		user_id: paymentIntent.metadata.user_id,
			// 		amount: paymentIntent.amount_total,
			// 		stripeId: paymentIntent.id,
			// 		status: paymentIntent.status,
			// 		locator: paymentIntent.customer,
			// 		subscription: paymentIntent.subscription,
			// 		product_id: paymentIntent.query.product_id,
			// 		start_date: new Date(paymentIntent.created * 1000),
			// 		end_date: new Date(subscription.data[0].current_period_end * 1000),
			// 	},
			// 	{ where: paymentIntent.metadata.user_id }
			// )
			// console.log(order)
			//console.log(JSON.stringify(paymentIntent))
			break
		case "payment_method.attached":
			const paymentMethod = event.data.object
			// Then define and call a method to handle the successful attachment of a PaymentMethod.
			// handlePaymentMethodAttached(paymentMethod);
			break
		// ... handle other event types
		default:
		//console.log(`Unhandled event type ${event.type}`)
	}

	// Return a response to acknowledge receipt of the event
	response.json({ received: true })
})

export default router
