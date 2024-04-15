export function buildBaseRecObject(main_symptoms_conditions_ids: number[], other_symptoms_conditions_ids: number[], symptomsAndConditionsById: any){
    if(main_symptoms_conditions_ids?.length > 1){
        other_symptoms_conditions_ids.push(...main_symptoms_conditions_ids.slice(1))        
    }

    const main_symptom_condition_id = main_symptoms_conditions_ids[0]

    const main_symptom_condition = symptomsAndConditionsById[main_symptom_condition_id]
    let other_symptoms_conditions = other_symptoms_conditions_ids.map((s: number) => symptomsAndConditionsById[s]).filter((s: any) => s)
    
    
    if(main_symptom_condition.symptom_type === 'condition'){
     const relatedSymptoms = (main_symptom_condition?.symptoms??[]).filter((s: number) => (other_symptoms_conditions_ids??[]).includes(s)).map((s: number) => symptomsAndConditionsById[s]).filter((s: any) => s)
     const unrelatedSymptomsAndConditions = other_symptoms_conditions.filter((s: any) => !(main_symptom_condition?.symptoms??[]).includes(s.symptom_id))
     
     return ({
        condition: main_symptom_condition,
        relatedSymptoms,
        unrelatedSymptomsAndConditions,
        treatments: [],
        treatmentsUnrelatedSymptomsAndConditions: [],
     })
    }
    else{
        const other_conditions = other_symptoms_conditions.filter((s: any) => s.symptom_type === 'condition')

        const other_related_conditions = other_conditions.filter((s: any) => (s?.symptoms??[]).includes(main_symptom_condition.symptom_id))

        if(other_related_conditions.length){
            const condition = other_related_conditions[0]

            other_symptoms_conditions = other_symptoms_conditions.filter((s: any) => s.symptom_id !== condition.symptom_id)

            return ({
                symptom: main_symptom_condition,
                condition,
                otherSymptomsAndConditions: other_symptoms_conditions,
                treatments: [],
            })
        }

        return ({
            symptom: main_symptom_condition,
            otherSymptomsAndConditions: other_symptoms_conditions,
            treatments: [],
        })
    }

}