import dotenv from "dotenv"
import path from "path"

// dotenv.config({
// 	path: path.resolve(__dirname, `../envs/${process.env.NODE_ENV}.env`),
// })

dotenv.config({
	path: path.resolve(`src/envs/${process.env.NODE_ENV}.env`),
})

export default {
	NODE_ENV: process.env.NODE_ENV || "dev",
	BASE_URL: process.env.BASE_URL,
	ACCESS_TOKEN: process.env.ACCESS_TOKEN,

	// Web site
	JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY ?? " ",

	// Payment
	STRIPE_API_KEY: process.env.STRIPE_API_KEY,
	STRIPE_REDIRECT_URL: process.env.STRIPE_REDIRECT_URL,
	STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
	STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

	// Storage
	DB_USER: process.env.DB_USER,
	DB_PASSWORD: process.env.DB_PASSWORD,
	DB_HOST: process.env.DB_HOST,
	DB_PORT: process.env.DB_PORT,
	DB_DATABASE: process.env.DB_DATABASE,

	SPACES_ENDPOINT: process.env.SPACES_ENDPOINT,
	DO_SPACE_KEY: process.env.SPACES_KEY,
	DO_SPACE_SECRET: process.env.SPACES_SECRET,
	DO_SPACE_NAME: process.env.SPACES_ENDPOINT,
	
	ENV: process.env.ENV || "dev",
	FIREBASE_WEB_KEY: process.env.FIREBASE_WEB_KEY,
	FIREBASE_DYNAMIC_LINK_URL: process.env.FIREBASE_DYNAMIC_LINK_URL,
	OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
	TULIP_KNOWLEDGEBASE_URL: process.env.TULIP_KNOWLEDGEBASE_URL,

	// Firebase
	FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
	FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

	// Azure
	AZURE_CV: process.env.AZURE_CV,
	AZURE_OCP_APIM_SUBSCRIPTION: process.env.AZURE_OCP_APIM_SUBSCRIPTION,
}
