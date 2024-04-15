export const getTCMRootCause = async(user_answers: any, dashboard_reference: any) => {
    try {
        let topOne = user_answers.data.reduce((acc: any, el: any) => {
            const text = dashboard_reference.filter((item: any) => el.question_id == item.id_question && el.values.includes(item.answer_value))
            if(text.length > 0 && text[0]?.tcm_root_cause?.length > 0) {
                acc = acc.concat(text[0]?.tcm_root_cause?.split(","))
            }
            return acc
        },[])
        const frequency: any = {}
        for (const element of topOne) {
            frequency[element] = frequency[element] || 0
            frequency[element]++
        }
        topOne = topOne.sort((a: any, b: any) => frequency[b] - frequency[a])
        return topOne.slice(0,1)
    } catch {
        return []
    }
}