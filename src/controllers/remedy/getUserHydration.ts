export const getUserHydration = async(user_answers: any, constitutions: any, presets: any) => {
    const constitution = user_answers.data.reduce((acc: any, el: any) => {
        const text = constitutions.filter((item: any) => el.question_id == item.id_question && el.values.includes(item.answer_value))
        if(text.length > 0 && text[0]['constitutions_main.constitution']?.length > 0 && text[0]['constitutions_main.information_to_show']?.length > 0) {
            acc.push({
                preset_id: text[0]['constitutions_main.preset_id']
            })
        }
        return acc
    },[])
    const preset_id = constitution[0]?.preset_id
    const hydrations = presets
                        .filter((item: any) => item.preset_id == preset_id && item.remedy_type == 'hydration')
                        .map((item: any) => [item.remedy_id,1])
    return hydrations
}