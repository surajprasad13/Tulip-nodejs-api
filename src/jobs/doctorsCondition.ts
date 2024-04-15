
import config from '../config'
import SymptomConditionMaster from "../models/symptom_condition_master"
import SymptomConditionDoctorInfo from "../models/symptom_condition_doctor_info"
import { genericInfoExtraction } from './genericInfoExtraction'


const OVERVIEW_DOMAINS = [
   'http://medscape.com/',
   'http://merckmanuals.com/professional'
]

const INCIDENCE_RATE_DOMAINS = [
    'http://merckmanuals.com/professional'
]

const EPIDEMIOLOGY_DOMAINS = [
    'http://medscape.com/',
    'http://merckmanuals.com/professional'
]

const RISK_FACTORS_DOMAINS = [
    'http://merckmanuals.com/professional'
]

const ETIOLOGY_DOMAINS = [
    'http://medscape.com/',
    'http://merckmanuals.com/professional'
]

const PATHOPHYSIOLOGY_DOMAINS = [
    'http://medscape.com/',
    'http://merckmanuals.com/professional'
]

const SYMPTOMS_DOMAINS = [
    'http://medscape.com/',
    'http://merckmanuals.com/professional'
]

const PHYSICAL_EXAM_FINDINGS_DOMAINS = [
    'http://medscape.com/',
    'http://merckmanuals.com/professional'
]

const CONFIRMATION_OF_DIAGNOSIS_DOMAINS = [
    'http://medscape.com/',
    'http://merckmanuals.com/professional'
]

const DIFFERENTIAL_DIAGNOSIS_DOMAINS = [
    'http://medscape.com/',
    'http://merckmanuals.com/professional'
]

const TREATMENT_CONVENTIONAL_PHARMACEUTICALS_DOMAINS = [
    'http://merckmanuals.com/professional',
    'http://drugs.com/',
    'http://rxlist.com/'
]


let conditionsBeingProcessed = 0

export async function doctorsCondition() {
    if (config.NODE_ENV !== 'local') {
      console.log('NOT LOCAL ENV')
      return
    }
  
    console.log('doctorsCondition - running...')

    const symptom = await SymptomConditionMaster.findAll({
        raw: true,
      })

    const symptomsProcessed = (await SymptomConditionDoctorInfo.findAll({
        raw: true,
      })).map((s:any) => s.symptom_id)

      for(const s of symptom){
        if(symptomsProcessed.includes(s.id)){
            continue
        }

        if(s.symptom_type === 'condition'){
            searchCondition(s)
        }
      }

}

