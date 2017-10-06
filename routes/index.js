var express = require('express');
var router = express.Router();
let admin = require('../models/admin')
let menu = require('../models/menu')
let role = require('../models/role')
let security = require('../util/security')
let mongoose = require('mongoose')
let jwt = require('jsonwebtoken')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login');
});

router.get('/default', function(req, res, next) {
    res.render('default')
})

router.post('/login', async function(req, res, next) {
    let info = await admin.aggregate(
    [
        {
            $lookup:
            {
                from: 'roles',
                localField: 'roleId',
                foreignField: '_id',
                as: 'rolename'
            }
        },
        {
            $match: {username: req.body.name}
        },
        {
          $project:
          {
              username: 1,
              roleId: 1,
              status: 1,
              password: 1,
              menus: {$arrayElemAt: [ '$rolename.menus', 0 ]},
              roleName: {$arrayElemAt: [ '$rolename.name', 0 ]}
          }
        }
    ])

    if (info.length === 0) {
        return res.json({error:'账号不存在'})
    } else {
        if (info[0].password !== security.encryptWithSalt(req.body.name, req.body.password)) {
            return res.json({error:'密码错误'})
        } else {
            if (info[0].status !== 1) {
                return res.json({error:'账号异常，无法登录'})
            } else {
                var menus = await menu.find(
                    {_id: {$in:info[0].menus}, status:1}
                ).select({name:1,_id:0,url:1}).sort({sort:1})

                let token = jwt.sign({v:
                    info[0]._id.toString(),r:info[0].roleId
                }, secretOrPrivateKey, {
                    expiresIn: '30 days'
                })
                return res.json({token:token, admin:JSON.stringify(info[0]), menus: JSON.stringify(menus)})
            }
        }
    }
})

router.get('/index', async (req, res, next) => {
    let info = await role.aggregate(
    [
        {
            $unwind:'$menus'
        },
        {
            $lookup:
            {
                from: 'menus',
                localField: 'menus',
                foreignField: '_id',
                as: 'info'
            }
        },
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
            $match: {_id: mongoose.Types.ObjectId(req.roleId)}
        },
        {
            $unwind: '$info'
        },
        {
            $group:
            {
                _id: '$_id',
                roleName: {$first: '$name'},
                list: {
                    $push: {
                        name:'$info.name',
                        icon:'$info.icon',
                        url:'$info.url',
                        status:'$info.status',
                        sort:'$info.sort'
                    }},
                admin: {
                    $first:
                    {
                        $filter: {
                            input: '$admin',
                            as: 'num',
                            cond: { $eq: [ '$$num._id', mongoose.Types.ObjectId(req.adminId)]}
                        }
                    }
                }
            }
        },
        {
            $project:
            {
                roleName: 1,
                menus: {
                    $filter: {
                        input: '$list',
                        as: 'num',
                        cond: { $eq: [ '$$num.status', 1 ]}
                    }
                },
                admin: { $arrayElemAt: [ '$admin.username', 0 ]},
                _id: 0
            }
        },
        {
            $sort:{
                sort:1
            }
        }
    ])

    res.render('index', {
        menus: info.length > 0 ? info[0].menus : [],
        adminName: info.length > 0 ? info[0].admin : '',
        roleName: info.length > 0 ? info[0].roleName : ''
    })
})

router.get('/main', function(req, res, next) {
    res.write('<script language=\'javascript\'>window.parent.location.href=\'/index\'</script>');
    res.end()
})

module.exports = router;
