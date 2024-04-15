export enum PaymentStatus {
	success = "success",
	fail = "fail",
	wait = "wait",
	paid = "paid",
	unpaid = "unpaid",
	no_payment_required = "no_payment_required",
	canceled = "canceled",
}

export interface Plans {
	id: string
	group_id: number
	name: string
	price: string
	priceLabel: string
	description: string
	image: string
	start_date: Date | null
	end_date: Date | null
	coupon_code: string[]
	type: string
	url: string | null
}
