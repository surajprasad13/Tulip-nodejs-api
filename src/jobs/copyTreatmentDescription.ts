import config from '../config'
import TreatmentMaster from '../models/masters/treatment_master';
import SymptomTreatments from '../models/symptom_treatments';

export async function copyTreatmentDescription() {
    if (
        config.NODE_ENV !== 'qa'
      ) {
        console.log('NOT QA ENV');
        return
      }
    
      console.log('copyTreatmentDescription - QA ENV')

      const symptomTreatments = (await SymptomTreatments.findAll({
        raw: true,    
      })??[])

      const treatments = await TreatmentMaster.findAll({ raw: true })

      for(const symptomTreatment of symptomTreatments) {
        const treatment = treatments.find((treatment: any) => +treatment.treatment_id === +symptomTreatment.treatment_id)

        if(!treatment){
            console.log('TREATMENT NOT FOUND: ', symptomTreatment.treatment_id);
            continue
        }

        await SymptomTreatments.update(
            {
                treatment_description: treatment.description
            },
            {
                where: {
                    id: symptomTreatment.id
                }
            })
      }

      console.log('copyTreatmentDescription - DONE');

}