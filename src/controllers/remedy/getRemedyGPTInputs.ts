import { QuestionsModel, UserModel, UserProfileModel } from "../../models"
import QuestionRemedies from "../../models/questionremedies"
import UserAnswers from "../../models/useranswers"
import recipes from './recipes.json';
const { Configuration, OpenAIApi } = require("openai");
import config from "../../config"

export async function getRemedyGPTInputs(userId: number, groupId: number, remedies: any) {
    if(groupId !== 105){
        return null
    }

    const userName = (await UserProfileModel.findOne({
        raw: true,
        attributes: ["first_name"],
        where: {
            user_id: userId
        }
    })).first_name

    const user_answers = await UserAnswers.findOne({
		raw: true,
		attributes: ["data"],
		where: {
			user_id: userId,
			group_id: groupId,
		},
		order: [["time", "DESC"]],
	})

    const question_remedies = await QuestionRemedies.findAll({
		raw: true,
		where: {
			id_group: groupId
		},
	})

    const data = user_answers.data

	const remediesAndQuestions: any = {}
	
	let excluded: string[] = []
	let count = await data.reduce(
		(acc: any, el: any) => {
			const filter = question_remedies.filter(
				(val: any) => val.id_question == el.question_id && el.values.includes(val.answer_value)
			)
			if (filter.length > 0) {
				filter.forEach((el2: any) => {
					if (filter.exception && filter.exception.toString().includes("Dont")) {
						const excep = filter.exception.split("&&")
						const supexcep = excep[1].split(",")
						supexcep.forEach((val: any) => {
							excluded.push(val)
						})
					}
					if(el2.remedy_type != '') {
						if(!remediesAndQuestions[el2.remedy_type]){
							remediesAndQuestions[el2.remedy_type] = {}
						}

						if(!remediesAndQuestions[el2.remedy_type][el2.remedy_id]) {
                            remediesAndQuestions[el2.remedy_type][el2.remedy_id] = {}
							remediesAndQuestions[el2.remedy_type][el2.remedy_id].questions = []							
						}

						remediesAndQuestions[el2.remedy_type][el2.remedy_id].questions.push(
							{
								id_question: el2.id_question,
								answer_value: el2.answer_value,
							}
						)
						
						acc[el2.remedy_type].push([el2.remedy_id,el2.weight])
					}
				})
			}
			return acc
		},
		{ remedy: [], nutrition: [], hydration: [], lifestyle: [], preset: [] }
	)

    const questions = await QuestionsModel.findAll({
        raw: true,    
        where: {
            group_id: groupId
        }
    })

    const questionsAndOptions = questions.reduce((acc: any, el: any) => {
        acc[el.id_question] = {}
        ;(el?.options?.choices || []).forEach((el2: any) => {
            acc[el.id_question][el2.value] = el2.name
        })        
        return acc
    }, {})

    const questionsAndGPTTemplate = questions.reduce((acc: any, el: any) => {
        acc[el.id_question] = el?.options?.GPT_template??''
 
        return acc
    }, {})


    const ageQuestion = questions.find((el: any) => el.id_question === 1000)
    const ageOption = (user_answers.data.find((el: any) => +el.question_id === 1000))?.values[0]
    
    const age = (ageQuestion?.options?.choices || []).find((el: any) => el.value === ageOption)?.name

    const genderOption = (user_answers.data.find((el: any) => +el.question_id === 2))?.values[0]

    const gender = genderOption === 'm' ? 'man' : 'woman'

    const subjectPronoum = genderOption === 'm' ? 'he' : 'she'
    const objectPronoum = genderOption === 'm' ? 'him' : 'her'


    const gpt:any = {}

    for(const remedyType in remediesAndQuestions){
        for(const remedyId in remediesAndQuestions[remedyType]){
            const questions_: any = {}

            ;(remediesAndQuestions[remedyType][remedyId].questions||[]).forEach((q: any) => {
                if(!questions_[q.id_question]){
                    questions_[q.id_question] = []
                }
                questions_[q.id_question].push(q.answer_value)
            })


            for(const questionId in questions_){
                questions_[questionId] = questions_[questionId].map((answerValue: any) => questionsAndOptions[questionId][answerValue])

                if(questions_[questionId]?.length > 1){
                    questions_[questionId][questions_[questionId].length - 1] = `and ${questions_[questionId][questions_[questionId].length - 1]}`
                }

                questions_[questionId] = `${questionsAndGPTTemplate[questionId]} ${questions_[questionId].join(', ')}`
            }
            
            remediesAndQuestions[remedyType][remedyId] = Object.values(questions_).join(', ')
        }
    }

    for(const remedyType in remedies){
        for(let rec of remedies[remedyType]){

            if(remedyType === 'nutrition'){
                rec = (recipes.find((el: any) => +el.id === +rec))||{}
                if(!rec.name && rec.title){
                    rec.name = rec.title
                }
            }

            if(!gpt[remedyType]){
                gpt[remedyType] = {}
            }

            if(!gpt[remedyType][rec.id]){
                gpt[remedyType][rec.id] = {}
            }
    
            let verb = ''
    
            if(remedyType === 'remedy'){
                verb = 'take'
            }
    
            if(remedyType === 'nutrition'){
                verb = 'eat'
            }
    
            if(remedyType === 'hydration'){
                verb = 'drink'
            }
    
            const input = `${userName} is a ${age} ${gender} with long covid. Explain to ${objectPronoum} without mentioning ${objectPronoum} age that ${subjectPronoum} should ${verb} ${rec.name} because he ${remediesAndQuestions[remedyType][rec.id]}. Consider the information below and do it in a very positive way.
            ${rec?.options?.descriptions || rec?.description || ''}`

            console.log(input);

            console.log('----------------------------------------------------------------------------------------------------------------');

            let output = ''

            try{

                const configuration = new Configuration({
                    apiKey: config.OPENAI_API_KEY,
                });

                const openai = new OpenAIApi(configuration);
                const completion = await openai.createCompletion({
                    model:'text-davinci-003',
                    prompt: input,
                    temperature: 0.7,
                    max_tokens:  256,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                });

                var theResult = { text: completion.data };

                output = completion?.data?.choices[0]?.text || ''
                console.log('output');
                console.log(output);

                gpt[remedyType][rec.id].input = input
                gpt[remedyType][rec.id].output = output

            } catch (error: any) {
                console.log('ERROR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                
                console.log(error)
                console.log(error?.response?.data?.error)
            }
            
            
        }
       
        
    }

    

    console.log(gpt);
    

    return gpt
}