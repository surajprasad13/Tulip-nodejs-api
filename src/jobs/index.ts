import {
  EVERY_5_SECONDS,
  EVERY_DAY,
  EVERY_30_SECONDS,
  EVERY_WEEK,
} from "./../constants/ScheduleConstants";
import { json, Op } from "sequelize";
import moment from "moment";
import cron from "node-cron";
import {
  EVERY_HOUR,
  EVERY_MINUTE,
  EVERY_3_MINUTES,
  EVERY_10_MINUTES,
} from "../constants/ScheduleConstants";

// config
import firebase from "../config/firebase";
import { google } from "googleapis";
const OpenAI = require("openai");
import config from "../config";

// controllers
import { updateWearableData } from "../controllers/wearables";
import * as _ from "lodash";

// models
import { UserProfileModel } from "../models";
import UserFollowupModel from "../models/notification/user_followup";
import "./planEmail";
import "./weeklyEmail";
import "./wellnessChat";
import "./askAnExpert";
import { hideSymptomsWithNoTreatments } from "./hideSymptomsWithNoTreatments";
import { removeForbidenArticles } from "./removeForbidenArticles";
import { symptomTreatmentsHumata } from "./symptomTreatmentsHumata";
import { smartArticleAnalyzer } from "./smartArticleAnalyzer";
import { symptomConditionInfo } from "./symptomConditionInfo";
import TreatmentMaster from "../models/masters/treatment_master";
import { symptomTreatments } from "./symptomTreatments";
import SymptomTreatmentsHumata from "../models/symptom_treatments_humata";
import { smartArticleAnalyzerGpt4 } from "./smartArticleAnalyzerGpt4";
import SymptomConditionMaster from "../models/symptom_condition_master";
import {
  getHealthLineLinks,
  saveHealthLineArticles,
} from "../controllers/scrapping/healthline";
import { symptomTreatmentsSummarize } from "./symptomTreatmentsSummarize";
import {
  getAllIdsFromDatabase,
  getHealthArticles,
  getMedicineArticles,
  getSaveArticleContent,
  getSaveArticleContentOwn,
} from "../utils/getMedicineArticles";
import { smartArticleAnalyzerHealthline } from "./smartArticleAnalyzerHealthline";
import MedicineArticles from "../models/medicine_articles";
import SymptomTreatments from "../models/symptom_treatments";
import MedicineArticlesApprovedShortText from "../models/medicine_articles_approved_short_text";
import SmartChat from "../models/smart_chat";
import { doctorsCondition } from "./doctorsCondition";
import { processMedicationsInfo } from "./processMedicationsInfo";
import { processSymptomConditionDoctorInfo } from "./processSymptomConditionDoctorInfo";
const fs = require("fs");

//processMedicationsInfo()

//processSymptomConditionDoctorInfo()

// analyzeSmartChat()

// async function analyzeSmartChat(){
//   console.log('ANALYZE SMART CHAT');

//   let smartChat = await SmartChat.findAll({raw: true})

//   // console.log(smartChat.length);

//   smartChat.sort((a:any, b:any) => {
//     return a?.id - b?.id
//   })

//   // console.log(smartChat[0]);
  

//   const chats = smartChat.reduce((acc:any, chat:any) => {
//     if(!acc[chat?.session_id]){
//       acc[chat?.session_id] = []
//     }

//     acc[chat?.session_id].push(chat.messages)
    
//     return acc
//   },{})

  
  

//   for(const session_id in chats){
//     chats[session_id].sort((a:any, b:any) => {
//       return b?.length - a?.length
//     })

//     chats[session_id] = chats[session_id][0]

//     chats[session_id] = chats[session_id][chats[session_id].length-1]?.role === 'assistant'
//   }

//   //console.log(chats);

//   const arr = []

//   for(const session_id in chats){
//     if(chats[session_id] === true){
//      arr.push({
//         session_id: +session_id,
//         date: new Date(+session_id),
//         month: new Date(+session_id).getMonth()+1,
//         day: new Date(+session_id).getDate(),
//         year: new Date(+session_id).getFullYear(),
//      })
//     }
//   }

//   const arr2:any = []

//   for(const s of arr){
//     if(!arr2.find((a:any) => a?.month === s?.month && a?.year === s?.year && a?.day === s?.day)){
//       arr2.push({
//         month: s?.month,
//         year: s?.year,
//         day: s?.day,
//         count: 1,
//       })
//     }
//     else{
//       arr2.find((a:any) => a?.month === s?.month && a?.year === s?.year && a?.day === s?.day).count++
//     }
//   }

//   arr2.sort((a:any, b:any) => {
//     if(a?.year === b?.year){
//       if(a?.month === b?.month){
//         return a?.day - b?.day
//       }
//       return a?.month - b?.month
//     }
//     return a?.year - b?.year    
//   })

//   console.log(arr2[arr2.length-1]);
  
//   jsonToCsv('smart_chat.csv', arr2)  
  
// }


// findApprovedArticles()

// async function findApprovedArticles(){
// 	console.log('FIND APPROVED ARTICLES');

// 	let pubmed_ids = []

// 	const allSymptomTreatments = await SymptomTreatments.findAll({
// 		raw: true,
// 	})

// 	for(const st of allSymptomTreatments){
// 		for(const article of (st?.articles??[])){
// 			if(+article.pubmed_id){
// 				pubmed_ids.push(+article.pubmed_id)
// 			}
// 		}
// 	}

// 	pubmed_ids = _.uniq(pubmed_ids)

// 	console.log(pubmed_ids.length);

// 	let fullArticles = await MedicineArticles.findAll({
// 		where: {
// 			pubmed_id: {
// 				[Op.in]: pubmed_ids,
// 			}
// 		},
// 		raw: true,
// 	})

// 	fullArticles = _.uniqBy(fullArticles, 'pubmed_id')

// 	for(const article of fullArticles){
// 		try{
// 			await MedicineArticlesApprovedShortText.create({
// 				pubmed_id: article.pubmed_id,
// 				short_text: article.short_text,
// 			})
// 		}
// 		catch(err){
// 			console.log(err);
// 		}
// 	}
// }

// cron.schedule("0 8 * * *", async () => {
// 	try {
// 		await updateWearableData()
// 	} catch (err) {
// 		console.log(err)
// 	}
// })

//searchInvalidTreatments()

// cron.schedule("*/5 * * * * *", async () => {
// 	console.log("Running in 1 minute")
// })

/** Send first configure automated message */
//cron.schedule(EVERY_MINUTE, async () => {
// console.log('Running smart article analyzer')
//	smartArticleAnalyzer()
//})

//smartArticleAnalyzerGpt4()

//smartArticleAnalyzer()

//symptomTreatments()

//smartArticleAnalyzerHealthline()

//symptomTreatmentsSummarize()

//updateMedicineArticlesProcessed()

// cron.schedule(EVERY_HOUR, async () => {
// 	updateMedicineArticlesProcessed()
// })

//updateMedicineArticlesProcessedOwn()

// cron.schedule(EVERY_HOUR, async () => {
//	updateMedicineArticlesProcessedOwn()
// })

// hideSymptomsWithNoTreatments()

//exportSuccessRate()

//symptomTreatmentsHumata()

// async function fixSymptomTreatments(){
// 	console.log('FIX SYMPTOM TREATMENTS');

// 	const symptomTreatments = (await SymptomTreatments.findAll({
// 		raw: true,
// 	})??[]).filter((st: any) => ((st?.humata??[]).filter((h: any) => h?.url?.length).length))

// 	console.log(symptomTreatments.length);

// 	for(const st of symptomTreatments){
// 		let humata = ((await SymptomTreatments2.findOne({
// 			where: {
// 				id: st.id,
// 			},
// 			raw: true,
// 		})) ?? null)?.humata

// 		if(!humata?.length){
// 			humata = null
// 		}

// 		console.log(st.id);

// 		await SymptomTreatments.update({
// 			humata: humata,
// 			summarized_data: null,
// 		}, {
// 			where: {
// 				id: st.id,
// 			}
// 		})
// 	}
// }

/** Get Health Line Content */
// async function getHealthLineContent(url: string) {
// 	const links = await getHealthLineLinks(url)
// 	saveHealthLineArticles(links)
// }

// getHealthLineContent("https://www.healthline.com/directory/topics")

/** End Get Health Line Content */

//symptomConditionInfo()

// cron.schedule(EVERY_HOUR, async () => {
// 	hideSymptomsWithNoTreatments()
// })

// removeForbidenArticles()

// cron.schedule(EVERY_HOUR, async () => {
// 	removeForbidenArticles()
// })

// cron.schedule(EVERY_HOUR, async () => {
// 	console.log("Running a every day task")
// 	UserProfileModel.hasMany(UserFollowupModel, { foreignKey: "user_id" })
// 	UserFollowupModel.belongsTo(UserProfileModel, { foreignKey: "user_id" })

// 	const data = await UserFollowupModel.findAll({
// 		where: {
// 			date_sent: null,
// 			date_created: {
// 				[Op.gt]: moment().format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().format("YYYY-MM-DD 23:59"),
// 			},
// 		},
// 	})

// 	let tokens: string[] = []

// 	if (data.length > 0) {
// 		for (const element of data) {
// 			const token = await UserProfileModel.findOne({ where: { user_id: element.user_id } })
// 			tokens.push(token.device_tokens)
// 		}
// 	}

// 	if (tokens.length > 0) {
// 		const message = {
// 			notification: {
// 				title: "Plan update",
// 				body: "Have you followed up your plan today",
// 			},
// 			tokens: tokens,
// 		}

// 		firebase
// 			.messaging()
// 			.sendMulticast(message)
// 			.then(async (response) => {
// 				for (const element of data) {
// 					await UserFollowupModel.update({ date_sent: new Date() }, { where: { user_id: element.user_id } })
// 				}
// 			})
// 			.catch((error) => {
// 				console.log("Error sending message:", error)
// 			})
// 	}
// })

/** Summarize Root Causes */

// async function summarizeRootCauses() {
// 	console.log("Summarizing Root Causes")
// 	const { Configuration, OpenAIApi } = require('openai')

// 	// Configure OpenAI API
// 	const openaiApiKey = config.OPENAI_API_KEY
// 	const configuration = new Configuration({
// 		apiKey: openaiApiKey
// 	  })
// 	const gpt = new OpenAIApi(configuration)

// 	// Google Service Account credentials
// 	const client = new google.auth.JWT({
//     	email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//     	key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//     	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
// 	})

// 	const sheets = google.sheets({version: 'v4', auth: client})

// 	const spreadsheetId = '1A7Y4r1eFrlelipD18Px8YHs2cYWCuLGJM2Lz3uSEIQQ'
// 	const range = 'Root Causes!B2:B291' // Add more rows if needed

// 	sheets.spreadsheets.values.get({
// 		spreadsheetId: spreadsheetId,
// 		range: range,
// 	}, async (err, res) => {
// 		if (err) return console.log('The API returned an error: ' + err)

// 		const rows = res?.data.values;
// 		if (rows?.length) {
// 			// Iterate through each cell
// 			for (let i = 0; i < rows.length; i++) {
// 				// Pass the cell content to the OpenAI API
// 				const messages = [{ role: 'system', content: 'You are an empathetic AI assistant, with a focus on analyzing health-related scientific text. Your goal is to extract key information from this text that could potentially help patients understand their symptoms and treatments better. Avoid using abbreviations (blood pressure instead of bp). Present the information in bullet points. The explanation should be written in a way that is easy for everyone to understand without too much scientific or medical words.' },
// 									{ role: 'user', content: `Create a really short summary of the text below

// 									"""
// 									${rows[i][0]}
// 									"""` }]
// 				console.log("Row number ",i)
// 				const gptResponse = await gpt.createChatCompletion({
// 					model: 'gpt-4',
// 					messages,
// 					temperature: 0.7,
// 					top_p: 1,
// 					frequency_penalty: 0,
// 					presence_penalty: 0,
// 				})
// 				console.log("After row number ",i)

// 				// const summary = gptResponse.data.choices[0].text.trim();
//     			const summary = (gptResponse.data.choices[0].message?.content || '')
// 				// console.log('Summary: ', summary);

