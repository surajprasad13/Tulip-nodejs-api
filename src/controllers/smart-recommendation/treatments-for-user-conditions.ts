import * as _ from 'lodash'

export function getTreatmentsForUserConditions(userSymptoms:any[], userConditions: any[], symptomsTreatments: any[]) {
    if(!userConditions?.length){
        return []
    }

    const userSymptomsIds = userSymptoms.map((us: any) => us.symptom_id)
    const userConditionsIds = userConditions.map((us: any) => us.symptom_id)

    const result = _.uniq([
        ...symptomsTreatments.filter((st: any) => (userConditionsIds.includes(st.condition_id)) && (!st.symptom_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (userConditionsIds.includes(st.symptom_id)) && (!st.condition_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (userConditionsIds.includes(st.condition_id)) && (userSymptomsIds.includes(st.symptom_id))).map((st: any) => +st.treatment_id),
    ])

    console.log('getTreatmentsForUserConditions');
    console.log(result);
    
    return result
}

