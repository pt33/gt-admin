let express = require('express')
let router = express.Router()
let column  = require('../models/column')
let table  = require('../models/table')
let field  = require('../models/field')
let mongoose = require('mongoose')
let child = require('../models/child')
let formidable = require('formidable')
let index = require('../models/index')

router.get('/', async function(req, res, next) {
    try{
        res.render('client')
    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.get('/columns', async function(req, res, next) {
    try{
        let data = await getColumnData(req.query.status)
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.get('/list', async function(req, res, next) {
    try{
        // let data = await getPaperData(
        //     req.query.page
        //     ,req.query.limit
        //     ,req.query.sort
        //     ,req.query.key === undefined ? '' : req.query.key
        // )
        // return res.json(data)
    } catch (e) {
        // return res.json({error:e.message})
    }
})

router.put('/saveColumnField', async function (req, res, next) {
    column.update({_id:mongoose.Types.ObjectId(req.body._id)},req.body.params,{new:true}).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.put('/index/saveColumnField', async function (req, res, next) {
    if (req.body._id.indexOf('index_') >= 0) {
        index.create(req.body.params).then(function (e) {
            return res.json({statusCode: 200, newId: e._id})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    } else {
        index.update({_id: mongoose.Types.ObjectId(req.body._id)}, req.body.params, {new: true}).then(function () {
            return res.json({statusCode: 200})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    }
})

router.get('/columnStatus/:cId/:status', function(req, res, next) {
    column.update(
        {_id:mongoose.Types.ObjectId(req.params.cId)}
        ,{status:req.params.status}
    ).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.get('/indexStatus/:cId/:status', function(req, res, next) {
    index.update(
        {_id:mongoose.Types.ObjectId(req.params.cId)}
        ,{status:req.params.status}
    ).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.get('/delIndex/:cId', function(req, res, next) {
    index.remove(
        {_id:mongoose.Types.ObjectId(req.params.cId)}
    ).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.get('/getTables', async function(req, res, next) {
    try {
        let info = await table.aggregate([
            {
                $match:
                    { status : 1 }
            },{
                $project:
                    {
                        value:'$name',
                        text:'$title',
                        _id:0
                    }
            }
        ])
        info.splice(0,0,{value:'',text:'无'})
        return res.json(info)
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.get('/getRefTable', async function(req, res, next) {
    try {
        let info = await table.aggregate([
            {
                $match: { status : 1}
            },{
                $project:
                {
                    value:'$name',
                    text:'$title',
                }
            }
        ])

        // info.splice(0,0,{value:'',text:'无'})
        return res.json(info)
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.get('/index', async function(req, res, next) {
    try {
        let info = await index.find().sort({sort:1})
        return res.json(info)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/getRefFields', async function(req, res, next) {
    try {
        let info = await table.aggregate([
            {
                $match:
                    { status : 1, name : req.query.tablename}
            },
            {
                $lookup:
                {
                    from: 'fields',
                    localField: '_id',
                    foreignField: 'tableId',
                    as: 'fields'
                }
            }
            ,{
                $project:
                    {
                        fields:1,
                        _id:0,
                    }
            }, {
                $unwind:'$fields'
            },{
                $match:
                    { 'fields.status' : 1,'fields.needShow': true}
            },{
                $sort: {'fields.viewSort':1}
            },{
                $project:
                {
                    value:'$fields.name',
                    text:'$fields.title',
                }
            }
        ])
        // info.splice(0,0,{value:'',text:'无'})
        return res.json(info)
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.get('/getSearchFields', async function(req, res, next) {
    try {
        let info = await table.aggregate([
            {
                $match:
                    { status : 1, name : req.query.tablename}
            },
            {
                $lookup:
                {
                    from: 'fields',
                    localField: '_id',
                    foreignField: 'tableId',
                    as: 'fields'
                }
            }
            ,{
                $project:
                    {
                        fields:1,
                        _id:0,
                    }
            }, {
                $unwind:'$fields'
            },{
                $match:{ 'fields.status' : 1}
            },{
                $sort: {'fields.viewSort':1}
            },{
                $project:
                {
                    name:'$fields.name',
                    title:'$fields.title',
                    _id:'$fields._id',
                    searchMode: {$cond: { if: { $eq: [ "$fields.needQuery", true ] }, then: 'normal', else: '' }},
                    searchType: {$cond: { if: { $eq: [ "$fields.needQuery", true ] }, then: 'text', else: '' }},
                    canSearch: '$fields.needQuery'
                }
            }
        ])
        let data = await child.aggregate([
            {
                $match:
                    { status : 1, columnId : mongoose.Types.ObjectId(req.query.columnId)}
            },{
                $unwind:'$searchs'
            },{
                $project:
                {
                    searchMode:'$searchs.searchMode',
                    searchType:'$searchs.searchType',
                    canSearch:'$searchs.canSearch',
                    fieldId:'$searchs.fieldId',
                    _id:'$searchs._id'
                }
            }
        ])
        if (data.length > 0) {
            for (let i in info) {
                for (let j in data) {
                    info[i].searchMode = ''
                    info[i].searchType = ''
                    info[i].canSearch = false
                    if (info[i]._id.toString() === data[j].fieldId.toString()) {
                        info[i].searchMode = data[j].searchMode
                        info[i].searchType = data[j].searchType
                        info[i].canSearch = data[j].canSearch
                        break
                    }
                }
            }
        }
        return res.json(info)
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.get('/getGroupFields', async function(req, res, next) {
    try {
        let info = await table.aggregate([
            {
                $match:
                    { status : 1, name : req.query.tablename}
            },
            {
                $lookup:
                    {
                        from: 'fields',
                        localField: '_id',
                        foreignField: 'tableId',
                        as: 'fields'
                    }
            }
            ,{
                $project:
                    {
                        fields:1,
                        _id:0,
                    }
            }, {
                $unwind:'$fields'
            },{
                $match:{ 'fields.status' : 1}
            },{
                $sort: {'fields.viewSort':1}
            },{
                $project:
                    {
                        name:'$fields.name',
                        title:'$fields.title',
                        _id:'$fields._id',
                        groupShow: {$cond: { if: { $eq: [ 1, 1 ] }, then: false, else: true }},
                        showMode:  '',
                        groupType:  '',
                        groupTitle:'',
                    }
            }
        ])
        let data = await child.aggregate([
            {
                $match:
                    { status : 1, columnId : mongoose.Types.ObjectId(req.query.columnId)}
            },{
                $unwind:'$groupFields'
            },{
                $project:
                    {
                        groupShow:'$groupFields.groupShow',
                        showMode:'$groupFields.showMode',
                        groupType:'$groupFields.groupType',
                        groupTitle:'$groupFields.groupTitle',
                        fieldId:'$groupFields.fieldId',
                        _id:'$groupFields._id'
                    }
            }
        ])
        if (data.length > 0) {
            for (let i in info) {
                for (let j in data) {
                    if (info[i]._id.toString() === data[j].fieldId.toString()) {
                        info[i].groupShow = data[j].groupShow
                        info[i].groupTitle = data[j].groupTitle
                        info[i].groupType = data[j].groupType
                        info[i].showMode = data[j].showMode
                        break
                    }
                }
            }
        }
        return res.json(info)
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.delete('/child/:_id', async function(req, res, next) {
    column.update(
        {
        }, { $pull: { childs: {_id: mongoose.Types.ObjectId(req.params._id)}} }, {new : true}
    ).then(function (e) {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.delete('/index/button/:_id', async function(req, res, next) {
    index.update(
        {
        }, { $pull: { buttons: {_id: mongoose.Types.ObjectId(req.params._id)}} }, {new : true}
    ).then(function (e) {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.put('/child', async function (req, res, next) {
    if (req.body._id.indexOf('_') > 0) {
        let param = req.body.childs
        param._id = mongoose.Types.ObjectId()
        column.update(
            {
                _id : mongoose.Types.ObjectId(req.body.cId),
            }, { $addToSet: { childs: param } }, {new : true}
        ).then(function (e) {
            return res.json({statusCode: 200, newId: param._id.toString()})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    } else {
        column.update(
            {
                _id : mongoose.Types.ObjectId(req.body.cId),
                'childs._id':mongoose.Types.ObjectId(req.body._id)
            }, {$set:req.body.data}, {new : true}
        ).then(function (e) {
            return res.json({statusCode: 200})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    }
})

router.put('/index/button', async function (req, res, next) {
    if (req.body._id.indexOf('_') > 0) {
        let param = req.body.buttons
        param._id = mongoose.Types.ObjectId()
        index.update(
            {
                _id : mongoose.Types.ObjectId(req.body.cId),
            }, { $addToSet: { buttons: param } }, {new : true}
        ).then(function (e) {
            return res.json({statusCode: 200, newId: param._id.toString()})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    } else {
        index.update(
            {
                _id : mongoose.Types.ObjectId(req.body.cId),
                'buttons._id':mongoose.Types.ObjectId(req.body._id)
            }, {$set:req.body.data}, {new : true}
        ).then(function (e) {
            return res.json({statusCode: 200})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    }
})

router.post('/saveChild', async function (req, res, next) {
    try{
        req.body.param.columnId =  mongoose.Types.ObjectId(req.body.columnId)
        req.body.param.status = 1
        if(req.body.param.groupFields !== undefined && req.body.param.groupFields.length > 0) {
            for (let i in req.body.param.groupFields) {
                req.body.param.groupFields[i].fieldId = mongoose.Types.ObjectId(req.body.param.groupFields[i].fieldId)
                req.body.param.groupFields[i].groupShow = true
            }
        }

        if(req.body.param.searchs !== undefined && req.body.param.searchs.length > 0) {
            for (let i in req.body.param.searchs) {
                req.body.param.searchs[i].fieldId = mongoose.Types.ObjectId(req.body.param.searchs[i].fieldId)
                req.body.param.searchs[i].canSearch = Number(req.body.param.searchs[i].canSearch) === 0 ? false : true
            }
        }

        if (req.body.param.detail !== undefined) {
            req.body.param.detail.canCollection = Number(req.body.param.detail.canCollection) === 0 ? false : true
            req.body.param.detail.canLike = Number(req.body.param.detail.canLike) === 0 ? false : true
            req.body.param.detail.canShare = Number(req.body.param.detail.canShare) === 0 ? false : true
            req.body.param.detail.showViewNum = Number(req.body.param.detail.showViewNum) === 0 ? false : true
            req.body.param.detail.bgImgs = req.body.param.detail.bgImgs !== '' && req.body.param.detail.bgImgs !== undefined
                                        ? JSON.parse(req.body.param.detail.bgImgs) : []
            req.body.param.detail.refFile = Number(req.body.param.detail.refFile) === 0 ? false : true
        }

        req.body.param.showDetail = Number(req.body.param.showDetail) === 0 ? false : true
        req.body.param.hasRef = Number(req.body.param.hasRef) === 0 ? false : true
        req.body.param.showSearch = Number(req.body.param.showSearch) === 0 ? false : true

        await child.findAndModify(
            {columnId:  mongoose.Types.ObjectId(req.body.columnId)},
            {_id:-1},
            req.body.param,
            {upsert: true,
                new : true}
        )
        return res.json({statusCode: 200})
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.get('/getChild', async function(req, res, next) {
    try {
        let data = await child.aggregate([
            {
                $match:
                    { status : 1, columnId : mongoose.Types.ObjectId(req.query.columnId)}
            },{
                $project:
                {
                    refTables:{
                        $map:
                        {
                            input: "$refTables",
                            as: "info",
                            in: { refTable:'$$info.refTable'
                                ,showField:'$$info.showField'
                                ,showMode:'$$info.showMode'
                                ,refTitle:'$$info.refTitle'
                                ,tableField:'$$info.tableField'
                                ,refField:'$$info.refField'
                                ,_id:'$$info.refTable'
                            }
                        }
                    },
                    detail : 1,
                    showDetail: 1,
                    showMode : 1,
                    hasRef : 1,
                    showSearch : 1,
                    columnId : 1
                }
            }
        ])

        // let info = await child.findOne({ status : 1, columnId: mongoose.Types.ObjectId(req.query.columnId) }, {searchs:0})
        return res.json(data.length > 0 ? data[0] : {})
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.get('/getGroupTitleField',async function(req, res, next) {
    try{
        let tid = await getTableId(req.query.tablename)


        let info = await field.aggregate([
            {
                $match: {
                    status : 1
                    ,tableId: tid
                    ,hasFile: true
                }
            },
            {
                $lookup:
                {
                    from: 'tables',
                    localField: 'tableId',
                    foreignField: '_id',
                    as: 'tables'
                }
            }
        ])

        let fields = await field.find(
            {
                tableId: tid
                ,status:1,
                $or: [{needShow: true}, {needQuery: true}]
            },{_id:0,name:1,title:1}).sort({viewSort:1})
        res.render('field', {fields: fields})
    } catch (e) {
        res.render('error', e.message)
    }
})

router.get('/getFileRefField',async function(req, res, next) {
    try{
        let tid = await getTableId(req.query.tablename)

        let infos = await field.find({status: 1, tableId: mongoose.Types.ObjectId(tid)})
        res.render('refField', {tables:infos})
    } catch (e) {
        res.render('error', e.message)
    }
})

router.get('/getFileMainField',async function(req, res, next) {
    try{
        let tid = await getTableId(req.query.tablename)

        let infos = await field.find({status: 1, tableId: mongoose.Types.ObjectId(tid)})
        res.render('mainField', {tables:infos})
    } catch (e) {
        res.render('error', e.message)
    }
})

router.get('/getFileRefTable',async function(req, res, next) {
    try{
        let tid = await getTableId(req.query.tablename)

        let infos = await field.aggregate(
            [
                {
                    $match: {
                        status : 1
                        ,tableId: {$ne: mongoose.Types.ObjectId(tid)}
                        ,hasFile: true
                    }
                },
                {
                    $lookup:
                        {
                            from: 'tables',
                            localField: 'tableId',
                            foreignField: '_id',
                            as: 'tables'
                        }
                },
                {
                    $project:
                        {
                            tid: {$arrayElemAt: [ '$tables._id', 0 ]},
                            name: {$arrayElemAt: [ '$tables.name', 0 ]},
                            title: {$arrayElemAt: [ '$tables.title', 0 ]},
                            _id:0
                        }
                }
            ])
        res.render('refTable', {tables:infos})
    } catch (e) {
        res.render('error', e.message)
    }
})


router.post('/upload', function (req, res, next) {
    var form = new formidable.IncomingForm()
    form.encoding = 'utf-8'
    form.uploadDir = uploadPath
    form.multiples = true
    form.keepExtensions = true
    form.maxFieldsSize = 1024 * 1024 * 1024

    let filePath = ''
    form.on('file', (filed, file) => {
        if (Number(file.size) !== 0) {
            filePath = file.path
        }
    })

    form.parse(req, (err, fields, files) => {
        console.log('')
    })

    form.on('end', async function () {
        return res.json(filePath.replace(uploadPath,''))
    })

    form.on('error', (err) => {
        return res.json({error: err.message})
    })
})

async function getColumnData(status) {

    let param = {}

    if(status !==  undefined) {
        param.status = status
    }

    let count = await column.count(param)

    let info = []

    if (count !== 0) {
        info = await column.find(param).sort({sort: 1})
    }

    return {
        rows: info,
        total: count
    }
}

async function getTableId(tableName) {

    let info = await table.findOne({name:tableName,status:1})

    if (info) {
        return info._id.toString()
    } else {
        return null
    }
}

module.exports = router
