
import { cpuUsage } from 'process';
import { attribute as _, Digraph, Subgraph, Node, Edge, toDot } from 'ts-graphviz';
import { toFile } from 'ts-graphviz/adapter';
import * as L from 'lodash';


const G = new Digraph();
const A = new Subgraph('A');
G.addSubgraph(A);
function upsertNode(question: any, surveyMax: any): any {
	let group_id = question.group_id;
	let id_question = question.id_question;
	let question_type = question.question_type;
	var qC = surveyMax[question.id_question]
	// var nodeId = `${group_id}-${id_question}`;
	var nodeId = `${id_question}`;
	var label = `p:${qC} t:${question_type} q:${id_question}`;

	let style = {};
	if (question.type == "END" || question.type == "LEAVE") {
		style = {
			[_.color]: 'red',
			[_.style]: 'filled',
			[_.fillcolor]: 'red',
			[_.label]: label,
		};
	} else if (question.type == "EVAL") {
		style = {
			[_.color]: 'red',
			[_.style]: 'filled',
			[_.fillcolor]: 'green',
			[_.label]: label,
		};
	} else if (question.type == "SELECT") {
		style = {
			[_.color]: 'red',
			[_.style]: 'filled',
			[_.fillcolor]: 'yellow',
			[_.label]: label,
		};
	} else {
		style = {
			[_.color]: 'black',
			[_.label]: label,
		};
	}

	const node1 = new Node(nodeId, style);
	if (!A.existNode(nodeId)) {
		A.addNode(node1);
		return node1;
	}
	else
		return A.nodes.filter((x: any) => x.id == nodeId)[0];
};
function upsertEdge(q1: any, q2: any, surveyMax: any) {
	let node1 = upsertNode(q1, surveyMax);
	let node2 = upsertNode(q2, surveyMax);
	const edge = new Edge([node1, node2], {
		[_.label]: node2.id,
		[_.color]: 'pink'
	});
	var aaa = A.edges.filter((x: any) => x.targets[0].id == node1.id && x.targets[1].id == node2.id);
	if (aaa.length == 0) {
		A.addEdge(edge);
	} else {
		// throw "e";
	}
};

var debug = false;
var log = (x: string) => debug ? console.log(x) : (x: string) => (x);
function ValidateDuplicateQuestion(nextQuestions: any, optionNext: number = 0) {
	if (!nextQuestions || nextQuestions.length == 0 || nextQuestions.length > 1) {
		log(nextQuestions)
		throw `Duplicate or inexistent question exists ${nextQuestions} / ${optionNext} `;
	}
}
var overflowCount = 0;
var QuestionIdWithIssues = [{ id: 570, group_id: 101 }, { id: 655, group_id: 102 }, { id: 150, group_id: 102 }]
function ForceJump(id: number) {
	if (QuestionIdWithIssues.filter(x => x.id == id).length > 0) {
		log('This one is invalid, jumping.')
		return true;
	}
	return false;
}

function IsNewSection(qCurrent: any, qNext: any) {
	if (qCurrent.question_type == null || qNext.question_type == null) {
		return false;
	}
	if (qCurrent.question_type != qNext.question_type) {
		return true;
	}
	return false;
}

function StopIfNextHigherOrNewSection(qCurrent: any, qNext: any, surveyMax: any) {
	var qC = surveyMax[qCurrent.id_question]
	var qN = surveyMax[qNext.id_question]
	if (qN) {
		if (qN > qC) {
			log(`Path traced ${surveyMax[qCurrent.id_question]} [${qCurrent.id_question}]`)
			return true

		} else if (qN == 0) {
			log(`New section found ${surveyMax[qCurrent.id_question]} [${qCurrent.id_question}]`)
			return true;
		} else {
			// log(`Path not tracted ${surveyMax[qCurrent.id_question]}`)
			return false
		}
	} else {
		return false;
	}
}

let computeProgress = function (surveyQuestions: any, currentQuestion: any, answers: any, surveyMax: any): any {
	overflowCount++
	if (currentQuestion == null) {
		currentQuestion = surveyQuestions[0];
		currentQuestion.question_type = "demographics";
		surveyMax[currentQuestion.id_question] = 0
		var okkk = computeProgress(surveyQuestions, currentQuestion, answers, surveyMax);
		return [okkk[0], G, surveyQuestions];
	}
	log(`${String(currentQuestion.id_question).padEnd(6)}\t${currentQuestion.type.padEnd(10)}\tL:${String(Object.keys(surveyMax).length).padEnd(5)}\tM:${surveyMax[currentQuestion.id_question]}\tT:${currentQuestion.question_type}`)

	if (overflowCount > 50000)
		throw "Overflow!"

	if (currentQuestion.type) {
		if (currentQuestion.type == "SELECT" || currentQuestion.type == "CHECK") {
			log(currentQuestion.options.choices.map((x: any) => x.next).join(','))
			for (var i = 0; i < currentQuestion.options.choices.length; i++) {
				var optionNext = currentQuestion.options.choices[i].next;
				var nextQuestions = surveyQuestions.filter((x: any) => x.id_question == optionNext);
				ValidateDuplicateQuestion(nextQuestions, optionNext);
				var nextQuestion = nextQuestions[0];
				if (nextQuestion.question_type == null || nextQuestion.question_type == false)
					nextQuestion.question_type = currentQuestion.question_type;

				if (StopIfNextHigherOrNewSection(currentQuestion, nextQuestion, surveyMax)) {
					upsertEdge(currentQuestion, nextQuestion, surveyMax);
					continue;
				}

				if (IsNewSection(currentQuestion, nextQuestion))
					surveyMax[nextQuestion.id_question] = 0;
				else {
					surveyMax[nextQuestion.id_question] = surveyMax[currentQuestion.id_question] + 1;
				}
				upsertEdge(currentQuestion, nextQuestion, surveyMax);

				let surveyMax2: any;
				[surveyMax2] = computeProgress(surveyQuestions, nextQuestion, answers, surveyMax);
				surveyMax = surveyMax2;
				log(`<- SELECT going back to ${currentQuestion.id_question} from ${nextQuestion.id_question}`)
			}
			return [surveyMax];
		} else if (currentQuestion.type == "COMBO") {
			var comboTag = currentQuestion.options.combo_questions[0];
			var nextQuestions = surveyQuestions.filter((x: any) => (x.tags ?? []).includes(comboTag));
			ValidateDuplicateQuestion(nextQuestions, currentQuestion.options.next);
			var nextQuestion = nextQuestions[0];
			if (StopIfNextHigherOrNewSection(currentQuestion, nextQuestion, surveyMax))
				return [surveyMax];
			surveyMax[nextQuestion.id_question] = surveyMax[currentQuestion.id_question] + 1;

			if (nextQuestion.question_type == null) nextQuestion.question_type = currentQuestion.question_type;
			upsertEdge(currentQuestion, nextQuestion, surveyMax)
			return computeProgress(surveyQuestions, nextQuestion, answers, surveyMax);
		} else if (currentQuestion.type == "DISPLAY" || currentQuestion.type == "POPUP" || currentQuestion.type == "INPUT") {
			var nextQuestions = surveyQuestions.filter((x: any) => x.id_question == currentQuestion.options.next);
			ValidateDuplicateQuestion(nextQuestions, currentQuestion.options.next);
			var nextQuestion = nextQuestions[0];
			if (nextQuestion.question_type == null || nextQuestion.question_type == false)
				nextQuestion.question_type = currentQuestion.question_type;

			if (StopIfNextHigherOrNewSection(currentQuestion, nextQuestion, surveyMax)) {
				upsertEdge(currentQuestion, nextQuestion, surveyMax);
				return [surveyMax];
			}

			if (IsNewSection(currentQuestion, nextQuestion))
				surveyMax[nextQuestion.id_question] = 0;
			else {
				surveyMax[nextQuestion.id_question] = surveyMax[currentQuestion.id_question] + 1;
			}

			upsertEdge(currentQuestion, nextQuestion, surveyMax)

			return computeProgress(surveyQuestions, nextQuestion, answers, surveyMax);
		} else if (currentQuestion.type == 'EVAL') {
			if (ForceJump(currentQuestion.options.f))
				return [surveyMax];
			var nextQuestions = surveyQuestions.filter((x: any) => x.id_question == currentQuestion.options.f);
			ValidateDuplicateQuestion(nextQuestions, currentQuestion.options.f);
			var nextQuestionF = nextQuestions[0];
			if (StopIfNextHigherOrNewSection(currentQuestion, nextQuestionF, surveyMax))
				return [surveyMax];
			surveyMax[nextQuestionF.id_question] = surveyMax[currentQuestion.id_question] + 1;
			let nextSurveyMax: any;
			if (nextQuestionF.question_type == null) nextQuestionF.question_type = currentQuestion.question_type;
			upsertEdge(currentQuestion, nextQuestionF, surveyMax);
			[nextSurveyMax] = computeProgress(surveyQuestions, nextQuestionF, answers, surveyMax);
			log(`<- EVAL going back to ${currentQuestion.id_question} from ${nextQuestionF.id_question}`)

			if (ForceJump(currentQuestion.options.t))
				return [nextSurveyMax];
			var nextQuestions = surveyQuestions.filter((x: any) => x.id_question == currentQuestion.options.t);
			ValidateDuplicateQuestion(nextQuestions, currentQuestion.options.t);
			var nextQuestionT = nextQuestions[0];
			if (StopIfNextHigherOrNewSection(currentQuestion, nextQuestionT, surveyMax))
				return [surveyMax];
			surveyMax[nextQuestionT.id_question] = surveyMax[currentQuestion.id_question] + 1;
			let nextSurveyMax2: any;
			if (nextQuestionT.question_type == null) nextQuestionT.question_type = currentQuestion.question_type;
			upsertEdge(currentQuestion, nextQuestionT, surveyMax);
			[nextSurveyMax2] = computeProgress(surveyQuestions, nextQuestionT, answers, nextSurveyMax);
			log(`<- EVAL going back to ${currentQuestion.id_question} from ${nextQuestionT.id_question}`)
			return [nextSurveyMax2];
		} else if (currentQuestion.type == 'END' || currentQuestion.type == 'LEAVE') {
			log('END');
			return [surveyMax];
		} else {
			throw `question of type ${currentQuestion.type} does not exist`;
			log(currentQuestion.type);
			return;
		}
		log("bling");
		return;
	} else {
		log("xxxxxxx!");
		return [surveyMax];
	}
	log("where to go?");
};

