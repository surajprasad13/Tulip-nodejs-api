import request from 'supertest'
import { Express } from 'express-serve-static-core'

import Server from '../../server/index'
var agent = request.agent();

jest.setTimeout(10000);

var url = `https://api-staging.meettulip.com`;

beforeAll(async () => {
})

describe('login succesful', () => {
    // var server = (new Server()).app;
    it('should return 200 & valid response if request param list is empity', done => {
        request(url)
            .post("/minitulip/auth/userLogin")
            .send({
                "email": "suraj@meettulip.com",
                "password": "Suraj13!#"
            })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                expect(res.body.data).toHaveProperty('access_token');
                expect(res.body.data.access_token).not.toBe(null)
                done()
            })
    })
})