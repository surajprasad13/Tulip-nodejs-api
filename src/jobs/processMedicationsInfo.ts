
import config from '../config'
import MedicationsMaster from '../models/masters/medications_master'
import MedicationsInfo from '../models/medications_info'
import MedicationsInfoLightweight from '../models/medications_info_lightweight'

import { genericInfoExtraction } from './genericInfoExtraction'


let medicationsBeingProcessed = 0

const DOMAINS = [
    'http://drugs.com',
    'http://rxlist.com',
    'http://merckmanuals.com',
    'http://accessdata.fda.gov',
    'http://medlineplus.gov',
    'http://reference.medscape.com'
 ]

export async function processMedicationsInfo() {
    if (config.NODE_ENV !== 'dev') {
      console.log('NOT DEV ENV')
      return
    }
  
    console.log('medications info - running...')

    const medications = (await MedicationsMaster.findAll({       
        raw: true,
        where: {
            id_medication: [57824,50226,51931,50336,51065,50514,50001,50002,50003,50005,50004,50008,50011,50009,50014,50012,50016,50022,50023,50021,50020,50019,50018,50017,50032,50030,50033,50031,50029,50036,50028,50035,50034,50038,50037,50026,50027,50025,50041,50042,50024,50044,50045,50043,50040,50048,50046,50047,50039,50055,50054,50056,50057,50060,50051,50049,50050,50058,50052,50064,50061,50053,50059,50065,50063,50062,]
        }
      }))

    console.log(`Found ${medications.length} medications`);

    const medicationsProcessed = (await MedicationsInfo.findAll({
        raw: true,
      }))

      console.log(`Found ${medications.length} medications processed`);

      for(const m of medications){
        if(medicationsProcessed.find((mp: any) => mp.id_medication === m.id_medication)?.gpt3){
            continue
        }

        try{
            searchMedication(m, medicationsProcessed.find((mp: any) => mp.id_medication === m.id_medication)?.gpt3??null)
        }
        catch(e){
            console.error(e)
        }
      }

      console.log('processMedicationsInfo DONE!');
      

}

