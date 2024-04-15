import admin from "firebase-admin"
import config from "./"

import serviceAccountProd from "../../service-account-prod.json"
import serviceAccountDev from "../../service-account-dev.json"
import serviceAccountStaging from "../../service-account-staging.json"

const serviceAccount: any = {
	local: serviceAccountDev,
	dev: serviceAccountDev,
	qa: serviceAccountDev,
	staging: serviceAccountStaging,
	prod: serviceAccountProd,
	automatedtests: serviceAccountDev,
}
const firebaseCert = {
	...serviceAccount[config.NODE_ENV],
	private_key_id: config.FIREBASE_PRIVATE_KEY_ID,
	private_key: config.FIREBASE_PRIVATE_KEY
}

const firebase = admin.initializeApp({
	credential: admin.credential.cert(firebaseCert as admin.ServiceAccount),
})

export const DYNAMIC_LINK_URL = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${config.FIREBASE_WEB_KEY}`

export default firebase
