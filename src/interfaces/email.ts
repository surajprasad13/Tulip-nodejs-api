export interface Email {
	from: string
	to: string
	text: string
	subject: string
	html: string
}

export enum EmailCondition {
	Welcome = "welcome",
	Welcome_Free = "welcome_free",
	CompletedPyamentFail = "payment_fail",
	FiveDayleft = "five_day_left",
	TwoDayLeft = "twentyeight_day_left",
	PlanExpire = "plan_expire",
	Invoice = 'invoice',
	DidnTryPayment = "didnt_try_payment",
	Otp = "otp",
	AdvisorChat = "advisor_chat",
	RecommendedTreatment = "recommended_treatment"
}

export enum WeeklyCondition {
	FiveDay = "five_day",
	EightDay = "eight_day",
	FourteenDay = "fourteen_day",
	TwentyOneDay = "twenty_one_day",
	TwentyEightDay = "twenty_eight_day",
}

export interface SubscriptionEmail {
	id: number
	title: string
	subject: string
	html: string
	createdAt: Date
	updatedAt: Date
}
