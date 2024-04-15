import Questions from "../models/questions"

export const getTaggedQuestions = async(tags: string[], group_id: number) => {
    const questions = await Questions.findAll({
		attributes: ['id_question','tags'],
		raw: true,
		where: {
			tags: tags,
			group_id: group_id
		},
	}).catch((error: any) => {
		return []
	})
	
    if(!questions){
        return []
    }

    return questions

}