let MaximumLength = function (surveyMax: any): number {
	var k = Object.keys(surveyMax);
	var mm = k.map(a => surveyMax[a]).map(x => x)
	return Math.max(...mm.reverse());
}

let updateSurveyWithMetadata = function (survey: any, surveyMax: any) {
	var max = TopProgress(survey, surveyMax);
	for (var i = 0; i < survey.length; i++) {
		var q = survey[i];
		var questionId = survey[i].id_question

		// add progress
		var currentProgress = surveyMax[questionId];
		let maximum = max[q.question_type];
		survey[i].progress = (currentProgress / max[q.question_type]).toFixed(2);
		survey[i].progressMax = maximum;
	}
	return survey
}

function TopProgress(questionsUpdated: any, surveyMaxUpdated: any) {
	var ff = L.groupBy(questionsUpdated, x => x.question_type);
	delete ff.null;
	var names = Object.keys(ff);
	var f2 = L.map(ff, (x: any) => L.map(x, (z: any) => surveyMaxUpdated[z.id_question]));
	var f3 = L.map(f2, (x: any) => x.filter((z: any) => z != undefined));
	var f4 = L.map(f3, (x: any) => Math.max(...x));
	var summary: any = {};
	for (var i = 0; i < names.length; i++) {
		summary[names[i]] = f4[i];
	}

	return summary;
}

export { computeProgress, MaximumLength, updateSurveyWithMetadata, TopProgress }