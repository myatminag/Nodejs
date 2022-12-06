const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transporter = nodemailer.createTransport(
    sendgridTransport({
        auth: {
            api_key: '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'
        }
    }
));

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: message
    });
};

exports.getSignup = (req, res, next) => { 
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null;
    }
    res.render('auth/signup', {
        pageTitle: 'Sign Up',
        path: '/signup',
        errorMessage: message
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User
        .findOne({
            email: email
        })
        .then((user) => {
            if (!user) {
                req.flash('error', 'Invalid Email Or Password!');
                return res.redirect('/login');
            }
            bcrypt
                .compare(password, user.password)
                .then((doMatch) => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session
                            .save((err) => {
                                console.log(err);
                                res.redirect('/');
                            });
                    }
                    req.flash('error', 'Invalid Email Or Password!');
                    res.redirect('/login')
                })
                .catch((err) => {
                    console.log(err);
                    res.redirect('/login')
                })
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.postSignup =(req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User
        .findOne({
            email: email
        })
        .then((userDoc) => {
            if (userDoc) {
                req.flash(
                    'error', 
                    'Email exists already, please pick a different one!'
                );
                return res.redirect('/signup')
            }
            return bcrypt
                .hash(password, 12)
                .then((hashedPassword) => {
                    const user = new User({
                        email: email,
                        password: hashedPassword, 
                        cart: { items: [] },
                    });
                    return user.save();
                })
                .then((result) => {
                    res.redirect('/login');
                    return transporter.sendMail({
                        to: email,
                        from: 'maytminmyintmo@gmail.com',
                        subject: 'Signup Succeeded!',
                        html: '<h1>You Successfully Signed Up!</h1>'
                    });
                })
                .catch((err) => {
                    console.log(err);
                })
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message
    });
};

exports.postRest = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        } 
        const token = buffer.toString('hex');
        User
            .findOne({
                email: req.body.email
            }) 
            .then((user) => { 
                if (!user) {
                    req.flash('error', 'No account with that email found!');
                    return res.redirect('/reset')
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000; 
                return user.save();
            })
            .then((result) => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email, 
                    from: 'myatminmyintmo@gmail.com',
                    subject: 'Password Reset',
                    html: ` 
                        <p>You requested a password.</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                    `
                });
            })  
            .catch((err) => {  
                console.log(err)
            })  
    });
};  

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User
        .findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        .then((user) => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0]
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                pageTitle: 'New Password',
                path: '/new-password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch((err) => {
            console.log(err)
        })
};

exports.postNewPassword = (req, res, body) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    User
        .findOne({
            resetToken: passwordToken,
            resetTokenExpiration: {
                $gt: Date.now()
            },
            _id: userId
        })
        .then((user) => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12)
        })
        .then((hashedPassword) => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then((result) => {
            res.redirect('/login');
        })
        .catch((err) => {
            console.log(err)
        })
}