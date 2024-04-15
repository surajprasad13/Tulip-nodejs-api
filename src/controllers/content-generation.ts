import { Request, Response } from "express"
import config from "../config"
import { UploadFileToS3Generic, GenerateSignedUrlGeneric } from "../services/s3"
import { TongueAnalysis_Data_KeyFolder, userDataOpenAIdata, userDataOpenAIdataLatest, userDataTongueAnalysisImageKey, userDataTongueAnalysisReportKey } from "../services/user-data"
import { ACL, BucketNames, SpaceName } from "../types/interface"
const { Configuration, OpenAIApi } = require("openai");
import Questions from "../models/questions"
import UserAnswers from "../models/useranswers"
import moment from "moment"
import { Op } from "sequelize"
import { parse } from "path"

var thirdPersonCondition = "Always refere to Tulip in the third person as 'we' and not 'I', because you are part of Tulip and Tulip is a team.";


const prepareQuestionAndAswers = (questions: any, answers: any) => {
	var parsed = [];
	var answerIds = Object.keys(answers);
	for (var i = 0; i < answerIds.length; i++) {
		var answerId = parseInt(answerIds[i]);
		var answer = answers[answerId];
		// console.log(answer)

		var q = questions.filter((x: any) => String(x.id_question) == String(answerId))[0];
		if (!q) {
			console.log(`Question for '${answerId}' and '${answer}' not found.`);
			continue;
		}
		// console.log(q)

		if (q.type == "INPUT") {
			parsed.push({ "q": answerId, "a": answer });
		} else if (q.type == "EVAL") {
			continue;
		} else {
			var isMultiple = answer.split(',').length > 1;
			if (!isMultiple) {
				if (q.options.choices)
					q.options = q.options.choices
				var a = q.options.filter((x: any) => x.value == answer)
				// console.log('---' + answerId)
				// console.log(a)
				if (a != null && a != undefined) {
					if (q.type == "CHECK") {
						var aaa = a.map((x: any) => x.name).join(',').toLowerCase()
						parsed.push({ "q": answerId, "a": aaa });
					}
					else if (q.type == "SELECT") {
						var aaa = a[0].name;
						parsed.push({ "q": answerId, "a": aaa });
					} else {
						var aaa = a.map((x: any) => x.name).join(',').toLowerCase()
						parsed.push({ "q": answerId, "a": aaa });
					}
				}
				else {
					console.log(' could matchd ' + JSON.stringify(q.options) + JSON.stringify(answer))
					return parsed;
				}
			} else {
				// console.log('---' + answerId)
				var as = answer.split(',');
				if (q.options.choices)
					q.options = q.options.choices
				var qs = [];
				for (var assss of as) {
					var a = q.options.filter((x: any) => x.value == assss)
					// console.log(a);
					if (a.length > 0) {
						qs.push(a[0].name);
					}
				}
				var qsa = qs.join(', ').toLowerCase();
				// console.log(qsa)
				if (qsa != null && qsa != undefined) {
					parsed.push({ "q": answerId, "a": qsa });
				}
				else {
					console.log(' could matchd ' + JSON.stringify(q.options) + JSON.stringify(answer))
					return parsed;
				}
			}
		}
	}
	return parsed;
};

