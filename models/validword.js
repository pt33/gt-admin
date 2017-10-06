let mongoose = require('mongoose')

//定义管理员表
const validwordSchema = new mongoose.Schema({
    name:String,
    value:[],
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

const validword = mongoose.model('validword', validwordSchema)

module.exports = validword