// 				// Write the response in column C of the same row
// 				await sheets.spreadsheets.values.update({
// 					spreadsheetId: spreadsheetId,
// 					range: `Root Causes!C${i + 2}`,
// 					valueInputOption: 'USER_ENTERED',
// 					requestBody: {
// 						values: [[summary]],
// 					},
// 				});
// 			}
// 			console.log("Root Causes Summarization Ended")
// 		} else {
// 			console.log('No data found.');
// 		}
// 	})

// }

// summarizeRootCauses()

/** End Summarize Root Causes */

/** Symptom Synonyms */

// async function symptomSynonyms() {
//   console.log("Symptom Synonyms");

//   // Configure OpenAI API
//   const openaiApiKey = config.OPENAI_API_KEY;
//   const gpt = new OpenAI({ apiKey: openaiApiKey });

//   // Google Service Account credentials
//   const client = new google.auth.JWT({
//     email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//     key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//     scopes: ["https://www.googleapis.com/auth/spreadsheets"],
//   });

//   const sheets = google.sheets({ version: "v4", auth: client });

//   const spreadsheetId = "1A7Y4r1eFrlelipD18Px8YHs2cYWCuLGJM2Lz3uSEIQQ";
//   const range = "symptoms and conditions!B2:B931"; // Add more rows if needed

//   sheets.spreadsheets.values.get(
//     {
//       spreadsheetId: spreadsheetId,
//       range: range,
//     },
//     async (err, res) => {
//       if (err) return console.log("The API returned an error: " + err);

//       const rows = res?.data.values;
//       if (rows?.length) {
//         // Iterate through each cell
//         for (let i = 0; i < rows.length; i++) {
//           // Pass the cell content to the OpenAI API
//           const messages = [
//             {
//               role: "system",
//               content: "You are an AI assistant, focused in language tasks.",
//             },
//             {
//               role: "user",
//               content: `Identify synonyms of the next symptom/condition and deliver them separate by commas. Try to be specific and use maximum 2 words per synonym. Create uo to 6 synonyms.
// 									"""
// 									${rows[i][0]}
// 									"""`,
//             },
//           ];
//           console.log("Row number ", i);
//           const gptResponse = await gpt.chat.completions.create({
//             model: "gpt-4-0125-preview",
//             messages,
//             temperature: 0,
//             top_p: 1,
//             frequency_penalty: 0,
//             presence_penalty: 0,
//           });
//           console.log("After row number ", i);

//           await new Promise((resolve) => setTimeout(resolve, 2000));

//           const synonyms = gptResponse?.choices[0]?.message?.content || "";

//           // Write the response in column P of the same row
//           await sheets.spreadsheets.values.update({
//             spreadsheetId: spreadsheetId,
//             range: `symptoms and conditions!P${i + 2}`,
//             valueInputOption: "USER_ENTERED",
//             requestBody: {
//               values: [[synonyms]],
//             },
//           });
//         }
//         console.log("Symptoms synonyms Ended");
//       } else {
//         console.log("No data found.");
//       }
//     }
//   );
// }

// symptomSynonyms();

/** End Symptoms Synonyms */

/** Drinks Benefits */

// async function drinksBenefits() {
//   console.log("Drinks Benefits");

//   // Configure OpenAI API
//   const openaiApiKey = config.OPENAI_API_KEY;
//   const gpt = new OpenAI({ apiKey: openaiApiKey });

//   // Google Service Account credentials
//   const client = new google.auth.JWT({
//     email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//     key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//     scopes: ["https://www.googleapis.com/auth/spreadsheets"],
//   });

//   const sheets = google.sheets({ version: "v4", auth: client });

//   const spreadsheetId = "1A7Y4r1eFrlelipD18Px8YHs2cYWCuLGJM2Lz3uSEIQQ";
//   const range = "Drinks!D2:D163"; // Add more rows if needed

//   sheets.spreadsheets.values.get(
//     {
//       spreadsheetId: spreadsheetId,
//       range: range,
//     },
//     async (err, res) => {
//       if (err) return console.log("The API returned an error: " + err);

//       const rows = res?.data.values;
//       if (rows?.length) {
//         // Iterate through each cell
//         for (let i = 0; i < rows.length; i++) {
//           // Pass the cell content to the OpenAI API
//           const messages = [
//             {
//               role: "system",
//               content:
//                 "You are an AI assistant, you are an expert in healthy drinks.",
//             },
//             {
//               role: "user",
//               content: `Use your knowledge to describe the health benefits of the drink bellow. Take into acount I am providing the ingredients of the drink, so you can tell me the heath benefits of it.
// 									"""
// 									${rows[i][0]}
// 									"""`,
//             },
//           ];
//           console.log("Row number ", i);
//           const gptResponse = await gpt.chat.completions.create({
//             model: "gpt-4-0125-preview",
//             messages,
//             temperature: 0,
//             top_p: 1,
//             frequency_penalty: 0,
//             presence_penalty: 0,
//           });
//           console.log("After row number ", i);

//           await new Promise((resolve) => setTimeout(resolve, 2000));

//           const synonyms = gptResponse?.choices[0]?.message?.content || "";

//           // Write the response in column H of the same row
//           await sheets.spreadsheets.values.update({
//             spreadsheetId: spreadsheetId,
//             range: `Drinks!H${i + 2}`,
//             valueInputOption: "USER_ENTERED",
//             requestBody: {
//               values: [[synonyms]],
//             },
//           });
//         }
//         console.log("Drinks Benefits Ended");
//       } else {
//         console.log("No data found.");
//       }
//     }
//   );
// }

// drinksBenefits();

/** End Drinks Benefits */

/** Save Medicine Articles */
// cron.schedule(EVERY_DAY, async () => {
// 	try {
// 		const articles = await getMedicineArticles(moment().subtract(20, "day").format("YYYY-MM-DD"), moment().subtract(19, "day").format("YYYY-MM-DD"))
// 		articles.forEach(async (el: any) => {
// 			const article = await getSaveArticleContent(el)
// 			if (!article) {
// 				console.log("Article Already Exists")
// 			}
// 		})
// 	} catch (error) {
// 		console.error('Error:', error)
// 	}
// })

/** Save PDF */
// cron.schedule(EVERY_WEEK, async () => {
// 	try {
// 		console.log("Saving PDF executed")
// 		await getPdfArticles()
// 	} catch (error) {
// 		console.error('Error:', error)
// 	}
// })

/** Save Health Articles Own */
// async function searchArticlesOwn() {
// 	try {
// 		console.log("Saving Health Articles Own")
// 		const articles = await getHealthArticles()
// 		if(articles?.pmcIds?.length > 0) {
// 			const article_ids = articles.pmcIds.map((el: any) => el.id)
// 			printDuplicates(article_ids)
// 			const dbIds = await getAllIdsFromDatabase()
// 			const nonExistingPmcIds = articles.pmcIds.filter((el: any) => !dbIds.includes(el.id))
// 			if(nonExistingPmcIds?.length > 0) {
// 				nonExistingPmcIds.forEach(async (el: any) => {
// 					const article = await getSaveArticleContentOwn(el.id, "", el.symptoms, el.treatments, el.preconditions)
// 					if (!article) {
// 						console.log("PMC Own Article Already Exists or Error")
// 					}
// 				})
// 			} else {
// 				console.log("No new article own")
// 			}
// 		}
// 		// if(articles?.pubmedIds?.length > 0) {
// 		// 	articles.pubmedIds.forEach(async (el: any) => {
// 		// 		const article = await getSaveArticleContent(el, "?is_pubmed=true")
// 		// 		if (!article) {
// 		// 			console.log("PubMed Article Already Exists or Error")
// 		// 		}
// 		// 	})
// 		// }
// 	} catch (error) {
// 		console.error('Error en search')
// 	}
// }

// function printDuplicates(arr: any[]) {
//     const frequency: { [key: string]: number } = {};

//     for (const item of arr) {
//         if (frequency[item]) {
//             frequency[item]++;
//         } else {
//             frequency[item] = 1;
//         }
//     }

//     for (const item in frequency) {
//         if (frequency[item] > 1) {
//             console.log(item);
//         }
//     }
// }

// searchArticlesOwn()

/** Save old Article */

// const waitTime = 1 * 1000

// const symptoms = [
// 	"dizziness","vertigo","headache","numbness of extremities","tingling of extremities","lack of coordination","loss or memory","tremors","lack of comprehension","depression","anxiety","sadness","fatigue",
// 	"anger","paranoid","detachment","burning eyes","floaters","itchy eyes","blurry vision","dry eyes","excessive tearing","macular degeneration","glaucoma","diabetic retinopathy","cataracts","Amblyopia",
// 	"conjunctivitis","stye","Strabismus","tinnitus","hearing loss","ear infection","pressure in the ears","ear discharge","vertigo","nasal congestion","sneezing","post nasal drip","sinus pressure","sinus pain",
// 	"stuffy nose","runny nose","loss of smell","loss of taste","sore throat","loss of voice","difficulty swallowing","tonsilitis","hoarseness of voice","cough","muscle cramping","muscle ache","muscle twitching",
// 	"muscle spasms","bruising","joint pain","brusitis","gout","muscle strain","osteoarthritis","rheumatoid arthritis","osteoporosis","nausea","vomiting","diarrhea","constipation","abdominal pain","heartburn",
// 	"bloating","gastritis","bloody stools","mucous in stools","hemorrhoids","hiatal hernia","rapid heart rate","slow heart rate","high blood pressure","low blood pressure","high cholesterol","irregular heart rate",
// 	"Pain","shortness of breath with exertion","wheezing","heart palpitations","shortness of breath at rest","chest congestion","urinary incontinence","pain with urination","burning with urination","cloudy urine",
// 	"blood in urine","overactive bladder","hives","rash","heat rash","contact dermatitis","rosacea","eczema","psoriasis","ringworm","painful menses","irregular menses","breast tenderness","pelvic pain",
// 	"bleeding inbetween menses","PMS","enlarged prostate","pain with intercourse","fever","chills","sleep apnea","insomnia","narcolepsy","restless leg syndrome","parasomia","migraine","neck pain","leg pain","arm pain",
// 	"hand pain","back pain","shoulder pain","knee pain","hip pain","ear pain","allergies","anorexia","light headedness","cold intolerance","heat intolerance","weight loss","weight gain","vaginal discharge",
// 	"penile discharge","jaundice","painful lymph nodes","bloody nose","nasal discharge","tooth ache","belching","flatulence","hair loss","abnormal hair growth","fainting","amenorrhea","double vision","bloody sputum",
// 	"urinary discharge","acne","ADD/ADHD","vaginitis","bowel incontinence","cold sore","endometriosis","erectile dysfunction","fibroids","food poisoning","nail infection","gum disease","hyperhidrosis","hypoglycemia",
// 	"hyperglycemia","hot flashes","nightsweats","thrush","aging","psoriatic arthritis","bacterial infections","c. difficile","escherichia coli","helicobacter pylori",
// 	"methicillin-resistant staphylococcus aureus","cystitis","bacterial vaginosis","small intestinal bacterial overgrowth",
// 	"strep throat","bronchitis","sinus infection","anemia","iron deficiency anemia","blood clot","iron overload","irregular heartbeat",
// 	"arteriosclerosis","atherosclerosis","hypotension","raynaud's syndrome","varicose veins","dehydration","indigestion",
// 	"acid reflux","colitis","menstrual cramps","diverticulitis","gastroesophageal reflux disease","bad breath","irritable bowel syndrome",
// 	"ulcers","hyperthyroidism","adrenal insufficiency","type 1 diabetes","type 2 diabetes","graves' disease","hypothyroidism",
// 	"polycystic ovary syndrome","metrorrhagia","premenstrual syndrome","fungal infection","yeast infection","nail fungus",
// 	"allergic rhinitis","food allergy","bruise","muscle sprain","fibrocystic breast","tendonitis","fatty liver","gallstones",
// 	"lymphedema","abscess","edema","swollen lymph nodes","dementia","low libido in women","low libido in men","mood swings",
// 	"obsessive compulsive disorder","brain fog","seasonal affective disorder","stress","tics","fibromyalgia","bell's palsy",
// 	"chronic fatigue syndrome","nerve pain","jaw pain","frozen shoulder","motion sickness","sciatica","trigeminal neuralgia",
// 	"tooth decay","tmj","estrogen dominance","prostatitis","chronic obstructive pulmonary disease","emphysema","influenza",
// 	"laryngitis","seasonal allergies","sinusitis","spasmodic cough","muscle pain","age spots","actinic keratosis","bug bites",
// 	"canker sore","cellulite","dandruff","seborrheic dermatitis","dry skin","herpes simplex 1","herpes simplex 2","lichen planus",
// 	"lichen sclerosus","scar","shingles","sunburn","wart","wound","wrinkles","bursitis","lipoma","interstitial cystitis","alzheimer",
// 	"angina","asthma","boils","candidiasis","carpal tunnel syndrome","celiac disease","common cold","crohn's disease","ulcerative colitis",
// 	"hay fever","tension headache","high triglycerides","kidney stones","menopause","menorrhagia","gingivitis","benign prostatic hyperplasia","lupus","thyroiditis","inflammation","heart disease","metabolic syndrome","covid-19",
// 	"long covid","gingivitis","dysmenorrhea","muscle weakness",
// 	"brittle nails","melasma","itchy skin","acanthosis nigricans"
// ]