const generateFacts = (questions: any, answers: any) => {
	var parsed = prepareQuestionAndAswers(questions, answers);

	var userFactsConfiguration = [
		{ "id": 1, "content": `My name is MAGIC` },
		{ "id": 1000, "content": `I am in the age range of MAGIC` },
		{ "id": 2, "content": `My gender at birth is MAGIC` },
		{ "id": 3, "content": `I have been experiencing long covid symptons for MAGIC` },
		{ "id": 4, "content": `I have been experiencing the following symptoms: MAGIC` },
		{ "id": 21, "content": `The severity of my fatigue is MAGIC.` },
		{ "id": 23, "content": `The severity of my shortness of breath is MAGIC.` },
		{ "id": 25, "content": `The severity of my cough is MAGIC.` },
		{ "id": 27, "content": `The severity of my joint pain is MAGIC.` },
		{ "id": 29, "content": `The severity of my weakness is MAGIC.` },
		{ "id": 31, "content": `The severity of my headache is MAGIC.` },
		{ "id": 33, "content": `The severity of my head congestion is MAGIC.` },
		{ "id": 35, "content": `The severity of my brain fog or trouble concentrating is MAGIC.` },
		{ "id": 37, "content": `The severity of my chest pain MAGIC.` },
		{ "id": 39, "content": `The severity of my loss of taste or smell is MAGIC.` },
		{ "id": 41, "content": `The severity of my hair loss is MAGIC.` },
		{ "id": 43, "content": `The severity of my earaches, hearing loss, or tinnitus (ringing in ears) is MAGIC.` },
		{ "id": 45, "content": `The severity of my fatigue is MAGIC.` },
		{ "id": 45, "content": `The severity of my sleep disturbances is MAGIC.` },
		{ "id": 47, "content": `The severity of my rashes or other skin issues is MAGIC.` },
		{ "id": 49, "content": `The severity of my depression or anxiety is MAGIC.` },
		{ "id": 51, "content": `The severity of my heart Issues is MAGIC.` },
		{ "id": 53, "content": `The severity of my digestive issues is MAGIC.` },
		{ "id": 5, "content": `I have been experiencing the following other symptoms: MAGIC` },
		// { "id": 6, "content": `My long covid symptoms severity is MAGIC` },
		{ "id": 7, "content": `I answered MAGIC when asked if I am taking medications.` },
		{ "id": 8, "content": `These are the medications I am currently taking: MAGIC` },
		{ "id": 9, "content": `These are the medications I am currently taking, in addition: MAGIC` },
		// { "id": 10, "content": `When asked asked if I was receiving any medical treatment for the symptoms mentioned and the answer was MAGIC` },
		{ "id": 11, "content": `I had the following medical conditions before I got COVID: MAGIC` },
		{ "id": 12, "content": `I have the following medical conditions that were not mentioned yet: MAGIC` },
		{ "id": 13, "content": `My current activity level, from 1 (low) to 5 (high), is MAGIC` },
		{ "id": 14, "content": `My sleep quality and duration is MAGIC` },
		{ "id": 15, "content": `My current anxiety, depresseion and/or stress level, from 1 (low) to 5 (high), is MAGIC` },
		{ "id": 16, "content": `My current energy level, from 1 (low) to 5 (high), is MAGIC` },
		{ "id": 17, "content": `I eat MAGIC foods that are high in saturated and trans fats, such as fried foods or processed meats.` },
		{ "id": 18, "content": `I eat MAGIC foods or drinks that are high in added sugars, such as candy, baked goods, ice cream, or sweetened beverages.` },
	]
	var facts = [];
	for (var fact of userFactsConfiguration) {
		var factId = fact.id;
		// console.log(factId)
		var factPreAnswer = parsed.filter(x => x.q == factId);
		// console.log(factPreAnswer)
		if (factPreAnswer.length != 1)
			continue;
		var composedAnswer = fact.content.replace("MAGIC", factPreAnswer[0].a);
		// console.log(composedAnswer)
		facts.push(composedAnswer);
	}
	return facts;
}

const backupReponseSmartPopup = {
	"text": {
		"id": "chatcmpl-6tdjI50xfoTHKKP7QumA1W3MpD2fz", "object": "chat.completion", "created": 1678718780, "model": "gpt-3.5-turbo-0301", "usage": { "prompt_tokens": 429, "completion_tokens": 115, "total_tokens": 544 }, "choices": [{
			"message": {
				"role": "assistant",
				"content": "With Tulip, we provide you with personalized recommendations and health insights to help you improve your long COVID symptoms and optimize your well-being. Our team utilizes the power of natural medicine to offer personalized tips and advice that cater to your specific needs. We assure you that our experts will provide you with the necessary support to address this symptom. By understading your lifestyle, Tulip can assist you in maintaining a balanced diet while simultaneously tracking your symptoms. Start using Tulip today and let us help you feel better."
			}, "finish_reason": "stop", "index": 0
		}]
	}, "symptoms": []
}

