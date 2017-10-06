var mongoose = require('mongoose')

//定义管理员表
const questionTypeSchema = new mongoose.Schema({
    name: String,
    icon: String,
    status: {type: Number, default: 1},  // 状态：1：正常，-1：冻结, -2: 删除
})

const questionType = mongoose.model('questionType', questionTypeSchema)

module.exports = questionType

