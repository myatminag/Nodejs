const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try {
        const totalItems = await Post.find().countDocuments();   
        const posts = await Post
            .find()
            .skip((currentPage - 1) * perPage)
            .limit(perPage);  
        res
            .status(200)
            .json({
                message: 'Fetched Post Successfully!',
                posts: posts,
                totalItems: totalItems
            })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Vadilation Failed, Please enter correct data!');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('NO image provided!');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path.replace("\\" ,"/");
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });

    try {
        await post.save()
        const user = await User.findById(req.userId);
        user.posts.push(post);
        await user.save()
        res.status(201).json({
            message: 'Post Created Successfully!',
            post: post,
            creator: {
                _id: user._id,
                name: user.name 
            }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId)
        if (!post) {
            const error = new Error('Could not find post!')
            error.statusCode = 404;
            throw error;
        }
        res
            .status(200)
            .json({
                message: 'Successfully fetched!',
                post: post
            })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updatePost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Vadilation Failed, Please enter correct data!');
        error.statusCode = 422;
        throw error;
    }

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path.replace("\\" ,"/");
    }
    if (!imageUrl) {
        const error = new Error('No File Is Added!');
        error.statusCode = 422;
        throw error;
    }
    try {
        const post = await Post.findById(postId)
        if (!post) {
            const error = new Error('Could not find post!')
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('NOT Authorized!');
            error.statusCode = 403;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        const result = await post.save();
        res
            .status(200)
            .json({
                message: 'Post Updated!',
                post: result
            })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); 
    }
};

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId)
        if (!post) {
            const error = new Error('Could not find post!')
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('NOT Authorized!');
            error.statusCode = 403;
            throw error;
        }
        // Check Login User
        clearImage(post.imageUrl);
        await Post.findByIdAndRemove(postId);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();
        res
            .status(200)
            .json({
                message: 'Deleted Post!'
            })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const clearImage = (filePath) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};