const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const Po = require('../models/post');
const AuthController = require('../controllers/auth');

describe('Feed Controller', () => {
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

    it('should add a created post to the posts of the creator', (done) => {
        const req = {
            body: {
                title: 'Test Post',
                content: 'Testing Content'
            },
            file: {
                path: 'abc'
            },
            userId: 'xyz'
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