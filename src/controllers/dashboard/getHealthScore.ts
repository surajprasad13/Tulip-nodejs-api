export const getHealthScore = async(user_answers: any, dashboard_reference: any) => {
    let score = user_answers.reduce((acc: any, el: any) => {
        const score = dashboard_reference.filter((item: any) => el.question_id == item.id_question && el.values.includes(item.answer_value))
        return acc+=Number(score[0]?.health_score??0)
    },0)
    if (score < 60) {
        score = 60
    }
    return {health_score: score}
}