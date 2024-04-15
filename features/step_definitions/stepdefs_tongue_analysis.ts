import Server from "../../src/server";
import assert from "assert";
import { Given, Then, When } from "@cucumber/cucumber";
import request from "supertest";
import db from "../../src/db"
import { UserModel } from "../../src/models";
var fs = require('fs');
import path from 'path';

var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODAwMDg1NzksInVzZXJfaWQiOjE1MSwiaWF0IjoxNjc5OTIyMTc5fQ.WPurIWQx_xcYbiVWvnV1Eq1NcMtkljwm1kgww1Qg7hM";

const getSubmissions = (folder: string) => {
  var submissions: any[] = [];
  fs.readdirSync(`${folder}`).forEach((file: string) => {
    var fullpath = path.join(folder, file);
    // if (!/[0-9a-z]{30,}/.test(fullpath))
    //   return;
    if (fullpath.indexOf("jpg") != -1)
      return;
    fs.readdirSync(`${fullpath}`).forEach((el: string) => {
      var fullpath2 = path.join(fullpath, el);
      if (!/tongue-analysis/.test(el))
        return;
      var analysisPath = `${fullpath2}/tongue-analysis.json`;
      if (!fs.existsSync(analysisPath))
        return;
      submissions.push(fullpath2);
    });
  });
  submissions.sort();
  return submissions;
}

const getAnalysis = (path: string) => {
  var content = fs
    .readFileSync(`${path}/tongue-analysis.json`, 'utf8')
    .replace(/\\"/g, "\"")
    .replace(/"{/g, "{")
    .replace(/}"/g, "}")
    ;


  var contentParsed = JSON.parse(content);
  return contentParsed;
}

Given('generate tongue analysis report', { timeout: 5 * 60 * 1000 }, async function (this: any) {
  this.response = await request(this.api)
    .get("/minitulip/tongue-analysis/analysis")
    .set('authorization-temp', this.token_temp);
  var content = this.response.body;
  fs.writeFileSync('features/result_tongue_analysis_analysis.json', JSON.stringify(content));
  this.tongueReport = JSON.stringify(content);
})

Given('data in {string}', async function (this: any, folder: string) {
  var subs = getSubmissions(`features/${folder}`);
  console.log(`Files: ${subs.length}`);
  var dataSplit: any = { conclusive: [], inconclusive: [] };
  subs.forEach((file: string) => {
    var analysis = getAnalysis(file);
    // console.log(analysis);
    var isInconclusive = analysis.prediction[0].pred.length == 0;
    if (isInconclusive) {
      dataSplit.inconclusive.push(analysis);
      console.log("Inconclusive");
      return;
    }
    dataSplit.conclusive.push(analysis);

    var diag = analysis.prediction[0].pred[0].stringValue;
    var prob = analysis.prediction[0].conf[0].numberValue;
    // console.log(`Result ${diag} and ${prob}.`);
  });
  this.dataSplit = dataSplit;
})


Then('there is statistics', async function (this: any) {
  console.log(this.dataSplit.conclusive.length);
  console.log(this.dataSplit.inconclusive.length);
  var baseFolder = `features/tongue-data`;
  for (var ds of this.dataSplit.inconclusive) {
    var inputFile = ds.input[0]
      .replace(/qa\//g, "");
    var outputFile = inputFile
      .replace(/\//g, "-")
      + ".jpg";

    var source = `${baseFolder}/${inputFile}`;
    var target = `${baseFolder}/${outputFile}`;
    // console.log(source);
    // console.log(target);

    fs.copyFileSync(source, target);
  }
})

Given('the picture uploaded to Tongue Analysis with path {string}', async function (this: any, s: string) {
  this.tongueFilepath = [s, s, s];
})

Given('the picture uploaded to Tongue Analysis with folder {string}', async function (this: any, s: string) {
  this.tongueFilepath = fs.readdirSync(s)
    .map((x: any) => `${s}/${x}`);
  console.log(this.tongueFilepath)
})

const sharp = require("sharp");
Then('I can locate the tongue', { timeout: 50 * 1000 }, async function (this: any) {
  this.img = [];
  for (var filepath of this.tongueFilepath) {
    const imageBuffer: Buffer = fs.readFileSync(filepath);

    var result: any = await request(this.genericApiUri)
      .post("?features=denseCaptions,read&gender-neutral-caption=true&model-version=latest&language=en&api-version=2023-02-01-preview")
      .set('Content-Type', 'application/octet-stream')
      .set('Ocp-Apim-Subscription-Key', '45a147eed5c24296a3927ffd064e8c58')
      .send(imageBuffer);
    var rr = JSON.parse(result.res.text);
    if (result.res.statusCode != 200)
      continue;
    // console.log(rr.denseCaptionsResult);
    var vals = rr.denseCaptionsResult.values;
    var cont = [];
    for (var v of vals) {
      if (!/person/g.test(v.text))
        continue;
      if (!/tongue/g.test(v.text))
        continue;
      if (!/close/g.test(v.text))
        continue;
      cont.push(v);
    }
    if (cont.length == 0) {
      console.log(rr.denseCaptionsResult);
      continue;
    }
    var u = cont[0].boundingBox;

    var img = await sharp(imageBuffer)
      .rotate()
      .extract({ left: u.x, top: u.y, width: u.w, height: u.h })
      .toBuffer();

    this.img.push(img);
  }
  assert.ok(true)
})


var token_temp = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODAwODc1NDMsInVzZXJfaWQiOjE1MSwiaWF0IjoxNjgwMDAxMTQzfQ.eEC9XOA3aMdWKWOamhxH9iY0W4bvDp6yJKkYTrK7AHw";
Then('I can do a Tongue Analysis result that is not {string}', { timeout: 50 * 1000 }, async function (this: any, s: string) {
  var uploads: any[] = [];
  var filepathTemp = 'asd.jpg';
  for (var tempFile of this.img) {
    fs.writeFileSync(filepathTemp, tempFile);
    uploads.push(request(this.api)
      .post("/minitulip/tongue-analysis/image?image_type=0")
      .set('authorization-temp', token_temp)
      .attach("originalname", filepathTemp))
  }

  var uploadResults = await Promise.all(uploads);
  console.log('uploaded');
  // console.log(uploadResults)
  // for (var upload of uploadResults) {
  //   console.log(upload);

  //   this.token_temp = token_temp;
  //   var content = this.response.body;
  //   var prer = this.response.body.pre_register_session;
  //   fs.writeFileSync('test-123.json', JSON.stringify(content));
  // }
})

Then('upload Tongue Analysis images', { timeout: 50 * 1000 }, async function (this: any) {
  var uploads: any[] = [];
  var filepathTemp = 'asd.jpg';
  this.token_temp = token_temp;
  if (this.img.length == 0)
    throw 'Not enough reconizable images';
  var i = 0;
  for (var tempFile of this.img) {
    fs.writeFileSync(filepathTemp, tempFile);
    var r = request(this.api)
      .post("/minitulip/tongue-analysis/image?image_type=" + i)
      .set('authorization-temp', token_temp)
      .attach("originalname", filepathTemp);
    i = i + 1;
    uploads.push(r);
  }

  var results = await Promise.all(uploads);
  assert.ok(true)
})