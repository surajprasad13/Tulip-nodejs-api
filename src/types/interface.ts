export interface UserData {
	user_id: number
	stripe_user_id: string
	email: string
	active: number
	otp: string
	last_login: Date
	ip_address: string
	date_created: Date
	password_hash: string
	email_verified: number
}

enum Sex {
	M = "M",
	F = "F",
	O = "O",
}

export enum SpaceName {
	DoctorProfile = "doctor-profile",
	UserProfile = "tulip-user-profile",
	TulipRemedies = "tulip-remedies",
	TulipRootCauseInsights = "tulip-root-cause-insights",
	TulipNoCdn = "tulip-nocdn",
	TulipUserData = "tulip-user-data",
}

export enum ACL {
	public = "public-read",
	private = "private",
}

export enum BucketNames {
	UserProfile = "tulip-user-profile",
	DoctorProfile = "doctor-profile",
	TulipRemedies = "tulip-remedies",
	TulipRootCauseInsights = "tulip-root-cause-insights",
	TulipNoCdn = "tulip-nocdn",
	TulipUserData = "tulip-user-data",
}

export interface UserProfile {
	user_profile_id: number
	user_id: number
	email?: string
	phone_code?: string
	first_name?: string
	last_name?: string
	dob?: Date
	sex?: Sex
	phone?: number
	address_line1?: string
	address_line2?: string
	address_city?: string
	address_zip?: string
	address_state?: string
	address_country?: string
	timezone?: string
	communication_preference?: string
	profile_image: string
	isLabUser: boolean
}

interface AnswerData {
	data: string
	next: string
	type: string
	choices: Array<{ name: string; value: string; next: string }>
}

export interface UserAnswer {
	id: number
	user_id: number
	time: Date
	data: AnswerData
}

export interface Question {
	group_id: number
	id_question: number
	id_tree: number
	type: string
	question: string
	options: JSON
}

export interface Stripe {
	id: string
	group_id: number
	name: string
	price: string
	priceLabel: string
	description: string
	image: string
	url: string
	start_date: string
	end_date: string
	coupon_code: string
	type: string
}

export interface FirebaseUser {
	email?: string
	displayName?: string
}

// Payment interface

export enum PaymentStatus {
	active = "active",
	past_due = "past_due",
	unpaid = "unpaid",
	canceled = "canceled",
	incomplete = "incomplete",
	incomplete_expired = "incomplete_expired",
	trialing = "trialing",
	all = "all",
	ended = "ended",
}
