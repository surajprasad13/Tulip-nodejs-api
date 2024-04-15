import axios from "axios"
import MedicineArticles from "../models/medicine_articles"
import MedicineArticlesOwn from "../models/medicine_articles_own"
import { google } from 'googleapis'
import MedicinePdfs from "../models/medicine_pdfs"
import pdfParse from 'pdf-parse'
import { Op } from 'sequelize'
import { GoogleSpreadsheet } from 'google-spreadsheet'

export const getMedicineArticles = async (symptom: string, treatment: string, start_date: string = '', end_date: string = '') => {
    try{
		const query = symptom + " " + treatment
		const config = {
			method: "post",
			// url: "https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/search-pubmed",
			url: "http://localhost:8001/search_pubmed",
			headers: {
				accept: "application/json",
				"Content-Type": "application/json",
			},
			// data: {query, start_date, end_date},
			data: {query},
		}
        let articles: any
		await axios(config).then((response: any) => {
            articles = response.data.pubmed_ids
        })
        return articles
	} catch (error: any) {
		return error
	}

}


export const getSaveArticleContent = async (id_article: number, getVariables = "", currentSymptom = "", currentTreatment = "") => {
	try {
	  const config = {
		method: "get",
		// url: "https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/pubmed_article/" + id_article + getVariables,
		url: "http://localhost:8001/pubmed_article/" + id_article + getVariables,
		headers: {
		  accept: "application/json",
		  "Content-Type": "application/json",
		},
	  };
	  let article: any;
	  await axios(config).then((response: any) => {
		article = response.data;
	  });

	  const existingArticle = await MedicineArticles.findOne({ where: { pubmed_id: id_article } });

	  if (existingArticle) {
		const symptomsArray = existingArticle.symptoms.split(",");
		const treatmentsArray = existingArticle.treatments.split(",");

		let updated = false;
		if (!symptomsArray.includes(currentSymptom)) {
		  symptomsArray.push(currentSymptom);
		  existingArticle.symptoms = symptomsArray.join(",");
		  updated = true;
		}

		if (!treatmentsArray.includes(currentTreatment)) {
		  treatmentsArray.push(currentTreatment);
		  existingArticle.treatments = treatmentsArray.join(",");
		  updated = true;
		}

		if (updated) {
		  await existingArticle.save();
		}

		return false;
	  } else {
		article["symptoms"] = currentSymptom;
		article["treatments"] = currentTreatment;
		const medicineArticles = new MedicineArticles(article);
		await medicineArticles.save();
		return true;
	  }
	} catch (error: any) {
	  console.error("Error while saving article content:", error);
	  return false;
	}
};

export const getSaveArticleContentOwn = async (id_article: number, getVariables = "", currentSymptom = "", currentTreatment = "", currentPrecondition = "") => {
	try {
	  const config = {
		method: "get",
		// url: "https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/pubmed_article/" + id_article + getVariables,
		url: "http://localhost:8001/pubmed_article/" + id_article + getVariables,
		headers: {
		  accept: "application/json",
		  "Content-Type": "application/json",
		},
	  };
	  let article: any;
	  await axios(config).then((response: any) => {
		article = response.data;
	  });

	  const existingArticle = await MedicineArticlesOwn.findOne({ where: { pubmed_id: id_article } });

	  if (existingArticle) {
		return false;
	  } else {
		article["symptoms"] = currentSymptom ? currentSymptom.toLowerCase() : "";
		article["treatments"] = currentTreatment ? currentTreatment.toLowerCase() : "";
		article["preconditions"] = currentPrecondition ? currentPrecondition.toLowerCase() : "";

		const medicineArticlesOwn = new MedicineArticlesOwn(article);
		await medicineArticlesOwn.save();
		return true;
	  }
	} catch (error: any) {
	  console.error("Error while saving article content", error);
	  return false;
	}
};


export const getPdfArticles = async () => {
	try {
		const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
		const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')
		const auth = new google.auth.JWT(serviceAccountEmail, undefined, privateKey, [
			'https://www.googleapis.com/auth/drive'
		])
		await auth.authorize()
		google.options({ auth })

		const drive = google.drive({ version: 'v3', auth })

		const folderId = '1RsiX5rG4lYpIv-zNZmME5ekJeKQpzWdL'
		const { data: files } = await drive.files.list({
			q: `'${folderId}' in parents and mimeType='application/pdf'`,
			fields: 'nextPageToken, files(id, name, mimeType, createdTime)'
		})
		
		// PDF names
		const pdfNames = files.files!.map(file => file.name!)
		
		// Check names in DB
		const existingArticles = await MedicinePdfs.findAll({
			attributes: ['title'],
			where: {
				title: {
					[Op.in]: pdfNames
				}
			}
		})
		
		const existingTitles = existingArticles.map((article: any) => article.title)
		const newFiles = files.files!.filter(file => !existingTitles.includes(file.name!))
		
		for (const file of newFiles) {
			console.log(`File: ${file.name}`)
			const fileId = file.id!

			try {
				const pdfStream = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
				const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
					const chunks: any[] = []
					pdfStream.data.on('data', chunk => chunks.push(chunk))
					pdfStream.data.on('end', () => resolve(Buffer.concat(chunks)))
					pdfStream.data.on('error', reject)
				})

				const pdfData = await pdfParse(pdfBuffer)
				const title = file.name!
				const content = pdfData.text

				const article = MedicinePdfs.build({ title, content })
				await article.save()
				console.log(`PDF "${title}" saved.`)
			} catch (error) {
				console.error(`Error processing PDF "${file.name}":`, error)
			}
		}
		return true
	 
	} catch (error: any) {
		console.log(error)
		return false
	}
}

export const getHealthArticles = async () => {
    try {
        const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
        const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY!
        const SPREADSHEET_ID = '1A7Y4r1eFrlelipD18Px8YHs2cYWCuLGJM2Lz3uSEIQQ'

        const doc = new GoogleSpreadsheet(SPREADSHEET_ID)

        await doc.useServiceAccountAuth({
            client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })

        await doc.loadInfo()

        // const sheet = doc.sheetsByIndex[1]
		const sheet = doc.sheetsByTitle['Symptom Treatments Own'];

        const rows = await sheet.getRows()

        const pmcIds = []

        for (const row of rows) {
            const links = row['articles_urls']?.split(';') 

            if (links) {
                for (const link of links) { 
                    const pmcRegex = /PMC(\d+)/;
                    const pmcMatch = link.trim().match(pmcRegex)

                    if (pmcMatch && pmcMatch[1]) {
						pmcIds.push({
							id: Number(pmcMatch[1]),
							symptoms: row['symptom_name'],
							treatments: row['treatment_name'],
							preconditions: row['condition_name']
						})
                    } else {
                        console.log('Not a PMC link:', link)
                    }
                }
            } else {
                console.log('Empty link')
            }
        }

        return { pmcIds }
    } catch (error) {
        console.error('Error in health articles:', error)
        return { pmcIds: [] }
    }
}

export const getAllIdsFromDatabase = async() => {
    const ids = await MedicineArticlesOwn.findAll({
        attributes: ['pubmed_id'],
        raw: true,
    });
    return ids.map((item: any) => item.pubmed_id)
}