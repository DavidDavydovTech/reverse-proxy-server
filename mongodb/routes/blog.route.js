const express = require('express');
const router = express.Router();

// Model
const Blog = require('../blog.model');

router.get('/all', (req, res) => {
    Blog.find({}, "name date views id")
        .sort({ date: -1})
        .then(blogs => {
            for(let blog of blogs)
            res.json(blogs)
        })
});

router.post('/', (req, res) => {
    try {
        const newBlog = new Blog({
            name: req.body.name,
            blog: req.body.blog
        })

        console.log(req.body.blog)

        newBlog.save()
            .then(blog => res.json(blog))
            .catch(err => res.status(404).end(err));
            
    } catch (err) {
        res.status(404).end(`${err}`)
    }
});


router.get('/single/:blogId', (req, res) => {
    Blog.findById(req.params.blogId)
        .then(blog => res.json(blog))
});


module.exports = router;