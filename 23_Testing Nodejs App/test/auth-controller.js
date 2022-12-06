const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const AuthController = require('../controllers/auth');

describe('Auth Controller', () => {
    before(function(done) {
        mongoose
            .connect('mongodb+srv://Rand:88mma71azh@nodejs-course.2bi0z99.mongodb.net/test-messages?retryWrites=true&w=majority')
            .then(result => {
                const user = new User({
                    email: 'test@test.com',
                    password: 'tester',
                    name: 'Test',
                    posts: [],
                    _id: '630ca9b1056a9a3abfe22fa6'
                });
                return user.save()
            })
            .then(() => {
                done()
            })
    })

    it('should throw an error with code 500 if accessing the database fails', (done) => {
        sinon.stub(User, 'findOne');
        User.findOne.throws();

        const req = {
            body: {
                email: 'test@test.com',
                password: 'tester'
            }
        };

        AuthController
            .login(req, {}, () => {})
            .then(result => {
                expect(result).to.be.an('error');
                expect(result).to.have.property('statusCode', 500);
                done();
            });

        User.findOne.restore();
    });

    it('should send a response with a valid user status for an existing user', (done) => {
        const req = { userId: '630ca9b1056a9a3abfe22fa6' };
        const res = {
            statusCode: 500,
            userStatus: null,
            status: function() {
                this.statusCode = code
                return this
            },
            json: function(data) {
                this.userStatus = data.status;
            }
        };
        AuthController.getUserStatus(req, res, () => {}).then(() => {
            expect(res.statusCode).to.be.equal(200);
            expect(res.userStatus).to.be.equal('I am new!');
            done();
        })
    });

    after(function(done) {
        User
            .deleteMany({})
            .then(() => {
                return mongoose.disconnect();
            })
            .then(() => {
                done();
            });
    })
});