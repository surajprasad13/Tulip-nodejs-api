export const getUserNutrition = async(user_answers: any, nutritions: any, dashboard_reference: any) => {
    try {
        const presets_id = user_answers.data.reduce((acc: any, el: any) => {
            const preset_id = dashboard_reference.filter((item: any) => el.question_id == item.id_question && el.values.includes(item.answer_value))
            if(preset_id.length > 0 && preset_id[0]?.preset_ids) {
                acc = acc.concat(preset_id[0]?.preset_ids?.split(","))
            }
            return acc
        },[])
        const frequency: any = {}
        for (const element of presets_id) {
            frequency[element] = frequency[element] || 0
            frequency[element]++
        }
        const topPreset = presets_id.sort((a: any, b: any) => frequency[b] - frequency[a]).slice(0,1)[0]
        const finalNutrition = nutritions.filter((food: any) => food.preset_ids == topPreset)
        return finalNutrition[0]
    } catch {
        return []
    }
}