export {}

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: string
			DB_USER: string
			DB_PASSWORD: string
			DB_HOST: string
			DB_PORT: number
			DB_DATABASE: string
			ENV: "local" | "dev" | "qa"| "staging" | "testing" | "prod" 
			STRIPE_API_KEY: string
			STRIPE_PUBLISHABLE_KEY: string
			STRIPE_WEBHOOK_SECRET: string
			JWT_PRIVATE_KEY: string
			ADMIN_JWT_PRIVATE_KEY: string
			BCRYPT_SALT_ROUNDS: string
			FIREBASE_WEB_KEY: string

			// Storage
			SPACES_ENDPOINT: string
			SPACES_KEY: string
			SPACES_SECRET: string
			SPACES_NAME: string
		}
	}
}
