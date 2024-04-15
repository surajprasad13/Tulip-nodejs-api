import Server from "../../src/server";
import assert from "assert";
import { Given, Then, When } from "@cucumber/cucumber";
import request from "supertest";
import db from "../../src/db"
import { UserModel } from "../../src/models";

Given('the user tries to login with standard credentials', { timeout: 20 * 1000 }, function (this: any) {
    this.email = "daniel@meettulip.com"
    this.password = "asdaAsd123!@#"
    assert.strictEqual(1, 1)
});

When('for {int} times the auth\\/userRegister endpoint is called', { timeout: 50 * 1000 }, async function (this: any, numberOfTries: number) {
    var responsesAsync = [];
    for (var i = 0; i < numberOfTries; i++) {
        var responseAsync = request(this.api)
            .post("/minitulip/auth/userLogin")
            .send({
                email: this.email, password: this.password
            })
            .timeout(10000);
        responsesAsync.push(responseAsync);
    }
    this.responses = await Promise.all(responsesAsync);
});

Then('all responses http status code are {int}', function (this: any, statusCode: number) {
    const responses: Response[] = this.responses
    console.log(responses.length)
    for (var i = 0; i < responses.length; i++) {
        var response = responses[i];
        try {
            assert.strictEqual(response.status, statusCode)
        } catch (error) {
            if (response.status !== 200 && response.text) {
                console.log(response.text)
            }
            throw error
        }
    }
});