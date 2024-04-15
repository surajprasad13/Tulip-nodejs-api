import axios from "axios"
import { Request, Response } from "express"
import RootCauseInsights from "../models/root_cause_insights"
import RootCauseInsights2 from "../models/root_cause_insights_2"
import UserAnswers from "../models/useranswers"
import { getUserAnswers } from "../utils/getUserAnswers"
import { getQuestionRemedies } from "../utils/getQuestionRemedies"
import { getConstitutionText } from "../utils/getConstitutionText"
import { getAyurvedicSup } from "../utils/getAyurvedicSup"

export const getModelInsights = async (req: Request, res: Response) => {
	const id = req.body.payload.user_id
	const id_group = req.body.group_id
	const user_answers = await UserAnswers.findOne({
		raw: true,
		attributes: ["data"],
		where: {
			user_id: id,
			group_id: id_group,
		},
		order: [["time", "DESC"]],
	}).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})
	if (user_answers) {
		const array = user_answers.data.map((val: any) => val.question_id + val.values)
		const data = JSON.stringify(array)

		let url: any
		if (id_group == 101) {
			url = "https://surveyinsights-llnbzkdk4q-uc.a.run.app/surveyInsightsSleep"
		} else if (id_group == 102) {
			url = "https://surveyinsights-llnbzkdk4q-uc.a.run.app/surveyInsightsFatigue"
		} else {
			url = "https://surveyinsights-llnbzkdk4q-uc.a.run.app/surveyInsightsBloodSugar"
		}
		const config = {
			method: "post",
			url: url,
			headers: {
				accept: "application/json",
				"Content-Type": "application/json",
			},
			data: data,
		}
		let ml: any, titles: any
		try {
			await axios(config).then((response: any) => {
				ml = response.data.data
				titles = ml.map((item: any) => item.rootCause)
			})
			const root_couse_model = await RootCauseInsights.findAll({
				raw: true,
				where: {
					title: titles,
					group_id: id_group,
				},
			})
			ml = ml.reduce((acc: any, el: any) => {
				const filter = root_couse_model.filter((val: any) => val.title == el.rootCause)
				if (filter.length > 0) {
					el.template = filter[0].description
					el.imageUrl = filter[0].image_url
					el.imageIconUrl = filter[0].image_url
					el.studies = filter[0].studies
					acc.push(el)
				}
				return acc
			}, [])
			res.json(ml)
		} catch (error) {
			res.status(404).send({
				msg: `${error}. Contact Admin`,
			})
		}
	} else {
		res.status(200).json({
			msg: "Data not found",
		})
	}
}

export const getPrivatePreview = async (req: Request, res: Response) => {
	const id_user = req.body.payload.user_id
	const lead_id = req.body.payload.lead_id
	const id_group = req.body.group_id
	let where
	if (id_user) {
		where = {
			user_id: id_user,
			group_id: id_group,
		}
	} else {
		where = {
			lead_id: lead_id,
			group_id: id_group,
		}
	}
	const user_answers = await UserAnswers.findOne({
		raw: true,
		attributes: ["data"],
		where: where,
		order: [["time", "DESC"]],
	}).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})
	if (user_answers) {
		const array = user_answers.data.map((val: any) => val.question_id + val.values)
		const data = JSON.stringify(array)

		let urlGraph: any, urlText: any
		if (id_group == 101) {
			urlGraph = "https://surveygraphs-llnbzkdk4q-uc.a.run.app/interactiveGraph/101"
			urlText = "https://tulipaimlserver.web.app/surveyInsightsSleep"
		} else if (id_group == 102) {
			urlGraph = "https://surveygraphs-llnbzkdk4q-uc.a.run.app/interactiveGraph/102"
			urlText = "https://tulipaimlserver.web.app/surveyInsightsFatigue"
		} else {
			urlGraph = "https://surveygraphs-llnbzkdk4q-uc.a.run.app/interactiveGraph/103"
			urlText = "https://tulipaimlserver.web.app/surveyInsightsBloodSugar"
		}

		const promise1 = new Promise((resolve, reject) => {
			const config = {
				method: "get",
				url: urlGraph,
				headers: {
					accept: "application/json",
					"Content-Type": "application/json",
				},
			}
			axios(config)
				.then((response: any) => {
					resolve(response.data)
				})
				.catch((error: any) => {
					res.status(500).json({
						msg: `${error}. Contact Admin`,
					})
				})
		})

		const promise2 = new Promise((resolve, reject) => {
			const config = {
				method: "post",
				url: urlText,
				headers: {
					accept: "application/json",
					"Content-Type": "application/json",
				},
				data: data,
			}
			axios(config)
				.then((response: any) => {
					resolve(response.data)
				})
				.catch((error: any) => {
					res.status(500).json({
						msg: `${error}. Contact Admin`,
					})
				})
		})

		await Promise.all([promise1, promise2]).then((values: any) => {
			const response = {
				Graph: values[0],
				Text: values[1].intro,
			}
			res.json(response)
		})
	} else {
		res.status(204).json({
			message: `Answers for lead ${lead_id} not found`,
		})
	}
}

