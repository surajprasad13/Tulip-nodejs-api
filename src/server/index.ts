import express, { Application } from "express"
import cors from "cors"
import swaggerJsDoc from "swagger-jsdoc"
import swaggerUI from "swagger-ui-express"
import { jwtValidate } from "../middlewares/jwt-validate"
import db from "../db"

// routes
import importRoutesStripe from "../routes/stripe"
import importRoutesAuth from "../routes/auth"
import importRoutesChat from "../routes/chat"
import importRoutesRemedy from "../routes/remedy"
import userRoutes from "../routes/user"
import {
	adminUsersRouter,
	firebaseRouter,
	leadRouter,
	wearablesRouter,
	adminPublicImagestRouter,
	webhookRouter
} from "../routes"
import adminAuthRouter from "../routes/admin/auth"
import doctorChatRouter from "../routes/doctor-chat"
import salesRouter from "../routes/sales"
import insightsRouter from "../routes/insights"
import deficiencyRouter from "../routes/deficiency"
import contraindicationsRouter from "../routes/contraindications"
import adminBlogRouter from "../routes/admin/blog"
import adminDataIngestionRouter from "../routes/admin/data_ingestion"
import adminNewsletter from "../routes/admin/newsletter"
import wellnessChatRouter from "../routes/wellness-chat"
import surveyConfigurationRouter from "../routes/admin/survey-configuration"
import blogsRouter from "../routes/blogs"
import researchRouter from "../routes/research"
import testimonialRouter from "../routes/testimonials"
import tongueAnalysisRouter from "../routes/tongue-analysis"
import contentGenerationRouter from "../routes/content-generation"
import teamsRouter from "../routes/teams"
import fitbitRouter from "../routes/fitbit"
import plansRouter from "../routes/plans"
import { contactRouter } from "../routes"
import { adminJwtValidate, ROLES } from "../middlewares/admin-jwt-validate"
import siteDataAssetsRouter from "../routes/admin/site-data-assets"
import knowledgeBase from "../routes/knowledge-base"
import dashboardRouter from "../routes/dashboard"
import mailRouter from "../routes/mail"
import authMailRouter from "../routes/authmail"
import healthTipsRouter from "../routes/health-tips-subscription"
import askExpertQuestionsAnswersRouter from "../routes/ask-expert-questions-answers"
import newsletterSubscriptionRouter from "../routes/newsletter-subscription"
import importRoutesSymptoms from "../routes/symptoms"
import smartInsightRouter from "../routes/smart-insight"
import mastersRouter from "../routes/masters"
import smartChatRouter from "../routes/smart-chat"

class Server {
	app: Application
	private port: string
	private apiPaths = {
		stripe: "/minitulip/stripe",
		auth: "/minitulip/auth",
		chat: "/minitulip/chat",
		remedy: "/minitulip/remedy",
		docs: "/minitulip/api-docs",
		user: "/minitulip/user",
		leads: "/minitulip/leads",
		firebase: "/minitulip/firebase",
		adminAuth: "/minitulip/admin-auth",
		doctorChat: "/minitulip/doctor-chat",
		sales: "/minitulip/sales",
		insights: "/minitulip/insights",
		deficiency: "/minitulip/deficiency",
		adminUsers: "/minitulip/admin/users",
		wearables: "/minitulip/wearables",
		contraindications: "/minitulip/contraindications",
		blogs: "/minitulip/blogs",
		research: "/minitulip/research",
		testimonial: "/minitulip/testimonial",
		tongueAnalysis: "/minitulip/tongue-analysis",
		contentGeneration: "/minitulip/content-generation",
		teams: "/minitulip/teams",
		fitbit: "/minitulip/fitbit",
		plans: "/minitulip/plans",
		contact: "/minitulip/contact",
		adminPublicImages: "/minitulip/admin/public-images",
		adminBlog: "/minitulip/admin/blog",
		adminDataIngestion: "/minitulip/admin/data-ingestion",
		adminNewsletter: "/minitulip/admin/newsletter",
		wellnessChat: "/minitulip/wellness-chat",
		surveyConfiguration: "/minitulip/survey-configuration",
		webhook: "/minitulip/webhook",
		adminSiteDataAssets: "/minitulip/admin/site-data-assets",
		knowledgeBase: "/minitulip/knowledgebase",
		dashboard: "/minitulip/dashboard",		
		mail: "/minitulip/mail",
		authmail: "/minitulip/authmail",
		newsletter: "/minitulip/newsletter",
		healthTips: "/minitulip/health-tips",
		askExpert: "/minitulip/ask-expert",
		symptoms: "/minitulip/symptoms",
		smartInsight: "/minitulip/smart-insight",
		masters: "/minitulip/master",
		smartChat: "/minitulip/smart-chat",
	}
	private swaggerOptions = {
		swaggerDefinition: {
			openapi: "3.0.0",
			info: {
				title: "Minitulip API",
				version: "1.0.0",
				description: "Minitulip API documentation",
			},
		},
		apis: ["dist/src/routes/*.js", "dist/src/routes/admin/*.js"],
	}
	private swaggerDocs: Object

	constructor() {
		this.app = express()
		this.port = process.env.PORT || "8000"
		this.swaggerDocs = swaggerJsDoc(this.swaggerOptions)

		this.dbConnection()

		this.middlewares()

		// Define routes
		this.routes()
	}

