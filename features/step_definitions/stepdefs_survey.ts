import Server from "../../src/server";
import assert from "assert";
import { Given, Then, When } from "@cucumber/cucumber";
import request from "supertest";
import { computeProgress, TopProgress, updateSurveyWithMetadata } from "../../src/services/surveyEngine"
import * as fs from 'fs';
import * as _ from 'lodash';

import { attribute as Digraph, Subgraph, Node, Edge, toDot } from 'ts-graphviz';
import { toFile } from 'ts-graphviz/adapter';

Given('the plan {string} is selected (remote)', async function (this: any, planName: string) {
    this.api = new Server().app;
    this.planName = planName;
    var response:any = await request('https://tulip-nocdn.sfo3.cdn.digitaloceanspaces.com')
        .get(`/tulip-web/data/${planName}_questions.json`);
    this.survey = JSON.parse(response.res.text);
    fs.writeFileSync(`questions_${planName}.json`, response.res.text);
});

When('the I generate metadata for the survey', async function (this: any) {
    var answers = {};
    var surveyMax = {};
    var [surveyMaxUpdated, graph, questionsUpdated] = computeProgress(this.survey, null, answers, surveyMax);
    var progressSummary = TopProgress(questionsUpdated, surveyMaxUpdated);
    // console.log(progressSummary)
    let surveyWithMetadata = updateSurveyWithMetadata(questionsUpdated, surveyMaxUpdated);
    // fs.writeFileSync("ok2.json", JSON.stringify(surveyWithMetadata));
    this.graph = graph;
});

Then('the survey contains metadata for progress bar', function (this: any) {
    const dot = toDot(this.graph);

    toFile(dot, `result_${this.planName}.svg`, { format: 'svg' }).then(x => {
        console.log(`Diagram for ${this.planName} generated.`);
    });
});