// const treatments = [
// 	"vitamin b1","vitamin b2","vitamin b3","vitamin b5","vitamim b6","vitamin b7","vitamin b9","vitamin b12","vitamin c","quercetin","flavonoids","vitamin a","vitamin d",
// "vitamin e","vitamin k1","vitamin k2","vitamin k3","iron","calcium","iodine","potassium iodide","magnesium","zinc","selenium","copper","manganese","chromium","molybdenum",
// "choline","glycine","isoleucine","lysine","phenylalanine","serine","arginine","sarcosine","aspartic acid","threonine","alanine","proline","histidine","asparagine",
// "glutamic acid","glutamine","tryptophan","leucine","valine","tyrosine","cysteine","branched chain amino acids","amino acids","rebamipine","boron","vanadium","lutein",
// "lycopene","zeaxanthin","n-acetyl-cysteine","inositol","alpha lipoic acid","vaccinium angustifolium","olea europaea","pomegranate","vitis vinifera","polyphenol","green tea",
// "agrimony","aloe vera","angelica","anise","basil","bay leaf","borage","calendula","caraway","chamomile","chervil","chives","comfrey","coriander","dill","elderflower","fennel",
// "fenugreek","garlic","ginger","ginkgo","ginseng","horseradish","lemongrass","linseed","lovage","lungwort","marjoram","oregano","parsley","peppermint","rosemary","sage","sorrel",
// "st john’s wort","tansy","tarragon","thyme","turmeric","valerian","yarrow","vitamin c","lycopene","selenium","blueberries","glutathione","lipoic acid","flavonoid","coenzyme q10",
// "resveratrol","beta carotene","polyphenol","astaxanthin","broccoli","lutein","zinc","anthocyanins","kale","goji","artichokes","quercetin","curcumin","asparagus","apples","avacado",
// "alfalfa","acorn squash","almond","arugala","artichoke","applesauce","asian noodles","antelope","ahi tuna","albacore tuna","apple juice","avocado roll","bruscetta","bacon",
// "black beans","bagels","baked beans","bbq","bison","barley","beer","bisque","bluefish","bread","broccoli","buritto","babaganoosh","cabbage","cake","carrots","carne asada","celery",
// "cheese","chicken","catfish","chips","chocolate","chowder","clams","coffee","cookies","corn","cupcakes","crab","curry","cereal","chimichanga","dates","dips","duck","dumplings",
// "donuts","eggs","enchilada","eggrolls","english muffins","edimame","eel sushi","fajita","falafel","fish","franks","fondu","french toast","french dip","garlic","ginger","gnocchi",
// "goose","granola","grapes","green beans","guancamole","gumbo","grits","graham crackers","ham","halibut","hamburger","honey","huenos rancheros","hash browns","hot dogs","haiku roll",
// "hummus","ice cream","irish stew","indian food","italian bread","jambalaya","jelly","jerky","jalapeño","kale","kabobs","ketchup","kiwi","kidney beans","kingfish","lobster","lamb",
// "linguine","lasagna","meatballs","moose","milk","milkshake","noodles","pizza","pepperoni","porter","pancakes","quesadilla","quiche","reuben","spinach","spaghetti","waffles","wine",
// "walnuts","yogurt","ziti","zucchini","artichoke","aubergine","eggplant","asparagus","broccoflower","broccoli","brussels sprouts","cabbage","kohlrabi","savoy cabbage","red cabbage",
// "cauliflower","celery","endive","fiddleheads","frisee","fennel","greens","arugula","bok choy","chard","beet greens","collard greens","kale","lettuce","mustard greens","spinach",
// "herbs","anise","basil","caraway","coriander","chamomile","daikon","dill","fennel","lavender","cymbopogon","marjoram","lemongrass","oregano","parsley","rosemary","thyme","legumes",
// "alfalfa sprouts","azuki beans","bean sprouts","black beans","black-eyed peas","borlotti bean","broad beans","chickpeas","garbanzo","green beans","kidney beans","lentils",
// "lima beans","mung beans","navy beans","peanuts","pinto beans","runner beans","split peas","soy beans","peas","mange tout","snap peas","mushrooms","nettles","new zealand spinach",
// "okra","onions","chives","garlic","leek","onion","shallot","scallion","peppers","bell pepper","chili pepper","jalapeño","habanero","paprika","tabasco pepper","cayenne pepper",
// "radicchio","rhubarb","root vegetables","beetroot","carrot","celeriac","corms","eddoe","konjac","taro","water chestnut","ginger","parsnip","rutabaga","radish","wasabi","horseradish",
// "daikon","white radish","tubers","jicama","jerusalem artichoke","potato","sweet potato","yam","turnip","oyster plant","skirret","sweetcorn","topinambur","squashes","acorn squash",
// "bitter melon","butternut squash","banana squash","courgette","cucumber","delicata","gem squash","hubbard squash","squash","spaghetti squash","tat soi","tomato","watercress",
// "abiu","açaí","acerola","akebi","ackee","african cherry orange","american mayapple","apple","apricot","aratiles","araza","annona squamosa","avocado","banana","bilberry","blackberry",
// "blackcurrant","black sapote","blueberry","boysenberry","breadfruit","buddha's hand","cacao","cactus pear","canistel","catmon","cempedak","cherimoya","cherry","chico fruit",
// "cloudberry","coco de mer","coconut","crab apple","cranberry","currant","damson","date","dragonfruit","pitaya","durian","elderberry","feijoa","fig","finger lime","goji berry",
// "gooseberry","grape","raisin","grapefruit","grewia asiatica","guava","guyabano","hala fruit","honeyberry","huckleberry","jabuticaba","jackfruit","jambul","japanese plum","jostaberry",
// "jujube","juniper berry","kaffir lime","kiwano","kiwifruit","kumquat","lanzones","lemon","lime","loganberry","longan","loquat","lulo","lychee","magellan barberry","macopa",
// "mamey apple","mamey sapote","mango","mangosteen","marionberry","melon","cantaloupe","galia melon","honeydew","mouse melon","musk melon","watermelon","miracle fruit","momordica fruit",
// "monstera deliciosa","mulberry","nance","nectarine","orange","blood orange","clementine","mandarine","tangerine","papaya","passionfruit","pawpaw","peach","pear","persimmon",
// "plantain","plum","prune","pineapple","pineberry","plumcot","pomegranate","pomelo","purple mangosteen","quince","raspberry","salmonberry","rambutan","redcurrant","rose apple",
// "salal berry","salak","santol","sampaloc","sapodilla","sapote","sarguelas","satsuma","soursop","star apple","star fruit","strawberry","surinam cherry","tamarillo","tamarind","tangelo",
// "tayberry","tambis","thimbleberry","ugli fruit","white currant","white sapote","ximenia","yuzu","bell pepper","carolina reaper","chile pepper","corn kernel","cucumber","jalapeño",
// "alpha-linolenic acid","eicosapentaenoic acid","docosahexaenoic acid","linoleic acid","arachidonic acid","gamma linoleic","conjugated linoleic acid","bharadvaja's twist","big toe pose",
// "boat pose","bound angle pose","bow pose","bridge pose","camel pose","cat pose","chair pose","child’s pose","cobra pose","corpse pose","cow face pose","cow pose","crane (crow) pose",
// "dolphin plank pose | forearm plank","dolphin pose","downward-facing dog","eagle pose","easy pose","eight-angle pose","extended hand-to-big-toe pose","extended puppy pose",
// "extended side angle pose","extended triangle pose","feathered peacock pose","fire log pose","firefly pose","fish pose","four-limbed staff pose","garland pose","gate pose",
// "half frog pose","half lord of the fishes pose","half moon pose","handstand","happy baby pose","head-to-knee pose","hero pose","heron pose","high lunge","high lunge, crescent variation",
// "intense side stretch pose | pyramid pose","legs-up-the-wall pose","locust pose","lord of the dance pose","lotus pose","low lunge","marichi’s pose","monkey pose","mountain pose",
// "rope pose","one-legged king pigeon pose","one-legged king pigeon pose ii","peacock pose","pigeon pose","plank pose","plow pose","pose dedicated to the sagekoundinya i",
// "pose dedicated to the sagekoundinya ii","pose dedicated to the sage marichi i","reclining bound angle pose","reclining hand-to-big-toe pose","reclining hero pose",
// "revolved head-to-knee pose","revolved side angle pose","revolved triangle pose","scale pose","seated forward bend","shoulder-pressing pose","side crane (crow) pose","side plank pose",
// "side-reclining leg lift","sphinx pose","staff pose","standing forward bend","standing half forward bend","standing split","supported headstand","supported shoulderstand",
// "tree pose","upward bow (wheel) pose","upward facing two-foot staff pose","upward plank pose | reverse plank","upward salute","upward-facing dog pose","warrior i pose",
// "warrior ii pose","warrior iii pose","wide-angle seated forward bend","wide-legged forward bend","acacia catechu","acacia nilotica","achillea millefolium","achyranthes",
// "aconitum","acorus calamus","actaea racemosa","adansonia digitata","aesculus hippocastanum","alangium salviifolium","allium cepa","allium sativum","aloe vera","andrographis paniculata",
// "angelica archangelica","angelica sinensis","apium graveolens","aralia","arctium lappa","arctostaphylos uva-ursi","areca catechu","aristolochia","arnica montana","aronia melanocarpa",
// "artemisia","aspalathus linearis","asparagus racemosus","asparagus","astragalus membranaceus","astragalus","atractylodes","atropa belladonna","avena sativa","azadirachta indica",
// "bacopa monnieri","bassia scoparia","berberis aquifolium","berberis","betula","borago officinalis","boswellia serrata","brassica juncea","brassica oleracea broccoli group","bryonia",
// "bulbine natalensis","bupleurum","calendula officinalis","calophyllum","camellia sinensis","camptotheca acuminata","cannabis sativa","capsicum annuum","caulophyllum thalictroides",
// "celastrus paniculatus","centaurea","centaurium erythraea","centella asiatica","chelidonium majus","cichorium intybus","cinnamomum spp.","cinnamomum verum","cistus x incanus",
// "citrus x aurantium","clematis","codonopsis","coffea arabica","coffea","colchicum autumnale","commiphora mukul","cordyceps","coriandrum sativum","cornus florida","crataegus",
// "crinum latifolium","crocus sativus","curcuma longa","cynara cardunculus cardoon group","cynara cardunculus scolymus group","cynodon dactylon","cyperus rotundus","datura stramonium",
// "dioscorea","dryopteris","echinacea purpurea, e. angustifolia, e. pallida","eclipta","elettaria cardamomum","eleutherococcus senticosus","ephedra sinica","epimedium",
// "equisetum arvense","equisetum hyemale","erigeron breviscapus","eriodictyon californicum","eschscholzia californica","eucalyptus globulus","eugenia","eupatorium","eurycoma longifolia",
// "euterpe oleracea","ferula","ficus carica","foeniculum vulgare","forsythia suspensa","fucus vesiculosus","ganoderma lucidum","garcinia gummi-gutta","garcinia kola","garcinia mangostana",
// "garcinia","gentiana","ginkgo biloba","glycine max","glycyrrhiza glabra","gossypium herbaceum","grifola frondosa","gymnema sylvestre","hamamelis virginiana","harpagophytum procumbens",
// "helichrysum italicum","hemidesmus indicus","hibiscus sabdariffa","hibiscus","hoodia gordonii","humulus lupulus","hydrastis canadensis","hyoscyamus niger","hypericum perforatum",
// "ilex guayusa","ilex paraguariensis","illicium verum","inula","juniperus","justicia adhatoda","kadsura","kochia scoparia","larrea tridentata","laurus nobilis","lavandula angustifolia",
// "lavandula","lentinus edodes","leonurus cardiaca","lepidium meyenii","lepidium","ligusticum striatum","linum usitatissimum","lobelia inflata","lonicera japonica","luffa","lycium",
// "malpighia glabra","matricaria chamomilla","medicago sativa","melaleuca alternifolia","melissa officinalis","mentha pulegium,","mentha spicata","mentha x piperita","mitragyna speciosa",
// "momordica charantia","morinda","mosannona depressa","musa","myrica","myristica fragrans","nelumbo nucifera","nigella sativa","nyctanthes arbortristis","ocimum spp.","ocimum tenuiflorum",
// "oenothera biennis","olea europaea","origanum vulgare","panax ginseng","panax notoginseng","panax quinquefolius","panax","passiflora","paullinia cupana","pausinystalia johimbe",
// "pelargonium sidoides","persicaria minor","phyllanthus emblica","phytolacca dodecandra","pimpinella anisum","piper methysticum","piper nigrum","plantago afra","plantago major",
// "podophyllum peltatum","potentilla","primula veris","propolis","prunella vulgaris","prunus africana","prunus cerasus","prunus persica","pueraria lobata","punica granatum","quassia",
// "quercus infectoria","rauwolfia serpentina","rehmannia glutinosa","rhodiola rosea","ribes nigrum","rosa canina","rubus idaeus","rumex acetosa","rumex crispus","ruscus aculeatus",
// "ruta graveolens","saccharomyces cerevisiae","salix alba","salvia hispanica","salvia miltiorrhiza","salvia officinalis","salvia rosmarinus","sambucus nigra","sanguinaria canadensis",
// "sassafras albidum","sceletium tortuosum","schisandra chinensis","scutellaria baicalensis","senna alexandrina","serenoa repens","silybum marianum","sinupret","siraitia grosvenorii",
// "smilax glabra","stevia rebaudiana","styphnolobium japonicum","swertia","symphytum officinale","syzygium aromaticum","syzygium cumini","syzygium","tabebuia impetiginosa",
// "tabernanthe iboga","tamarindus indica","tanacetum parthenium","tanacetum vulgare","taraxacum officinale","terminalia arjuna","terminalia bellerica","terminalia chebula",
// "theobroma cacao","thuja occidentalis","thuja plicata","thymus vulgaris","tribulus terrestris","trichosanthes","trifolium pratense","trigonella foenum-graecum","triphala",
// "uncaria","uncaria tomentosa","urtica dioica","vaccinium macrocarpon","vaccinium myrtillus","valeriana officinalis","verbascum thapsus","verbena officinalis","viburnum",
// "viscum album","vitex agnus-castus","vitis vinifera","withania somnifera","xylopia aromatica","yucca schidigera","zanthoxylum","zea mays","zingiber officinale","ziziphus",
// "lactobacillus rhamnosus","lactobacillus plantarum","lactobacillus casei","lactobacillus","bifidobacterium longum","bifidobacterium animalis","bifidobacterium bifidum",
// "bifidobacterium","lactobacillus reuteri","bacillus coagulans","bifidobacterium breve","lactobacillus bulgaricus","lactobacillus fermentum","bifidobacterium animalis subsp. lactis bb-12",
// "lactobacillus helveticus","lactobacillus brevis","lactococcus lactis","lactobacillus gasseri","streptococcus thermophilus","saccharomyces boulardii","alkalihalobacillus clausii",
// "bifidobacterium adolescentis","lacticaseibacillus paracasei","lactobacillus acidophilus","sitz bath","hydrotherapy","sauna","steam inhalation","aquatic exercise","immersion therapy",
// "acupuncture","moxibustion","acupressure","earthing","forest bathing","epsom salt","physical therapy","castor oil","angelica root essential oil","balsam gurjun essential oil",
// "balsam peru essential oil","balsam poplar essential oil","basil linalool essential oil","bay laurel essential oil","benzoin resinoid in dpg","benzoin resinoid, extruded",
// "bergamot essential oil","bergamot mint essential oil","birch sweet essential oil","black pepper essential oil","blood orange essential oil","blue tansy essential oil",
// "buddha wood essential oil","cajeput essential oil","caraway seed essential oil","cardamom essential oil","cedarwood atlas essential oil","cedarwood essential oil",
// "celery seed essential oil","german chamomile essential oil","roman chamomile essential oil","cinnamon bark essential oil","cinnamon leaf essential oil","cistus absolute",
// "citronella essential oil","clary sage essential oil","clove bud essential oil","clove leaf essential oil","cocoa absolute","coffee essential oil","copaiba balsam essential oil",
// "coriander essential oil","cumin essential oil","cypress essential oil","dalmatian sage essential oil","dill essential oil","elemi essential oil",
// "eucalyptus citriodora essential oil","eucalyptus globulus essential oil","eucalyptus radiata essential oil","eucalyptus smithii essential oil","fennel essential oil, sweet",
// "fir needle essential oil","frankincense essential oil","frankincense serrata essential oil","galbanum essential oil","geranium bourbon essential oil","geranium essential oil",
// "ginger essential oil","ginger lily essential oil","goldenrod essential oil","grapefruit essential oil","helichrysum essential oil","helichrysum rambiazina essential oil",
// "hinoki wood","holy basil essential oil","hyssop decumbens essential oil","hyssop essential oil","jasmine absolute","juniper berry essential oil – wildcrafted",
// "kanuka essential oil","lavandin essential oil","lavender essential oil","lemongrass essential oil","lemon essential oil","lemon myrtle essential oil","lemon verbena essential oil",
// "magnolia flower oil","mandarin essential oil","manuka essential oil","marjoram essential oil","may chang essential oil","melissa essential oil","myrrh essential oil",
// "myrtle essential oil","neroli essential oil","niaouli essential oil","nutmeg essential oil","oak moss absolute","oregano essential oil","osmanthus absolute","palmarosa essential oil",
// "palo santo essential oil","patchouli essential oil","peppermint essential oil","petitgrain essential oil","pine needle essential oil, scotch","pink grapefruit essential oil",
// "pink lotus absolute","pink pepper essential oil","plai essential oil","ravensara bark essential oil","ravintsara leaf essential oil","rosemary essential oil","rose absolute",
// "rose geranium essential oil","rose otto essential oil","sandalwood essential oil","spanish sage essential oil","spearmint essential oil","spruce essential oil",
// "sweet orange essence oil","tangerine essential oil","tea tree essential oil","thyme linalol essential oil","turmeric essential oil","valerian root essential oil","vanilla absolute",
// "vetiver essential oil","vitex essential oil","white lotus absolute","wintergreen essential oil","yarrow essential oil","ylang ylang essential oil","yuzu essential oil",
// "emblica officinalis","amla","saraca asoca","withania somnifera","aconitum heterophyllum","aegle marmelos","phyllanthus amarus","bacopa monnieri","santalum album","swartia chirata",
// "tinospora cordifolia","gymnema sylvestre","commiphora wightii","barberis aristata","plantago ovata","nardostachys jatamansi","andrographis paniculata","gloriosa superba",
// "garcinia indica","saussurea costus","picrohiza kurroa","glycyrrhiza glabra","piper longum","solanum nigrum","chlorophytum arundinaceum","saxtragus ligulata","crocus sativus",
// "rauvolria serpentina","cassia angustifolia","asparagus racemosus","ocimum sanctum","embelia ribes","aconitum ferox","aerobic exercise","strength training","pilates","yoga",
// "cycling","swimming","walking","aerobics","running","stretching","circuit training","water aerobics","tai chi","dance","weightlifting","strength and balance exercises","jogging",
// "rowing","boxing","hiking","physical strength","squats","push-up","interval training","transcendental meditation","mindfulness","samatha-vipassana","vipassanā","walking meditation",
// "qigong","progressive muscle relaxation","guided meditation","zazen","tai chi","mindfulness-based stress reduction","mantra","guided imagery","zen","buddhist meditation",
// "taoist meditation","sound","maitrī","diaphragmatic breathing","kundalini yoga","chakra","deep breathing","diaphragmatic breathing","pursed lips breathing","box breathing",
// "pranayama","mindful breathing","cardiac coherence breathing","alternating nostril breathing","biofeedback","neurofeedback","rebounding","sleep hygiene","journaling","mouth taping",
// "cold compress","mustard compress","onion compress","cold wet sock","seed cycling","apple cider vinegar","digestive bitters","dry skin brushing","neti pot","oil pulling",
// "allergy elimination diet","candida diet","fermented foods","xylitol","lung percussion","weight bearing exercise","coffee enema","butyric acid","bacillus licheniformis",
// "bacillus indicus hu36","bacillus subtilis hu58","bacillus clausii","bacillus coagulans","black walnut","caprylic acid","coconut oil","avocado oil","sesame oil","fish oil",
// "krill oil","astaxanthin","jojoba oil","almond oil","walnut oil","argan oil","blue light glasses","hydrotherapy","cold plunge","intermittent fasting","juice fast","water fast",
// "ozonated oil","olive oil","salt water float","cupping","goji berry","codonopsis","astragalus","chinese yam","chinese angelica root","eucommia bark","poria","american ginseng",
// "cordyceps","korean ginseng","licorice root","red dates","ginger, zingiber","cinnamomum","paeonia lactiflora","bupleurum","ligusticum","coptis chinensis","scuttellaria biacalensis",
// "phellodendron chinese bark","arctium lappa","taraxacum","rehmannia glutinosa","dioscorea opposita","paeonia suffruticosa","prunus armeniaca","gentiana scabra","plantago asiatica",
// "lycium chinense","prunus persica","rheum palmatum","citrus reticulata peel","platycladus orientalis","magnolia officinalis","pinellia ternata","ziziphys jujuba","cyperus rotundus",
// "aractylodes macrocephala","poria cocos","corydalis yanhusuo","aucklandia lappa","curcuma","polygonatum odoratum","stephania tetrandra","alisma orientalis","angelica dahurica",
// "plantago asiatica","gardenia jasminoides","abrus cantoniensis","salvia miltiorrhiza","inula helenium","clematis armandi","boswellia carterii","eucommia ulmoides","potassium ","apple sauce","chichorium endivia","stinging nettles","trapa natans","ribes rubrum",
// 	"phoenix dactylifera","emblica officinalis ","vaccinium membranaceum dougl","mangifera indica","momordica",
// 	"pyramid pose","upward plank pose ","artemisia absinthium","brassica oleracea ","cynara ","echinacea angustifolia",
// 	"echinacea pallida","lemon balm","holy basil","epsom salt bath","juniper berry essential oil ","meditation","asian ginseng",
// 	"ligusticum porteri","5-htp","medium-chain triglycerides","polyglycoplex","azelaic acid","probiotic","grape seed extract",
// 	"pine bark extract","fiber","phosphatidylserine","l-acetylcarnitine","carnitine","hawthorn","omega-3 fatty acids",
// 	"hedera helix","l-theanine","bromelain","bubble blowing","postural draining","berberine","humidifier","indole-3-carbinol",
// 	"evening primrose oil","vegetarian diet","food allergy avoidance","lecithin","rutin","low-purine alkaline-ash diet",
// 	"celery seed extract","apple polyphenols","dietary goitrogens avoidance","flax seed oil","di-indoylmethane","folic acid",
// 	"butterbur","saffron","fumaric acid","capsaicin cream","bioflavonoids","nasal rinse","boric acid","dhea","walnut",
// 	"spirulina","methylsulfonylmethane","cat's claw","calcium ascorbate","olive leaf","melatonin","vitamin b-complex",
// 	"marshmellow root","baking soda","biotin","slippery elm","nattokinase","serrapeptase","colloidal silver","red yeast rice",
// 	"palmitoylethanolimide","gamma-aminobutyric acid","ultrasound","phosphatidylcholine","wheatgrass","barley grass","lauric acid",
// 	"monolaurin","chondroitin","glucosamine","collagen","hyaluronic acid","triticum vulgare","methionine","calcium b-hydroxy b-methylbutyrate",
// 	"gamma-linolenic acid","betaine hydrochloride","l-glutamic acid hydrochloride","pancreatin","same","shepherd's purse","sodium","silicon",
// 	"taurine","omega 6 fatty acids","maitake mushroom","chaga","lion's mane","coleus forskohlii","bugleweed","pipsissewa","buchu",
// 	"coriolus versicolor","eyebright","american skullcap ","caffeine","creatine","citicoline ","d-mannose","fulvic acid",
// 	"berberis vulgaris","blessed thistle","waterhyssop","butea superba","myrciaria dubia","cascara sagrada","nepeta cataria",
// 	"catuaba","chicory","chlorella vulgaris","galium aparine","he shou wu","piscidia piscipula","lomatium","manuka honey",
// 	"filipendula ulmaria","artemisia vulgaris","pleurisy root","ceanothus americanus","rose hip","hippophae rhamnoides",
// 	"wild cherry bark","opuntia","bottle blowing","brazil nut","palmaria palmata","pistacia vera","hemp seeds","cumin",
// 	"anethum graveolens","sesamum indicum","cucurbita maxima","anacardium occidentale","alternating hot and cold showers",
// 	"stomach 36 acupressure point","ren 6 acupressure point","spleen 6 acupressure point","liver 3 acupressure point",
// 	"large intestines 4 acupressure point","large intestines 11 acupressure point","kidney 7 acupressure point","du 4 acupressure point",
// 	"spleen 9 acupressure point","liver 8 acupressure point","ren 17 acupressure point","lung 7 acupressure point","lung 1 acupressure point",
// 	"urinary bladder 2 acupressure point","large intestines 20 acupressure point","si-shen-cong acupressure point","an mian acupressure point",
// 	"spleen 10 acupressure point","yin tang acupressure point","liver 2 acupressure point","stomach 25 acupressure point","heart 7 acupressure point",
// 	"epigallocatechin gallate","glycosaminoglycans","brown rice","ginseng radix et rhizoma","lymphatic massage","hyperbaric oxygen treatment","manual therapy","acupressure","salt water gargle","yoga ocular exercise","nail oil",
// 	"pelvic floor therapy","spinal manipulation therapy","myofascial physical therapy","zinc pyrithione shampoo"
// ]

