
export function removeSimilarTreatments(supplements: any[]) {
    const supplementsOut:any[] = []
  
    const groups = [
      {
        count: 0,
        treatments: [30905, 30906, 30907, 30908, 30909, 30910, 30912, 30913, 30915, 30916, 30917, 30918, 30919, 30920, 30921, 30922, 30924, 30925, 30928, 30929, 30930, 30931, 30932, 30933, 30934, 30936, 30937, 30938, 30939, 30940, 30941, 30942, 30943, 30944, 30945, 30946, 30947, 30948, 30949, 30950, 30951, 30952, 30953, 30954, 30955, 30956, 30957, 30958, 30959, 30960, 30961, 30962, 30964, 30965, 30966, 30967, 30969, 30970, 30971, 30972, 30973, 30974, 30975, 30976, 30977, 30978, 30979, 30980, 30981, 30982, 30983, 30984, 30985, 30986, 30987, 30988, 30989, 30990, 30991, 30992, 30993, 30995, 30996, 30997, 30998, 30999, 31000, 31001, 31002, 31003, 31004, 31005, 31006, 31007, 31008, 31009, 31010, 31012, 31013, 31014, 31015, 31016, 31017, 31018, 31019, 31020, 31021, 31022]
      },
      {
        count: 0,
        treatments: [31277, 31194, 31258]
      },
      {
        count: 0,
        treatments: [31233, 30064]
      },
      {
        count: 0,
        treatments: [30057,30109]
      },
      {
        count: 0,
        treatments: [31312, 30201]
      },
      {
        count: 0,
        treatments: [31224, 30064]
      },
      {
        count: 0,
        treatments: [31237, 30050, 31233, 30117]
      }
    ]
  
    for(const supplement of supplements){
      let addSupplement = true
  
      for(const group of groups){
        if(group.treatments.includes(supplement.treatment_id)){
          group.count++
  
          if(group.count > 1){
            addSupplement = false
          }
        }
      }
  
      if(addSupplement){
        supplementsOut.push(supplement)
      }
    }
  
    return supplementsOut
  }