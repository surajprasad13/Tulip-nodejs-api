import UserAnswers from "../models/useranswers"

export const getUserAnswers = async(user_id: number, group_id: number) => {
    const user_answers = await UserAnswers.findOne({
		raw: true,
		attributes: ["data"],
		where: {
			user_id: user_id,
			group_id: group_id,
		},
		order: [["time", "DESC"]],
	}).catch((error: any) => {
		return []
	})

    if(!user_answers) {
        return []
    }

    return user_answers.data
}


export const getBubbleCounters = async(user_id: number, group_id: number) => {
    const user_answers = await UserAnswers.findOne({
		raw: true,
		attributes: ["bubble_counters"],
		where: {
			user_id: user_id,
			group_id: group_id,
		},
		order: [["time", "DESC"]],
	}).catch((error: any) => {
		return []
	})

    if(!user_answers) {
        return []
    }

    return user_answers.bubble_counters
}