// const symptoms2 = ["macular degeneration", "diabetic retinopathy", "cataracts", "ear infection", "pressure in the ears", "ear discharge", "nasal congestion", "loss of smell",
// "loss of taste", "muscle ache", "joint pain", "muscle strain", "osteoarthritis", "diarrhea", "constipation", "abdominal pain", "heartburn", "bloating",
// "heart palpitations", "hives", "rash", "contact dermatitis", "eczema", "breast tenderness", "pelvic pain", "enlarged prostate", "fever", "neck pain",
// "leg pain", "arm pain", "hand pain", "back pain", "shoulder pain", "knee pain", "hip pain", "ear pain", "light headedness", "cold intolerance",
// "heat intolerance", "weight loss", "weight gain", "vaginal discharge", "painful lymph nodes", "tooth ache", "belching", "hair loss", "abnormal hair growth",
// "amenorrhea", "urinary discharge", "acne", "add/adhd", "vaginitis", "hyperhidrosis", "hypoglycemia", "hot flashes", "helicobacter pylori", "bacterial vaginosis",
// "small intestinal bacterial overgrowth", "bronchitis", "sinus infection", "hypotension", "acid reflux", "colitis", "menstrual cramps", "bad breath",
// "irritable bowel syndrome", "ulcers", "adrenal insufficiency", "graves' disease", "muscle sprain", "fibrocystic breast", "swollen lymph nodes",
// "low libido in women", "low libido in men", "brain fog", "seasonal affective disorder", "chronic fatigue syndrome", "nerve pain", "jaw pain",
// "frozen shoulder", "motion sickness", "influenza", "seasonal allergies", "muscle pain", "interstitial cystitis", "candidiasis", "carpal tunnel syndrome",
// "celiac disease", "hay fever", "tension headache", "gingivitis", "dysmenorrhea", "muscle weakness", "asthma", "allergic rhinitis", "allergies",
// "alzheimer's disease", "anxiety", "benign prostate hypertrophy", "common cold", "conjunctivitis", "cough", "crohn's disease", "diabetes insipidus",
// "depression", "diverticulitis", "dizziness", "endometriosis", "fibroids", "glomerulonephritis", "fibromyalgia", "gastroesophageal reflux disease",
// "gastritis", "gout", "headache", "high blood pressure", "high cholesterol", "indigestion", "infertility", "insomnia", "lichen planus", "menopause",
// "migraine", "non-alcoholic fatty liver disease", "norovirus", "obesity", "obsessive compulsive disorder", "osteoporosis", "pelvic inflammatory disease",
// "peptic ulcer", "pneumonia", "polycystic ovary syndrome", "premenstrual syndrome", "psoriasis", "psoriatic arthritis", "restless legs syndrome",
// "retinoblastoma", "rheumatoid arthritis", "sinusitis", "tinnitus", "tonsillitis", "ulcerative colitis", "urinary tract infection", "vertigo",
// "diabetic neuropathy", "adrenocortical insufficiency", "hypothyroidism", "hyperthyroidism", "irritable bowel syndrome (diarrhea)",
// "irritable bowel syndrome (constipation)", "irritable bowel syndrome (mixed)", "internal hemorrhoid", "dermatitis", "dyshidrotic dermatitis",
// "hormone imbalance", "burning tongue", "nerve damage", "alopecia areata", "insulin resistance", "prediabetes", "labyrinthitis",
// "vestibular neuritis", "pilonidal cyst", "meniere's disease", "wrist pain", "ankle pain", "low back pain", "osteopenia", "weakened bones",
// "vaginal dryness", "bone fractures", "joint stiffness", "nocturia", "slow healing wounds", "goiter", "lower back pain", "stiff muscles",
// "muscle stiffness", "male-pattern baldness", "muscle tension", "irritability", "abdominal pain that improves after eating",
// "abdominal pain that worsens after eating", "dry cough", "eye strain", "aging", "muscle strain"]

