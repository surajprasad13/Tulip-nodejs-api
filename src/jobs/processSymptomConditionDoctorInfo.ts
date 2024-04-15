
import config from '../config'
import SymptomConditionDoctorInfo from '../models/symptom_condition_doctor_info'
import SymptomConditionMaster from '../models/symptom_condition_master'

import { genericInfoExtraction } from './genericInfoExtraction'


const OVERVIEW_DOMAINS = [
    'http://medscape.com/',
    'http://merckmanuals.com/'
 ]
 
 const INCIDENCE_RATE_DOMAINS = [
     'http://merckmanuals.com/'
 ]
 
 const EPIDEMIOLOGY_DOMAINS = [
     'http://medscape.com/',
     'http://merckmanuals.com/'
 ]
 
 const RISK_FACTORS_DOMAINS = [
     'http://merckmanuals.com/'
 ]
 
 const ETIOLOGY_DOMAINS = [
     'http://medscape.com/',
     'http://merckmanuals.com/'
 ]

 const PROGNOSIS_DOMAINS = [
    'http://medscape.com/',
    'http://merckmanuals.com/'
]
 
 const PATHOPHYSIOLOGY_DOMAINS = [
     'http://medscape.com/',
     'http://merckmanuals.com/'
 ]
 
 const SYMPTOMS_DOMAINS = [
     'http://medscape.com/',
     'http://merckmanuals.com/'
 ]
 
 const PHYSICAL_EXAM_FINDINGS_DOMAINS = [
     'http://medscape.com/',
     'http://merckmanuals.com/'
 ]
 
 const TESTING_SPECIALTY_TESTING_DOMAINS = [
    'https://www.rupahealth.com/'
]

const CONFIRMATION_OF_DIAGNOSIS_DOMAINS = [
    'http://medscape.com/',
    'http://merckmanuals.com/'
]

 const DIFFERENTIAL_DIAGNOSIS_DOMAINS = [
     'http://medscape.com/',
     'http://merckmanuals.com/'
 ]
 
 const TREATMENT_CONVENTIONAL_PHARMACEUTICALS_DOMAINS = [
     'http://merckmanuals.com/',
     'http://drugs.com/',
     'http://rxlist.com/'
 ]
 

let symptomConditionsBeingProcessed = 0


export async function processSymptomConditionDoctorInfo() {
    if (config.NODE_ENV !== 'dev') {
      console.log('NOT DEV ENV')
      return
    }
  
    console.log('processSymptomConditionDoctorInfo info - running...')

    const symptomConditionMaster = (await SymptomConditionMaster.findAll({       
        raw: true,       
      }))

    console.log(`Found ${symptomConditionMaster.length} symptomConditionMaster`);

    const symptomConditionDoctorInfo = (await SymptomConditionDoctorInfo.findAll({
        raw: true,
      }))

      console.log(`Found ${symptomConditionDoctorInfo.length} symptomConditionDoctorInfo`);

      for(const symptomCondition of symptomConditionMaster){
        if(symptomConditionDoctorInfo.find((sc: any) => sc.symptom_id === symptomCondition.symptom_id)?.data){
            continue
        }

        try{
            search(symptomCondition, symptomConditionDoctorInfo.find((sc: any) => sc.symptom_id === symptomCondition.symptom_id)?.data??null)
        }
        catch(e){
            console.error(e)
        }
      }

      console.log('processMedicationsInfo DONE!');
      

}

