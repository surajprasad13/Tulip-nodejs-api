const OpenAI = require('openai')
import axios from "axios"
import config from '../config'
import GptLog from "../models/gpt_log"

const searchWebRequests:any = {}
const searchPDFRequests:any = {}
const gptRequests:any = {}

export async function genericInfoExtraction(skeleton: any) {
    let promises = []
    
    for (const searchWebRequest of (skeleton.searchWebRequests??[])) {
      promises.push(searchWeb(searchWebRequest))
    }

    await Promise.all(promises)

    skeleton.searchWebText = (skeleton.searchWebRequests??[]).map((r:any) => (r.result?.message??[]).map((m:any) => {      
      if((m?.pageContent?.length > 400000) || m?.metadata?.source.endsWith('pdf') ){
        return ''
      }
      return m?.pageContent??''
    }).join('\n\n')).join('\n\n')

    console.log(`SEARCH WEB TEXT INPUT: ${skeleton.searchWebText?.length}`);
    
    skeleton.searchWebText = await summarizeWebText(skeleton.searchWebQuestion, skeleton.searchWebText, skeleton.searchWebSystemMessage)

    console.log(`SEARCH WEB TEXT OUTPUT: ${skeleton.searchWebText?.length}`);

    promises = []

    for (const section of skeleton.sections) {
      for (const source of section.sources) {
        if (source.source === 'pdf') {
            promises.push(searchPDF(source))
        }
        else{
          if (source.source === 'search-web') {
            promises.push(searchWeb(source))
        }
        }
      }
    }

    await Promise.all(promises)   

    console.log('SEARCH DONE');
 
   // await wait(40000)

    promises = []

    for (const section of skeleton.sections) {
      promises.push(processSection(section, skeleton.searchWebText))
    }

    await Promise.all(promises)

    return skeleton
}

async function processSection(section: any, searchWebText: string) {
  const answers = section.sources.map((s:any) => s?.answer??'').join('\n\n')+searchWebText

  section.summary = await combineAndAsk(section.question, answers, section.systemMessage, 'gpt-4-turbo-preview')  
}


