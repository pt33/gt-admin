let mongoose = require('mongoose')

//定义管理员表
const userSchema = new mongoose.Schema({
    userName: String,
    realName:String,
    nickName:String,
    birthday:String,
    sex: Number,
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

const user = mongoose.model('user', userSchema)

module.exports = user