export const getRootCause = async (req: Request, res: Response) => {
	const id = req.body.payload.user_id
	const id_group = req.body.group_id
	const user_answers = await UserAnswers.findOne({
		raw: true,
		attributes: ["data"],
		where: {
			user_id: id,
			group_id: id_group,
		},
		order: [["time", "DESC"]],
	}).catch((error: any) => {
		res.status(500).send({
			msg: `${error}. Contact Admin`,
		})
	})
	if (user_answers) {
		const root_cause_insights_2 = await RootCauseInsights2.findAll({
			raw: true,
			where: {
				id_group: id_group,
			}
		}).catch((error: any) => {
			res.status(500).send({
				msg: `${error}. Contact Admin`,
			})
		})
		if(root_cause_insights_2) {
			try{
				const data = user_answers.data
				// console.log(data)
				let result = await data.reduce((acc: any, el: any) => {
					const insight = root_cause_insights_2.filter((item: any) => item.id_question.toString() == el.question_id && el.values.includes(item.answer_value))
					if(insight.length > 0) {
						acc = acc.concat(insight)
					}
					return acc
				},[])
				res.json(result)
			} catch (error) {
				res.status(404).send({
					msg: `${error}. Contact Admin`,
				})
			}
		} else {
			res.status(200).json({
				message: `Root Causes not found. Contact Admin`,
			})
		}
	} else {
		res.status(200).json({
			message: `Answers for user ${id} not found`,
		})
	}
}


export const getConstitution = async (req: Request, res: Response) => {
    try {
        const answers = req.body.user_answers;
        const id_group = req.body.group_id;

        const question_remedies = await getQuestionRemedies(id_group)

        let remedyFrequency: {[key: number]: number} = {};

        answers.forEach((answer: any) => {
            question_remedies.forEach((questionRemedy: any) => {
                if (
                    answer.question_id == questionRemedy.id_question &&
                    answer.values == questionRemedy.answer_value
                ) {
                    if (remedyFrequency[questionRemedy.remedy_id]) {
                        remedyFrequency[questionRemedy.remedy_id]++;
                    } else {
                        remedyFrequency[questionRemedy.remedy_id] = 1;
                    }
                }
            });
        });

        const groups = [
            ["1", "2", "3"],
            ["4", "5", "6", "7"]
        ];

        const findMostFrequentInGroup = (group: string[], frequencyMap: {[key: string]: number}) => {
            let maxFrequency = 0;
            let mostFrequent: any[] = [];

            group.forEach((item) => {
                const frequency = frequencyMap[item] || 0;
                if (frequency > maxFrequency) {
                    maxFrequency = frequency;
                    mostFrequent.length = 0;
                    mostFrequent.push(item);
                } else if (frequency === maxFrequency) {
                    mostFrequent.push(item);
                }
            });

            return mostFrequent;
        };

        let result: number[] = [];
        let firstGroupFrequents = findMostFrequentInGroup(groups[0], remedyFrequency);
        firstGroupFrequents.forEach((item) => {
            if (remedyFrequency[item] && remedyFrequency[item] === Math.max(...firstGroupFrequents.map(id => remedyFrequency[id] || 0))) {
                result.push(parseInt(item));
            }
        });

        groups.slice(1).forEach((group: any) => {
            const mostFrequent: any = findMostFrequentInGroup(group, remedyFrequency)[0]; // Solo el primero, como antes
            if (remedyFrequency[mostFrequent] && remedyFrequency[mostFrequent] > 0) {
                result.push(parseInt(mostFrequent));
            }
        });

        if (remedyFrequency["8"] && remedyFrequency["8"] > 0) {
            result.push(8);
        }

        const text = await getConstitutionText(result)

		const ayurvedic = await getAyurvedicSup(result)

        res.status(200).json({
            result, text, ayurvedic
        });
    } catch (error) {
        res.status(404).send({
            msg: `${error}. Contact Admin`,
        });
    }
}