	async dbConnection() {
		try {
			await Object.keys(db).forEach((key) => {
				db[key].authenticate()
			})
			//console.log("Databases Online")
		} catch (error: any) {
			throw new Error(error)
		}
	}

	middlewares() {
		// CORS
		this.app.use(cors())

		// Reading
		const maxRequestBodySize = '50mb';

		this.app.use(express.json({limit: maxRequestBodySize}))
		
		this.app.use(express.urlencoded({ extended: true }))

		// Auth Token
		this.app.use("/minitulip/chat/", jwtValidate)
		this.app.use("/minitulip/remedy/", jwtValidate)
		this.app.use("/minitulip/stripe/", jwtValidate)
		this.app.use("/minitulip/user/", jwtValidate)
		// this.app.use("/minitulip/insights/", jwtValidate)
		this.app.use("/minitulip/deficiency/", jwtValidate)
		this.app.use("/minitulip/contraindications/", jwtValidate)
		this.app.use("/minitulip/fitbit/", jwtValidate)
		this.app.use("/minitulip/knowledgebase/", jwtValidate)
		this.app.use("/minitulip/dashboard/", jwtValidate)
		this.app.use("/minitulip/authmail/", jwtValidate)
		this.app.use("/minitulip/admin/public-images", adminJwtValidate([]))
		this.app.use("/minitulip/admin/users", adminJwtValidate([]))
		this.app.use("/minitulip/admin/blog", adminJwtValidate([]))
		this.app.use("/minitulip/admin/data-ingestion", adminJwtValidate([]))
		this.app.use("/minitulip/admin/newsletter", adminJwtValidate([ROLES.ROOT_ADMIN]))
		this.app.use("/minitulip/admin/site-data-assets", adminJwtValidate([]))
		this.app.use("/minitulip/newsletter/", jwtValidate)
		this.app.use("/minitulip/health-tips/", jwtValidate)
		this.app.use("/minitulip/wearables/", jwtValidate)
		this.app.use("/minitulip/wellness-advisor/", jwtValidate)
	}

	routes() {
		this.app.use(this.apiPaths.stripe, importRoutesStripe)
		this.app.use(this.apiPaths.webhook, webhookRouter)
		this.app.use(this.apiPaths.auth, importRoutesAuth)		
		this.app.use(this.apiPaths.chat, importRoutesChat)
		this.app.use(this.apiPaths.remedy, importRoutesRemedy)
		this.app.use(this.apiPaths.user, userRoutes)
		this.app.use(this.apiPaths.leads, leadRouter)
		this.app.use(this.apiPaths.firebase, firebaseRouter)
		this.app.use(this.apiPaths.adminAuth, adminAuthRouter)
		this.app.use(this.apiPaths.doctorChat, doctorChatRouter)
		this.app.use(this.apiPaths.sales, salesRouter)
		this.app.use(this.apiPaths.insights, insightsRouter)
		this.app.use(this.apiPaths.deficiency, deficiencyRouter)
		this.app.use(this.apiPaths.adminUsers, adminUsersRouter)
		this.app.use(this.apiPaths.wearables, wearablesRouter)
		this.app.use(this.apiPaths.contraindications, contraindicationsRouter)
		this.app.use(this.apiPaths.blogs, blogsRouter)
		this.app.use(this.apiPaths.research, researchRouter)
		this.app.use(this.apiPaths.testimonial, testimonialRouter)
		this.app.use(this.apiPaths.tongueAnalysis, tongueAnalysisRouter)
		this.app.use(this.apiPaths.contentGeneration, contentGenerationRouter)
		this.app.use(this.apiPaths.teams, teamsRouter)
		this.app.use(this.apiPaths.fitbit, fitbitRouter)
		this.app.use(this.apiPaths.plans, plansRouter)
		this.app.use(this.apiPaths.contact, contactRouter)
		this.app.use(this.apiPaths.adminPublicImages, adminPublicImagestRouter)
		this.app.use(this.apiPaths.adminBlog, adminBlogRouter)
		this.app.use(this.apiPaths.adminDataIngestion, adminDataIngestionRouter)
		this.app.use(this.apiPaths.adminNewsletter, adminNewsletter)
		this.app.use(this.apiPaths.wellnessChat, wellnessChatRouter)
		this.app.use(this.apiPaths.surveyConfiguration, surveyConfigurationRouter)
		this.app.use(this.apiPaths.adminSiteDataAssets, siteDataAssetsRouter)
		this.app.use(this.apiPaths.knowledgeBase, knowledgeBase)
		this.app.use(this.apiPaths.dashboard, dashboardRouter)
		this.app.use(this.apiPaths.mail, mailRouter)
		this.app.use(this.apiPaths.authmail, authMailRouter)
		this.app.use(this.apiPaths.newsletter, newsletterSubscriptionRouter)
		this.app.use(this.apiPaths.healthTips, healthTipsRouter)
		this.app.use(this.apiPaths.askExpert, askExpertQuestionsAnswersRouter)
		this.app.use(this.apiPaths.symptoms, importRoutesSymptoms)
		this.app.use(this.apiPaths.smartInsight, smartInsightRouter)
		this.app.use(this.apiPaths.masters, mastersRouter)
		this.app.use(this.apiPaths.smartChat, smartChatRouter)
		this.app.use(this.apiPaths.docs, swaggerUI.serve, swaggerUI.setup(this.swaggerDocs))
	}

	listen() {
		this.app.listen(this.port, () => {
			//console.log("Server running in port: " + this.port)
		})
	}
}

export default Server
