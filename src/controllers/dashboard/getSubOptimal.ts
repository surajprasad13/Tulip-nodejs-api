export const getSubOptimal = async(user_answers: any, dashboard_reference: any) => {
    const suboptimal = user_answers.reduce((acc: any, el: any) => {
        const text = dashboard_reference.filter((item: any) => el.question_id == item.id_question && el.values.includes(item.answer_value))
        if(text.length > 0 && text[0].mad_libs_suboptimal?.length > 0) {
            acc.push(text[0].mad_libs_suboptimal)
        }
        return acc
    },[])
    return {suboptimal: suboptimal.slice(0, 6)}
}