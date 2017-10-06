let mongoose = require('mongoose')

//定义管理员表
const questionSchema = new mongoose.Schema({
    username: String,
    title:String,
    type:mongoose.Schema.Types.ObjectId,
    content:{
        shortContent:String,
        longContent:{
            type: String,
            default: ''
        }
    },
    email:String,
    telphone:String,
    comments:[{}],
    images:[],
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    },
    status: {
        type: Number,
        default: 0
    },
    viewNum:{
        type: Number,
        default: 0
    },
    isCommonly:{
        type: Boolean,
        default: false
    }
})

const question = mongoose.model('question', questionSchema)

module.exports = question

