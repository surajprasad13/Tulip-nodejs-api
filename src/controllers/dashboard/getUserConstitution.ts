export const getUserConstitution = async(user_answers: any, constitutions: any) => {
    const constitution = user_answers.reduce((acc: any, el: any) => {
        const text = constitutions.filter((item: any) => el.question_id == item.id_question && el.values.includes(item.answer_value))
        if(text.length > 0 && text[0]['constitutions_main.constitution']?.length > 0 && text[0]['constitutions_main.information_to_show']?.length > 0) {
            acc.push({
                constitution_type: text[0]['constitutions_main.constitution'],
                constitution_text: text[0]['constitutions_main.information_to_show'],
                foods_to_increase: text[0]['constitutions_main.foods_to_increase'],
                foods_to_decrease: text[0]['constitutions_main.foods_to_decrease'],
                shopping_list: text[0]['constitutions_main.shopping_list']
            })
        }
        return acc
    },[])

    return {constitution: constitution}
}