// const treatments2 = ["vitamin b1", "vitamin b2", "vitamin b3", "vitamin b5", "vitamin b6", "vitamin b12", "vitamin c", "quercetin", "vitamin a", "vitamin d",
// "vitamin e", "vitamin k1", "vitamin k2", "vitamin k3", "iron", "calcium", "iodine", "potassium", "magnesium", "zinc", "selenium", "copper",
// "manganese", "chromium", "molybdenum", "choline", "glycine", "isoleucine", "lysine", "phenylalanine", "glutamine", "tryptophan", "leucine",
// "valine", "tyrosine", "cysteine", "amino acids", "rebamipine", "boron", "vanadium", "lutein", "lycopene", "zeaxanthin", "n-acetyl-cysteine",
// "inositol", "alpha lipoic acid", "vaccinium angustifolium", "olea europaea", "vitis vinifera", "polyphenol", "green tea", "agrimony", "aloe vera",
// "anise", "basil", "calendula", "chervil", "elderflower", "fenugreek", "horseradish", "lemongrass", "linseed", "lovage", "lungwort", "parsley",
// "sorrel", "tarragon", "glutathione", "coenzyme q10", "resveratrol", "beta carotene", "astaxanthin", "broccoli", "anthocyanins", "kale", "asparagus",
// "avocado", "alfalfa", "alpha-linolenic acid", "eicosapentaenoic acid", "docosahexaenoic acid", "linoleic acid", "arachidonic acid", "gamma linoleic",
// "conjugated linoleic acid", "acacia catechu", "acacia nilotica", "achillea millefolium", "achyranthes", "aconitum", "acorus calamus", "actaea racemosa",
// "adansonia digitata", "aesculus hippocastanum", "alangium salviifolium", "allium cepa", "allium sativum", "andrographis paniculata", "angelica archangelica",
// "angelica sinensis", "apium graveolens", "aralia", "arctium lappa", "arctostaphylos uva-ursi", "areca catechu", "aristolochia", "arnica montana",
// "aronia melanocarpa", "artemisia absinthium", "aspalathus linearis", "asparagus racemosus", "astragalus membranaceus", "atractylodes", "avena sativa",
// "azadirachta indica", "bacopa monnieri", "bassia scoparia", "berberis aquifolium", "betula", "borago officinalis", "boswellia serrata", "brassica juncea",
// "brassica oleracea", "capsicum annuum", "caulophyllum thalictroides", "commiphora mukul", "cordyceps", "coriandrum sativum", "cornus florida",
// "crinum latifolium", "curcuma longa", "cynara", "cynodon dactylon", "cyperus rotundus", "datura stramonium", "dioscorea", "dryopteris", "echinacea purpurea",
// "echinacea angustifolia", "echinacea pallida", "eclipta", "elettaria cardamomum", "eleutherococcus senticosus", "ephedra sinica", "epimedium",
// "equisetum arvense", "equisetum hyemale", "erigeron breviscapus", "eriodictyon californicum", "eschscholzia californica", "eucalyptus globulus", "eugenia",
// "eupatorium", "eurycoma longifolia", "euterpe oleracea", "ferula", "ficus carica", "foeniculum vulgare", "forsythia suspensa", "fucus vesiculosus",
// "ganoderma lucidum", "garcinia gummi-gutta", "garcinia kola", "garcinia mangostana", "garcinia", "gentiana", "ginkgo biloba", "gossypium herbaceum",
// "grifola frondosa", "gymnema sylvestre", "hamamelis virginiana", "harpagophytum procumbens", "helichrysum italicum", "hemidesmus indicus", "hibiscus",
// "hoodia gordonii", "humulus lupulus", "hydrastis canadensis", "hypericum perforatum", "ilex guayusa", "ilex paraguariensis", "illicium verum",
// "inula helenium", "juniperus", "justicia adhatoda", "kadsura", "kochia scoparia", "larrea tridentata", "laurus nobilis", "lavandula", "lentinus edodes",
// "leonurus cardiaca", "lepidium", "linum usitatissimum", "lobelia inflata", "lonicera japonica", "luffa", "lycium", "malpighia glabra", "medicago sativa",
// "melaleuca alternifolia", "lemon balm", "mentha pulegium", "mentha spicata", "mentha x piperita", "mitragyna speciosa", "morinda", "mosannona depressa",
// "musa", "myrica", "myristica fragrans", "nelumbo nucifera", "nigella sativa", "nyctanthes arbortristis", "holy basil", "oenothera biennis",
// "origanum vulgare", "panax notoginseng", "passiflora", "paullinia cupana", "pausinystalia johimbe", "pelargonium sidoides", "persicaria minor",
// "phyllanthus emblica", "pimpinella anisum", "piper methysticum", "piper nigrum", "plantago afra", "plantago major", "podophyllum peltatum",
// "potentilla", "primula veris", "propolis", "prunella vulgaris", "prunus africana", "prunus cerasus", "prunus persica", "pueraria lobata",
// "punica granatum", "quassia", "quercus infectoria", "rauwolfia serpentina", "rehmannia glutinosa", "rhodiola rosea", "ribes nigrum", "rosa canina",
// "rubus idaeus", "rumex acetosa", "rumex crispus", "ruscus aculeatus", "ruta graveolens", "salix alba", "salvia hispanica", "salvia miltiorrhiza",
// "salvia officinalis", "salvia rosmarinus", "sambucus nigra", "sanguinaria canadensis", "sassafras albidum", "sceletium tortuosum", "schisandra chinensis",
// "scutellaria baicalensis", "serenoa repens", "silybum marianum", "sinupret", "siraitia grosvenorii", "smilax glabra", "styphnolobium japonicum",
// "swertia", "symphytum officinale", "syzygium aromaticum", "syzygium cumini", "tabebuia impetiginosa", "tabernanthe iboga", "tamarindus indica",
// "tanacetum parthenium", "tanacetum vulgare", "terminalia arjuna", "terminalia bellerica", "theobroma cacao", "thuja occidentalis", "thuja plicata",
// "thymus vulgaris", "tribulus terrestris", "trichosanthes", "trifolium pratense", "terminalia chebula", "vaccinium macrocarpon", "vaccinium myrtillus",
// "valeriana officinalis", "verbascum thapsus", "verbena officinalis", "viburnum", "vitex agnus-castus", "withania somnifera", "xylopia aromatica",
// "yucca schidigera", "zanthoxylum", "zea mays", "ziziphus", "bifidobacterium", "lactobacillus", "sitz bath", "hydrotherapy", "sauna", "acupuncture",
// "moxibustion", "earthing", "forest bathing", "epsom salt bath", "physical therapy", "castor oil", "chinese yam", "eucommia bark", "poria",
// "american ginseng", "asian ginseng", "licorice root", "red dates", "zingiber", "cinnamomum", "paeonia lactiflora", "ligusticum porteri",
// "coptis chinensis", "phellodendron chinese bark", "taraxacum", "paeonia suffruticosa", "plantago asiatica", "boswellia carterii", "eucommia ulmoides",
// "5-htp", "medium-chain triglycerides", "polyglycoplex", "azelaic acid", "probiotic", "grape seed extract", "pine bark extract", "fiber",
// "phosphatidylserine", "l-acetylcarnitine", "carnitine", "hawthorn", "omega-3 fatty acids", "hedera helix", "l-theanine", "bromelain", "kiwifruit",
// "berberine", "humidifier", "indole-3-carbinol", "evening primrose oil", "vegetarian diet", "food allergy avoidance", "lecithin", "rutin",
// "low-purine alkaline-ash diet", "celery seed extract", "apple polyphenols", "dietary goitrogens avoidance", "flax seed oil", "di-indoylmethane",
// "folic acid", "butterbur", "saffron", "fumaric acid", "capsaicin cream", "bioflavonoids", "nasal rinse", "boric acid", "dhea",
// "branched chain amino acids", "walnut", "spinach", "spirulina", "methylsulfonylmethane", "cat's claw", "calcium ascorbate", "olive leaf",
// "melatonin", "vitamin b-complex", "marshmellow root", "baking soda", "biotin", "slippery elm", "nattokinase", "serrapeptase", "colloidal silver",
// "red yeast rice", "palmitoylethanolimide", "gamma-aminobutyric acid", "ultrasound", "phosphatidylcholine", "wheatgrass", "barley grass",
// "lauric acid", "monolaurin", "chondroitin", "glucosamine", "collagen", "hyaluronic acid", "triticum vulgare", "methionine",
// "calcium β-hydroxy β-methylbutyrate", "gamma-linolenic acid", "betaine hydrochloride", "l-glutamic acid hydrochloride", "pancreatin",
// "adenosyl methionine", "shepherd's purse", "sodium", "silicon", "taurine", "omega 6 fatty acids", "maitake mushroom", "chaga", "lion's mane", "coleus forskohlii",
// "bugleweed", "pipsissewa", "buchu", "coriolus versicolor", "eyebright", "american skullcap", "creatine", "citicoline", "d-mannose", "fulvic acid",
// "berberis vulgaris", "blessed thistle", "hippophae rhamnoides", "wild cherry bark", "opuntia", "bottle blowing", "brazil nut", "palmaria palmata",
// "pistacia vera", "hemp seeds", "cumin", "anethum graveolens", "sesamum indicum", "cucurbita maxima", "anacardium occidentale",
// "alternating hot and cold showers", "epigallocatechin gallate", "glycosaminoglycans", "brown rice", "ginseng radix et rhizoma",
// "lymphatic massage", "hyperbaric oxygen treatment", "manual therapy", "citronella essential oil", "clove bud essential oil",
// "clove leaf essential oil", "lavender essential oil", "lemongrass essential oil", "peppermint essential oil", "spearmint essential oil",
// "thyme linalol essential oil", "saraca asoca", "aegle marmelos", "phyllanthus amarus", "santalum album", "swartia chirata", "tinospora cordifolia",
// "commiphora wightii", "barberis aristata", "plantago ovata", "nardostachys jatamansi", "gloriosa superba", "garcinia indica", "saussurea costus",
// "picrohiza kurroa", "piper longum", "aerobic exercise", "strength training", "yoga", "tai chi", "qigong", "progressive muscle relaxation",
// "diaphragmatic breathing", "pranayama", "mindful breathing", "cardiac coherence breathing", "alternating nostril breathing", "biofeedback",
// "neurofeedback", "rebounding", "sleep hygiene", "journaling", "mouth taping", "cold compress", "mustard compress", "onion compress",
// "cold wet sock", "seed cycling", "apple cider vinegar", "digestive bitters", "dry skin brushing", "neti pot", "oil pulling", "candida diet",
// "fermented foods", "xylitol", "lung percussion", "weight bearing exercise", "butyric acid", "black walnut", "caprylic acid", "coconut oil",
// "avocado oil", "sesame oil", "krill oil", "jojoba oil", "almond oil", "walnut oil", "argan oil", "cold plunge", "mediterranean diet",
// "chlorophyll", "ultraviolet light therapy", "electrolytes", "resperate", "fodmap", "psychotherapy", "lactobacillus species",
// "bifidobacterium species", "proanthocyanidins", "prebiotic", "senna", "transcutaneous electrical nerve stimulation", "hesperidin",
// "glycerin suppositories", "cognitive therapy", "zinc monocysteine", "serratia peptidase", "procyanidolic oligomers", "chiropractic",
// "osteopathic manipulation", "glycerophosphocholine", "isometric exercise", "laser therapy", "low-frequency pulsed magnetic fields",
// "gamma-oryzanol", "carnosine", "citrulline", "strontium", "acupressure", "salt water gargle", "yoga ocular exercise", "nail oil",
// "pelvic floor therapy", "spinal manipulation therapy", "myofascial physical therapy", "zinc pyrithione shampoo", "tilia americana",
// "huperzine a", "hydrochloric acid", "bile acid", "psyllium", "carob", "electroacupuncture", "antioxidants", "tormentil root", "sunlight",
// "postural drainage", "proteolytic enzymes", "lemon verbena", "chrysanthemum"]

