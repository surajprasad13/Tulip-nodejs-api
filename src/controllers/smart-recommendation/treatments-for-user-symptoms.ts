export function getTreatmentsForUserSymptoms(userSymptoms: any[], symptomsTreatments: any[]) {
  const treatmentsIds: number[] = []

  for (const userSymptom of userSymptoms) {
    const symptomTreatments = symptomsTreatments.filter((st: any) => (((st.symptom_id === userSymptom.symptom_id) && (!st.condition_id)) || ((st.condition_id === userSymptom.symptom_id) && (!st.symptom_id))) )
    for (const symptomTreatment of symptomTreatments) {
      treatmentsIds.push(symptomTreatment.treatment_id)
    }
  }

  console.log('getTreatmentsForUserSymptoms');
    console.log(treatmentsIds);
  
  return treatmentsIds
}
