const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlogSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    date_updated: {
        type: Array,
        required: false
    },
    views: {
        type: Number,
        required: false
    },
    blog: {
        type: Object,
        required: true
    }
})

module.exports = Blog = mongoose.model('blog', BlogSchema);