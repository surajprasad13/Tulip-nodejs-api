import authRouter from "./auth"
import chatRouter from "./chat"
import remedyRouter from "./remedy"
import stripeRouter from "./stripe"
import userRouter from "./user"
import leadRouter from "./lead"
import firebaseRouter from "./firebase"
import adminAuthRouter from "./admin/auth"
import doctorChatRouter from "./doctor-chat"
import adminUsersRouter from "./admin/users"
import wearablesRouter from "./wearables"
import contactRouter from "./contact"
import adminPublicImagestRouter from "./admin/public-images"
import adminBlogRouter from "./admin/blog"
import adminDataIngestionRouter from "./admin/data_ingestion"
import wellnessChatRouter from "./wellness-chat"
import surveyConfigurationRouter from "./admin/survey-configuration"
import siteDataAssetsRouter from "./admin/site-data-assets"
import knowledgeBaseRouter from "./knowledge-base"
import webhookRouter from "./webhook"
import healthTipsRouter from './health-tips-subscription'
import newsletterSubscriptionRouter from './newsletter-subscription'
import askExpertQuestionsAnswersRouter from './ask-expert-questions-answers'
import smartInsightRouter from './smart-insight'

export {
	authRouter,
	chatRouter,
	remedyRouter,
	stripeRouter,
	userRouter,
	leadRouter,
	firebaseRouter,
	adminAuthRouter,
	doctorChatRouter,
	adminUsersRouter,
	wearablesRouter,
	contactRouter,
	adminPublicImagestRouter,
	adminBlogRouter,
	adminDataIngestionRouter,
	wellnessChatRouter,
	surveyConfigurationRouter,
	webhookRouter,
	siteDataAssetsRouter,
	knowledgeBaseRouter,
	healthTipsRouter,
	newsletterSubscriptionRouter,
	askExpertQuestionsAnswersRouter,
	smartInsightRouter
}