async function searchWeb(request: any, retries: number = 0): Promise<any>{
    try{
      if(request.result){
        console.log(`SEARCH WEB (${request.domain}): ${request.question} - CACHED`);
        return
      }

        while(!canSubmitSearchWebRequest()){
            await wait(2000)    
        }

        console.log(`SEARCH WEB (${request.domain}): ${request.question}`);

        searchWebRequests[new Date().getTime()] = {
            ts: new Date().getTime(),
            requests: (searchWebRequests[new Date().getTime()]?.requests??0) + 1
        }
        
        const res = await axios({
            method: "post",
            url: "https://us-central1-tulip-final-dev.cloudfunctions.net/apiSearch/search-web",
            data: {
                query: request.question,
                domain: request.domain,
                isStudy: false,
                sources: request.sources??1,
            },
        })
    
        if(res?.data){
            //console.log(`SEARCH WEB (${request.domain}): ${request.question} - ${(res?.data?.message??[]).map((m:any) => m?.pageContent?.length).join(',')}`);
            request.result = res.data
            return 
        }
        
        return
    }
    catch(e){
        console.log(e)

        if(retries < 5){
            await wait(5000)
            return searchWeb(request, retries + 1)
        }

        request.result = null
        return
    }      
  }

  async function searchPDF(requestParams: any, retries: number = 0): Promise<any>{
    try{
      if(requestParams.answer?.length && requestParams.answer_raw){
        console.log(`SEARCH PDF: ${requestParams.question} - CACHED`);
        return
      }

        while(!canSubmitSearchPDFRequest()){
            await wait(5000)    
        }

        console.log(`SEARCH PDF: ${requestParams.question}`);

        searchPDFRequests[new Date().getTime()] = {
            ts: new Date().getTime(),
            requests: (searchPDFRequests[new Date().getTime()]?.requests??0) + 1
        }
        
        const res = await axios({
            method: "post",
            url: "https://us-central1-tulip-final-dev.cloudfunctions.net/apiLang/chat",
            data: {
                question: requestParams.question,
                systemType: requestParams.systemType,
                isStudy: false,
                sources: requestParams.sources??1,
                onlySources: true
            },
        })

        if(res?.data){
            requestParams.answer = res.data.text??null
            requestParams.answer_raw = res.data
            return 
        }
    
        requestParams.answer = ''
        return
    }
    catch(e){
        console.log(e)

        if(retries < 5){
            await wait(5000)
            return searchPDF(requestParams, retries + 1)
        }

        requestParams.answer = ''
        return
    }      
  }

  function canSubmitSearchWebRequest(){
    const last60SecondsRequests = (Object.values(searchWebRequests).filter((requests:any) => {
        return (new Date().getTime() - (requests.ts??0)) < 90000
      })).map((r:any) => r.requests).reduce((a:number, b:number) => a + b, 0)

      if(last60SecondsRequests >= 10){
        return false
      }

      return true
  }

  function canSubmitSearchPDFRequest(){
    const last60SecondsRequests = (Object.values(searchPDFRequests).filter((requests:any) => {
        return (new Date().getTime() - (requests.ts??0)) < 70000
      })).map((r:any) => r.requests).reduce((a:number, b:number) => a + b, 0)

      if(last60SecondsRequests >= 14){
        return false
      }

      return true
  }

  function canSubmitGPTRequest(){
    const last60SecondsRequests = (Object.values(gptRequests).filter((requests:any) => {
        return (new Date().getTime() - (requests.ts??0)) < 70000
      })).map((r:any) => r.requests).reduce((a:number, b:number) => a + b, 0)

      if(last60SecondsRequests >= 30){
        return false
      }

      return true
  }

  async function summarizeWebText(question: string, answers: string, systemMessage: string): Promise<any> {
    if(!question?.length || !answers?.length || !systemMessage?.length){
      return null
    }

    console.log(`summarizeWebText`);
    
    if(answers.length < 40000){
      console.log('DO NOT NEED TO CHUNK');      
      return combineAndAsk(question, answers, systemMessage, 'gpt-3.5-turbo-0125')
    }

    const chunkSize = 40000;
    const answerChunks = [];

    for (let i = 0; i < answers.length; i += chunkSize) {
      const chunk = answers.substring(i, i + chunkSize);
      answerChunks.push(chunk);
    }

    console.log(`${answerChunks.length} CHUNKS`);

    const promises = []

    for(const chunk of answerChunks){
      promises.push(combineAndAsk(question, chunk, systemMessage, 'gpt-3.5-turbo-0125'))
    }

    return (await Promise.all(promises)).join('\n\n').substring(0, 200000)
  }

async function combineAndAsk(question: string, answers: string, systemMessage: string, model:string, retries: number = 0): Promise<any> {
  if(!question?.length || !answers?.length || !systemMessage?.length){
    return null
  }
    if (retries > 10) {
      console.log(question)
      console.log('GPT Too many retries')
      throw new Error('GPT Too many retries')
    }

    while(!canSubmitGPTRequest()){
        await wait(5000)    
    }
  
    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: `${question}
        \n\n
        \`\`\`text
        ${answers}
        \`\`\`
        
        `,
      },
    ]

   // Configure OpenAI API
   const openaiApiKey = config.OPENAI_API_KEY
   const gpt = new OpenAI({ apiKey: openaiApiKey })

   console.log('GPT CALL');   

   gptRequests[new Date().getTime()] = {
      ts: new Date().getTime(),
      requests: (gptRequests[new Date().getTime()]?.requests??0) + 1
  }

    try {
      const gptResponse = await gpt.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })
  
      const gptResponseMessage = (gptResponse?.choices ?? [])[0]?.message?.content ?? ''

      await GptLog.create({
        messages,
        response: gptResponse,
        tokens: gptResponse?.usage?.total_tokens ?? 0,
        createdAt: new Date()
      })

      return gptResponseMessage
    } catch (error: any) {
      await GptLog.create({
        messages,
        response: null,
        tokens: null,
        error: error?.response?.data?.error || error?.response?.data || error?.response || error,
        createdAt: new Date()
      })
      console.log('ERROR-->>')
      console.log(error?.response?.data?.error || error?.response?.data || error?.response || error)
  
      await wait(30000)
  
      return combineAndAsk(question, answers, systemMessage, model, retries + 1)
    }
  }

  async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
  