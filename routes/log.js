let express = require('express')
let router = express.Router()
let uploadLog = require('../models/uploadLog')
let mongoose = require('mongoose')

router.get('/', async function(req, res, next) {
    try{
        res.render('log')
    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.get('/list', async function(req, res, next) {
    try{
        let data = await getPaperData(
            req.query.page === undefined ? 0 : req.query.page
            , req.query.limit === undefined ? 10 : req.query.limit
            , req.query.sort === undefined ? {_id:1} : req.query.sort
            ,req.query.key === undefined ? '' : req.query.key
        )
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

async function getPaperData(current, limit, sort, key) {

    let count = await uploadLog.count()

    let info = []

    if (count !== 0) {

        info = await uploadLog.aggregate(
            [
                {
                    $lookup:
                        {
                            from: 'admins',
                            localField: 'adminId',
                            foreignField: '_id',
                            as: 'admin'
                        }
                },
                {
                    $project:
                    {
                        desc: 1,
                        path: 1,
                        createTime: { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: { $add: [ "$createTime", 8*60*60000 ] }  } } ,
                        admin:  {$arrayElemAt: [ '$admin.username', 0 ]}
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

module.exports = router
