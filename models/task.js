let mongoose = require('mongoose')

//定义管理员表
const taskSchema = new mongoose.Schema({
    fromId: mongoose.Schema.Types.ObjectId,
    toIds:[mongoose.Schema.Types.ObjectId],
    qId:mongoose.Schema.Types.ObjectId,
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
    }
})

const task = mongoose.model('task', taskSchema)

module.exports = task

