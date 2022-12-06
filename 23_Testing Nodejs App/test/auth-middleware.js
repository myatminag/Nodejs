const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const authMiddleware = require('../middleware/is-auth');

describe('Auth middleware', () => {
    it('should throw an error if no authorization header is present', () => {
        const req = {
            get: () => {
                return null;
            }
        };
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('NOT Authenticated!');
    });
    
    it('should throw an error if authorization header is only one string', () => {
        const req = {
            get: () => {
                return 'xyz';
            }
        };
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
    });

    it('should yeild a userId after decoding the token', () => {
        const req = {
            get: () => {
                return 'Bearer xyz';
            }
        };
        sinon.stub(jwt, 'verify');
        jwt.verify.returns({ userId: 'abc' });
        authMiddleware(req, {}, () => {});
        expect(req).to.have.property('userId');
        expect(req).to.have.property('userId', 'abc');
        expect(jwt.verify.called).to.be.true;
        jwt.verify.restore();
    })
})