async function searchCondition(condition: any) {
    while(conditionsBeingProcessed > 10){
      await wait(30000)
    }

    conditionsBeingProcessed++
    console.log(`Searching condition ${condition.symptom_name}...`)
  
    let skeleton:any = buildSkeleton(condition.symptom_name)

    skeleton = await genericInfoExtraction(skeleton)    

    await SymptomConditionDoctorInfo.create({
        symptom_id: condition.id,
        symptom_name: condition.symptom_name,
        symptom_type: condition.symptom_type,
        data: skeleton
    })
  
    conditionsBeingProcessed--
    console.log(`${condition.symptom_name} - DONE`)
  
    return skeleton
  }
  
  
  
  function buildSkeleton(condition_name: string) {
      return [
          {
              id: 'WHAT_IS',
              summary: '',
              question: `Given the pieces of text below, please summarize them trying to answer what is ${condition_name}? Explain what is ${condition_name} in maximum 3 sentences.`,              
              sources: [
                  {
                      source: 'pdf',
                      systemType: 'diagnosis',
                      answer: ''
                  },
                  ...OVERVIEW_DOMAINS.map((domain) => ({
                      source: 'search-web',
                      domain,
                      answer: ''
                  }))
              ].map((source) => ({
                  ...source,
                  question: `What is ${condition_name}?`
              }))
          },
          {
              id: 'INCIDENCE_RATE',
              summary: '',
              question: `Given the pieces of text below, please summarize them trying to answer what is the incidence rate of ${condition_name}? Explain the incidence rate of ${condition_name} in maximum 3 sentences.`,
              sources: [
                  {
                      source: 'pdf',
                      systemType: 'diagnosis',
                      answer: ''
                  },
                  ...INCIDENCE_RATE_DOMAINS.map((domain) => ({
                      source: 'search-web',
                      domain,
                      answer: ''
                  }))
              ].map((source) => ({
                  ...source,
                  question: `What is the incidence rate of ${condition_name}?`,
              }))
          },
          {
              id: 'EPIDEMIOLOGY',
              summary: '',
              question: `Given the pieces of text below, please summarize them trying to answer what is the epidemiology of ${condition_name}? Explain the epidemiology of ${condition_name} in maximum 3 sentences.`,
              sources: [
                  {
                      source: 'pdf',
                      systemType: 'diagnosis',
                      answer: ''
                  },
                  ...EPIDEMIOLOGY_DOMAINS.map((domain) => ({
                      source: 'search-web',
                      domain,
                      answer: ''
                  }))
              ].map((source) => ({
                  ...source,
                  question: `What is the epidemiology of ${condition_name}?`,
              }))
          },
          {
            id: 'RISK_FACTORS',
            summary: '',
            question: `Given the pieces of text below, please summarize them trying to answer what are the risk factors of ${condition_name}? Try to answer who is at most risk based on age, gender, race, lifestyle, genetics, family history etc. List the risk factors in bullet points. Give a brief 1-2 sentence explanation as to how each risk factor leads to this condition or symptom.`,
            sources: [
                {
                    source: 'pdf',
                    systemType: 'diagnosis',
                    answer: ''
                },
                ...RISK_FACTORS_DOMAINS.map((domain) => ({
                    source: 'search-web',
                    domain,
                    answer: ''
                }))
            ].map((source) => ({
                ...source,
                question: `What are the risk factors of ${condition_name}?`,
            }))
        },
        {
            id: 'ETIOLOGY',
            summary: '',
            question: `Given the pieces of text below, please summarize them trying to answer what is the etiology of ${condition_name}? What causes it? Explain the etiology of ${condition_name} in maximum 3 sentences.`,
            sources: [
                {
                    source: 'pdf',
                    systemType: 'diagnosis',
                    answer: ''
                },
                ...ETIOLOGY_DOMAINS.map((domain) => ({
                    source: 'search-web',
                    domain,
                    answer: ''
                }))
            ].map((source) => ({
                ...source,
                question: `What is the etiology of ${condition_name}? What causes it?`,
            }))
        },
        {
            id: 'PATHOPHYSIOLOGY',
            summary: '',
            question: `Given the pieces of text below, please summarize them trying to answer what is the pathophysiology of ${condition_name}? What is going wrong in the body when the patient has ${condition_name}? Explain the pathophysiology of ${condition_name} in maximum 3 sentences.`,
            sources: [
                {
                    source: 'pdf',
                    systemType: 'diagnosis',
                    answer: ''
                },
                ...PATHOPHYSIOLOGY_DOMAINS.map((domain) => ({
                    source: 'search-web',
                    domain,
                    answer: ''
                }))
            ].map((source) => ({
                ...source,
                question: `What is the pathophysiology of ${condition_name}? What is going wrong in the body when the patient has ${condition_name}?`,
            }))
        },
        {
            id: 'SYMPTOMS',
            summary: '',
            question: `Given the pieces of text below, please summarize them trying to answer what are the most common symptoms of ${condition_name}? What are the less common symptoms of ${condition_name}? List in bullet points the most common and less common symptoms of ${condition_name}. Give a brief 1-2 sentence explanation as to how each symptom presents in the patient.`,
            sources: [
                {
                    source: 'pdf',
                    systemType: 'diagnosis',
                    answer: ''
                },
                ...SYMPTOMS_DOMAINS.map((domain) => ({
                    source: 'search-web',
                    domain,
                    answer: ''
                }))
            ].map((source) => ({
                ...source,
                question: `What are the most common symptoms of ${condition_name}? What are the less common symptoms of ${condition_name}?`,
            }))
        },
        {
            id: 'PHYSICAL_EXAMS',
            summary: '',
            question: `Given the pieces of text below, please summarize them trying to answer what are the indicated physical exams for ${condition_name}? What are the most common findings in the physical exams for ${condition_name}? List in bullet points the most common findings in the physical exams for ${condition_name}. List physical exam item and then the findings; i.e., what they would palpate/visualize/hear for that specific finding and what does that mean physiologically/what is that indicating in the body. Give a brief 1-2 sentence explanation as to how each physical exam finding is indicative of ${condition_name}.`,
            sources: [
                {
                    source: 'pdf',
                    systemType: 'diagnosis',
                    answer: ''
                },
                ...PHYSICAL_EXAM_FINDINGS_DOMAINS.map((domain) => ({
                    source: 'search-web',
                    domain,
                    answer: ''
                }))
            ].map((source) => ({
                ...source,
                question: `What are the indicated physical exams for ${condition_name}? What are the most common findings in the physical exams for ${condition_name}?`,
            }))
        },
      ].map((section) => ({
        ...section,
        systemMessage: `You are a naturopahtic doctor especialized in ${condition_name} supporting other doctors in their practice.
        Your goal is to summarize pices of text extracted from books and websites about ${condition_name}.
        Write the text in the best way possible considering that other doctors will read it. `
      }))
  }
  

  async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }