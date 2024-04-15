import request from 'supertest'
import config from '../../../src/config/index'

beforeAll(async () => {
})

var baseUrl = `${config.BASE_URL}`;
var accessToken = `${config.ACCESS_TOKEN}`;

describe('contraindications is returning data', () => {
    it('tests if any data is sent', done => {
        request(baseUrl)
            .get("/contraindications")
            .set({ Authorization: accessToken })
            // .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                expect(Array.isArray(res.body)).toBe(true);
                done()
            })
    })
})