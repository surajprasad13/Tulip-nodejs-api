import * as _ from 'lodash'

export function findConditionTreatments(condition_id:number, symptoms_ids: number[] ,symptomsTreatments: any[]){
    const result = _.uniq([
        ...symptomsTreatments.filter((st: any) => (st.condition_id === condition_id) && (!st.symptom_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (st.symptom_id === condition_id) && (!st.condition_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => ((symptoms_ids??[]).includes(st.symptom_id)) && (st.condition_id === condition_id)).map((st: any) => +st.treatment_id),
    ])
    
    return result
}