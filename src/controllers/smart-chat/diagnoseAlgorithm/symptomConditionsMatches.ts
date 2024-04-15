import SymptomTreatmentsHumata from '../../../models/symptom_treatments_humata'

export async function symptomConditionsMatches(main_symptoms_conditions: any[], other_symptoms_conditions: any[]) {
  const conditions = [...main_symptoms_conditions, ...other_symptoms_conditions].filter(
    (c: any) => c.symptom_type === 'condition'
  )

  const allSymptomsNames = [...main_symptoms_conditions, ...other_symptoms_conditions]
    .filter((c: any) => c.symptom_type === 'symptom')
    .map((c: any) => c.symptom_name)

  const symptomsTreatmentsHumata = await SymptomTreatmentsHumata.findAll({
    where: {
      condition_name: conditions.map((c: any) => c.symptom_name),
    },
    raw: true,
  })

  const symptom_conditions_matches = []

  for (const symptomTreatmentHumata of symptomsTreatmentsHumata) {
    if (
      symptomTreatmentHumata?.symptom_name?.length &&
      allSymptomsNames.includes(symptomTreatmentHumata?.symptom_name)
    ) {
      symptom_conditions_matches.push(symptomTreatmentHumata)
    }
  }

  return symptom_conditions_matches
}
