import * as _ from 'lodash'

export function findSymptomTreatments(symptom_id:number, conditions_ids: number[] ,symptomsTreatments: any[]){    
    const result = _.uniq([
        ...symptomsTreatments.filter((st: any) => (st.condition_id === symptom_id) && (!st.symptom_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (st.symptom_id === symptom_id) && (!st.condition_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => ((conditions_ids??[]).includes(st.condition_id)) && (st.symptom_id === symptom_id)).map((st: any) => +st.treatment_id),
    ])

    return result
}