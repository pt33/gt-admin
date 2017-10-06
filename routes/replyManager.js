let express = require('express')
let router = express.Router()
let role = require('../models/role')
let question = require('../models/question')
let menu = require('../models/menu')
let admin = require('../models/admin')
let tag = require('../models/tag')
let mongoose = require('mongoose')
let task = require('../models/task')

router.get('/', async function (req, res, next) {
    try {
        let menus = await menu.find({status: 1}).sort({'sort': 1})
        let data = {
            menus: menus,
            headTitle: '专家咨询管理',
            headBtnId: 'addRole',
            tableName: 'replyManager',
            toolbarId: 'toolbarreplyManager',
            headBtnTitle: '创建提问类型',
            headMode: 'addQuestionTypeModal'
        }
        let cnts = await getNumGroupByStatus()
        data.cnts = cnts
        res.render('replyManager', data)
    } catch (e) {
        res.render('error', {errorMsg: e.message})
    }
})

router.get('/reply', async function (req, res, next) {
    try {
        let data = {
            headTitle: '专家咨询回复',
            headBtnId: 'addRole',
            tableName: 'reply',
            toolbarId: 'toolbarreply'
        }
        let cnts = await getNumGroupByReply(req.adminId)
        data.cnts = cnts
        res.render('replyQuestion', data)
    } catch (e) {
        res.render('error', {errorMsg: e.message})
    }
})

router.get('/reload', async function (req, res, next) {
    try {
        let menus = await menu.find({status: 1}).sort({'sort': 1})
        let data = {
            menus: menus,
            headTitle: '专家咨询管理',
            headBtnId: 'addRole',
            tableName: 'replyManager',
            toolbarId: 'toolbarreplyManager',
            headBtnTitle: '创建提问类型',
            headMode: 'addQuestionTypeModal'
        }
        let cnts = await getNumGroupByStatus()
        data.cnts = cnts
        let replyer = await getReplyerList()
        data.replyer = replyer
        res.render('loadTable', data)
    } catch (e) {
        res.render('error', {errorMsg: e.message})
    }
})

router.get('/reply/reload', async function (req, res, next) {
    try {
        let data = {
            tableName: 'reply',
            toolbarId: 'toolbarreply',
        }
        let cnts = await getNumGroupByReply(req.adminId)
        data.cnts = cnts
        res.render('replyReload', data)
    } catch (e) {
        res.render('error', {errorMsg: e.message})
    }
})

