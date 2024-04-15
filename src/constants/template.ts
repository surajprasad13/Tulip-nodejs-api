import { EmailCondition, WeeklyCondition } from "../interfaces/email"

const emailTemplate = [
	{
		type: EmailCondition.Welcome,
		subject: "Welcome to Tulip {{name}}!",
		html: "351ndgwroqr4zqx8"
	},
	{
		type: EmailCondition.Welcome_Free,
		subject: "Welcome to Tulip {{name}}!",
		html: "7dnvo4dmy1645r86"
	},
	{
		type: EmailCondition.CompletedPyamentFail,
		subject: "We have got an offer for your health",
		html: "{{name}}, you have shown interest and completed the Tulip survey. However you have not taken the plan.If you are interested, we have offer for you, <a href=`https://meettulip.com`>Click Here</a>",
	},
	{
		type: EmailCondition.FiveDayleft,
		subject: "Just Five Days left for you Fabulous Health",
		html: "{{name}} you have 5 days left on your 30 days of support - would you like to continue support for $9 a month",
	},
	{
		type: EmailCondition.TwoDayLeft,
		subject: "Just Two Days left for you Fabulous Health",
		html: "{{name}} you have 2 days left on your 30 days of support - would you like to continue support for $9 a month",
	},
	{
		type: EmailCondition.PlanExpire,
		subject: "Plan Expired ! ⚠️",
		html: "{{name}} your Tulip support has expired, to review anytime,",
	},
	{
		type: EmailCondition.Invoice,
		subject: "Thanks for Your Payment!",
		html: "neqvygmn5d540p7w"
	},
	{
		type: EmailCondition.DidnTryPayment,
		subject: "Tulip Reminder: Better Health Can Start Today!",
		html: "yzkq34028q6gd796",
	},
	{
		type: EmailCondition.Otp,
		subject: "Tulip Forgot Password Request",
		html: "pr9084zko584w63d",
	},
	{
		type: EmailCondition.AdvisorChat,
		subject: "Tulip Chat Notification: A Message from Your Tulip Wellness Advisor!",
		html: "vywj2lpo1e147oqz",
	},
	{
		type: EmailCondition.RecommendedTreatment,
		subject: "Tulip Notification: You got a recommended treatment!",
		html: "z86org89md14ew13",
	},
]

const weeklyTemplate = [
	{
		type: WeeklyCondition.FiveDay,
		subject: "Plan update on five day",
		html: "Hi {{name}}, have you started your sleep wellness plan ?<br> <a href=`https://meettulip.com`>click here to update</a>",
	},
	{
		type: WeeklyCondition.EightDay,
		subject: "Plan update on eight day",
		html: "Hi {{name}}, have you started your sleep wellness plan?<br> <a href=`https://meettulip.com`>click here to update</a>",
	},
	{
		type: WeeklyCondition.FourteenDay,
		subject: "Plan update on week 2",
		html: "Hi {{name}}, we're just checking in to see how you're doing with your wellness plan. Have you been able to start taking [supplement 1], [supplement 2], [supplement 3], and [supplement 4] ? <br> <a href=`https://meettulip.com`>click here to update</a>",
	},
	{
		type: WeeklyCondition.TwentyOneDay,
		subject: "Plan update on week 3",
		html: "Hi {{name}}, we're just checking in to see how you're doing with your wellness plan. Have you been able to start taking [supplement 1], [supplement 2], [supplement 3], and [supplement 4] ? <br> <a href=`https://meettulip.com`>click here to update</a>",
	},
	{
		type: WeeklyCondition.TwentyEightDay,
		subject: "Plan update on week 4",
		html: "Overall, have you noticed any improvements in your sleep since you began your wellness program ? <br> <a href=`https://meettulip.com`>click here to update</a>",
	},
]

export { emailTemplate, weeklyTemplate }
