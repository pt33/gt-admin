let express = require('express')
let router = express.Router()
let uploadLog = require('../models/uploadLog')
let mongoose = require('mongoose')
let validword = require('../models/validword')

router.get('/', async function(req, res, next) {
    try{
        let data = await getPaperData()
        res.render('validword', {headTitle:'敏感词管理',data:data[0].value})

    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.get('/words', async function (req, res, next) {
    try {
        let data = await getPaperData()
        return res.json(data)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.delete('/:name', function(req, res, next) {
    validword.update(
        {"name":"validword"}
    ,{"$pop":{"value":req.params.name}}).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.post('/add', function(req, res, next) {
    validword.update({name:'validword'},
            { $addToSet: {"value":req.body.name}}
        ).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

async function getPaperData() {
    return await validword.find({},{value:1,_id:0})
}

module.exports = router