async function searchMedication(medication: any, skeleton: any = null) {
    while(medicationsBeingProcessed > 10){
      await wait(30000)
    }

    medicationsBeingProcessed++
    console.log(`Searching medication ${medication.brand_name} (${medication.generic_name})...`)
  
    skeleton = skeleton ?? buildSkeleton(medication.brand_name, medication.generic_name)

    skeleton = await genericInfoExtraction(skeleton)    

    if(await MedicationsInfo.findOne({where: {id_medication: medication.id_medication}})){
        await MedicationsInfo.update({
            gpt3: skeleton,
            updatedAt: new Date(),
        }, {
            where: {id_medication: medication.id_medication}
        })
    }
    else{
        await MedicationsInfo.create({
            id_medication: medication.id_medication,
            brand_name: medication.brand_name,
            generic_name: medication.generic_name,
            gpt3: skeleton,
            summarized_info: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    }

    if(await MedicationsInfoLightweight.findOne({where: {id_medication: medication.id_medication}})){
        await MedicationsInfoLightweight.update({
            gpt3: {
                sections: skeleton.sections.map((s: any) => ({
                    id: s.id,
                    question: s.question,
                    systemMessage: s.systemMessage,
                    summary: s.summary,
                }))
            },
            updatedAt: new Date(),
        }, {
            where: {id_medication: medication.id_medication}
        })
    }
    else{
        await MedicationsInfoLightweight.create({
            id_medication: medication.id_medication,
            brand_name: medication.brand_name,
            generic_name: medication.generic_name,
            gpt3: {
                sections: skeleton.sections.map((s: any) => ({
                    id: s.id,
                    question: s.question,
                    systemMessage: s.systemMessage,
                    summary: s.summary,
                }))
            },
            summarized_info: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
    }
    
  
    medicationsBeingProcessed--
    console.log(`${medication.brand_name} (${medication.generic_name}) - DONE`)
  
    return skeleton
  }
  
  
  
  function buildSkeleton(brand_name: string, generic_name: string) {
      return {
        searchWebRequests: DOMAINS.map((domain: string) => ({
            domain,
            question: `Provide all information about ${brand_name} (${generic_name})`,
            result: null
        })),
        searchWebText: '',
        searchWebQuestion: `Summarize the text below about ${brand_name} (${generic_name}). 
        The text was extracted from websites about ${brand_name} (${generic_name}).
        Give me detailed and specific information about ${brand_name} (${generic_name}) in a professional, scientific, medical terminology.
        Do not make up information, give answers based on the text provided to you.
        Try to extract and summarize the following information: drug classification, availability, CSA schedule, WADA class, approval history, mechanism of action, pharmacokinetics (Absorption, Distribution, Metabolism, Excretion, and Special populations), indications, dosage, dosing, tapering schedule, side effects, black box warnings, pregnancy, lactation, contraindications, cautions, monitoring parameters, major pharmaceutical interactions, minor pharmaceutical interactions, nutritional interactions, botanical interactions, nutrient depletions, and other relevant information about ${brand_name} (${generic_name}).
        TEXT: `,        
        searchWebSystemMessage: `You are a medication expert especialized in ${brand_name} (${generic_name}). 
        Your goal is to analyze and summarize pieces of text about ${brand_name} (${generic_name}) extracted from the web.
        Do not make up information, give answers based on the text provided to you.
        Try to extract the following information items from the text given to you: 
            - Drug classification of ${brand_name} (${generic_name})
            - Availability. Does ${brand_name} (${generic_name}) need to be prescribed or can it be bought over the counter?
            - CSA schedule. Which schedule ${brand_name} (${generic_name}) is or if it's a controlled substance (i.e., need special license to prescribe)
            - WADA class. Is ${brand_name} (${generic_name}) prohibited or allowed by the WADA (world anti doping association)? Can you prescribe it to professional/semi-professional athletes?
            - Approval history
            - Mechanism of action
            - Pharmacokinetics - Absorption. Is it well absorbed? About how much of it is absorbed? Does food help or hinder absorption?
            - Pharmacokinetics - Distribution. How does it move through the body to produce the intended effects?
            - Pharmacokinetics - Metabolism. How is it metabolized in the body?
            - Pharmacokinetics - Excretion. How is it excreted (eliminated) from the body?
            - Pharmacokinetics - Special populations. Does the dose/prescription need to be adjusted based on race, age, kidney or liver function,etc...?
            - Indications - Adult common. What are all of the common uses in adults?
            - Indications - Adult off label. What are all of the off-label uses in adults?
            - Indications - Pediatric common. What are all of the common uses in children?
            - Indications - Pediatric off label. What are all of the off-label uses in children?
            - Dosage form available and dosage. What are the dosage forms and all of the available doses?
            - Dosing - Adult common. What are the common adult dosing instructions and dosage forms for each condition?
            - Dosing - Pediatric common. What are the common pediatric dosing instructions and dosage forms for each condition?
            - Tapering schedule. What is the specific taper off schedule? Need to actually list the taper schedule, not just state that there should be one.
            - Common side effects
            - Rare side effects
            - Black box warnings
            - Pregnancy. Is it safe for pregnancy?
            - Lactation. Is it safe for lactation?
            - Contraindications
            - Cautions
            - Monitoring parameters along with safety warnings
            - Major pharmaceutical interactions. All major medications that should not be taken at the same time with ${brand_name} (${generic_name}) and how and why they interact
            - Minor pharmaceutical interactions. All minor medications that should not be taken at the same time with ${brand_name} (${generic_name}) and how and why they interact
            - Nutritional interactions. All supplements, vitamins, minerals, and herbs that should not be taken at the same time with ${brand_name} (${generic_name}) and how and why they interact
            - Botanical interactions. All plants, herbs, and botanicals that should not be taken at the same time with ${brand_name} (${generic_name}) and how and why they interact
            - Nutrient depletions. All nutrients that can be depleted when taking ${brand_name} (${generic_name}) and how and why the nutrients become depleted
            - Other relevant information about ${brand_name} (${generic_name}).`,
        searchWebSummarizedText: '',
        sections: [
            {
                id: 'DRUG_CLASSIFICATION',
                summary: '',
                question: `According to the pieces of text below, what is the drug classification of ${brand_name} (${generic_name})?`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `What is the drug classification of ${brand_name} (${generic_name})?`
                }))
            },


            {
                id: 'DRUG_STATUS_AVAILABILITY_APPROVAL_HISTORY',
                summary: '',
                question: `According to the pieces of text below, what is the status of ${brand_name} (${generic_name}) including its availability? Does ${brand_name} (${generic_name}) need to be prescribed or can it be bought over the counter?). Is ${brand_name} (${generic_name}) a controlled substance? If so what category of drug is it, is it prohibited or allowed by the WADA (world anti doping association)? what is the approval history of ${brand_name} (${generic_name})?`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `What is the status of ${brand_name} (${generic_name}) including its availability? Does ${brand_name} (${generic_name}) need to be prescribed or can it be bought over the counter?). Is ${brand_name} (${generic_name}) a controlled substance? If so what category of drug is it, is it prohibited or allowed by the WADA (world anti doping association)? what is the approval history of ${brand_name} (${generic_name})?`
                }))
            },

            {
                id: 'MECHANISM_OF_ACTION_PHARMACOKINETICS',
                summary: '',
                question: `According to the pieces of text below, what is the mechanism of action of ${brand_name} (${generic_name})? Please give detailed and specific information about the mechanism of action of ${brand_name} (${generic_name}). What is the pharmacokinetics of ${brand_name} (${generic_name}) (metabolism, elimination, half life)?`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `Please give detailed and specific information about ${brand_name} (${generic_name}) mechanism of action and its pharmacokinetics (metabolism, elimination, half life)`
                }))
            },

            {
                id: 'COMMON_USES',
                summary: '',
                question: `According to the pieces of text below, what are all of the common uses of ${brand_name} (${generic_name}) in adults? Give a list of all of ${brand_name} (${generic_name}) common uses and off label uses, with specific dosing instructions and dosage forms of the medication in adults and pediatrics.`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `Give a list of all of ${brand_name} (${generic_name}) common uses and off label uses, with specific dosing instructions and dosage forms of the medication in adults and pediatrics`
                }))
            },


            {
                id: 'DOSAGE',
                summary: '',
                question: `According to the pieces of text below, what are the common dosing instructions and dosage forms for each condition that ${brand_name} (${generic_name}) is used for? Please give specific dosing instructions and dosage forms for each condition that ${brand_name} (${generic_name}) is used for. Give a list of the dosage forms (capsules, tablets, liquid, ointment, etc.), all of the available doses, and specific taper off schedule of ${brand_name} (${generic_name}).`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `Give a list of the dosage forms (capsules, tablets, liquid, ointment, etc.), all of the available doses, and specific taper off schedule of ${brand_name} (${generic_name})`
                }))
            },

            {
                id: 'SIDE_EFFECTS_BLACKBOX_WARNINGS',
                summary: '',
                question: `According to the pieces of text below, what are the common side effects, rare side effects, and specific black box warnings of ${brand_name} (${generic_name})? Give all common side effects, rare side effects, and specific black box warnings of ${brand_name} (${generic_name}).`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `Give all common side effects, rare side effects, and specific black box warnings of ${brand_name} (${generic_name})`
                }))
            },

            {
                id: 'CONTRAINDICATIONS_CAUTIONS',
                summary: '',
                question: `According to the pieces of text below, what are all contraindications and cautions of ${brand_name} (${generic_name})? Give all contraindications and cautions of ${brand_name} (${generic_name}). Is ${brand_name} (${generic_name}) safe in pregnancy and lactation?`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `Give all contraindications and cautions of ${brand_name} (${generic_name}) including if it is safe in pregnancy and lactation`
                }))
            },


            {
                id: 'MONITOR',
                summary: '',
                question: `According to the pieces of text below, how to monitor someone while on ${brand_name} (${generic_name}) along with safety warnings? Give detailed and specific information on how to monitor someone while on ${brand_name} (${generic_name}) along with safety warnings.`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `How to monitor someone while on ${brand_name} (${generic_name}) along with safety warnings`
                }))
            },

            {
                id: 'PHARMACEUTICAL_INTERACTIONS',
                summary: '',
                question: `According to the pieces of text below, what are the major and minor pharmaceutical interactions of ${brand_name} (${generic_name})? Give a list of all major and minor medications that should not be taken at the same time with ${brand_name} (${generic_name}). Also include the information about how and why they interact.`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `Give a list of all medications that should not be taken at the same time with ${brand_name} (${generic_name}). How and why they interact?`
                }))
            },

            {
                id: 'SUPPLEMENTS_INTERACTIONS',
                summary: '',
                question: `According to the pieces of text below, what are the nutritional and botanical interactions of ${brand_name} (${generic_name})? Give a list of all supplements, vitamins, minerals, herbs, foods, and drink that should not be taken at the same time with ${brand_name} (${generic_name}). Also include the information about how and why they interact.`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `Give a list of all supplements, vitamins, minerals, herbs, foods, and drink that should not be taken at the same time with ${brand_name} (${generic_name}). How and why they interact?`
                }))
            },

            {
                id: 'NUTRIENT_DEPLETIONS',
                summary: '',
                question: `According to the pieces of text below,  what are the nutrient depletions of ${brand_name} (${generic_name})? Give a list of all nutrients that can be depleted when taking ${brand_name} (${generic_name}) with information on how and why the nutrients become depleted.`,              
                sources: [
                    {
                        source: 'pdf',
                        systemType: 'medications2',
                        answer: ''
                    },                   
                ].map((source) => ({
                    ...source,
                    question: `Give a list of all nutrients that can be depleted when taking ${brand_name} (${generic_name}) with information on how and why the nutrients become depleted`
                }))
            },
        ].map((section) => ({
          ...section,
          systemMessage: `You are a medication expert especialized in ${brand_name} (${generic_name}) supporting doctors in their practice.
          Answer the questions based on the pieces of text given to you without referring to them. Avoid mentioning "according to the pieces of text below" or similar expressions.
          If you are not able to answer the question, leave it blank.
          The pieces of text are extracted from books and websites about ${brand_name} (${generic_name}).
          Do not make up the answer, only use the information provided to answer the questions.        
          Write the text in the best way possible considering that other doctors will read it. 
          Please provide the information in professional, scientific, medical terminology.`
        }))
      }
  }
  

  async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }