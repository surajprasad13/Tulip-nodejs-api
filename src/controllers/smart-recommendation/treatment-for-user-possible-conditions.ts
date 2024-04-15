import * as _ from 'lodash'

export function getTreatmentForUserPossibleConditions(userSymptoms:any[], userPossibleConditions: any[], symptomsTreatments: any[]) {
    if((userPossibleConditions?.length??0) < 3){
        return []
    }

    const userSymptomsIds = userSymptoms.map((us: any) => us.symptom_id)

    const top1ConditionTreatments = _.uniq([
        ...symptomsTreatments.filter((st: any) => (st.condition_id === userPossibleConditions[0].symptom_id) && (!st.symptom_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (st.symptom_id === userPossibleConditions[0].symptom_id) && (!st.condition_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (st.condition_id === userPossibleConditions[0].symptom_id) && (userSymptomsIds.includes(st.symptom_id))).map((st: any) => +st.treatment_id),
        
    ])

    const top2ConditionTreatments = _.uniq([
        ...symptomsTreatments.filter((st: any) => (st.condition_id === userPossibleConditions[1].symptom_id) && (!st.symptom_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (st.symptom_id === userPossibleConditions[1].symptom_id) && (!st.condition_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (st.condition_id === userPossibleConditions[1].symptom_id) && (userSymptomsIds.includes(st.symptom_id))).map((st: any) => +st.treatment_id),
        
    ])

    const top3ConditionTreatments = _.uniq([
        ...symptomsTreatments.filter((st: any) => (st.condition_id === userPossibleConditions[2].symptom_id) && (!st.symptom_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (st.symptom_id === userPossibleConditions[2].symptom_id) && (!st.condition_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (st.condition_id === userPossibleConditions[2].symptom_id) && (userSymptomsIds.includes(st.symptom_id))).map((st: any) => +st.treatment_id),
        
    ])

    const result = _.intersection(top1ConditionTreatments, top2ConditionTreatments, top3ConditionTreatments)

    console.log('getTreatmentForUserPossibleConditions');
    console.log(result);
    
    return result
}