import QuestionRemedies from "../models/questionremedies"

export const getQuestionRemedies = async(group_id: number) => {
    const question_remedies = await QuestionRemedies.findAll({
		where: {
			id_group: group_id,
		}
	}).catch((error: any) => {
		return []
	})

    if(!question_remedies) {
        return []
    }

    return question_remedies
}
