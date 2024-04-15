import axios from "axios"
import firebase, { DYNAMIC_LINK_URL } from "../config/firebase"
import { generate20MinuteToken, generateToken } from "../middlewares/jwt-validate"
import config from "../config"

const FIREBASE_DYNAMIC_LINK_URL = config.FIREBASE_DYNAMIC_LINK_URL;

const getUserData = (uuid: string) => {
	return firebase
		.auth()
		.getUser(uuid)
		.then((data) => {
			return data
		})
		.catch((error) => {
			return error
		})
}

const sendMesageToDevice = (id: string, token: string, question: any) => {
	const topicName = "industry-tech"

	const message = {
		data: {
			message: String(id),
			title: "Missing answers ⚠️ ⚠️",
			body: `Hou have missed to anser this question ⚠️ 🟠 🟠 \n
			${question.question}
			`,
		},
		android: {
			notification: {
				icon: "ic_launcher",
				color: "#7e55c3",
			},
		},
		//topic: topicName,
		token: token,
	}

	return firebase
		.messaging()
		.send(message)
		.then((response) => {
			return response
		})
		.catch((error) => {
			return null
		})
}

const generateLinks = async (user_id: number) => {
	try {
		const token = generate20MinuteToken(user_id)

		const response = await axios.post(DYNAMIC_LINK_URL, {
			dynamicLinkInfo: {
				domainUriPrefix: "https://app.meettulip.com",
				link:  `${FIREBASE_DYNAMIC_LINK_URL}/token=${token}`,
				androidInfo: {
					androidPackageName: "com.meettulip",
					androidMinPackageVersionCode: "1",
				},
				iosInfo: {
					iosBundleId: "com.meettulip",
				},
				socialMetaTagInfo: {
					socialTitle: "Download Tulip app",
					socialDescription:
						"Where technology + holistic medicine unite. Data driven. Scientific. Personal.\n A revolutionary platform offering individualized tools and support to empower you on the road to wellness.\n Meet Tulip, Designed to improve the way you live and feel. ",
					socialImageLink:
						"https://firebasestorage.googleapis.com/v0/b/mini-tulip-app.appspot.com/o/logo.png?alt=media&token=281d35d3-4098-4c79-8022-868535bcae5e",
				},
			},
			suffix: {
				option: "SHORT",
			},
		})

		return response.data
	} catch (error: any) {
		console.log("There was an error in generating link", error.response)
		return
	}
}

export { getUserData, sendMesageToDevice, generateLinks }