async function search(symptomCondition: any, skeleton: any = null) {
    while(symptomConditionsBeingProcessed > 10){
      await wait(30000)
    }

    symptomConditionsBeingProcessed++
    console.log(`Searching ${symptomCondition.symptom_name}...`)
  
    skeleton = skeleton ?? buildSkeleton(symptomCondition.symptom_name)

    skeleton = await genericInfoExtraction(skeleton)    

    if(await SymptomConditionDoctorInfo.findOne({where: {symptom_id: symptomCondition.symptom_id}})){
        await SymptomConditionDoctorInfo.update({
            data: skeleton,
            updatedAt: new Date(),
        }, {
            where: {symptom_id: symptomCondition.symptom_id}
        })
    }
    else{
        await SymptomConditionDoctorInfo.create({
            symptom_id: symptomCondition.symptom_id,
            symptom_name: symptomCondition.symptom_name,
            symptom_type: symptomCondition.symptom_type,
            data: skeleton,
            summarized_info: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    }

    symptomConditionsBeingProcessed--
  
    return skeleton
  }
  
  
  
  function buildSkeleton(symptom_name: string) {
      return {
        searchWebRequests: null,
        searchWebText: null,
        searchWebQuestion: null,        
        searchWebSystemMessage: null,
        searchWebSummarizedText: '',
        sections: [
            {
                id: 'OVERVIEW',
                summary: '',
                sectionHeading: 'Overview',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...OVERVIEW_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What is ${symptom_name}? Give me the overview of ${symptom_name}.`,
                }))
            },
            {
                id: 'INCIDENCE_RATE',
                summary: '',
                sectionHeading: 'Incidence rate',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...INCIDENCE_RATE_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What is the incidence rate of ${symptom_name}? What are the new cases of ${symptom_name} per year (or a specified amount of time)?`,
                }))
            },
            {
                id: 'EPIDEMIOLOGY',
                summary: '',
                sectionHeading: 'Epidemiology',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...EPIDEMIOLOGY_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What is the epidemiology of ${symptom_name}?`,
                }))
            },
            {
                id: 'RISK_FACTORS',
                summary: '',
                sectionHeading: 'Risk factors',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...RISK_FACTORS_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What are the risk factors of ${symptom_name}? Who is at the most risk based on age, gender, race, lifestyle, genetics, family history etc.?`,
                }))
            },
            {
                id: 'ETIOLOGY',
                summary: '',
                sectionHeading: 'Etiology',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...ETIOLOGY_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What is the etiology of ${symptom_name}? What causes it?`,
                }))
            },
            {
                id: 'PROGNOSIS',
                summary: '',
                sectionHeading: 'Prognosis',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...PROGNOSIS_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What is the prognosis of ${symptom_name}? What is the most likely outcome of ${symptom_name}? Will the patient get better or worse? Will they survive? Can ${symptom_name} turn into something else?`,
                }))
            },
            {
                id: 'PATHOPHYSIOLOGY',
                summary: '',
                sectionHeading: 'Pathophysiology',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...PATHOPHYSIOLOGY_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What is the pathophysiology of ${symptom_name}? What is going wrong in the body when the patient has ${symptom_name}? Give specific and detailed information about the pathophysiology of ${symptom_name}.`,
                }))
            },
            {
                id: 'MOST_COMMON_SYMPTOMS',
                summary: '',
                sectionHeading: 'Symptoms ',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...SYMPTOMS_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What are the most common symptoms of ${symptom_name}? Why they occur, how they feel, and how they affect the patient?`,
                }))
            },
            {
                id: 'LESS COMMON SYMPTOMS',
                summary: '',
                sectionHeading: 'Symptoms ',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...SYMPTOMS_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What are the less common symptoms of ${symptom_name}? Why they occur, how they feel, and how they affect the patient?`,
                }))
            },
            {
                id: 'PHYSICAL_EXAMS',
                summary: '',
                sectionHeading: 'Physical Exam Findings',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...PHYSICAL_EXAM_FINDINGS_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What are the indicated physical exams for ${symptom_name}? What are the most common findings in the physical exams for ${symptom_name}? List the specific physical exams that a doctor would do on a patient, what the results are, and what the results mean`,
                }))
            },
            {
                id: 'TESTING_CONVENTIONAL_LABS',
                summary: '',
                sectionHeading: 'Testing: Conventional Labs',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What are the conventional labs for ${symptom_name}? What are the most common findings in the conventional labs for ${symptom_name}?`,
                }))
            },
            {
                id: 'TESTING_SPECIALTY_TESTING',
                summary: '',
                sectionHeading: 'Testing: Specialty testing ',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...TESTING_SPECIALTY_TESTING_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What are the specialty tests for ${symptom_name}? What are the most common findings in the specialty tests for ${symptom_name}?`,
                }))
            },
            {
                id: 'CONFIRMATION_OF_DIAGNOSIS',
                summary: '',
                sectionHeading: 'Confirmation of Diagnosis',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...CONFIRMATION_OF_DIAGNOSIS_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `How is the diagnosis of ${symptom_name} confirmed? What are the most common methods to confirm the diagnosis of ${symptom_name}?`,
                }))
            },
            {
                id: 'MOST_COMMON_DIFFERENTIAL_DIAGNOSIS',
                summary: '',
                sectionHeading: 'Differential Diagnosis ',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...DIFFERENTIAL_DIAGNOSIS_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What are the most common conditions that can be confused with ${symptom_name}? List other diagnoses/conditions that overlap in symptoms or signs (physical exam findings) with ${symptom_name} and how they are differentiated from ${symptom_name}.`,
                }))
            },
            {
                id: 'LESS_COMMON_DIFFERENTIAL_DIAGNOSIS',
                summary: '',
                sectionHeading: 'Differential Diagnosis ',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...DIFFERENTIAL_DIAGNOSIS_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What are the less common conditions that can be confused with ${symptom_name}? List other diagnoses/conditions that overlap in symptoms or signs (physical exam findings) with ${symptom_name} and how they are differentiated from ${symptom_name}.`,
                }))
            },
            {
                id: 'HOLISTIC_ROOT_CAUSE_DIFFERENTIAL_DIAGNOSIS',
                summary: '',
                sectionHeading: 'Differential Diagnosis ',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'natural-root-causes',
                        answer: ''
                    },
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What are the holistic root causes of ${symptom_name}? What are the underlying causes of ${symptom_name} that are not typically addressed by conventional medicine?`,
                }))
            },
            {
                id: 'TREATMENT_CONVENTIONAL_PHARMACEUTICALS',
                summary: '',
                sectionHeading: 'Treatment: Conventional Pharmaceuticals',
                question: null,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'conventional-diagnosis',
                        answer: ''
                    },
                    ...TREATMENT_CONVENTIONAL_PHARMACEUTICALS_DOMAINS.map((domain) => ({
                        source: 'search-web',
                        domain,
                        answer: ''
                    }))
                ].map((source) => ({
                    ...source,
                    sources: 4,
                    question: `What are the conventional pharmaceuticals used to treat ${symptom_name}?`,
                }))
            },
        ].map((section) => ({
          ...section,
          systemMessage: null
        }))
      }
  }
  

  async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }