import { integer } from 'aws-sdk/clients/cloudfront';
import request from 'supertest'
import config from '../../config/index'

beforeAll(async () => {
})

var baseUrl = `${config.BASE_URL}`;
var accessToken = `${config.ACCESS_TOKEN}`;
// var plans = [101, 102, 103]
var plans = [101]
// var sections = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
var sections = [1, 2, 3, 4]
var combinations: any[] = [];
for (var i = 0; i < plans.length; i++) {
    var plan = plans[i];
    for (var j = 0; j < sections.length; j++) {
        var section = sections[j];
        combinations.push([plan, section])
    }
}

var sectionConfiguration: any = {
    "1": {
        "shouldContainPlaceholders": false
    }, "2": {
        "shouldContainPlaceholders": true
    }, "3": {
        "shouldContainPlaceholders": true
    }, "4": {
        "shouldContainPlaceholders": false
    },
}

var validatePlaceholders = function (result: any) {
    var corpus = result.text;
    console.log(corpus)
    for (var i = 0; i < result.placeholders.length; i++) {
        var placeholder = result.placeholders[i];
        // console.log(placeholder);
        corpus = corpus.replace(`[${placeholder.name}]`, placeholder.populate);
    }

    const regex = /(\[[0-9A-Za-z\.]{1,}\])/g;
    const anyPlaceholders = corpus.match(regex);

    // console.log(anyPlaceholders.length);
    // console.log(anyPlaceholders);
    if (anyPlaceholders.length > 0)
        return false;
    return true;
}

var checkStory = function (sectionId: integer, body: any) {
    var secConfg = sectionConfiguration[sectionId]
    expect(body).toHaveProperty("text");
    if (secConfg.shouldContainPlaceholders) {
        expect(body).toHaveProperty("placeholders");
        expect(body.placeholders).not.toHaveLength(0);
        expect(validatePlaceholders(body)).toBe(true)
    }
}

describe('story mode should be working for all sections and plans', () => {
    test.each(combinations)('Plan %i, section %i', async (planId, sectionId) => {
        var x = await request(baseUrl)
            .post("/remedy/story")
            .send({
                "group_id": planId,
                "section_id": sectionId
            })
            .set({ Authorization: accessToken })
            .expect(200)
            .expect('Content-Type', /json/)
        var body = x.body;
        checkStory(sectionId, body);
    });
})