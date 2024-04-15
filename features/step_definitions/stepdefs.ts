import Server from "../../src/server";
import assert from "assert";
import {Given, Then, When} from "@cucumber/cucumber";
import request from "supertest";
import db from "../../src/db"
import {UserModel} from "../../src/models";
import * as fs from 'fs';

Given('a tulip api', async function (this: any) {
    this.api = new Server().app;
    try {
        await db.decision.sync()
        await db.defaultdb.sync()
        await db.users.sync()
    } catch (error) {
        console.error("error creating database")
        console.error(error)
    }
});

Given('an actual tulip api', async function (this: any) {
    this.api = new Server().app;
});

Given('an API with URI {string}', async function (this: any, uri: string) {
    this.genericApiUri = uri;
});

Given('the user email is {string}', function (this: any, email: string) {
    this.email = email
});

Given('the user chose {string} as his password', function (this: any, password: string) {
    this.password = password
});

Given('the user chose {string} as his new password', function (this: any, password: string) {
    this.newPassword = password
});

When('the auth\\/userRegister endpoint is called', async function (this: any) {
    this.response = await request(this.api)
        .post("/minitulip/auth/userRegister")
        .send({
            email: this.email, password: this.password
        })
});

Then('the response http status code is {int}', function (this: any, statusCode: number) {
    const response: Response = this.response
    try {
        assert.strictEqual(response.status, statusCode)
    } catch (error) {
        if (this.response.status !== 200 && this.response.text) {
            console.log(this.response.text)
        }
        throw error
    }
});

Given('the user email is {int} characters long', function (n: number) {
    const ending = "@example.com"
    const charsNeeded = n - ending.length
    if (charsNeeded > 0) {
        this.email = "a".repeat(charsNeeded) + ending
    } else {
        this.email = "a".repeat(n)
    }
});

When('the auth\\/sendMailOtp endpoint is called', async function (this: any) {
    this.response = await request(this.api)
        .post("/minitulip/auth/sendMailOtp")
        .send({
            email: this.email
        })
});

When('the auth\\/resetPassword endpoint is called', async function (this: any) {
    const user = await UserModel.findOne({ where: { email: this.email } })
    const otp = user?.otp
    this.response = await request(this.api)
        .post("/minitulip/auth/resetPassword")
        .send({
            "email": this.email,
            "password": this.newPassword,
            "otp": otp
        })
});

Given('the plan {string} is selected - cached', async function (this: any, planName: string) {
    this.planName = planName;
    var content = fs.readFileSync(`features/fixture/dev_${planName}_questions.json`, 'utf8');
    this.survey = JSON.parse(content);
});