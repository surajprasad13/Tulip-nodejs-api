import { PaymentStatus } from "./payment"

export enum Sex {
	M = "M",
	F = "F",
	O = "O",
}

export enum SurveyStatus {
	NOTSTARTED = "NOT-STARTED",
	INCOMPLETE = "INCOMPLETE",
	COMPLETED = "COMPLETED",
}

export interface User {
	user_id: number
	stripe_user_id: string | null
	email: string
	password_hash: string | null
	active: number
	last_login: Date
	date_created: Date
	email_verified: number | null
	user_type: string
	user_survey_status: SurveyStatus
	lead_id: number | null
	otp: number | null
}

export interface UserOrder {
	id: number
	product_id: string
	user_id: number
	amount: number
	stripeId: string
	url: string | null
	subscription: string | null
	start_date: Date
	end_date: Date
	status: PaymentStatus
	createdAt: Date
	updatedAt: Date
}

export interface UserProfile {
	user_profile_id: number
	user_id: number
	first_name: string | null
	last_name: string | null
	sex: Sex | null
	dob: string | null
	phone?: string | null
	address_line1?: string | null
	address_line2?: string | null
	address_city?: string | null
	address_zip?: string | null
	address_state?: string | null
	address_country?: string
	communication_preference?: string | null
	timezone?: string | null
	device_tokens?: string | null
	data?: any | null
	profile_image?: string | null
	time: Date
}

export interface SubscriptionUser {
	id: number
	email: string
	user_id: number
	lead_id: number
	active: boolean
	createdAt: Date
	updatedAt: Date
}
