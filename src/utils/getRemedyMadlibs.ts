import { removeDuplicates } from "."

export const getRemedyMadlibs = async(dashboard_reference: any, remedies: any, user_answers: any) => {
    try {
		remedies.forEach((item:any) => {
			const text = item?.options?.mad_libs_supplements_why
			if(!text) {
				return []
			}
			const list = text.match(/\[(.*?)\]/)[1]?.split(",")
			if(list?.length == 0) {
				return []
			}
			const final_answers = user_answers.data?.filter((answer: any) => list.includes(answer.question_id))
			if(final_answers?.length == 0) {
				item.options.mad_libs_supplements_why = item.options?.if_no_answers??''
			}
			let madlibsbullets = final_answers?.reduce((acc: any, el: any) => {
				const madlib = dashboard_reference?.filter((dash: any) => dash.id_question == el.question_id && el.values.includes(dash.answer_value))
			 	if(madlib?.length > 0 && madlib[0].mad_libs_root_cause) {
					const madText = madlib[0].mad_libs_root_cause.trim()
					if(madText.length > 0) {
						acc.push(madText)
					}
				}
				return acc
			},[])
			if(madlibsbullets?.length == 0) {
				item.options.mad_libs_supplements_why = item.options?.if_no_answers??''
			} else {
				item.options.mad_libs_supplements_why = 
						item.options.mad_libs_supplements_why.replace(text.match(/\[(.*?)\]/)[0],'').trim() + '#' + removeDuplicates(madlibsbullets).join("|")
			}
			
		})
		return remedies
	} catch(error) {
		console.log(error)
		return []
	}

}