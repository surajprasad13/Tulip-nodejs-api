import { Request } from "express"
import bcrypt from "bcrypt"
import multer from "multer"
import { verify } from "jsonwebtoken"
import crypto from "crypto"
import config from "../config"

function CheckPassword(str: string) {
	var pattern = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[-+_!@#$%^&*.,?]).+$")
	if (!str || str.length === 0) {
		return false
	}
	if (pattern.test(str)) {
		return true
	} else {
		return false
	}
}

function hashPassword(password: string) {
	let hash = bcrypt.hashSync(password, 5)
	return hash
}

function comparePassword(password: string, hash: string) {
	let value = bcrypt.compareSync(password, hash)
	return value
}

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 25000000, //25MB
	},
})

function getLoggedInUserId(req: Request) {
	const token = (req.headers.authorization ?? "").replace("Bearer", "").trim()

	if (token) {
		try {
			const payload: any = verify(token, config.JWT_PRIVATE_KEY ?? " ")
			return payload?.user_id ?? null
		} catch (err) {}
	}
}

function getLoggedInAdminUserId(req: Request) {
	const token = (req.headers.authorization ?? "").replace("Bearer", "").trim()

	if (token) {
		try {
			const payload: any = verify(token, process.env.ADMIN_JWT_PRIVATE_KEY ?? " ")
			return payload?.userId ?? null
		} catch (err) {}
	}
}

function base64URLEncode(str: any) {
	return str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function sha256(buffer: any) {
	return crypto.createHash("sha256").update(buffer).digest()
}

var code_verifier = base64URLEncode(crypto.randomBytes(32))
var code_challenge = base64URLEncode(sha256(code_verifier))

var clientId = "238QLZ"
var clientSecret = "504e50705102954d7d6f76c1269edf1f"
var base64Encode = Buffer.from(clientId + ":" + clientSecret).toString("base64")

function formatDate(date: Date) {
	return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
		.getDate()
		.toString()
		.padStart(2, "0")}`
}

function similarity(s1: String, s2: String) {
	var longer = s1
	var shorter = s2
	if (s1.length < s2.length) {
		longer = s2
		shorter = s1
	}
	var longerLength = longer.length
	if (longerLength == 0) {
		return 1.0
	}
	return (longerLength - editDistance(longer, shorter)) / longerLength
}

function editDistance(s1: String, s2: String) {
	s1 = s1.toLowerCase()
	s2 = s2.toLowerCase()

	var costs = new Array()
	for (var i = 0; i <= s1.length; i++) {
		var lastValue = i
		for (var j = 0; j <= s2.length; j++) {
			if (i == 0) costs[j] = j
			else {
				if (j > 0) {
					var newValue = costs[j - 1]
					if (s1.charAt(i - 1) != s2.charAt(j - 1))
						newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
					costs[j - 1] = lastValue
					lastValue = newValue
				}
			}
		}
		if (i > 0) costs[s2.length] = lastValue
	}
	return costs[s2.length]
}

function randomIntFromInterval(min: number, max: number) {
	// min and max included
	return Math.floor(Math.random() * (max - min + 1) + min)
}

function objectSorted(object: any) {
	let sortable:any[] = []

	Object.keys(object).forEach((key: any) => {
		sortable.push([key, object[key]])
	})
	sortable.sort((a: any, b: any) => {
		return b[1] - a[1]
	})

	return sortable
}

function removeDuplicates(arr: any[]) {
	const unique = arr.reduce((acc, curr) => {
	   if (!acc.includes(curr))
		  acc.push(curr);
	   return acc;
	}, []);
	return unique;
 }

 function combineArrays(arr1: any[], arr2: any[], key_compare: string) {
	try {

		const combined = arr1.reduce((acc: any, el: any) => {
			let el2 = arr2.filter((item: any) => item[key_compare] == el[key_compare])
			acc.push({...el,...el2[0]})
			return acc
		},[])

		return combined

	} catch(error) { 
		console.log(error)
		return []
	}
 }

export {
	CheckPassword,
	hashPassword,
	comparePassword,
	upload,
	getLoggedInUserId,
	getLoggedInAdminUserId,
	code_challenge,
	code_verifier,
	base64Encode,
	formatDate,
	similarity,
	randomIntFromInterval,
	objectSorted,
	removeDuplicates,
	combineArrays
}