router.get('/list', async function (req, res, next) {
    try {
        let param = req.query.key
        if (req.query.key && typeof req.query.key === 'string' && req.query.key.length > 0) {
            param = JSON.parse(req.query.key)
        }

        let data = await getPaperData(
            req.query.page === undefined ? 0 : req.query.page
            , req.query.limit === undefined ? 10 : req.query.limit
            , req.query.sort === undefined ? {createTime:-1} : req.query.sort
            , param === undefined || param === '' ? {status: 0} : param
            , true
        )
        return res.json(data)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/detail', async function (req, res, next) {
    try {
        let info = await getPaperData(
            0
            , 1
            , {_id: 1}
            , {_id: mongoose.Types.ObjectId(req.query.id)}
            , false
        )

        let replyer = await getReplyerList()
        info[0].replyer = replyer

        res.render('fullInfo', info.length > 0 ? info[0] : {})
    } catch (e) {
        res.render('error', {errorMsg: e.message})
    }
})

router.get('/reply/detail', async function (req, res, next) {
    try {
        let info = await getTaskList(
            0
            , 1
            , {_id: 1}
            , {_id: mongoose.Types.ObjectId(req.query.id)}
            , false
        )

        res.render('creatComment', info.length > 0 ? info[0] : {})
    } catch (e) {
        res.render('error', {errorMsg: e.message})
    }
})

router.get('/tag', async function (req, res, next) {
    try {

        res.render('tagList')
    } catch (e) {
        res.render('error', {errorMsg: e.message})
    }
})


router.get('/tag/list', async function (req, res, next) {
    try {
        let data = await getTagData(
            req.query.page === undefined ? 0 : req.query.page
            , req.query.limit === undefined ? 10 : req.query.limit
            , req.query.sort === undefined ? {_id:1} : req.query.sort
            , req.query.key === undefined ? '' : req.query.key
        )
        return res.json(data)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/reply/list', async function (req, res, next) {
    try {
        let param = req.query.key
        if (req.query.key === undefined || req.query.key === '') {
            param = {status:0}
        } else {
            param = JSON.parse(param)
        }

        param.toIds = mongoose.Types.ObjectId(req.adminId)
        let data = await getTaskList(
            req.query.page === undefined ? 0 : req.query.page
            , req.query.limit === undefined ? 10 : req.query.limit
            , req.query.sort === undefined ? {createTime:-1} : req.query.sort
            , param
            , true
        )
        return res.json(data)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.put('/change', function (req, res, next) {
    let param = {status: Number(req.body.status)}
    if (Number(req.body.status) === 3 || Number(req.body.status) === 3) {
        param = {isCommonly: Number(req.body.status) === 3 ? true : false}
    }
    question.update(
        {_id: mongoose.Types.ObjectId(req.body.id)}, param
    ).then(async function () {
        let info = await getNumGroupByStatus()
        return res.json({statusCode: 200, info: info})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.put('/batch', function (req, res, next) {
    let ary = []
    for (let i in req.body.ids) {
        ary.push(mongoose.Types.ObjectId(req.body.ids[i]))
    }
    let param = {status: Number(req.body.status)}
    if (Number(req.body.status) === 3 || Number(req.body.status) === 4) {
        param = {isCommonly: Number(req.body.status) === 3 ? true : false}
    }
    question.update(
        {_id: {$in: ary}}, param, {multi: true}
    ).then(async function () {
        let info = await getNumGroupByStatus()
        return res.json({statusCode: 200, info: info})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.post('/send', async function (req, res, next) {
    let ids = req.body.ids
    let users = req.body.users
    let data = []
    let ary = []
    let param = []
    for (let i in users) {
        data.push(mongoose.Types.ObjectId(users[i]))
    }
    for (let i in ids) {
        ary.push(mongoose.Types.ObjectId(ids[i]))
        param.push({qId: mongoose.Types.ObjectId(ids[i]), fromId: req.adminId, toIds: data})
    }

    try {
        await task.insertMany(param)
        await question.update(
            {_id: {$in: ary}}, {status: 2}, {multi: true}
        )
        let info = await getNumGroupByStatus()
        return res.json({statusCode: 200, info: info})
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.put('/saveColumnField', async function (req, res, next) {
    if (req.body._id.indexOf('tag_') >= 0) {
        tag.create(req.body.params).then(function (e) {
            return res.json({statusCode: 200, newId: e._id})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    } else {
        tag.update({_id: mongoose.Types.ObjectId(req.body._id)}, req.body.params, {new: true}).then(function () {
            return res.json({statusCode: 200})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    }
})

router.post('/reply/comment', async function (req, res, next) {

    question.update(
        {_id: mongoose.Types.ObjectId(req.body.qid)}
        , {
            $push: {
                comments:
                    {
                        content: req.body.content
                        , replyuser: req.body.adminname
                        , replyuserId: mongoose.Types.ObjectId(req.adminId)
                        , replydate: new Date()
                    }
            }
        }
    ).then(async function () {
        await task.update({_id:mongoose.Types.ObjectId(req.body.tid)},{status:1})
        let info = await getNumGroupByReply(req.adminId)
        return res.json({statusCode: 200, info: info})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

async function getNumGroupByStatus() {

    let info = await question.aggregate(
        [
            {
                $match: {status: {$in: [0, 1, 2]}, comments: {$size: 0}}
            },
            {
                $group: {
                    _id: '$status',
                    list: {
                        $push: {_id: "$_id"}
                    }
                }
            },
            {
                $project:
                    {
                        status: '$_id',
                        cnt: {$size: '$list'},
                        _id: 0
                    }
            }
        ])

    return info.length > 0 ? JSON.stringify(info) : ''
}

async function getNumGroupByReply(adminId) {

    let info = await task.aggregate(
        [
            {
                $match: {status: {$in: [0, 1]}, toIds: mongoose.Types.ObjectId(adminId)}
            },
            {
                $group: {
                    _id: '$status',
                    list: {
                        $push: {_id: "$_id"}
                    }
                }
            },
            {
                $project:
                    {
                        status: '$_id',
                        cnt: {$size: '$list'},
                        _id: 0
                    }
            }
        ])

    return info.length > 0 ? JSON.stringify(info) : ''
}

async function getPaperData(current, limit, sort, key, needCnt) {

    let count = 0

    if (needCnt) {
        count = await question.count(key)
    }

    var map = {
        $map:
        {
            input: "$comments",
                as: "comment",
        in: {
            content: '$$comment.content',
                replyuser: '$$comment.replyuser',
                replyuserId: '$$comment.replyuserId',
                replydate: '$$comment.replydate',
                replytime:
                {
                    $dateToString: {
                        format: "%Y-%m-%d %H:%M:%S",
                            date: {$add: ['$$comment.replydate', 8 * 60 * 60000]}
                    }
                }
            }
        }
    }

    let info = await question.aggregate(
        [
            {
                $lookup:
                    {
                        from: 'tags',
                        localField: 'type',
                        foreignField: '_id',
                        as: 'tag'
                    }
            },
            {
                $project:
                    {
                        title: 1,
                        telphone: 1,
                        createStr: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: {$add: ["$createTime", 8 * 60 * 60000]}
                            }
                        },
                        createTime: 1,
                        username: 1,
                        email: 1,
                        content: 1,
                        reply: {$size: '$comments'},
                        viewNum: 1,
                        type: 1,
                        tag: {$arrayElemAt: ['$tag.name', 0]},
                        icon: {$arrayElemAt: ['$tag.icon', 0]},
                        status: 1,
                        isCommonly: {$cond: { if: { $eq: [ "$isCommonly", true ] }, then: 1, else: 0 }},
                        comments: (Number(limit) === 1 ? map : ''),
                        images: (Number(limit) === 1 ? '$images' : ''),
                        _id: 1
                    }
            },
            {
                $match: key
            }
        ]).sort(sort).skip(Number(current)).limit(Number(limit))

    return needCnt ? {
        rows: info,
        total: count
    } : info
}

async function getTagData(current, limit, sort, key) {

    let count = await tag.count({name: {$regex: key}})

    let info = []

    if (count !== 0) {

        info = await tag.aggregate(
            [
                {
                    $lookup:
                        {
                            from: 'questions',
                            localField: '_id',
                            foreignField: 'type',
                            as: 'questions'
                        }
                },
                {

                    $match: {name: {$regex: key}}
                },
                {
                    $project:
                    {
                        name: 1,
                        icon: 1,
                        status: 1,
                        questions: {$size: '$questions'}
                    }
                }
            ]
        ).sort(sort).skip(Number(current)).limit(Number(limit))
    }

    return {
        rows: info,
        total: count
    }
}

async function getReplyerList() {

    return await role.aggregate(
        [
            {
                $lookup:
                    {
                        from: 'admins',
                        localField: '_id',
                        foreignField: 'roleId',
                        as: 'admin'
                    }
            },
            {
                $match: {enable: true, name: {$regex: '古籍馆专家'}, 'admin.status': 1}
            },
            {
                $project:
                    {
                        admin: 1,
                        _id: 0

                    }
            }, {
            $unwind: '$admin'

        }, {
            $project:
                {
                    _id: '$admin._id',
                    username: '$admin.username'

                }
        }])
}

async function getTaskList(current, limit, sort, key, needCnt) {

    let count = 0

    if (needCnt) {
        count = await task.count(key)
    }

    let info = await task.aggregate([
        {
            $lookup:
                {
                    from: 'questions',
                    localField: 'qId',
                    foreignField: '_id',
                    as: 'qa'
                }
        },
        {
            $lookup:
                {
                    from: 'admins',
                    localField: 'fromId',
                    foreignField: '_id',
                    as: 'admin'
                }
        },
        {
            $project: {
                info: {$arrayElemAt: ['$qa', 0]},
                adminname: {$arrayElemAt: ['$admin.username', 0]},
                toIds: 1,
                fromId: 1,
                createTime: 1,
                status: 1,
                sendStr: {$dateToString: {format: "%Y-%m-%d %H:%M:%S", date: {$add: ["$createTime", 8 * 60 * 60000]}}},
                createStr: {
                    $dateToString: {
                        format: "%Y-%m-%d %H:%M:%S",
                        date: {$add: [{$arrayElemAt: ['$qa.createTime', 0]}, 8 * 60 * 60000]}
                    }
                },
                username: {$arrayElemAt: ['$qa.username', 0]},
                title: {$arrayElemAt: ['$qa.title', 0]},
                type: {$arrayElemAt: ['$qa.type', 0]},
                reply: {$size: {$arrayElemAt: ['$qa.comments', 0]}}
            }
        },
        {
            $lookup:
                {
                    from: 'tags',
                    localField: 'type',
                    foreignField: '_id',
                    as: 'tags'
                }
        },
        {
            $project: {
                info:{telphone:'$info.telphone',content:'$info.content',images:'$info.images',viewNum:'$info.viewNum'
                ,'email':'$info.email',_id:'$info._id'},
                comments: {
                    $map:
                    {
                        input: "$info.comments",
                        as: "comment",
                        in: {
                            content: '$$comment.content',
                            replyuser: '$$comment.replyuser',
                            replyuserId: '$$comment.replyuserId',
                            replydate: '$$comment.replydate',
                            replytime:
                            {
                                $dateToString: {
                                    format: "%Y-%m-%d %H:%M:%S",
                                    date: {$add: ['$$comment.replydate', 8 * 60 * 60000]}
                                }
                            }
                        }
                    }
                },
                adminname: 1,
                fromId: 1,
                toIds: 1,
                createTime: 1,
                status: 1,
                sendStr: 1,
                createStr: 1,
                username: 1,
                title: 1,
                tag: {$arrayElemAt: ['$tags.name', 0]},
                reply: 1
            }
        },
        {
            $match: key
        },
    ]).sort(sort).skip(Number(current)).limit(Number(limit))

    return needCnt ? {
        rows: info,
        total: count
    } : info
}

module.exports = router
