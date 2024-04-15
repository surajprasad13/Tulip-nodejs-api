import { Email, EmailCondition, WeeklyCondition } from "../interfaces/email"
import transporter from "../services/mail"
import mustache from "mustache"
import { emailTemplate, weeklyTemplate } from "../constants/template"
import axios from "axios"
import hbs from "nodemailer-express-handlebars"
import { getUserId } from "../utils/getUserId"
import { getUserProfile } from "../utils/getUserProfile"

const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNzU4OGNkM2YzNTQ5NjcxOGQ1MmI3NWZhZWI5NDU1MTZhNTk2MDI1ZWJlZDljMThmOWNkMWRlNDY0OWU3NjkzOGVkZDk4MmNjZjkzNDAyNTciLCJpYXQiOjE2NzQ1NTcxNjIuNTE4Mjc1LCJuYmYiOjE2NzQ1NTcxNjIuNTE4Mjc4LCJleHAiOjQ4MzAyMzA3NjIuNTE0NDYyLCJzdWIiOiI1MjMwOSIsInNjb3BlcyI6WyJlbWFpbF9mdWxsIiwiZG9tYWluc19mdWxsIiwiYWN0aXZpdHlfZnVsbCIsImFuYWx5dGljc19mdWxsIiwidG9rZW5zX2Z1bGwiLCJ3ZWJob29rc19mdWxsIiwidGVtcGxhdGVzX2Z1bGwiLCJzdXBwcmVzc2lvbnNfZnVsbCIsInNtc19mdWxsIiwiZW1haWxfdmVyaWZpY2F0aW9uX2Z1bGwiLCJpbmJvdW5kc19mdWxsIiwicmVjaXBpZW50c19mdWxsIiwic2VuZGVyX2lkZW50aXR5X2Z1bGwiXX0.aq1Z23oA0xXTSpfcQCorluAymURiJGbTrZ69a3Usl4vwF8CCT1XfMe4OWFHcBh-pASMQv6uTHvh_0M5exbQJODcFgX8TtG5l8VYKLC6FrxcUgAooiMMhkH4ta8wQDXKxd4a3EyUl8Mzd0IRo6OI3s9lyWYmhAq4vUJmOnSfwb64gftFgwqbaL5JWQ329fEaYPTdmXy-t-NmkpaFzPhci4uc1E-vhf6SaFXClT-7B9Cd_QTVYI71LmB5svIRKlfOP6YDKoEyfsKIvjE6nRov8kpRRMBws2ydfEqqE4jnPjp_kKNaRTRXWhAoqmzrdFfd8BYLHM9ldyC7x24SGN4leiUDl9BGcCkUrGTHebZVELK3qZ9xJHwgB20kg3EBhdWkmT3y-8fy00-ViaLx0zt6MLmWVohvVBqkyAz5bXpoXUUNXmOfrunuYHNU8B0V0JolOvNmsN0Psuw48pH3YTqIRIaONCN1eQYDdTEHNu7uMV7CZeOe5_qev9rvlQnRjSVMBN5eHfGDaq4hWNvYWWxX6eRRg6rDLpedl5UkXjI17-nNFC0gnMUe6Q9G45vRMG8UYqG5bt3HkinHHMHky1xTU16RFNaTDwwo35qP0zqJy6g20OgTmGjQeRMYUBIaotcKBZwLcCVA4_cr-R4rQIG51qGd3I4ExNf7pyk57Hj2SH6M"

function sendEmailNotification(name: string, email: string, type: EmailCondition | WeeklyCondition) {

	const data = weeklyTemplate.filter((item) => item.type == type)[0]

	var mailOptions: Email = {
		from: "noreply@meettulip.com",
		to: email,
		text: "From Tulip",
		subject: data.subject,
		html: mustache.render(data.html, { name }),
	}

	transporter.sendMail(mailOptions, (error, info) => {
		console.log(error, "Email error")
		console.log(info, "email")
	})
}

function sendSubscriptionEmail(email: string, html: string) {
	var mailOptions: Email = {
		from: "noreply@meettulip.com",
		to: email,
		text: "From Tulip",
		subject: "Tulip subscription email",
		html: html,
	}

	console.log("Sending email")
	transporter.sendMail(mailOptions, (error, info) => {
		console.log(error, "Email error")
		console.log(info, "email")
	})
}

function sendEmail(name: string, email: string, type: EmailCondition) {

	const data = emailTemplate.filter((item) => item.type == type)[0]
	
	var mailOptions: Email = {
		from: "noreply@meettulip.com",
		to: email,
		text: "From Tulip",
		subject: data.subject,
		html: mustache.render(data.html, { name }),
	}
	// console.log(mailOptions)
	transporter.sendMail(mailOptions, (error, info) => {
		// console.log(error, "Email error")
		// console.log(info, "email")
	})
}

async function sendAPIEmail(mails: any[], type: EmailCondition) {
	const data = emailTemplate.filter((item) => item.type == type)[0]
	let url: string
	let content: any[] = []
	let final
	const emails = await mails.reduce(async (acc: any, el: any) => {
		const user_id = await getUserId(el.email)
		const profile = await getUserProfile(user_id)
		acc.push({...el,first_name:profile?.first_name})
		return acc
	}, [])
	emails.forEach((item: any) => {
		let personalization: any[] = []
		if(type == 'welcome' || type == 'didnt_try_payment' || type == 'welcome_free') {
			personalization = [{
				"email": item.email,
				"data": {
					"name": item.first_name??item.email.substring(0, item.email.indexOf('@')),
				}
			}]
		} else if(type == 'invoice') {
			personalization = [{
				"email": item.email,
				"data": {
					"amount": item.amount,
					"start_date": item.start_date
				}
			}]
		} else if(type == 'otp') {
			personalization = [{
				"email": item.email,
				"data": {
					"name": item.first_name,
					"otp": item.otp
				}
			}]
		} else if(type == 'advisor_chat') {
			personalization = [{
				"email": item.email,
				"data": {
					"name": item.name
				}
			}]
		} else if(type == 'recommended_treatment') {
			personalization = [{
				"email": item.email,
				"data": {
					"name": item.first_name??item.email.substring(0, item.email.indexOf('@')),
					"health_tip_title": item.health_tip_title,
					"health_tip_description": item.health_tip_description
				}
			}]
		}
		content.push({
			"from": {
				"email": "noreply@meettulip.com",
				"name": "Tulip Health"
			},
			"to": [
				{
					"email": item.email
				}
			],
			"subject": data.subject,
			"personalization": personalization,
			"template_id": data.html
		})
	})
	if(mails.length > 1) {
		url = "https://api.mailersend.com/v1/bulk-email"
		final = content
	} else {
		url = "https://api.mailersend.com/v1/email"
		final = content[0]
	}
	const config = {
		method: "post",
		url: url,
		headers: {
			Authorization: `Bearer ${token}`,
			accept: "application/json",
			"Content-Type": "application/json"
		},
		data: final,
	}
	try {
		await axios(config).then((response: any) => {
			console.log(response.status)
		})
	} catch (error: any) {
		console.log(error.response.data)
	}

}

export { sendEmailNotification, sendSubscriptionEmail, sendEmail, sendAPIEmail }