const prepareAnswers = (parsed: any[], ids: number[]) => {
	// console.log(parsed)
	// console.log(ids)
	var prepared = parsed
		.filter(x => { return ids.includes(x.q); })
		.map(x => x.a)
		.map(x => x.split(','))
		.flat().flat().map(x => x.trim());
	return prepared;
}

export const postSmartPopup = async (req: Request, res: Response) => {
	try {
		const configuration = new Configuration({
			apiKey: config.OPENAI_API_KEY,
		});

		// return res.status(200).send(backupReponseSmartPopup);

		const id = "1";
		var questions = {};
		var answers = {} as any;
		if (!req.body.answers) {
			questions = await Questions.findAll({ raw: true, where: { group_id: [105] }, order: [["id"]], })
			const answers2 = await UserAnswers.findAll({ raw: true, attributes: ["data"], where: { user_id: id } })
			const answers3 = answers2[0].data as any[];
			for (var a of answers3) {
				answers[a.question_id] = a.values;
			}
		} else {
			var questions2 = req.body.question;
			var result = Object
				.keys(questions2).map((key) => [Number(key), questions2[key]][1])
				.map((x: any) => {
					return {
						id_question: x.questionId,
						options: x.options,
						type: x.type
					}
				});
			questions = result;
			// console.log(result);
			// if (questions == null)
			// 	questions = questionsTest;
			answers = req.body.answers;
			// if (answers == null)
			// 	answers = answersTest;

			// console.log(answers)
			// console.log(questions)
		}

		if (!answers) {
			return res.status(200).send({
				text: null,
			});
		}
		if (!questions) {
			return res.status(200).send({
				text: null,
			});
		}

		var parsed = prepareQuestionAndAswers(questions, answers);
		var symptoms = prepareAnswers(parsed, [4, 5])
		var ageGroup = prepareAnswers(parsed, [1000])
		var genderAtBirth = prepareAnswers(parsed, [2])
		var stressLevel = prepareAnswers(parsed, [15])
		var energyLevel = prepareAnswers(parsed, [16])
		var activityLevel = prepareAnswers(parsed, [13]).join(',')

		var facts = generateFacts(questions, answers);
		// console.log(' --')
		// console.log(answers);
		// console.log(questions);
		// console.log(parsed);
		// console.log(aa);
		// console.log(facts);

		var instruction = [];
		instruction.push({ role: "system", content: "Tulip is a product that allows one to find all the tools one needs to improve long COVID symptoms and optimize their well-being. One can get health insights and recommendations, track symptoms, and connect with health experts for personalized tips and advice. It will do so by using the power of natural medicine." })
		// instruction.push({ "role": "system", "content": "Mention the power of natural medicine." })
		instruction.push(...facts.map((x: any) => { return { "role": "user", "content": x } }))
		instruction.push({ "role": "user", "content": thirdPersonCondition })
		// instruction.push({ "role": "user", "content": "Tell me what can be done with the product Tulip in one paragraph while mentioning some of the facts that I shared about me. Mention my name at least once. Tell me with empathy and compassion related to the symptoms I have so I feel warm and taken care of. Do make it very very short and very straightforward and crisp." })
		// instruction.push({ "role": "user", "content": "Tell me what can be done with the product Tulip in 3 paragraphs while mentioning some of the facts that I shared about me. Mention my name at least once. Tell me with empathy and compassion related to the symptoms I have." })

		// Paragraph structure
		instruction.push({ "role": "assistant", "content": "We are here to guide you on recommendations and insights to help you with your [...] due to Long Covid." })
		instruction.push({ "role": "assistant", "content": "We have helped many [gender] between [age range] on their welness journey using the power of natural medicine." })
		// instruction.push({ "role": "assistant", "content": "Here at Tulip, for FREE you will get:" }) // bullets
		instruction.push({ "role": "user", "content": "Tell me what can be done with the product Tulip in very short bullet points." })
		// instruction.push({ "role": "system", "content": "We understand how challenging and discouraging suffering from Long Covid can be - this could be contributing to your [symptoms]." }) // energy, strees, activty



		const openai = new OpenAIApi(configuration);
		const completion = await openai.createChatCompletion({
			model: "gpt-4",
			messages: instruction,
		});
		var theResult = { text: completion.data };
		const imageBinary = Buffer.from(JSON.stringify(theResult), "utf-8");

		var key = userDataOpenAIdata(id, "smart-popup");
		UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key, `application/json`);

		key = userDataOpenAIdataLatest(id, "smart-popup");
		UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key, `application/json`);

		// GenerateSignedUrlGeneric(BucketNames.TulipUserData, key)
		// 	.then((x: any) => {
		// 		console.log(`saved ${id}`)
		// 	})
		// 	.catch((error: any) => {
		// 		console.log(error);
		// 	});
		res.status(200).send({
			text: completion.data,
			symptoms: symptoms,
			ageGroup,
			genderAtBirth,
			stressLevel,
			energyLevel,
			activityLevel
		});
	} catch (error: any) {
		console.log('Error SmartPopup')
		console.log(JSON.stringify(error))
		if (error.status && error.status == 429) {
			console.log('OpenAI 429')
			return res.status(200).send(backupReponseSmartPopup);
		}
		res.status(500).send({ error })
	}
}