// const symptoms3 = ["numbness of extremities", "tingling of extremities", "lack of coordination", "loss of memory", "tremors", "lack of comprehension", "sadness",
// "fatigue", "anger", "burning eyes", "floaters", "itchy eyes", "blurry vision", "dry eyes", "excessive tearing", "candidiasis", "carpal tunnel syndrome",
// "celiac disease", "hay fever", "tension headache", "high triglycerides", "kidney stones", "menorrhagia", "gingivitis", "dysmenorrhea", "muscle weakness",
// "brittle nails", "melasma", "itchy skin", "acanthosis nigricans", "thyroiditis", "inflammation", "heart disease", "pharyngitis", "esophageal achalasia",
// "polymyositis", "nocturnal myoclonus", "short bowel syndrome", "osmotic diarrhea", "secretory diarrhea", "exudative diarrhea", "inadequate-contact diarrhea",
// "infectious diarrhea", "acute diarrhea", "chronic diarrhea", "hemorrhagic diarrhea", "diverticular disease", "gastroparesis", "postural hypotension",
// "orthostatic hypotension", "pulmonary edema", "poor sleep", "sedentary life", "hormone imbalance", "burning tongue", "bladder stones", "bladder obstruction",
// "malfunction of the detrusor muscle", "nerve damage", "skin tags", "no appetite", "weak appetite", "hunger", "alopecia areata", "androgenic alopecia",
// "postpartum alopecia", "traction alopecia", "glossodynia", "insulin resistance", "prediabetes", "nutrient deficiency", "social anxiety disorder",
// "generalized anxiety disorder", "panic disorder", "astigmatism", "presbyopia", "dry eye syndrome", "optic neuritis", "diplopia", "retinal detachment",
// "refractive error", "myopia", "hypermetropia", "nearsightedness", "farsightedness", "blood in stool", "yellow sputum", "green sputum", "otitis externa",
// "otitis media", "infectious myringitis", "acute mastoiditis", "herpes zoster of the ear", "labyrinthitis", "vestibular neuritis", "pilonidal cyst",
// "meniere's disease", "anal pain", "rectal pain", "finger pain", "abnormally colored urine", "dark colored urine", "frequent urination", "difficulty urinating",
// "interruption of the urine stream", "inability to urinate except in certain positions", "poor circulation", "cough with phlegm", "frequent infections",
// "wrist pain", "ankle pain", "low back pain", "pain spreading down the legs", "excess thirst", "large appetite", "coughing up blood", "skin bumps", "cysts",
// "papules", "pustules", "whiteheads", "blackheads", "darkened skin", "salt craving", "sugar craving", "lethargy", "breathlessness", "watery eyes",
// "mucous in eyes", "eye redness", "sensitivity to light", "sensation of having something in your eyes", "difficulty with nighttime driving",
// "difficulty wearing contact lenses", "continuous feeling of a full bladder", "straining to urinate", "muffled hearing", "full sensation in the ear",
// "noise sounds louder in one ear", "problems hearing in noisy areas", "problems following conversations when two or more people are talking",
// "hard to tell high-pitched sounds from one another", "sensitivity to loud sounds", "osteopenia", "weakened bones", "vaginal dryness", "swollen gums",
// "gums that bleed easily", "sensitive gums", "red or purple gums", "penile discharge", "lasting at least 12 weeks", "difficulty recognizing familiar faces",
// "straight lines appear wavy", "dark or empty area or blind spot appears in the center of vision", "reduced vision", "difficulty adapting to low light levels",
// "stooped posture", "loss of height", "bone fractures", "flaccid muscles", "shuffled walking", "scoliosis", "tip toe walking", "delayed development",
// "vision loss", "difficulty with vision at night", "seeing halos", "around lights", "frequent changes in eyeglass or contact lens prescription", "double vision",
// "fading of colors", "daytime sleepiness", "cataplexy", "sleep paralysis", "hallucinations", "disoriented", "waking up confused", "vaginal itching",
// "vaginal spotting", "unable to sit still", "fidgeting", "inability to concentrate", "excessive physical movements", "excessive talking", "unable to wait their turn",
// "interrupting conversations", "acting without thinking", "jaundice", "enlarged tongue", "pale skin", "bone pain"]

