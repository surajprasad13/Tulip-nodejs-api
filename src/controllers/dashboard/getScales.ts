import { round } from "lodash"

export const getScales = async(user_answers: any, questions: any) => {

    let scales = user_answers.filter((item: any) => (questions.map((quest: any) => quest.id_question.toString()).includes(item.question_id)))
    let element: any = {}
    scales.forEach((item: any) => {
        const index = questions.filter((quest: any) => quest.id_question.toString() == item.question_id)
        if(index.length > 0) {
            element[index[0].tags] = item.values.trim()
        }
    })
    let inches
    const height = element.height.trim().split('/')
    if(height.length > 1) {
        inches = Number(height[0])*12+Number(height[1])
    } else {
        inches = Number(height[0])
    }
    return {scales: {...element,bmi: round((703*Number(element.weight.trim())/Math.pow(inches,2)),2)}}
}