export const postSmartLifestyle = async (req: Request, res: Response) => {
	try {
		const configuration = new Configuration({
			apiKey: config.OPENAI_API_KEY,
		});

		const id = req.body.payload.user_id;

		const questions = await Questions.findAll({ where: { group_id: [105] }, order: [["id"]], })
		var answers = {} as any;
		const answers2 = await UserAnswers.findAll({ raw: true, attributes: ["data"], where: { user_id: id } })
		const answers3 = answers2[0].data as any[];
		for (var a of answers3) {
			answers[a.question_id] = a.values;
		}

		var facts = generateFacts(questions, answers);
		// console.log(answers)
		// console.log(facts)

		var instruction = [];
		var generalFacts = [
			"Making lifestyle changes is a very important component of healing. What supplements you take and how you nourish your body with food and drink are very important, but making lifestyle modifications can be very powerful at accelerating your healing.",
			"Here are some basic lifestyle recommendations:",
			"Sunlight and Nature: being outside in nature has shown to improve mood, decrease stress levels, and reduce feelings of fatigue. Try to spend at least 1 hour in nature every week. Also, If you go outside in the morning, allow your eyes to get exposed to sunlight. This has been shown to help regulate your circadian rhythm so you can sleep better at night.",
			"Movement: daily movement has numerous benefits for your health and wellbeing, including improving energy levels. Moving daily improves your oxygen and nutrient distribution to your body and boosts mitochondrial function (the energy powerhouses within your cells). Movement also releases endorphins that boost your mood and energy levels. Include a variety of different types of movement into your daily routine such as walking, running, swimming, biking, strength training, yoga and stretching. It is recommended that you exercise at least 30 minutes everyday.",
			"Sleep: try to get ready for bed, go to sleep, and wake up around the same time everyday. It is much better for your circadian rhythm to have a consistent routine. Begin winding down 60 minutes before your bedtime by turning off all types of screens. Drink a small warm cup of chamomile, lemon balm, passion flower tea to help calm your body and mind.",
			"Engage in activities that help you relax your mind, such as reading a book, journaling, light stretching, yoga, and meditation.",
			"Here is a recommendation that is specific to your specific Long Covid symptom:",
		]

		instruction.push(...generalFacts.map((x: any) => { return { "role": "system", "content": x } }))
		instruction.push(...facts.map((x: any) => { return { "role": "user", "content": x } }))
		instruction.push({ "role": "user", "content": thirdPersonCondition })
		instruction.push({ "role": "user", "content": "Explain to me what can be done to improve my lifestyle in 3 paragraphs while mentioning some of the facts that I reported earlier about myself. Do not mention any food or diet recommendations." })

		const openai = new OpenAIApi(configuration);
		const completion = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: instruction,
		});
		var theResult = { text: completion.data };
		const imageBinary = Buffer.from(JSON.stringify(theResult), "utf-8");

		var key = userDataOpenAIdata(id, "plan105-lifestyle");
		UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key, `application/json`);

		key = userDataOpenAIdataLatest(id, "plan105-lifestyle");
		UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key, `application/json`);

		// GenerateSignedUrlGeneric(BucketNames.TulipUserData, key)
		// 	.then((x: any) => {
		// 		console.log(`saved ${id}`)
		// 	})
		// 	.catch((error: any) => {
		// 		console.log(error);
		// 	});
		res.status(200).send({
			text: completion.data,
		});
	} catch (error) {
		// console.log(error)
		res.status(500).send({ error })
	}
}

export const postSmartFood = async (req: Request, res: Response) => {
	try {
		const configuration = new Configuration({
			apiKey: config.OPENAI_API_KEY,
		});

		const id = req.body.payload.user_id;

		const questions = await Questions.findAll({ raw: true, where: { group_id: [105] }, order: [["id"]], })
		var answers = {} as any;
		const answers2 = await UserAnswers.findAll({ raw: true, attributes: ["data"], where: { user_id: id } })
		const answers3 = answers2[0].data as any[];
		for (var a of answers3) {
			answers[a.question_id] = a.values;
		}

		var facts = generateFacts(questions, answers);
		// console.log(answers)
		console.log(facts)

		var instruction = [];
		var generalFacts = [
			"Nutrition plays an extremely important role in your health.",
			"Here are some basic nutritional recommendations to help you establish a healthy foundation:",
			"Eat whole, unprocessed foods. Meaning nutrient dense foods in their most natural state.",
			"Avoid drinking large amounts of fluids with meals as it can disrupt your digestion and therefore absorption of nutrients.",
			"Chew your food well.",
			"Avoid overeating and undereating as both can be stressors on your body.",
			"Practice mindful eating, limiting distractions and really focusing on the meal you are consuming.",
			"Increase fiber rich foods which help to slow the absorption of sugars from the foods we eat to reduce blood sugar spikes.",
			"Here are some nourishing foods to increase:",
			"Vegetables: leafy greens, cucumbers, artichokes, broccoli, cauliflower, celery, squash, brussel sprouts, asparagus, and onions",
			"Fruit: apples, pears, wild blueberries, strawberries, raspberries, and avocados Grains: steel cut oatmeal, brown rice, quinoa",
			"Protein: organic chicken, wild caught fish, nut butters, nuts, seeds ",
			"Oils: olive oil, avocado oil, coconut oil ",
			"Here are some inflammatory foods to decrease:",
			"Processed sugar: pastries, sweet cereals, candy, cookies, cake ",
			"Dairy products",
			"Fried foods ",
			"Foods with preservatives and dyes",
		]

		instruction.push(...generalFacts.map((x: any) => { return { "role": "system", "content": x } }))
		instruction.push(...facts.map((x: any) => { return { "role": "user", "content": x } }))
		instruction.push({ "role": "user", "content": thirdPersonCondition })
		instruction.push({ "role": "user", "content": "Explain to me what are good foods to increase, some foods to decrease and general good food practices. It should be in 3 paragraphs while mentioning some of the facts that I reported earlier about myself. Do not mention any lifestyle recommendations. Mention my name at least once." })

		const openai = new OpenAIApi(configuration);
		const completion = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: instruction,
		});
		var theResult = { text: completion.data };
		const imageBinary = Buffer.from(JSON.stringify(theResult), "utf-8");

		var key = userDataOpenAIdata(id, "plan105-food-intro");
		UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key, `application/json`);

		key = userDataOpenAIdataLatest(id, "plan105-food-intro");
		UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key, `application/json`);

		// GenerateSignedUrlGeneric(BucketNames.TulipUserData, key)
		// 	.then((x: any) => {
		// 		console.log(`saved ${id}`)
		// 	})
		// 	.catch((error: any) => {
		// 		console.log(error);
		// 	});
		res.status(200).send({
			text: completion.data,
		});
	} catch (error) {
		console.log(error)
		res.status(500).send({ error })
	}
}
