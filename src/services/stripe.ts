import Stripe from "stripe"
import config from "../config"

const redirectURL = config.STRIPE_REDIRECT_URL ?? null;

export const stripe = new Stripe(
	config.STRIPE_API_KEY,
	{
		apiVersion: "2020-08-27",
	}
)

const createCustomer = async (data: any) => {
	const user = await stripe.customers.create(data)
	return user
}

const createPaymentMethod = async (items: any, stripeUserId?: string, mode?: string, user_id?: number) => {
	let session: any
	if (mode == "subscription") {
		session = await stripe.checkout.sessions.create({
			mode,
			line_items: items,
			subscription_data: {
				metadata: {
					user_id,
				},
			},
			customer: stripeUserId,
			success_url: `${redirectURL}/users/payment?session_id={CHECKOUT_SESSION_ID}&payment_status=success`,
			cancel_url: `${redirectURL}/users/payment?session_id={CHECKOUT_SESSION_ID}&payment_status=fail`,
		} as any)
	} else {
		session = await stripe.checkout.sessions.create({
			mode,
			line_items: items,
			customer: stripeUserId,
			payment_intent_data: {
				metadata: {
					user_id: user_id,
				},
			},
			success_url: `${redirectURL}/users/payment?session_id={CHECKOUT_SESSION_ID}&payment_status=success`,
			cancel_url: `${redirectURL}/users/payment?session_id={CHECKOUT_SESSION_ID}&payment_status=fail`,
		} as any)
	}

	return session
}

const createPortalSession = async (session_id: string) => {
	const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)

	const returnUrl = `${redirectURL}/`

	const portalSession = await stripe.billingPortal.sessions.create({
		customer: checkoutSession.customer as string,
		return_url: returnUrl,
	})

	return portalSession.url
}

const checkoutSession = async (sessionId: string) => {
	const session = await stripe.checkout.sessions.retrieve(sessionId)
	return session
}

const generatePaymentIntent = async ({ amount, user, payment_method }: any) => {
	const resPaymentIntent = await stripe.paymentIntents.create({
		amount: parseFloat(amount) * 100,
		currency: "USD",
		payment_method_types: ["card"],
		payment_method,
		description: `Minitulip payment for user --> ${user}`,
	})

	return resPaymentIntent
}

const confirmPaymentIntent = async (id: any, token: any) => {
	const paymentIntent = await stripe.paymentIntents.confirm(id, { payment_method: token })
	return paymentIntent
}

const generatePaymentMethod = async (token: any) => {
	const paymentMethod = await stripe.paymentMethods.create({
		type: "card",
		card: { token },
	})

	return paymentMethod
}

export const getPaymentDetail = async (id: any) => {
	const detailOrder = await stripe.paymentIntents.retrieve(id)
	return detailOrder
}

const fetchPlans = async () => {
	const plans = await stripe.products.list({ limit: 10 })
	return plans
}

const fetchCoupons = async () => {
	const coupon = await stripe.coupons.list({ limit: 10 })
	return coupon
}

const fetchCouponDetail = async (id: string) => {
	const coupon = await stripe.coupons.retrieve(id)
	return coupon
}

const fetchPriceDetail = async (id: string) => {
	const price = await stripe.prices.retrieve(id)
	return price
}

export const fetchSubcription = async (customer: string) => {
	const subscription = await stripe.subscriptions.list({ customer, limit: 10 })
	return subscription
}

export const cancelSubscription = async (id: string) => {
	const subscription = await stripe.subscriptions.del(id)
	return subscription
}

const fetAllSubscription = async (limit?: number) => {
	const subscription = await stripe.subscriptions.list({ limit })
	return subscription
}

const fetchAllBalance = async (limit?: number) => {
	const balance = await stripe.balanceTransactions.list({ limit })
	return balance
}

const fetchAllCustomer = async (limit?: number) => {
	const customer = await stripe.customers.list({ limit })
	return customer
}

const fetchAllPayments = async (limit?: number) => {
	const payment = await stripe.balanceTransactions.list({ limit })
	return payment
}

const fetchBilling = async (customer: string) => {
	const billing = await stripe.billingPortal.sessions.create({
		customer,
		return_url: `${redirectURL}/`,
	})
	return billing
}

export {
	createCustomer,
	createPaymentMethod,
	createPortalSession,
	generatePaymentMethod,
	generatePaymentIntent,
	confirmPaymentIntent,
	fetAllSubscription,
	fetchAllBalance,
	fetchAllCustomer,
	fetchCouponDetail,
	fetchPriceDetail,
	fetchPlans,
	fetchCoupons,
	checkoutSession,
	fetchAllPayments,
	fetchBilling,
}