// const treatments3 = ["vitamin b1", "vitamin b2", "vitamin b3", "vitamin b5", "vitamin b6", "vitamin b12", "vitamin c", "quercetin", "vitamin a", "vitamin d",
// "vitamin e", "vitamin k1", "vitamin k2", "vitamin k3", "iron", "calcium", "iodine", "potassium", "magnesium", "zinc", "selenium", "copper",
// "manganese", "chromium", "molybdenum", "choline", "glycine", "isoleucine", "lysine", "phenylalanine", "glutamine", "tryptophan", "leucine",
// "valine", "tyrosine", "cysteine", "amino acids", "rebamipine", "boron", "vanadium", "lutein", "lycopene", "zeaxanthin", "n-acetyl-cysteine",
// "inositol", "alpha lipoic acid", "vaccinium angustifolium", "olea europaea", "vitis vinifera", "polyphenol", "green tea", "agrimony",
// "aloe vera", "anise", "basil", "calendula", "chervil", "elderflower", "fenugreek", "horseradish", "lemongrass", "linseed", "lovage", "lungwort",
// "parsley", "sorrel", "tarragon", "glutathione", "coenzyme q10", "resveratrol", "beta carotene", "astaxanthin", "broccoli", "anthocyanins",
// "kale", "asparagus", "avocado", "alfalfa", "alpha-linolenic acid", "eicosapentaenoic acid", "docosahexaenoic acid", "linoleic acid",
// "arachidonic acid", "gamma linoleic", "conjugated linoleic acid", "acacia catechu", "acacia nilotica", "achillea millefolium", "achyranthes",
// "aconitum", "acorus calamus", "actaea racemosa", "adansonia digitata", "aesculus hippocastanum", "alangium salviifolium", "allium cepa",
// "allium sativum", "andrographis paniculata", "angelica archangelica", "angelica sinensis", "apium graveolens", "aralia", "arctium lappa",
// "arctostaphylos uva-ursi", "areca catechu", "aristolochia", "arnica montana", "aronia melanocarpa", "artemisia absinthium", "aspalathus linearis",
// "asparagus racemosus", "astragalus membranaceus", "atractylodes", "avena sativa", "azadirachta indica", "bacopa monnieri", "bassia scoparia",
// "berberis aquifolium", "betula", "borago officinalis", "boswellia serrata", "brassica juncea", "brassica oleracea", "capsicum annuum",
// "caulophyllum thalictroides", "commiphora mukul", "cordyceps", "coriandrum sativum", "cornus florida", "crinum latifolium", "curcuma longa",
// "cynara", "cynodon dactylon", "cyperus rotundus", "datura stramonium", "dioscorea", "dryopteris", "echinacea purpurea", "echinacea angustifolia",
// "echinacea pallida", "eclipta", "elettaria cardamomum", "eleutherococcus senticosus", "ephedra sinica", "epimedium", "equisetum arvense",
// "equisetum hyemale", "erigeron breviscapus", "eriodictyon californicum", "eschscholzia californica", "eucalyptus globulus", "eugenia",
// "eupatorium", "eurycoma longifolia", "euterpe oleracea", "ferula", "ficus carica", "foeniculum vulgare", "forsythia suspensa", "fucus vesiculosus",
// "ganoderma lucidum", "garcinia gummi-gutta", "garcinia kola", "garcinia mangostana", "garcinia", "gentiana", "ginkgo biloba", "gossypium herbaceum",
// "grifola frondosa", "gymnema sylvestre", "hamamelis virginiana", "harpagophytum procumbens", "helichrysum italicum", "hemidesmus indicus",
// "hibiscus", "hoodia gordonii", "humulus lupulus", "hydrastis canadensis", "hypericum perforatum", "ilex guayusa", "ilex paraguariensis",
// "illicium verum", "inula helenium", "juniperus", "justicia adhatoda", "kadsura", "kochia scoparia", "larrea tridentata", "laurus nobilis",
// "lavandula", "lentinus edodes", "leonurus cardiaca", "lepidium", "linum usitatissimum", "lobelia inflata", "lonicera japonica", "luffa", "lycium",
// "malpighia glabra", "medicago sativa", "melaleuca alternifolia", "lemon balm", "mentha pulegium", "mentha spicata", "mentha x piperita",
// "mitragyna speciosa", "morinda", "mosannona depressa", "musa", "myrica", "myristica fragrans", "nelumbo nucifera", "nigella sativa",
// "nyctanthes arbortristis", "holy basil", "oenothera biennis", "origanum vulgare", "panax notoginseng", "passiflora", "paullinia cupana",
// "pausinystalia johimbe", "pelargonium sidoides", "persicaria minor", "phyllanthus emblica", "pimpinella anisum", "piper methysticum",
// "piper nigrum", "plantago afra", "plantago major", "podophyllum peltatum", "potentilla", "primula veris", "propolis", "prunella vulgaris",
// "prunus africana", "prunus cerasus", "prunus persica", "pueraria lobata", "punica granatum", "quassia", "quercus infectoria", "rauwolfia serpentina",
// "rehmannia glutinosa", "rhodiola rosea", "ribes nigrum", "rosa canina", "rubus idaeus", "rumex acetosa", "rumex crispus", "ruscus aculeatus",
// "ruta graveolens", "salix alba", "salvia hispanica", "salvia miltiorrhiza", "salvia officinalis", "salvia rosmarinus", "sambucus nigra",
// "sanguinaria canadensis", "sassafras albidum", "sceletium tortuosum", "schisandra chinensis", "scutellaria baicalensis", "serenoa repens",
// "silybum marianum", "sinupret", "siraitia grosvenorii", "smilax glabra", "styphnolobium japonicum", "swertia", "symphytum officinale",
// "syzygium aromaticum", "syzygium cumini", "tabebuia impetiginosa", "tabernanthe iboga", "tamarindus indica", "tanacetum parthenium",
// "tanacetum vulgare", "terminalia arjuna", "terminalia bellerica", "theobroma cacao", "thuja occidentalis", "thuja plicata", "thymus vulgaris",
// "tribulus terrestris", "trichosanthes", "trifolium pratense", "terminalia chebula", "vaccinium macrocarpon", "vaccinium myrtillus",
// "valeriana officinalis", "verbascum thapsus", "verbena officinalis", "viburnum", "vitex agnus-castus", "withania somnifera", "xylopia aromatica",
// "yucca schidigera", "zanthoxylum", "zea mays", "ziziphus", "bifidobacterium", "lactobacillus", "sitz bath", "hydrotherapy", "sauna", "acupuncture",
// "moxibustion", "earthing", "forest bathing", "epsom salt bath", "physical therapy", "castor oil", "chinese yam", "eucommia bark", "poria",
// "american ginseng", "asian ginseng", "licorice root", "red dates", "zingiber", "cinnamomum", "paeonia lactiflora", "ligusticum porteri", "coptis chinensis",
// "phellodendron chinese bark", "taraxacum", "paeonia suffruticosa", "plantago asiatica", "boswellia carterii", "eucommia ulmoides", "5-htp",
// "medium-chain triglycerides", "polyglycoplex", "azelaic acid", "probiotic", "grape seed extract", "pine bark extract", "fiber", "phosphatidylserine",
// "l-acetylcarnitine", "carnitine", "hawthorn", "omega-3 fatty acids", "hedera helix", "l-theanine", "bromelain", "kiwifruit", "berberine",
// "humidifier", "indole-3-carbinol", "evening primrose oil", "vegetarian diet", "food allergy avoidance", "lecithin", "rutin", "low-purine alkaline-ash diet",
// "celery seed extract", "apple polyphenols", "dietary goitrogens avoidance", "flax seed oil", "di-indoylmethane", "folic acid", "butterbur",
// "saffron", "fumaric acid", "capsaicin cream", "bioflavonoids", "nasal rinse", "boric acid", "dhea", "branched chain amino acids", "walnut",
// "spinach", "spirulina", "methylsulfonylmethane", "cat's claw", "calcium ascorbate", "olive leaf", "melatonin", "vitamin b-complex", "marshmellow root",
// "baking soda", "biotin", "slippery elm", "nattokinase", "serrapeptase", "colloidal silver", "red yeast rice", "palmitoylethanolimide",
// "gamma-aminobutyric acid", "ultrasound", "phosphatidylcholine", "wheatgrass", "barley grass", "lauric acid", "monolaurin", "chondroitin",
// "glucosamine", "collagen", "hyaluronic acid", "triticum vulgare", "methionine", "calcium β-hydroxy β-methylbutyrate", "gamma-linolenic acid",
// "betaine hydrochloride", "l-glutamic acid hydrochloride", "pancreatin", "same", "shepherd's purse", "sodium", "silicon", "taurine",
// "omega 6 fatty acids", "maitake mushroom", "chaga", "lion's mane", "coleus forskohlii", "bugleweed", "pipsissewa", "buchu", "coriolus versicolor",
// "eyebright", "american skullcap", "creatine", "citicoline", "d-mannose", "fulvic acid", "berberis vulgaris", "blessed thistle", "hippophae rhamnoides",
// "wild cherry bark", "opuntia", "bottle blowing", "brazil nut", "palmaria palmata", "pistacia vera", "hemp seeds", "cumin", "anethum graveolens",
// "sesamum indicum", "cucurbita maxima", "anacardium occidentale", "alternating hot and cold showers", "epigallocatechin gallate", "glycosaminoglycans",
// "brown rice", "ginseng radix et rhizoma", "lymphatic massage", "hyperbaric oxygen treatment", "manual therapy", "citronella essential oil",
// "clove bud essential oil", "clove leaf essential oil", "lavender essential oil", "lemongrass essential oil", "peppermint essential oil",
// "spearmint essential oil", "thyme linalol essential oil", "saraca asoca", "aegle marmelos", "phyllanthus amarus", "santalum album", "swartia chirata",
// "tinospora cordifolia", "commiphora wightii", "barberis aristata", "plantago ovata", "nardostachys jatamansi", "gloriosa superba", "garcinia indica",
// "saussurea costus", "picrohiza kurroa", "piper longum", "aerobic exercise", "strength training", "yoga", "tai chi", "qigong", "progressive muscle relaxation",
// "diaphragmatic breathing", "pranayama", "mindful breathing", "cardiac coherence breathing", "alternating nostril breathing", "biofeedback",
// "neurofeedback", "rebounding", "sleep hygiene", "journaling", "mouth taping", "cold compress", "mustard compress", "onion compress", "cold wet sock",
// "seed cycling", "apple cider vinegar", "digestive bitters", "dry skin brushing", "neti pot", "oil pulling", "candida diet", "fermented foods",
// "xylitol", "lung percussion", "weight bearing exercise", "butyric acid", "black walnut", "caprylic acid", "coconut oil", "avocado oil", "sesame oil",
// "krill oil", "jojoba oil", "almond oil", "walnut oil", "argan oil", "cold plunge", "mediterranean diet", "chlorophyll", "ultraviolet light therapy",
// "electrolytes", "resperate", "fodmap", "psychotherapy", "lactobacillus species", "bifidobacterium species", "proanthocyanidins", "prebiotic", "senna",
// "transcutaneous electrical nerve stimulation", "hesperidin", "glycerin suppositories", "cognitive therapy", "zinc monocysteine", "serratia peptidase",
// "procyanidolic oligomers", "chiropractic", "osteopathic manipulation", "glycerophosphocholine", "isometric exercise", "laser therapy",
// "low-frequency pulsed magnetic fields", "gamma-oryzanol", "carnosine", "citrulline", "strontium", "acupressure", "salt water gargle", "yoga ocular exercise",
// "nail oil", "pelvic floor therapy", "spinal manipulation therapy", "myofascial physical therapy", "zinc pyrithione shampoo", "tilia americana",
// "huperzine a", "hydrochloric acid", "bile acid", "psyllium", "carob", "electroacupuncture", "antioxidants", "tormentil root", "sunlight", "postural drainage",
// "proteolytic enzymes", "lemon verbena", "chrysanthemum"]

// let symptomIndex = 0;
// let treatmentIndex = 0;
// const finalSymptoms = symptoms3
// const finalTreatments = treatments3

// async function searchArticles() {
//   try {

//     const currentSymptom = finalSymptoms[symptomIndex];
//     const currentTreatment = finalTreatments[treatmentIndex];

//     console.log('Saving old article-',currentSymptom,'-',currentTreatment);

//     const articles = await getMedicineArticles(currentSymptom, currentTreatment);
//     console.log("Articles es:", articles);
//     if (articles.length > 0) {
//       for (const el of articles) {
//         const article = await getSaveArticleContent(el, "", currentSymptom, currentTreatment);

//         if (!article) {
//           console.log('Existing Article, adding symptom and treatment');
//         }
//       }
//     }

//     if (treatmentIndex < finalTreatments.length - 1) {
//       treatmentIndex++;
//     } else {
//       treatmentIndex = 0;
//       if (symptomIndex < finalSymptoms.length - 1) {
//         symptomIndex++;
//       } else {
//         console.log('All symptoms and treatments searched. Stopping the search.');
//         return;
//       }
//     }
//   } catch (error) {
//     console.error('Error:', error);
//   }

//   setTimeout(searchArticles, waitTime);
// }

// searchArticles();

/** Save old Article */

// cron.schedule(EVERY_HOUR, async () => {
// 	/** Send notification after five days */
// 	UserProfileModel.hasMany(UserFollowupModel, { foreignKey: "user_id" })
// 	UserFollowupModel.belongsTo(UserProfileModel, { foreignKey: "user_id" })

// 	const data = await UserFollowupModel.findAll({
// 		where: {
// 			date_sent: {
// 				[Op.gt]: moment().subtract(4, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(4, "day").format("YYYY-MM-DD 23:59"),
// 			},
// 			date_created: {
// 				[Op.gt]: moment().subtract(5, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(5, "day").format("YYYY-MM-DD 23:59"),
// 			},
// 		},
// 	})

// 	let tokens: string[] = []

// 	if (data.length > 0) {
// 		for (const element of data) {
// 			const token = await UserProfileModel.findOne({ where: { user_id: element.user_id } })
// 			tokens.push(token.device_tokens)
// 		}
// 	}

// 	if (tokens.length > 0) {
// 		const message = {
// 			notification: {
// 				title: "Plan update",
// 				body: "Have you started any parts of your wellness plan?",
// 			},
// 			data: {
// 				id: "201",
// 			},
// 			tokens: tokens,
// 		}

// 		firebase
// 			.messaging()
// 			.sendMulticast(message)
// 			.then(async (response) => {
// 				for (const element of data) {
// 					await UserFollowupModel.update({ date_sent: new Date() }, { where: { user_id: element.user_id } })
// 				}
// 			})
// 			.catch((error) => {
// 				console.log("Error sending message:", error)
// 			})
// 	}
// 	/** End of five days */
// })

// cron.schedule("0 0 0 * * *", async () => {
// 	console.log("Running in 2 week")
// 	UserProfileModel.hasMany(UserFollowupModel, { foreignKey: "user_id" })
// 	UserFollowupModel.belongsTo(UserProfileModel, { foreignKey: "user_id" })

// 	// .subtract(14, "day")

