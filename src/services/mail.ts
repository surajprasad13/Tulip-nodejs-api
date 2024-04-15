import nodemailer from "nodemailer"

let transporter = nodemailer.createTransport({
	host: "smtp.mailersend.net",
	port: 587,
	auth: {
		user: "MS_qvFybx@meettulip.com",
		pass: "2HcgTUxwnBWe3Mrg",
	},
})

export default transporter
