import { objectSorted } from "../../utils"

export const getRootCauses = async(user_answers: any, dashboard_reference: any) => {
    const root_causes = user_answers.reduce((acc: any, el: any) => {
        const root_cause = dashboard_reference.filter((item: any) => el.question_id == item.id_question && el.values.includes(item.answer_value))
        if(root_cause.length > 0 && root_cause[0].root_cause?.length > 0) {
            if(acc['root_causes'][root_cause[0].root_cause]) {
                acc['root_causes'][root_cause[0].root_cause]+=1
            } else {
                acc['root_causes'][root_cause[0].root_cause]=1
            }
            if(acc['root_causes_madlibs'][root_cause[0].root_cause]) {
                acc['root_causes_madlibs'][root_cause[0].root_cause].push(root_cause[0].mad_libs_root_cause)
            } else {
                acc['root_causes_madlibs'][root_cause[0].root_cause] = [root_cause[0].mad_libs_root_cause]
            }
        }
        return acc;
    },{root_causes: {}, root_causes_madlibs: {}})
    const root_causes_final = await objectSorted(root_causes['root_causes']).slice(0, 3)
    const list_root_causes = root_causes_final.map((item: any) => item[0])
    let root_causes_madlibs_final: any = {}
    list_root_causes.forEach((el: any) => {
        root_causes_madlibs_final[el] = root_causes['root_causes_madlibs'][el]
    })
    return {root_causes: root_causes_final, root_causes_madlibs: root_causes_madlibs_final}
}