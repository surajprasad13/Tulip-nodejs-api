import Server from "../../src/server";
import assert from "assert";
import { Given, Then, When } from "@cucumber/cucumber";
import request from "supertest";
import db from "../../src/db"
import { UserModel } from "../../src/models";
var fs = require('fs');

Given('the user answered the survey as in {string} file', async function (this: any, s: string) {
  var content = JSON.parse(fs.readFileSync("features/fixture/answers-free-long-covid-1.json", 'utf8'));
  this.answers = content;
  assert.notEqual(content, null);
})

Then('we generate an introductory text for the user', { timeout: 50 * 1000 }, async function (this: any) {
  this.response = await request(this.api)
    .post("/minitulip/content-generation/smart-popup")
    .send({
      history: [],
      question: this.survey,
      answers: this.answers.answers
    })
  var text = this.response.body.text.choices[0].message.content;
  // console.log(text);

  fs.writeFileSync('result.json', JSON.stringify(this.response.body));
  // console.log(this.response.body);
  console.log(text);
  // console.log(this.response.body.ageGroup);
  // console.log(this.response.body.genderAtBirth);
  // console.log(this.response.body.stressLevel);
  // console.log(this.response.body.energyLevel);
  // console.log(this.response.body.activityLevel);
  assert.notEqual(text, null);
})
