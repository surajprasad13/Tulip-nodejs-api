import Questions from "../models/questions"
import UserAnswers from "../models/useranswers"

export const getMedications = async(user_id: number) => {
    let questions = (await Questions.findAll({
		attributes: ['group_id', 'id_question'],
		raw: true,
		where: {
			tags: 'medications' 
		},
	}).catch((error: any) => {
			return []
	})) || 'Nothing'

    try {
		if(questions != 'Nothing' && questions.length > 0) {
			const id = user_id
			let userMedications =
					(await UserAnswers.findAll({
						raw: true,
						where: {
							user_id: id,
							group_id: [101,102,103,104,105]
						},
					})) || 'Nothing'
			if(userMedications != 'Nothing') {
				if(!userMedications?.length){
					return []
				}
				let medications: any[] = []
				userMedications.forEach((val: any) => {
					val.data.forEach((val2: any) => {
						if((val.group_id == 101 && val2.question_id == questions.filter((val: any) => val.group_id == 101)[0]['id_question']) ||
						(val.group_id == 102 && val2.question_id == questions.filter((val: any) => val.group_id == 102)[0]['id_question']) ||
						(val.group_id == 103 && val2.question_id == questions.filter((val: any) => val.group_id == 103)[0]['id_question']) ||
						(val.group_id == 104 && val2.question_id == questions.filter((val: any) => val.group_id == 104)[0]['id_question']) ||
						(val.group_id == 105 && val2.question_id == questions.filter((val: any) => val.group_id == 105)[0]['id_question'])) {
							const med = val2.values.split(",")
							let j = 0
							med.forEach((item: any) => {
								if (!Number(item)){
									j++
								}
							})
							if(j == 0){
								medications.push(val2.values)
							}
							
						}
					})
				})
				if( medications.length > 0) {
					medications = medications.reduce((acc: any, el: any) => acc.concat(el.split(",")),[])
					return [...new Set(medications)]
				} else {
					return []
				}
			} else {
				return []
			} 

		} else {
			return []
		}
	} catch(error: any) {
		return []
	}
}