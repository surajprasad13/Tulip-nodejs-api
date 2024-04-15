import * as _ from 'lodash'

export function mergeSimilarTreatments(supplements: any[], treatmentsMaster: any[]) {
    const similarTreatments:any[] = [{
      treatments: [30000, 30001, 30002, 30003, 30004, 30007, 31228, 31247],
      count: 0,
      convertTo: 31247,
      requiresConvertion: false
    },
    {
      treatments: [30501, 30500, 31206],
      count: 0,
      convertTo: 31206,
      requiresConvertion: false
    },
    {
      treatments: [30867, 30868, 30869, 30875, 30879, 30881, 30882, 30884, 30890, 31392,30871, 30872, 30874, 30877, 30880, 30888, 31393, 31198],
      count: 0,
      convertTo: 31198,
      requiresConvertion: false
    },
    {
      treatments: [30876, 31198],
      count: 0,
      convertTo: 31198,
      requiresConvertion: false
    }
  ]
  
    for(const supplement of supplements){
      for(const similarTreatment of similarTreatments){
        if(similarTreatment.treatments.includes(supplement.treatment_id)){
          similarTreatment.count++
        }
      }
    }
  
    for(const similarTreatment of similarTreatments){
      if(similarTreatment.count > 1){
        similarTreatment.requiresConvertion = true
      }
    }
  
    for(const similarTreatment of similarTreatments){
      if(similarTreatment.requiresConvertion){
        const supplementIds = supplements.map((s: any) => s.treatment_id)
  
        if(!supplementIds.includes(similarTreatment.convertTo)){
          const treatment = treatmentsMaster.find((t: any) => t.treatment_id === similarTreatment.convertTo)
  
          if(treatment){
            supplements.unshift({
              ...treatment,
              type: treatment?.treatment_type,
              treatment_common_name: treatment?.common_names||treatment?.treatment_name,
              ayurvedic_name: treatment?.ayurvedic_name||treatment?.common_names||treatment?.treatment_name,
              chinese_name: treatment?.chinese_name||treatment?.common_names||treatment?.treatment_name,
              constitution: (treatment?.constitution??[]).filter((c: any) => !!c),
              ayurvedic_description: treatment?.ayurvedic_description??'',
              chinese_description: treatment?.chinese_description??'',
              symptomsAndConditions: [],
              articles: [],
              totalArticles: 0,
              symptomsTreatments: [],
              overlapping_categories: []
            })
          }
        }
  
        const supplementTarget = supplements[supplements.findIndex((s: any) => s.treatment_id === similarTreatment.convertTo)]
  
        if(supplementTarget){
          for(const supplement of supplements){
            if(similarTreatment.treatments.includes(supplement.treatment_id) && (supplement.treatment_id !== similarTreatment.convertTo)){
              supplementTarget.symptomsAndConditions.push(...supplement.symptomsAndConditions)
              supplementTarget.articles.push(...supplement.articles)
              supplementTarget.overlapping_categories.push(...(supplement?.overlapping_categories??[]))            
              supplementTarget.totalArticles += supplementTarget.articles.length
              supplementTarget.symptomsTreatments.push(...supplement.symptomsTreatments)            
            }
          }
  
          supplementTarget.overlapping_categories = _.uniq(supplementTarget.overlapping_categories)
          supplementTarget.symptomsAndConditions = _.uniq(supplementTarget.symptomsAndConditions)
          supplementTarget.symptomsTreatments = _.uniqBy(supplementTarget.symptomsTreatments,'id')
        }   
  
        supplements = supplements.filter((s: any) => !similarTreatment.treatments.includes(s.treatment_id) || (s.treatment_id === similarTreatment.convertTo))
      }
    }
    
    return supplements
  }