// 	const data = await UserFollowupModel.findAll({
// 		where: {
// 			date_created: {
// 				[Op.gt]: moment().subtract(14, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(14, "day").format("YYYY-MM-DD 23:59"),
// 			},
// 			date_sent: {
// 				[Op.gt]: moment().subtract(9, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(9, "day").format("YYYY-MM-DD 23:59"),
// 			},
// 		},
// 	})

// 	let tokens: string[] = []

// 	if (data.length > 0) {
// 		for (const element of data) {
// 			const token = await UserProfileModel.findOne({ where: { user_id: element.user_id } })
// 			tokens.push(token.device_tokens)
// 		}
// 	}

// 	if (tokens.length > 0) {
// 		const message = {
// 			notification: {
// 				title: "Plan update in 2 week",
// 				body: "We are just checking in to see how you are doing on your plan! Have you been able to start the remedies and make the lifestyle recommendations?",
// 			},
// 			data: {
// 				id: "202",
// 			},
// 			tokens: tokens,
// 		}

// 		firebase
// 			.messaging()
// 			.sendMulticast(message)
// 			.then(async (response) => {
// 				console.log("After 2 week", response)
// 			})
// 			.catch((error) => {
// 				console.log("Error sending message:", error)
// 			})
// 	}
// })

// analyzeSymptomsAndTreatments()

// async function analyzeSymptomsAndTreatments(){
// 	console.log("analyzeSymptomsAndTreatments");

// 	const symptoms = (await SymptomMaster.findAll({raw: true})).map((s:any) => ({symptom_id: +s.symptom_id, symptom: s.symptom_name, food: [], vitamin:[], lifestyle: [], herb: []}))

// 	console.log("TOTAL SYMPTOMS: ", symptoms.length);

// 	const treatmentsMasterName = (await TreatmentMaster.findAll({raw: true})).reduce((acc:any, t:any) => {
// 		acc[t.treatment_name] = t.treatment_type

// 		if(t?.treatment_synonyms?.length){
// 			for(const synonym of (t.treatment_synonyms??'').split(',')){
// 				acc[synonym.trim()] = t.treatment_type
// 			}
// 		}
// 		return acc
// 	}, {})

// 	const treatmentsMasterId = (await TreatmentMaster.findAll({raw: true})).reduce((acc:any, t:any) => {
// 		acc[t.treatment_id] = t.treatment_type

// 		return acc
// 	}, {})

// 	 const symptomTreatment = await SymptomTreatmentsPdf.findAll({raw: true})

// 	for(const st of symptomTreatment){
// 		const symptom = symptoms.find((s:any) => +s.symptom_id === +st.symptom_id)

// 		for(const treatmentId of (st.treatments_ids??'').split(';').map((t:any) => t.trim()).filter((t:any) => t.length > 0).map((t:any) => parseInt(t))){
// 			const type = treatmentsMasterId[treatmentId]

// 			if(type){
// 				if(symptom[type]){
// 					symptom[type].push(treatmentId)
// 				}
// 				else{
// 					console.log("NOT FOUND A: ", treatmentId, type, st.symptom_id, st.symptom_name);
// 				}
// 			}
// 			else{
// 				console.log("NOT FOUND B: ", treatmentId, type, st.symptom_id, st.symptom_name);
// 			}
// 		}

// 	}

// 	// console.log(symptoms);

// 	const articles = await MedicineArticlesProcessed.findAll({raw: true, where: {is_accepted: true}})

// 	const notFoundTreatments:any = {}
// 	const notFoundSymptoms:any = {}

// 	for (const article of articles) {
// 		for(const symptom in (article?.gpt?.symptoms??{})){
// 			for(const treatment of (article?.gpt?.symptoms[symptom]??[])){
// 				if(treatment?.mainSymptomTreatment === true){
// 					const type = treatmentsMasterName[treatment?.treatment]
// 					if(type){
// 						const s = symptoms.find((s:any) => s.symptom === symptom)

// 						if(!s){
// 							notFoundSymptoms[symptom] = true
// 						}
// 						else{
// 							s[type].push(treatmentsMasterId[treatment?.treatment])
// 						}
// 					}
// 					else{
// 						notFoundTreatments[treatment?.treatment] = true
// 					}
// 				}
// 			}

// 		}
// 	}

// 	console.log("NOT FOUND TREATMENTS: ", Object.keys(notFoundTreatments).join(', '));

// 	for(const symptom of symptoms){
// 		symptom.food = [...new Set(symptom.food)].length
// 		symptom.vitamin = [...new Set(symptom.vitamin)].length
// 		symptom.lifestyle = [...new Set(symptom.lifestyle)].length
// 		symptom.herb = [...new Set(symptom.herb)].length
// 	}

// 	//console.log(Object.keys(notFoundTreatments));
// 	//console.log(Object.keys(notFoundTreatments)?.length);

// 	console.log('SYMPTOMS NAMES');
// 	console.log(symptoms.filter((s:any) => (s.food <= 0) && (s.vitamin <= 0) && (s.lifestyle <= 0) && (s.herb <= 0)).map((s:any) => s.symptom).join(','));

// 	console.log('SYMPTOMS IDS');
// 	console.log(symptoms.filter((s:any) => (s.food <= 0) && (s.vitamin <= 0) && (s.lifestyle <= 0) && (s.herb <= 0)).map((s:any) => s.symptom_id).join(','));

// 	console.log('SYMPTOMS COUNT');
// 	console.log(symptoms.filter((s:any) => (s.food <= 0) && (s.vitamin <= 0) && (s.lifestyle <= 0) && (s.herb <= 0))?.length);

// 	//console.log(symptoms);

// 	// jsonToCsv('symptoms.csv', symptoms)
// }

// exportHumataSymptomsAndConditions()

// async function exportHumataSymptomsAndConditions(){
// 	console.log('Exporting Humata Symptoms and Conditions');

// 	let symptomsTreatmentsHumata = (await SymptomTreatmentsHumata.findAll({raw: true})||[])

// 	let treatmentsFromHumata = []

// 	for(const st of symptomsTreatmentsHumata){
// 		treatmentsFromHumata.push(
// 			...((st?.treatments?.herb??[]).map((t:any) => t.name??'')),
// 			...((st?.treatments?.supplement??[]).map((t:any) => t.name??'')),
// 			...((st?.treatments?.modalities_therapies??[]).map((t:any) => t.name??'')),
// 		)
// 	}

// 	const treatmentsFromHumataWithDuplications = treatmentsFromHumata.map((t:any) => t.replace(/\(.*\)/g,'').toLowerCase().replace('use of','').replace('consumption of','').replace('administration of','').replace('supplementation','').replace('supplements','').replace('extracts','').replace('extract','').replace('supplement','').trim()).filter((t:any) => t.length > 0)

// 	treatmentsFromHumata = _.uniq(treatmentsFromHumataWithDuplications)

// 	let treatmentsMaster = (await TreatmentMaster.findAll({raw: true}))

// 	let treatmentsMasterNamesOnly = []

// 	for(const t of treatmentsMaster){
// 		treatmentsMasterNamesOnly.push(t.treatment_name.toLowerCase().trim())

// 		if(t?.treatment_synonyms?.length){
// 			treatmentsMasterNamesOnly.push(
// 				...t.treatment_synonyms.split(';').map((s:any) => s.toLowerCase().trim())
// 			)
// 		}

// 		if(t?.gpt_treatment_name?.length){
// 			treatmentsMasterNamesOnly.push(
// 				...t.gpt_treatment_name.split(';').map((s:any) => s.toLowerCase().trim())
// 			)
// 		}

// 		if(t?.humata_synonyms?.length){
// 			treatmentsMasterNamesOnly.push(
// 				...t.humata_synonyms.split(';').map((s:any) => s.toLowerCase().trim())
// 			)
// 		}

// 		if(t?.common_names?.length){
// 			treatmentsMasterNamesOnly.push(
// 				...t.common_names.split(';').map((s:any) => s.toLowerCase().trim())
// 			)
// 		}
// 	}

// 	treatmentsMasterNamesOnly = treatmentsMasterNamesOnly.map((t:any) => t.toLowerCase().replace('extracts','').replace('extract','').trim()).filter((t:any) => t.length > 0)

// 	let notFound = _.difference(treatmentsFromHumata, treatmentsMasterNamesOnly)

// 	notFound = notFound.map((t:any) => ({treatment: t, count: countOccurrences(treatmentsFromHumataWithDuplications, t)}))

// 	notFound = _.orderBy(notFound, ['count'], ['desc'])
// 	// console.log(notFound);

// 	// console.log(symptomsTreatmentsHumata.length);

// 	// let conditions:any = {}

// 	// for(const st of symptomsTreatmentsHumata){
// 	// 	if(!conditions[st.condition_id]){
// 	// 		conditions[st.condition_id] = {
// 	// 			condition_id: st.condition_id,
// 	// 			condition_name: st.condition_name,
// 	// 			nonindexed_symptoms: (st?.nonindexed_symptoms??[]).join(';'),
// 	// 			// herb: (st?.treatments?.herb??[]).join(';'),
// 	// 			// supplement: (st?.treatments?.supplement??[]).join(';'),
// 	// 			// foods_decrease: (st?.treatments?.foods_decrease??[]).join(';'),
// 	// 			// foods_increase: (st?.treatments?.foods_increase??[]).join(';'),
// 	// 			// modalities_therapies: (st?.treatments?.modalities_therapies??[]).join(';'),
// 	// 		}
// 	// 	}

// 	// 	//conditions[st.condition_id].symptoms.push(st.symptom_name)
// 	// }

// 	// conditions = Object.values(conditions).map((c:any) => ({
// 	// 	...c,
// 	// //	symptoms: (c.symptoms || []).join(', ')
// 	// }))

// 	jsonToCsv('not_found.csv', notFound)
// }

// // symptomsAndConditions()

// function jsonToCsv(filename: string, jsonObj: any[]){
// 	const headers = Object.keys(jsonObj[0]);
// 	const csvData = jsonObj.map((obj: any) => headers.map(header => obj[header]).join('|'));
// 	csvData.unshift(headers.join('|'));

// 	fs.writeFileSync(filename, csvData.join('\n'));
// }

// function countOccurrences(arr: any[], val: any) {
// 	return arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
//   }

// async function symptomsAndConditions(){
// 	console.log('symptomsAndConditions');

// 	const symptomsTreatmentsHumata = (
// 		(await SymptomTreatmentsHumata.findAll({
// 		  raw: true,
// 		})) ?? []
// 	  )

// 	const symptomsPerCondition = symptomsTreatmentsHumata.reduce((acc: any, sth: any) => {
// 		if (!acc[sth?.condition_id]) {
// 		  acc[sth?.condition_id] = {
// 			condition_id: sth?.condition_id,
// 			condition_name: sth?.condition_name,
// 			symptoms: [],
// 			symptoms_count: 0
// 		  }
// 		}

// 		if(sth?.symptom_name){
// 			acc[sth?.condition_id].symptoms.push(sth?.symptom_name)
// 		}

// 		return acc
// 	  }, {})

// 	  for(const conditionId in symptomsPerCondition){
// 		symptomsPerCondition[conditionId].symptoms_count = symptomsPerCondition[conditionId].symptoms.length
// 		symptomsPerCondition[conditionId].symptoms = symptomsPerCondition[conditionId].symptoms.join(', ')
// 	  }

// 	  jsonToCsv('symptoms_conditions', Object.values(symptomsPerCondition))
// }

// symptomAndConditionsChecking()

// async function symptomAndConditionsChecking(){
// 	console.log('symptomAndConditionsChecking');

// 	const symptomConditionMaster = await SymptomConditionMaster.findAll({raw: true})

// 	const symptomsObj = symptomConditionMaster.filter((sc:any) => sc.symptom_type === 'symptom').reduce((acc:any, sc:any) => {
// 		acc[sc.symptom_name] = 'asdfasd'
// 		return acc
// 	}, {})

// 	for(const symptomCondition of symptomConditionMaster){
// 		if(symptomCondition?.symptoms?.length){
// 			for(const symptom of symptomCondition.symptoms.split(';')){
// 				if(!symptomsObj[symptom.trim().toLowerCase()]){
// 					console.log(`|${symptom.trim().toLowerCase()}| NOT FOUND from ${symptomCondition.symptom_id}`);

// 				}
// 			}
// 		}
// 	}

// }
