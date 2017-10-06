let express = require('express')
let router = express.Router()
let role = require('../models/role')
let field = require('../models/field')
let table = require('../models/table')
let mongoose = require('mongoose')
let test = require('../models/test')
let uploadLog = require('../models/uploadLog')
let template = require('../models/template')
let templateType = require('../models/templateType')
let importTempDataSchema = require('../models/importTempData')
let formidable = require('formidable')
let xlsx = require('node-xlsx')
// let readline = require('readline')
let path = require('path')
let fs = require('fs')
let specialReplace = require('../util/specialReplace')
let iconv = require('iconv-lite')
let sizeOf = require('image-size')
let child_process = require('child_process')
let exec = child_process.exec
const SUBFLD  = 31	// 子字段指示符
const SPACE  = 32
const SUBEND = 30

router.get('/',async function(req, res, next) {
    try{
        let data = await getTitleData()
        res.render('data', data)
    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.get('/subListByRef',async function(req, res, next) {
    try{
        let data = await getTableListDetail(
            req.query.tableId
            ,req.query.tableName
            ,req.query.key
        )
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.get('/subList',async function(req, res, next) {
    try{
        let data = await getTableList(
            req.query.page === undefined ? 0 : req.query.page
            ,req.query.limit === undefined ? 10 : req.query.limit
            ,req.query.key === undefined ? {} : req.query.key
            ,req.query.sort === undefined ? {_id: 1} : req.query.sort
            ,req.query.tableId
            ,req.query.tableName
        )
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.get('/list',async function(req, res, next) {
    try{
        let data = await getPaperData(
            req.query.page === undefined ? 0 : req.query.page
            ,req.query.limit === undefined ? 10 : req.query.limit
            ,req.query.key === undefined ? '' : req.query.key
            ,req.query.sort
        )
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.get('/children',async function(req, res, next) {
    let tableName = req.query.tableName
    let tableId = req.query.tableId
    let fields = []
    const schma = await test.getSchema(tableId, tableName)
    let info = await schma.find({_id: mongoose.Types.ObjectId(req.query._id)
        , status : 1
        , 'children':{$exists:true}}).select({'children':1,_id:0})

    if (info.length > 0) {
        let obj = info[0].children[0]
        let param = []
        for(let i in obj){
            param.push(i)
        }
        fields = await field.find({name: {$in : param}, status : 1, tableId : mongoose.Types.ObjectId(tableId)}).sort({viewSort: 1})

    }
    return res.json({info:info,field:fields})
})

router.get('/getListDetail',async function(req, res, next) {
    try{
        let value = req.query.value
        let refField = req.query.refField
        let refTable = req.query.refTable
        let tableinfo = await table.find({name: refTable, status : 1}).select({_id:1,title:1,name:1}).limit(0)
        let fields = await field.find({tableId: tableinfo[0]._id, status: 1,needShow:true}).sort({viewSort:1})
        let cols = {paths:1,children:1}
        for (let i = 0; i < fields.length; i++) {
            cols[fields[i].name] = 1
        }
        const schema = await test.getSchema(tableinfo[0]._id.toString(), refTable)
        let param = {
            status : 1
        }
        param[refField] = value
        let info = await schema.find(param).select(cols)

        let data = {
            infos: info,
            fields: fields,
            table: tableinfo[0],
            fieldInfo: JSON.stringify(fields)
        }

        if (info.length === 1) {
            for(let i = 0;i<data.fields.length;i++) {
                data.fields[i].value = info[0][data.fields[i].name]
            }
        }

        res.render('detailList', data)
    } catch (e) {
        res.render('error', e.message)
    }
})

router.get('/getFileList',async function(req, res, next) {
    let ary = JSON.parse(req.query.paths)
    let infos = []
    let wh = req.query.wh
    let ww = req.query.ww - 180
    let w, h,page
    if (ary.length > 0 && path.parse(ary[0]).ext === '.pdf') {
        let dir = path.join(uploadPath, ary[0])
        let ppmPath = await execPdf(dir, 1)
        // let oldPath = await execImage(ppmPath)
        let size = sizeOf(ppmPath)
        let tmpw, tmph,pagenum
        w = size.width
        h = size.height
        let pp = h/w
        fs.unlinkSync(ppmPath)
        if (w > h) {
            pagenum = 3
             tmpw = Math.ceil((Number(ww) - 50) / 3)
             tmph = Math.ceil((tmpw - 20) * pp) - 12
        } else {
            pagenum = 4
            tmpw = Math.ceil((Number(ww) - 60) / 4)
            tmph = Math.ceil((tmpw - 20) * pp) - 25
        }

        page = (Math.floor(wh / tmph) + 1) * pagenum

        for (let i = 0; i < Math.min(page, ary.length); i++) {
            infos.push({url:ary[i],name:path.parse(ary[i]).name + path.parse(ary[i]).ext})
        }
    }
    res.render('fileList', {infos: infos, table:{title:req.query.value, tableId: req.query.tableId, name: req.query.tableName},w:w,h:h,pagenum:page})
})

router.post('/getFileList',async function(req, res, next) {
    let ary = req.body.paths
    let page = Number(req.body.page)
    let pageNum = Number(req.body.pageNum)
    let infos = []
    for (let i = page*pageNum; i < Math.min((page+1) * pageNum, ary.length); i++) {
        infos.push({url:ary[i],name:path.parse(ary[i]).name + path.parse(ary[i]).ext})
    }
    res.render('more', {infos: infos, pdfClass: req.body.pdfClass})
})

router.get('/getField/:tableId',async function(req, res, next) {
    try{
        let data = await field.find(
            {
                tableId: mongoose.Types.ObjectId(req.params.tableId)
                ,status: 1
            }
        ).sort({viewSort:1})
        return res.json({data: data})
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/getMarcFields',async function(req, res, next) {
    try{
        let info = await templateType.aggregate([
        {
            $match:
            {
                _id: mongoose.Types.ObjectId(req.query.typeId)
                ,status: 1
                ,type: req.query.type
            }
        },
        {
            $unwind: '$fields'
        },
        {
            $project:
            {
                id: '$fields',
                name: '$fields',
                text:'$fields',
                _id:0
            }
        }
    ])
        // info.unshift({value:'',text:'请选择marc标识符'})
        return res.json(info)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/getField',async function(req, res, next) {
    try{
        let info = await field.aggregate([
            {
                $match:
                {
                    tableId: mongoose.Types.ObjectId(req.query.tableId)
                    ,status: 1
                    ,title: {$regex: req.query.key || ''}
                }
            },
            { $sort : { viewSort : 1} },
            {
                $project:
                {
                    value: '$_id',
                    text: '$title',
                    name: '$name',
                    hasFile: '$hasFile',
                    // canDuplicate: '$canDuplicate',
                    // canEmpty: '$canEmpty',
                    // refDir: { $ifNull: [ '$refDir', false ] },
                    // needGroup: { $ifNull: [ '$needGroup', false ] }
                }
            }
        ])
        let marcs = []
        if (req.query.typeId && req.query.typeId !== undefined) {
            marcs = await templateType.aggregate([
                {
                    $match:
                        {
                            _id: mongoose.Types.ObjectId(req.query.typeId)
                            ,status: 1
                            ,type: req.query.type
                        }
                },
                {
                    $unwind: '$fields'
                },
                {
                    $project:
                    {
                        id: '$fields',
                        text: '$fields',
                        value: '$fields',
                        _id:0
                    }
                }
            ])
            // marcs.unshift({value:'',text:'请选择marc标识符'})
        }
        return res.json({info:info, marcs:marcs})
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/getTemplateById',async function(req, res, next) {
    try{
        let info = await template.aggregate([
            {
                $match:
                {
                    _id: mongoose.Types.ObjectId(req.query._id)
                    ,status : 1
                    ,type: req.query.type
                }
            },
            {
                $unwind: '$fields'
            },

            {
                $group:
                {
                    _id: '$fields.fieldId',
                    index:{$first: '$fields.index'},
                    filePath:{$first: '$fields.filePath'},
                    needGroup:{$first: '$fields.needGroup'},
                    canDuplicate:{$first: '$fields.canDuplicate'},
                    canEmpty:{$first: '$fields.canEmpty'},
                    refDir:{$first: '$fields.refDir'},
                    markCanDuplicate:{$first: '$fields.markCanDuplicate'},
                    marcMark:{$first: '$fields.marcMark'},
                }
            },
            {
                $lookup:
                {
                    from: 'fields',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sub'
                }
            },
            {
                $unwind: '$sub'
            },
            {
                $match:
                {
                    'sub.status': 1
                }
            },
            {
                $sort: { "index": 1 }
            },
            {
                $project:{
                    _id:1,
                    index:1,
                    filePath:{ $ifNull: [ '$filePath', '' ] },
                    refDir:  { $ifNull: [ '$refDir', false ] },
                    needGroup: { $ifNull: [ '$needGroup', false ] },
                    canDuplicate: { $ifNull: [ '$canDuplicate', true ] },
                    canEmpty: { $ifNull: [ '$canEmpty', true ] },
                    markCanDuplicate: { $ifNull: [ '$markCanDuplicate', false ] },
                    marcMark: { $ifNull: [ '$marcMark', '' ] },
                    hasFile:'$sub.hasFile',
                    name:'$sub._id',
                    title:'$sub.name'
                }
            }
        ])
        return res.json(info)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/getImportTemplate/:tableId',async function(req, res, next) {
    try{
        let info = await table.aggregate([
            {
                $lookup:
                {
                    from: 'fields',
                    localField: '_id',
                    foreignField: 'tableId',
                    as: 'fields'
                }
            },
            {
                $unwind: '$fields'
            },
            {
                $match:
                {
                    status : 1,
                    _id : mongoose.Types.ObjectId(req.params.tableId),
                    'fields.status': 1
                }
            },
            {
                $group:
                {
                    _id: '$_id',
                    title: {$first: '$title'},
                    name: {$first: '$name'},
                    fields: {$push:
                        {
                            'name': '$fields.name',
                            'needQuery': '$fields.needQuery',
                            'needSort': '$fields.needSort',
                            'isRef': '$fields.isRef',
                            'title': '$fields.title'
                        }
                    }

                }
            },{
                $lookup:
                {
                    from: 'templates',
                    localField: '_id',
                    foreignField: 'tableId',
                    as: 'templates'
                }
            },{
                $project:{
                    _id:1,
                    title:1,
                    fields:1,
                    name:1,
                    templates : {
                        $filter: {
                            input: "$templates",
                            as: "template",
                            cond: { $eq: [ "$$template.status", 1 ] }
                        }
                    }
                }
            }
        ])
        let templateTypes = await  templateType.find({status: 1, type: 'marc'}, {_id: 1, name: 1})
        res.render('template',{info:info[0],type:templateTypes})
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.post('/save/template', function(req, res, next) {
    try{
        let ary = []
        for (let i = 0; i < req.body.fields.length; i++) {
            let tmp = req.body.fields[i]
            ary.push({fieldId:mongoose.Types.ObjectId(tmp.name)
                ,index: Number(tmp.index)|0
                ,filePath:tmp.filePath
                ,needGroup: tmp.needGroup|false
                ,canEmpty: tmp.canEmpty|false
                ,canDuplicate: tmp.canDuplicate|false
                ,refDir: tmp.refDir|false
                ,markCanDuplicate: tmp.markCanDuplicate|false
                ,marcMark:tmp.marcMark
            })
        }
        let param = {
            type: req.body.type,
            title: req.body.title,
            tableId: req.body.tableId,
            fields: ary
        }
        if (req.body.typeId !== ''){
            param.typeId = req.body.typeId
        }
        template.create(param)
        return res.json({statusCode: 200})
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.get('/template',async function(req, res, next) {
    try{
        info = await template.aggregate([
            {
                $lookup:
                    {
                        from: 'fields',
                        localField: 'fields',
                        foreignField: '_id',
                        as: 'field'
                    }
            },
            {
                $unwind:'$fields'
            },
            {
                $match:
                    {
                        status : 1,
                        _id: mongoose.Types.ObjectId(req.query.templateId)
                    }
            },{
                $project:
                {
                    name: {$arrayElemAt: [ '$field.name', 0 ]},
                    index: 1,
                    needQuery:1,
                    canEmpty:1,
                    canDuplicate:1,
                    refDir:1,
                    _id: {$arrayElemAt: [ '$field._id', 0 ]},
                }
            }
        ])
        return res.json({statusCode: 200, data: info})
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.post('/save/table', function(req, res, next) {

    table.findOne({title:req.body.title, status: 1}).then(async function (data) {
        if (!data){
            if (req.body.tableId !== '' && req.body.tableId !== undefined) {
                table.update(
                    {
                        _id : mongoose.Types.ObjectId(req.body.tableId)
                    },
                    {
                        title: req.body.title,
                        type:req.body.type
                    }
                ).then(function () {
                    return res.json({statusCode: 200})
                }).catch(function (e) {
                    return res.json({statusCode: 201, error: e.message})
                })
            } else {
                let index = await table.findOne().select({index:1,_id:0}).sort({index:-1}).limit(1)
                table.create({
                    title:req.body.title,
                    type:req.body.type,
                    index: index ? (index.index + 1) : 1,
                    name: index ? 'table' + (index.index + 1) : 'table1'
                }).then(function (error,result) {
                    if(!error){
                        return res.json({statusCode:200})
                    } else {
                        return res.json({statusCode:201,error:error.message})
                    }
                }).catch(function (e) {
                    return res.json({statusCode:201,error:e.message})
                })
            }
        } else {
            if (req.body.tableId !== '' && req.body.tableId !== undefined) {
                if (req.body.tableId !== data._id.toString()) {
                    return res.json({statusCode:201,error:'资料库已存在'})
                } else {
                    table.update(
                        {
                            _id : mongoose.Types.ObjectId(req.body.tableId)
                        },
                        {
                            title: req.body.title,
                            type:req.body.type
                        }
                    ).then(function () {
                        return res.json({statusCode: 200})
                    }).catch(function (e) {
                        return res.json({statusCode: 201, error: e.message})
                    })
                }
            } else {
                return res.json({statusCode:201,error:'资料库已存在'})
            }
        }
    })
})

router.delete('/:tableId', function(req, res, next) {
    table.update(
        {_id:mongoose.Types.ObjectId(req.params.tableId)}, {status: 0}
    ).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.delete('/field/:fieldId', function(req, res, next) {
    // console.log(req.params.roleId)
    field.remove(
        {_id:mongoose.Types.ObjectId(req.params.fieldId)}
    ).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.get('/getRefTable', async function (req, res, next) {
    try {
        let info = await table.aggregate([
            {
                $match:
                    { _id : { $ne :  mongoose.Types.ObjectId(req.query.tableId) }, status : 1 }
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

router.post('/checkTableName', function(req, res, next) {
    table.findOne({title:req.body.title, status: 1}).then(function (data) {
        if (!data){
            return res.json(true)
        } else {
            if (req.body.tableId !== undefined && req.body.tableId !== '' && data._id.toString() !== req.body.tableId) {
                return res.json(true)
            }
            return res.json(false)
        }
    })
})

router.get('/getRefField', async function (req, res, next) {
    try {
        let info = await field.aggregate([
            {
                $lookup:
                {
                    from: 'tables',
                    localField: 'tableId',
                    foreignField: '_id',
                    as: 'table'
                }
            },
            {
                $unwind:'$table'
            },
            {
                $match: { status : 1,'table.name': req.query.tableName }
            },{
                $project:
                {
                    value:'$name',
                    text:'$title',
                    _id:0
                }
            }
        ])
        info.splice(0,0,{value:'_id',text:'默认关联值'})
        return res.json(info)
    } catch (e) {
        return res.json({statusCode: 201, error: e.message})
    }
})

router.put('/saveField', async function (req, res, next) {
    let isCreate = false
    let isUpdata = true
    if (req.body.data.title) {
        await field.findOne(
            {
                title:req.body.data.title
                ,tableId: mongoose.Types.ObjectId(req.body.tableId)
                ,status:1
            }).then(function (data) {
            if (!data){
                if (req.body.fieldId !== 'undefined' && req.body.fieldId !== undefined) {
                    isUpdata = true
                    isCreate = false
                } else {
                    isUpdata = false
                    isCreate = true
                }
            } else {
                if (req.body.fieldId !== 'undefined' && req.body.fieldId !== undefined) {
                    if (req.body.fieldId !== data._id.toString()) {
                        return res.json({statusCode:201,error:'字段名已存在'})
                    } else {
                        isUpdata = true
                        isCreate = false
                    }
                } else {
                    return res.json({statusCode:201,error:'字段名已存在'})
                }
            }
        })
    }

    if (isCreate) {
        let index = await field.findOne({tableId: mongoose.Types.ObjectId(req.body.tableId)}).select({index:1,_id:0}).sort({index:-1}).limit(1)

        field.create({
            title: req.body.data.title,
            tableId: req.body.tableId,
            index: index ? (index.index + 1) : 1,
            name: index ? 'field' + (index.index + 1) : 'field1',
            viewSort: req.body.data.viewSort
        }).then(function (result, error) {
            if(!error){
                return res.json({statusCode:200, data: result})
            } else {
                return res.json({statusCode:201,error: error.message})
            }
        }).catch(function (e) {
            return res.json({statusCode:201,error:e.message})
        })
    }
    if (isUpdata) {
        field.update(
            {
                _id : mongoose.Types.ObjectId(req.body.fieldId)
            }, req.body.data, {new : true}
        ).then(function (e) {
            return res.json({statusCode: 200})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    }
})

router.post('/upload', function (req, res, next) {
    var form = new formidable.IncomingForm()
    form.encoding = 'utf-8'
    form.uploadDir = uploadPath
    form.multiples = true
    form.keepExtensions = true
    form.maxFieldsSize = 1024 * 1024 * 1024

    let filePath = {}
    form.on('file', (filed, file) => {
        if (Number(file.size) !== 0) {
            filePath.dir = file.path
            filePath.name = file.name
        }
    })

    form.parse(req, (err, fields, files) => {
        console.log('')
    })

    form.on('end', async function () {
        return res.json(filePath)
    })

    form.on('error', (err) => {
        return res.json({error: err.message})
    })
})

router.post('/parse', async (req, res, next) =>{
    try {
        let sourceFrom = req.body.sourceFrom
        let type = req.body.type
        let tableId = req.body.tableId
        let fields = JSON.parse(req.body.fields)
        let tableName = req.body.tableName
        let paths = JSON.parse(req.body.paths)
        let wordNeedChange = req.body.wordNeedChange
        let parseDirection = req.body.parseDirection
        let hasGroup = false
        let groupField = []

        fields = fields.sort(function (a, b) {
            return -(Number(a.refDir) - Number(b.refDir))
        })

        for (let i = 0; i < fields.length; i++) {
            if (fields[i].needGroup) {
                hasGroup = true
                groupField.push(fields[i])
            }
        }

        if (hasGroup) {
            if (type === 'excel') {
                result = await parseGroupExcel(paths, sourceFrom, fields, tableName, wordNeedChange, parseDirection)
            }
        } else {
            if (type === 'excel') {
                result = parseExcel(paths, sourceFrom, fields, tableName, wordNeedChange, parseDirection)
            } else if (type === 'marc') {
                result = parseMarc(paths, sourceFrom, fields, wordNeedChange)
            }
        }

        const schema = await test.getSchema(tableId, tableName)

        let manyAry = []
        let repeatNum = 0

        for (let i = 0; i < result.success.length; i++) {
            let param = null
            let ary = []
            let setParam = {status:1, createTime: new Date(), updateTime : new Date(), sourceFrom: sourceFrom}
            for (let j = 0; j < fields.length; j++) {
                let field = fields[j]
                if (!field.canDuplicate || field.needGroup) {
                    if (!param) {
                        param = {}
                    }
                    param[field.title] = result.success[i][field.title]
                    setParam[field.title] = result.success[i][field.title]
                } else {
                    setParam[field.title] = result.success[i][field.title]
                }
            }

            if (param !== null) {
                ary.push(param)
            }

            if (ary.length > 0) {
              let message =  await schema.findAndModify(
                    {$or: ary},
                    {_id:-1},
                    {$set:setParam},
                    {upsert: true,
                    new : true}
                )
                if (message.error){
                    result.failed.push({fileName:'',page:'',index: (i+1), error: message.error.message})
                } else {
                    repeatNum++
                }
            } else {
                manyAry.push(result.success[i])
            }
        }

        let data = await schema.insertMany(manyAry)

        let fileName = ''
        if (result.failed.length > 0) {
            let str = ''
            for (let j = 0; j < result.failed.length; j++) {
                let fail = result.failed[j]
                str += '文件名:' + fail.fileName + ',' + fail.page + ',第' + fail.index + '行,第'  +fail.fields+ '列发生错误，信息如下：' + fail.error + '\n'
            }
            fileName = path.join(uploadPath, new Date().getTime() + '_error')
            fs.writeFileSync(fileName, str)
        }
        // for (let i = 0; i < paths.length; i++) {
        //     fs.unlinkSync(paths[i].dir)
        // }
        let more = fileName !== '' ? ',更多错误日志在:' + fileName + '中' : ''

        let msg = '已成功上传' + (data.length + repeatNum) + '条记录,失败' + result.failed.length + '条' + more

        await uploadLog.create({adminId: req.adminId, desc: msg, path: fileName})

        return res.json({statusCode: 200, msg: msg})
    } catch (e) {
        return res.json({statusCode: 201, msg:e.message})
    }
})

async function getTitleData() {
    let types = await table.aggregate([
        {
            $lookup:
                {
                    from: 'fields',
                    localField: '_id',
                    foreignField: 'tableId',
                    as: 'fields'
                }
        },
        {
            $match:
                {
                    status : 1
                }
        },{
            $project:
                {
                    _id: 1,
                    type:1,
                    name:1,
                    title:1,
                    field: {
                        $filter: {
                            input: '$fields',
                            as: 'num',
                            cond: { $eq: [ '$$num.status', 1 ]}
                        }
                    }
                }
        },
        {
            $group:
                {
                    _id: '$type',
                    title: {
                        $push:{
                            name:'$name',
                            title: '$title',
                            _id: '$_id',
                            fields:'$field'
                        }
                    }
                }
        }
    ])

    let templateTables = []

    for (let i in types) {
        templateTables = templateTables.length === 0 ? types[i].title : templateTables.concat(types[i].title)
    }

    return {
        tables:types || [],
        templateTables: templateTables,
        headTitle: '资料库数据',
        searchHolder: '请输入关键字',
        headBtnId: 'importFamilyData',
        headBtnTitle: '批量导入',
        headMode:'importFamilyDataModel',
    }
}

async function getTableListDetail(tableId, tableName, key) {

    let result = []

    const schema = await test.getSchema(tableId, tableName)

    const fields = await field.find(
        {tableId: mongoose.Types.ObjectId(tableId), status:1}
        ,{refField:1,refTable:1,_id:0,name:1}).sort({viewSort:1})

    key.status = 1


    let count = await schema.count(key)
    let lookups = []
    let project = {paths:1,children:1}

    if (count !== 0) {
        for (let i = 0;i < fields.length;i++) {
            if (fields[i].refTable !== '') {
                lookups.push({
                    $lookup:
                    {
                        from: fields[i].refTable,
                        localField: fields[i].name,
                        foreignField: fields[i].refField,
                        as: fields[i].refTable
                    }
                })
                project[fields[i].refTable] = {$size: "$"+fields[i].refTable}
            }
            project[fields[i].name] = 1
        }
        lookups.push({$match:key})
        lookups.push({$project:project})
        result = await schema.aggregate(lookups).sort({_id:1})
    }

    return {
        rows: result,
        total: count
    }
}

function execPdf (dir, page) {
    return new Promise(async (resolve, reject) => {
        let tmp = dir.replace(path.extname(dir), '')
        await exec('pdftoppm -jpeg -r 100 -scale-to 1200 ' + dir + ' ' + tmp + ' ', async function (error, stdout, stderr) {
            if (error) {
                reject(error.message)
            } else {
                resolve(tmp + '-1.jpg')
            }
        })
    })
}

function execImage(dir) {
    return new Promise(async (resolve, reject) => {
        let tmp = dir.replace(path.extname(dir), '') + '.jpeg'
        await exec('pnmtojpeg ' + dir + ' > '  + tmp, async function (error, stdout, stderr) {
            if (error) {
                reject(error.message)
            } else {
                fs.unlinkSync(dir)
                resolve(tmp)
            }
        })
    })

}

async function getTableList(current, limit, key, sort, tableId, tableName) {

    let result = []

    const schema = await test.getSchema(tableId, tableName)

    const fields = await field.find(
        {tableId: mongoose.Types.ObjectId(tableId), status:1}
        ,{refField:1,refTable:1,_id:0,name:1}).sort({viewSort:1})

    key.status = 1

    let count = await schema.count(key)
    let lookups = []
    let project = {paths:1,children:1}

    if (count !== 0) {
        for (let i = 0;i < fields.length;i++) {
            if (fields[i].refTable !== '') {
                lookups.push({
                    $lookup:
                        {
                            from: fields[i].refTable,
                            localField: fields[i].name,
                            foreignField: fields[i].refField,
                            as: fields[i].refTable
                        }
                })
                project[fields[i].refTable] = {$size: "$"+fields[i].refTable}
            }
            project[fields[i].name] = 1
        }
        lookups.push({$match:key})
        lookups.push({$project:project})
        result = await schema.aggregate(lookups).sort(sort).skip(Number(current)).limit(Number(limit))
    }

    return {
        rows: result,
        total: count
    }
}

async function getPaperData(current, limit, key, sort) {

    let count = await table.count({status: 1,$or:[{'name': {$regex: key}},{'type': {$regex: key}}]})

    let info = []

    if (count !== 0) {
        info = await table.aggregate([
            {
                $lookup:
                    {
                        from: 'fields',
                        localField: '_id',
                        foreignField: 'tableId',
                        as: 'fields'
                    }
            },
            {
                $match:
                    {
                        status : 1,
                        $or:[{'name': {$regex: key}},{'type': {$regex: key}}]
                    }
            }
        ]).sort(sort).skip(Number(current)).limit(Number(limit))
    }

    return {
        rows: info,
        total: count,
    }
}

async function parseGroupExcel(paths,sourceFrom,fields, tableName, wordNeedChange, parseDirection) {
    let successAry = []
    let faildAry = []
    for (let i = 0; i < paths.length; i++) {
        let obj = paths[i]
        let list = xlsx.parse(obj.dir)
        let param = await parseGroupExcelList (list, fields, sourceFrom, obj.name, tableName, wordNeedChange, parseDirection)
        if ( successAry.length === 0) {
            successAry = param.success
        } else {
            successAry.concat(param.success)
        }
        if ( faildAry.length === 0) {
            faildAry = param.failed
        } else {
            faildAry.concat(param.failed)
        }
    }
    return {success:successAry, failed:faildAry}
}

async function parseGroupExcelList(list, fields, sourceFrom, fileName, tableName, wordNeedChange, parseDirection) {
    let ary = []
    let param = {}
    let error = []
    let check = 0
    for (let i = 0; i < list.length; i++) {
        let obj = list[i]
        if (parseDirection === 'Vertical') {
            let param = {
                sourceFrom: sourceFrom
                ,page:obj.name
            }
            for (let j = 0; j < obj.data.length; j++) {
                check = 0
                let tmp = obj.data[j]
                for (let m = 0; m < fields.length; m++){
                    let field = fields[m]
                    if (field.index === j) {
                        if (!field.canEmpty && (tmp[1] === '' || tmp[1] === undefined)) {
                            error.push({fileName:fileName,page:obj.name,index: (j+1), fields:(m + 1), error: '必填值为空'})
                            check = 1
                            break
                        }
                    }
                    param[field.title] = specialReplace.check(tmp[1].toString(), wordNeedChange)
                }
            }
            if (check === 0) {
                ary.push(param)
            }
        } else {
            for (let j = 1; j < obj.data.length; j++) {
                check = 0
                let tmp = obj.data[j]
                if (tmp && tmp.length > 0) {
                    let param = {
                        sourceFrom: sourceFrom
                        ,page:obj.name
                    }
                    for (let m = 0; m < fields.length; m++){
                        let field = fields[m]
                        if (!field.canEmpty && (tmp[Number(field.index)] === '' || tmp[Number(field.index)] === undefined)) {
                            error.push({fileName:fileName,page:obj.name,index: (j+1), fields:(m + 1), error: '必填值为空'})
                            check = 1
                            break
                        }
                        param[field.title] = specialReplace.check(tmp[Number(field.index)].toString(), wordNeedChange)
                    }
                    if (check === 0) {
                        ary.push(param)
                    }
                }
            }
        }
    }

    let match = {}
    let group = {}
    let info = {page: '$page'}
    let sort = {}
    let refDir = ''
    let project = {_id:0
        , paths:[]
        , children : { $slice: [ '$info', 1, { $size: "$info" }] }
        , ref: {$arrayElemAt: [ '$ref', 0 ]}
        , page : {$arrayElemAt: [ '$info.page', 0 ]}
    }

    for(let i=0;i<fields.length;i++){//用javascript的for/in循环遍历对象的属性
        let tmp = fields[i]
        param[tmp.title] = 'String'
        if (tmp.refDir) {
            refDir ='$' + tmp.title
        }
        if (tmp.needGroup) {
            match[tmp.title] = {$exists:true}
            group[tmp.title] = '$' + tmp.title
            sort['_id.'+ tmp.title] = 1
            project[tmp.title] = '$_id.' + tmp.title
        } else {
            info[tmp.title] = '$' + tmp.title
            project[tmp.title] = {$arrayElemAt: [ '$info.' + tmp.title, 0 ]}
        }
    }
    param.page = 'String'

    importTempDataSchema.add(param)

    const importTempData = mongoose.model('importTempData', importTempDataSchema)

    await importTempData.remove()

    await importTempData.insertMany(ary)

    let groupResult = await importTempData.aggregate([
        {
            $match: match
        },
        {
            $group:
            {
                _id:  group,
                info:{$push:info},
                ref:{$push: refDir}
            }
        }
        ,{
            $sort:sort
        },
        {
            $project: project
        }
    ])

    let groupAry = []
    for (let j = 0;j<groupResult.length;j++) {
        let tmp = groupResult[j]
        let sub = {
            sourceFrom: sourceFrom
            ,children: tmp.children
            ,paths:[]
        }
        for (let m = 0; m < fields.length; m++){
            try {
                let field = fields[m]
                if (field.filePath !== '') {
                    let r = checkFile(field.filePath, tmp[field.title], tableName, tmp.ref)

                    if (typeof r === 'string' && r !== '') {
                        sub[field.title] = r
                    } else if (typeof r === 'object') {
                        sub[field.title] = specialReplace.check(tmp[field.title].toString(), wordNeedChange)
                        sub.paths = r
                    }
                    if ((typeof r === 'string' && r === '') || (typeof r === 'object' && r.length === 0)) {
                        error.push({fileName:fileName,page:tmp.page,index: (j+1),fields:(m + 1), error: '在上传目录:' + field.filePath + '中，未找到' + tmp.ref + '\\' + tmp[field.title] + '对应的文件'})
                    }
                } else {
                    sub[field.title] = specialReplace.check(tmp[field.title].toString(), wordNeedChange)
                }
            } catch (e) {
                error.push({fileName:fileName,page:tmp.page,index: (j+1),fields:(m + 1), error: e.message})
            }
        }
        groupAry.push(sub)
    }
    return {success:groupAry, failed:error}
}

function parseExcel(paths,sourceFrom,fields, tableName, wordNeedChange, parseDirection) {
    let successAry = []
    let faildAry = []
    for (let i = 0; i < paths.length; i++) {
        let obj = paths[i]
        let list = xlsx.parse(obj.dir)
        let param = parseExcelList (list, fields, sourceFrom, obj.name, tableName, wordNeedChange, parseDirection)
        if ( successAry.length === 0) {
            successAry = param.success
        } else {
            successAry.concat(param.success)
        }
        if ( faildAry.length === 0) {
            faildAry = param.failed
        } else {
            faildAry.concat(param.failed)
        }
    }
    return {success:successAry, failed:faildAry}
}

function parseMarc(paths,sourceFrom,fields, wordNeedChange) {
    let result = []
    let fieldMark = {}
    fields.forEach(function (e) {
        fieldMark[e.marcMark] = e.markCanDuplicate
    })
    for (let i = 0; i < paths.length; i++) {
        let obj = paths[i]
        let fRead = fs.readFileSync(obj.dir)
        var s = iconv.decode(fRead, 'gbk');
        let ary = s.split('\r\n')

        for(let i = 0;i<ary.length;i++){
            if (ary[i].length === 0) continue
            let marks = []
            let str = ary[i]
            let header = str.substring(0, 24).trim()
            let begin_source = Number(header.substring(14,17))
            let mark = str.substring(24, begin_source)
            let len = parseInt(mark.length / 12)
            let data = str.substring(begin_source)
            for (let j = 0;j < len; j++){
                let sub = mark.substring(j*12,12*(j+1))
                marks.push({key:sub.substring(0,3), len:sub.substring(3, 7), start: sub.substring(7)})
            }
            let subData = getMarcString(data, marks, fieldMark,wordNeedChange)
            let param = {sourceFrom : sourceFrom}
            fields.forEach(function (e) {
                param[e.title] = subData[e.marcMark]
            })
            result.push(param)
        }
    }
    return {success:result, failed:[]}
}

function parseExcelList(list, fields, sourceFrom, fileName, tableName, needWordChange, parseDirection) {
    let ary = []
    let error = []
    let check = 0
    let ref = ''
    for (let i = 0; i < list.length; i++) {
        let obj = list[i]
        if (parseDirection === 'Vertical') {
            let param = {
                sourceFrom: sourceFrom
            }
            for (let j = 0; j < obj.data.length; j++) {
                let tmp = obj.data[j]
                if (tmp && tmp.length > 0) {
                    try {
                        // let fieldPath = ''
                        for (let m = 0; m < fields.length; m++){
                            let field = fields[m]
                            if (field.index === j) {
                                if (field.refDir && ref === '') {
                                    ref = tmp[Number(field.index)]
                                }
                                if (!field.canEmpty && (tmp[1] === '' || tmp[1] === undefined)) {
                                    error.push({fileName:fileName,page:obj.name,index: (j+1), fields:(m + 1), error: '必填值为空'})
                                    check = 1
                                    break
                                }
                                if (field.filePath !== '') {
                                    let r = checkFile(field.filePath, tmp[1], tableName, ref)
                                    if (typeof r === 'string' && r !== '') {
                                        param[field.title] = r
                                    } else if (typeof r === 'object') {
                                        param[field.title] = specialReplace.check(tmp[Number(field.index)].toString(), needWordChange)
                                        param.paths = r
                                    }
                                    if ((typeof r === 'string' && r === '') || (typeof r === 'object' && r.length === 0)) {
                                        error.push({fileName:fileName,page:obj.name,index: (j+1),fields:(m + 1), error: '在上传目录:' + field.filePath + '中，未找到' + tmp.ref + '\\' + tmp[field.title] + '对应的文件'})
                                    }
                                } else {
                                    param[field.title] = specialReplace.check(tmp[1].toString(), needWordChange)
                                }
                                break
                            }
                        }
                    } catch (e) {
                        error.push({fileName:fileName,page:obj.name,index: (j+1), error: e.message})
                    }
                }
            }
            if (check === 0) {
                ary.push(param)
            }
        } else {
            for (let j = 1; j < obj.data.length; j++) {
                let tmp = obj.data[j]
                if (tmp && tmp.length > 0) {
                    try {
                        let param = {
                            sourceFrom: sourceFrom
                        }
                        let fieldPath = ''
                        for (let m = 0; m < fields.length; m++){
                            let field = fields[m]
                            if (field.refDir && ref === '') {
                                ref = tmp[Number(field.index)]
                            }
                            if (!field.canEmpty && (tmp[Number(field.index)] === '' || tmp[Number(field.index)] === undefined)) {
                                error.push({fileName:fileName,page:obj.name,index: (j+1), fields:(m + 1), error: '必填值为空'})
                                check = 1
                                break
                            }
                            if (field.filePath !== '') {
                                let r = checkFile(field.filePath, tmp[Number(field.index)], tableName, ref)
                                if (typeof r === 'string' && r !== '') {
                                    param[field.title] = r
                                } else if (typeof r === 'object') {
                                    param[field.title] = specialReplace.check(tmp[Number(field.index)].toString(), needWordChange)
                                    param.paths = r
                                }
                                if ((typeof r === 'string' && r === '') || (typeof r === 'object' && r.length === 0)) {
                                    error.push({fileName:fileName,page:obj.name,index: (j+1),fields:(m + 1), error: '在上传目录:' + field.filePath + '中，未找到' + tmp.ref + '\\' + tmp[field.title] + '对应的文件'})
                                }
                            } else {
                                param[field.title] = specialReplace.check(tmp[Number(field.index)].toString(), needWordChange)
                            }
                        }
                        if (check === 0) {
                            ary.push(param)
                        }
                    } catch (e) {
                        error.push({fileName:fileName,page:obj.name,index: (j+1), error: e.message})
                    }
                }
            }
        }
    }
    return {success:ary, failed:error}
}

function getMarcString(str, marks, fieldMark, wordNeedChange) {
    let result = {}
    var realLength = 0, charCode = -1;
    for (let j = 0; j< marks.length;j++) {
        let tmp = ''
        realLength = 0
        for (var i = 0; i < str.length; i++) {
            charCode = str.charCodeAt(i);
            if (charCode >= 0 && charCode <= 128) {
                realLength += 1;
            } else {
                realLength += 2
            }
            tmp += str[i]
            if(realLength === Number(marks[j].len)) {
                str = str.substring(tmp.length)

                if (tmp.indexOf(String.fromCharCode(SUBFLD)) >= 0) {
                    let tmpAry = tmp.substring(tmp.indexOf(String.fromCharCode(SUBFLD))).split(String.fromCharCode(SUBFLD))
                    tmpAry.forEach(function (e) {
                        if (e !== '') {
                            let val = e.substring(1).replace(String.fromCharCode(SUBEND),'')
                            let key = marks[j].key + '$' + e.substring(0,1)
                            if (fieldMark[key] !== undefined) {
                                if (Number(fieldMark[key]) === 1) {
                                    if (result[key]) {
                                        result[key] += ',' + specialReplace.check(val, wordNeedChange)
                                    } else {
                                        result[key] = specialReplace.check(val, wordNeedChange)
                                    }
                                } else {
                                    result[key] = specialReplace.check(val, wordNeedChange)
                                }
                            } else {
                                for (var obj in fieldMark) {
                                    if (obj.indexOf(',') > 0) {
                                        let ary = obj.split(',')
                                        for (var i in ary){
                                            if (ary[i] === key) {
                                                if (Number(fieldMark[obj]) === 1) {
                                                    if (result[obj]) {
                                                        result[obj] += ',' + specialReplace.check(val, wordNeedChange)
                                                    } else {
                                                        result[obj] = specialReplace.check(val, wordNeedChange)
                                                    }
                                                } else {
                                                    if (result[obj]) {
                                                        if (result[obj].split(',').length === ary.length) {
                                                            result[obj] = specialReplace.check(val, wordNeedChange)
                                                        } else {
                                                            result[obj] += ',' + specialReplace.check(val, wordNeedChange)
                                                        }
                                                    } else {
                                                        result[obj] = specialReplace.check(val, wordNeedChange)
                                                    }
                                                }
                                                break
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    })
                } else {
                    let key = marks[j].key
                    let value = tmp.replace(String.fromCharCode(SUBEND),'')
                    if (fieldMark[key] !== undefined) {
                        result[key] = key === '001' ? Number(value).toString() : specialReplace.check(value, wordNeedChange)
                    }
                }
                break
            }
        }
    }
    // console.log(result)
    return result
}

function checkFile(filepath,filename, tableName, refDir) {
    let tmpPath = ''
    let ary = path.parse(filename).base.split('\\')
    let tmpName = ary && ary.length > 0 ? ary[ary.length - 1] : ''

    if (path.parse(tmpName).ext !== '') {
        for (let i = 0; i < (ary.length - 1); i++) {
            if (fs.existsSync(path.join(filepath, ary[i], tmpName))) {
                tmpPath = path.join(filepath, ary[i], tmpName)
            }
        }

        if (tmpPath === '') {
            if (fs.existsSync(path.join(filepath, tmpName))) {
                tmpPath = path.join(filepath, tmpName)
            }
        }

        if (tmpPath !== '') {
            fs.renameSync(tmpPath, path.join(uploadPath, tableName, tmpName))
            return path.join(tableName, tmpName)
        } else {
            return ''
        }
    } else {
        if (!fs.existsSync(path.join(filepath, refDir))) {
            return []
        }

        if (!fs.existsSync(path.join(uploadPath, tableName))) {
            fs.mkdirSync(path.join(uploadPath, tableName))
        }

        if (!fs.existsSync(path.join(uploadPath, tableName, refDir))) {
            fs.mkdirSync(path.join(uploadPath, tableName, refDir))
        }

        if (!fs.existsSync(path.join(uploadPath, tableName, refDir, filename))) {
            fs.mkdirSync(path.join(uploadPath, tableName, refDir, filename))
        }

        let basePath = path.join(tableName, refDir, filename)

        return checkDir(path.join(filepath, refDir), filename, basePath)
    }
}

function checkDir(filePath, ref, baseDir) {
    let items = []
    let files = fs.readdirSync(filePath)
    for (let i = 0; i< files.length; i++) {
        let item = files[i]
        let info = fs.statSync(path.join(filePath, item))
        if (info.isDirectory()) {
            if (item.indexOf(ref) >= 0) {
                return checkDir(path.join(filePath, item), ref, baseDir)
            }
        } else {
            if (path.parse(item).ext.match('jpg|png|pdf|jpeg') !== null) {
                items.push(path.join(baseDir,item))
                fs.renameSync(path.join(filePath, item), path.join(uploadPath,baseDir, item))
            }
        }
    }
    return items
}

module.exports = router