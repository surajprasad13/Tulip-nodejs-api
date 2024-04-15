import config from '../config'
import SymptomMaster from '../models/masters/symptom_master';
import TreatmentMaster from '../models/masters/treatment_master';
import SymptomTreatments from '../models/symptom_treatments';

export async function hideSymptomsWithNoTreatments() {
  if (
    config.NODE_ENV !== 'qa'    
  ) {
    console.log('NOT QA ENV');
    return
  }

  console.log('hideSymptomsWithNoTreatments - QA ENV');

  let symptomTreatments =
  (await SymptomTreatments.findAll({
    raw: true,
  })) ?? []

  symptomTreatments = await setSourceAndIsValid(symptomTreatments)

  await setVisibilityInvalidSymptoms(symptomTreatments)

  console.log('hideSymptomsWithNoTreatments - DONE');
}


async function setSourceAndIsValid(symptomTreatments: any[]){
  const treatmentsMaster = (await TreatmentMaster.findAll({raw: true})) ?? []
  const symptomsMaster = (await SymptomMaster.findAll({raw: true})) ?? []

  for(const symptomTreatment of symptomTreatments){
    const treatmentMaster = treatmentsMaster.find((treatmentMaster: any) => +treatmentMaster.treatment_id === +symptomTreatment.treatment_id)
    const symptomMaster = symptomsMaster.find((symptomMaster: any) => +symptomMaster.symptom_id === +symptomTreatment.symptom_id)

    if(!treatmentMaster){
      symptomTreatment.toBeRemoved = true
      console.log(`treatmentMaster not found for treatment_id: ${symptomTreatment.treatment_id} - ${symptomTreatment.treatment_name}`);      
      continue
    }

    if(!symptomMaster){
      symptomTreatment.toBeRemoved = true
      console.log(`symptomMaster not found for symptom_id: ${symptomTreatment.symptom_id} - ${symptomTreatment.symptom_name}`);
      continue
    }

    symptomTreatment.isValid = ((symptomTreatment?.key_roles?.length || symptomTreatment?.expected_improvement?.length)) && (symptomTreatment?.valid_articles_counter > 0)

    symptomTreatment.type = []

    if((treatmentMaster?.treatment_type??'').toLowerCase().includes('vitamin') || (treatmentMaster?.treatment_type??'').toLowerCase().includes('herb') ) {
      symptomTreatment.type.push('supplement')
    }
    
    if((treatmentMaster?.treatment_type??'').toLowerCase().includes('food')) {
      symptomTreatment.type.push('food')
    }

    if((treatmentMaster?.treatment_type??'').toLowerCase().includes('lifestyle')) {
      symptomTreatment.type.push('lifestyle')
    }

    symptomTreatment.type = symptomTreatment.type.join(',')
  }

  return symptomTreatments.filter((symptomTreatment: any) => !symptomTreatment.toBeRemoved)
}

async function setVisibilityInvalidSymptoms(symptomTreatments: any[]){
  const symptomsMaster = ((await SymptomMaster.findAll({raw: true})) || []).map((symptomMaster: any) => ({
    ...symptomMaster,
    treatments: {
      supplements: 0,
      food: 0,
      lifestyle: 0,
    }
  }))

  for(const symptom of symptomsMaster){
    const treatments = symptomTreatments.filter((symptomTreatment: any) => symptomTreatment.symptom_id === symptom.symptom_id)

    for(const treatment of treatments){
      if(treatment?.isValid){
        if((treatment?.type??'').includes('supplement')){
          symptom.treatments.supplements++
        }

        if((treatment?.type??'').includes('food')){        
          symptom.treatments.food++
        }

        if((treatment?.type??'').includes('lifestyle')){              
          symptom.treatments.lifestyle++
        }
      }
    }
  }

  console.log(`TOTAL SYMPTOMS: ${symptomsMaster?.length}`);

  const symptomsFalse = []

  for(const symptomMaster of symptomsMaster){
    if((symptomMaster.treatments.supplements < 3) || (symptomMaster.treatments.food < 2) || (symptomMaster.treatments.lifestyle < 1)){
      await SymptomMaster.update({show: false}, {where: {symptom_id: symptomMaster.symptom_id}})
      symptomsFalse.push(symptomMaster.symptom_id)
    }
    else{
      await SymptomMaster.update({show: true}, {where: {symptom_id: symptomMaster.symptom_id}})
    }
  }

  console.log(`SYMPTOMS BEING HIDDEN: ${symptomsFalse?.length}`);  
  
}
