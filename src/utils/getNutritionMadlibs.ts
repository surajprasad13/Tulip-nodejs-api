
import { removeDuplicates } from "."

export const getNutritionMadlibs = async(dashboard_reference: any, nutrition: any, user_answers: any) => {
    try {
        const text = nutrition?.madlibs
        if(!text) {
            return []
        }
        const list = text.match(/\[(.*?)\]/)[1]?.split(",")
        if(list.length == 0) {
            return []
        }
        const final_answers = user_answers.data.filter((answer: any) => list.includes(answer.question_id))
        if(final_answers.length == 0) {
            return [] 
        }
        let madlibsbullets = final_answers.reduce((acc: any, el: any) => {
            const madlib = dashboard_reference.filter((dash: any) => dash.id_question == el.question_id && el.values.includes(dash.answer_value))
            if(madlib.length > 0 && madlib[0].mad_libs_suboptimal) {
                const madText = madlib[0].mad_libs_suboptimal.trim()
                if(madText.length > 0) {
                    acc.push(madText)
                }
            }
            return acc
        },[])
        if(madlibsbullets.length == 0) {
            return [] 
        } else {
            nutrition.madlibs = 
                    nutrition.madlibs.replace(text.match(/\[(.*?)\]/)[0],'').trim() + '#' + removeDuplicates(madlibsbullets).join("|")
        }
		return nutrition
	} catch(error) {
		console.log(error)
		return []
	}

}