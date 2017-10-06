var queryStr = {}
var checkedIds = {}

var tableOptions = {
    method: 'get',                      //请求方式（*）
    striped: true,                      //是否显示行间隔色
    cache: true,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
    pagination: true,                   //是否显示分页（*）
    sortable: true,                     //是否启用排序
    searchOnEnterKey:true,
    // sortOrder: "asc",                   //排序方式
    sidePagination: "server",           //分页方式：client客户端分页，server服务端分页（*）
    pageNumber: 1,                       //初始化加载第一页，默认第一页
    pageSize: 10,                       //每页的记录行数（*）
    pageList: [5, 10, 25, 50, 100],     //可供选择的每页的行数（*）
    search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
    strictSearch: true,
    showColumns: true,                  //是否显示所有的列
    showRefresh: true,                  //是否显示刷新按钮
    minimumCountColumns: 2,             //最少允许的列数
    clickToSelect: false,                //是否启用点击选中行
    iconSize:20,
    height: getCardHeight(),                        //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
    uniqueId: "_id",                     //每一行的唯一标识，一般为主键列
    queryParams: function (param) {
        let query = {
            page: param.offset
            , limit: param.limit
            , key: {}
            , sort: {}
        }
        if (param.sort !== undefined) {
            query.sort[param.sort] = param.order
        } else {
            query.sort['createTime'] = 'desc'
        }
        if (Object.keys(queryStr).length > 0) {
            query.key = JSON.stringify(queryStr)
        }
        return query
    },
    onLoadSuccess: function (aa, bb, cc) {
        if (aa.error) {
            // myModalTrigger.close()
            showMessage(aa.error, '')
        }
    }
    ,onLoadError: function (error) {
        // myModalTrigger.close()
        showMessage(error.message, '')
    }
}

var tableColumns = {}
tableColumns.admins = {
    columns: [
        {
            field: "username",
            title: "账号名称",
            sortable: true,
        }, {
            field: "roleName",
            title: "角色",
            sortable: true
        },{
            field: "statusName",
            title: "状态",
            sortable: true
        }, {
            field: "operate",
            title: "操作",
            formatter: function (value, row, index) {
                let a = ['<a href="javascript:void(0)"  data-toggle="tooltip" onclick="operateEvents(\''+ row._id + '\',\'' + index  +'\',\'tableListadmins\',\'resetAdmin\',\'confirmAdminModal\')" title="重置账号密码">',
                    '<i class="fa fa-lg fa-refresh"></i>',
                    '</a> &nbsp;',
                    '<a href="javascript:void(0)"  class="text-danger" data-toggle="tooltip" onclick="operateEvents(\'' + row._id  +'\',\'' + index  +'\',\'tableListadmins\',\'deleteAdmin\',\'confirmAdminModal\')" title="删除管理员账号">',
                    '<i class="fa fa-lg fa-trash-o"></i>',
                    '</a> &nbsp;']
                if (row.status === 1) {
                  return a.join('') + (['<a href="javascript:void(0)"  data-toggle="tooltip" onclick="operateEvents(\''+ row._id +'\',\'' + index  +'\',\'tableListadmins\',\'\setAdminStatus\',\'confirmAdminModal\')" title="冻结管理员账号">',
                        '<i class="fa fa-lg fa-lock"></i>',
                        '</a>']).join('')
                } else if (row.status === -1){
                   return a.join('') + ([
                        '<a href="javascript:void(0)"  data-toggle="tooltip" onclick="operateEvents(\''+ row._id + '\',\'' + index  +'\',\'tableListadmins\',\'setAdminStatus\',\'confirmAdminModal\')" title="解冻管理员账号">',
                        '<i class="fa fa-lg fa-unlock"></i>',
                        '</a>']).join('')
                }
                return a.join('')
            }
        }
    ]
}

tableColumns.role = {
    columns: [
    {
        field: "name",
        title: "角色名称"
    }, {
        field: "operate",
        title: "操作",
        formatter: function (value, row, index) {
            return ['<a href="javascript:void(0)"  data-toggle="tooltip" data-tip-class="tooltip-primary" onclick="operateEvents(\''+ row._id + '\',\'' + index  +'\',\'tableListrole\',\'editRole\',\'addRoleModal\')" title="编辑角色">',
                '<i class="fa fa-lg fa-edit"></i>',
                '</a> &nbsp;',
                row.admin === 0 ?
                    '<a href="javascript:void(0)"  title="删除角色" class="text-danger" onclick="operateEvents(\''+ row._id + '\',\'' + index  +'\',\'tableListrole\',\'editRole\',\'confirmRoleModal\')" title="删除角色">'
                    : '<a href="javascript:void(0)" title="角色已关联用户,无法删除" class="icon-state-default">',
                '<i class="fa fa-lg fa-trash-o"></i>',
                '</a>'].join('')
        }
    }]
}

tableColumns.question = {
    search: false,
    showRefresh:false,
    showColumns:false,
    columns: [
    {
        checkbox: true
    },
    {
        field: "status",
        title: "状态",
        sortable: true,
        formatter: function (value, row, index) {
            if  (row.status == 0 ) {
                return '<i class="fa fa-exclamation-circle href-rss" style="font-weight: 600;"></i> <span class="href-rss" style="font-weight: 500">未审核</span>'
            } else if (row.status == 1) {
                return '<i class="fa fa-inbox href-twitter" style="font-weight: 600;"></i> <span class="href-twitter" style="font-weight: 600;">未指派</span>'
            } else if (row.status == 2 && row.reply == 0) {
                return '<i class="fa fa-adjust href-facebook" style="font-weight: 600;"></i> <span class="href-facebook" style="font-weight: 600;">未回复</span>'
            } else if (row.status == 2 && row.reply != 0 && row.isCommonly === 0) {
                return '<i class="fa fa-check-square-o icon-state-success" style="font-weight: 600;"></i> <span class="text-success" style="font-weight: 600;">已回复</span>'
            } else if (row.status == 2 && row.reply != 0 && row.isCommonly === 1) {
                return '<i class="fa fa-star text-info" style="font-weight: 600;"></i> <span class="text-info" style="font-weight: 600;">已标星</span>'
            } else if (row.status == -1) {
                return '<i class="fa fa-close f-red" style="font-weight: 600;"></i> <span class="f-red" style="font-weight: 600;">已拒绝</span>'
            } else if (row.status == -2) {
                return '<i class="fa fa-remove f-yellow"></i> <span class="f-yellow">已删除</span>'
            } else {
                return ''
            }
        }
    },
    {
        field: "title",
        title: "标题"
    },{
        field: "tag",
        title: "类型",
        sortable: true
    },{
        field: "username",
        title: "用户"
    },{
        field: "createStr",
        title: "时间",
        sortable: true
    },{
        field: "operate",
        title: "操作",
        formatter: function (value, row, index) {
            return ['<a href="javascript:void(0)"  data-toggle="tooltip" data-tip-class="tooltip-primary" onclick="showContent(\''+ row._id + '\')" title="查看详情">',
                '<i class="fa fa-lg fa-edit"></i>',
                '</a>'].join('')
        }
    }]
    ,onCheck: function(row) {
        checkedIds[row._id] = 1
        changeBtn()
    }
    ,onUncheck: function(row) {
        delete checkedIds[row._id]
        changeBtn()
    }
    ,onCheckAll: function(a) {
        for (var i in a) {
            checkedIds[a[i]._id] = 1
        }
        changeBtn()
    }
    ,onUncheckAll: function(a) {
        for (var i in a) {
            delete checkedIds[a[i]._id]
        }
        changeBtn()
    }
}

tableColumns.reply = {
    search: false,
    showRefresh:false,
    showColumns:false,
    columns: [
        {
            field: "status",
            title: "状态",
            sortable: true,
            formatter: function (value, row, index) {
                if  (row.status == 0 ) {
                    return '<i class="fa fa-exclamation-circle href-rss"></i> <span class="href-rss">未处理</span>'
                } else if (row.status == 1) {
                    return '<i class="fa fa-inbox text-success"></i> <span class="text-success">已回复</span>'
                }
            }
        },
        {
            field: "title",
            title: "标题"
        },{
            field: "tag",
            title: "类型",
            sortable: true
        },{
            field: "username",
            title: "用户"
        },{
            field: "createStr",
            title: "时间",
            sortable: true
        },{
            field: "adminname",
            title: "指派人",
            sortable: true
        },{
            field: "sendStr",
            title: "指派时间",
            sortable: true
        },{
            field: "operate",
            title: "操作",
            formatter: function (value, row, index) {
                return ['<a href="javascript:void(0)"  data-toggle="tooltip" data-tip-class="tooltip-primary" onclick="showReply(\''+ row._id + '\')" title="查看详情">',
                    '<i class="fa fa-lg fa-edit"></i>',
                    '</a>'].join('')
            }
        }]
}

tableColumns.data = {
    onExpandRow: function (index, row, $detail) {
        expandTable($detail, row,index);
    },
    detailView: true,
    columns: [
        {
        field: "title",
        title: "资料库标题",
        sortable: true,
    }, {
        field: "type",
        title: "资料库分类",
        sortable: true
    }, {
        field: "operate",
        title: "操作",
        formatter: function (value, row, index) {
            return [
                '<a href="javascript:void(0)"  data-toggle="tooltip" data-tip-class="tooltip-primary" onclick="operateEvents(\''+ row._id + '\',\'' + index  +'\',\'tableListdata\',\'editTable\',\'addTableModel\')" title="编辑资料库">',
                '<i class="fa fa-lg fa-edit"></i>',
                '</a> &nbsp;',
                '<a href="javascript:void(0)"  data-toggle="tooltip" data-tip-class="tooltip-primary" onclick="operateEvents(\''+ row._id + '\',\'' + index  +'\',\'tableListdata\',\'deleteTable\',\'confirmTableModal\')" title="删除资料库">',
                '<i class="fa fa-lg fa-trash-o"></i>',
                '</a>'
            ].join('')
        }
    }]
}

tableColumns.template = {
    onExpandRow: function (index, row, $detail) {
        expandTemplate($detail, row,index);
    },
    detailView: true,
    columns: [
    {
        field: "title",
        title: "模板标题",
        sortable: true,
        editable: {
            type: 'text',
            url: '/template/title',
            emptytext:'请输入模板标题',          //编辑框的标题
            placeholder:'请输入模板标题',
            params: function(params) {
                let data = $('#tableListtemplate').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {'title':params.value,'_id':data[index]._id.toString()}
            },
            success: function(response, newValue) {
                $(this).editable('setValue', newValue)
            },
            error: function (response, newValue) {
                return response.error
            },
            validate: function (value) {
                value = $.trim(value);
                if (!value) {
                    return '标题不能为空'
                }
                let data = $('#tableListtemplate').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                for (let i = 0; i<data.length;i++){
                    if (data[i].title === value && i !== index) {
                        return '标题不能重复'
                    }
                }
            }
        }
    }, {
        field: "type",
        title: "模板类型",
        sortable: true
    }, {
        field: "tableName",
        title: "对应资料库",
        sortable: true
    }, {
        field: "operate",
        title: "操作",
        formatter: function (value, row, index) {
            return [
                '<a href="javascript:void(0)"  data-toggle="tooltip" data-tip-class="tooltip-primary" onclick="operateEvents(\''+ row._id + '\',\'' + index  +'\',\'tableListtemplate\',\'deleteTemplate\',\'confirmTemplateModal\')" title="删除资料库">',
                '<i class="fa fa-lg fa-trash-o"></i>',
                '</a>'
            ].join('')
        }
    }]
}

tableColumns.tag = {
    columns: [
    {
        field: "name",
        title: "类型名称",
        editable: {
            pk:'_id',
            type: 'text',
            url: '/replyManager/saveColumnField',
            emptytext:'请输入类型名称',          //编辑框的标题
            placeholder:'请输入类型名称',
            params: function(params) {
                let data = $('#tableListtag').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {
                    params: {name:params.value},
                    _id: data[index]._id
                }
            },
            success: function(response, newValue) {
                if(response.error !== undefined) {
                    return response.error
                }
                if (response.newId) {
                    let data = $('#tableListtag').bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].name = newValue
                    $('#tableListtag').bootstrapTable('updateRow',{index: i, row: data[i]})
                } else {
                    $(this).editable('setValue', newValue)
                }

            },
            validate: function (value) {
                value = $.trim(value);
                if (!value) {
                    return '值不能为空';
                }
                let data = $('#tableListtag').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                for (let i = 0; i<data.length;i++){
                    if (data[i].name === value && i !== index) {
                        return '类型名称不能重复'
                    }
                }
                return ''
            }
        }
    }, {
            field: "icon",
            title: "图标类型",
            sortable: true,
            editable: {
                pk:'_id',
                url: '/replyManager/saveColumnField',
                type: 'select',
                emptytext:'请选择',
                defaultValue: 'icon-book3',
                source: [
                    { value: 'icon-private-sitemap', text: "家谱" }
                    ,{ value: 'icon-private-map-signs', text: "寻根" }
                    ,{ value: 'icon-private-contacts-social', text: "委托查询" }
                    ,{ value: 'icon-private-send-to-front', text: "文献" }
                    ,{ value: 'icon-private-content-14', text: "服务" }
                ],
                params: function(params) {
                    let data = $('#tableListtag').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    return {
                        params: {icon:(params.value === '' ? 'icon-book3' : params.value)},
                        _id: data[index]._id
                    }
                },
                validate: function (value) {
                    value = $.trim(value);
                    if (!value) {
                        return '值不能为空';
                    }
                    let data = $('#tableListtag').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    if ((data[index].name === '' || data[index].name === undefined) && data[index]._id.indexOf('tag_') >= 0) {
                        return '名称不能为空'
                    }
                    return ''
                },
                success: function(response, newValue) {
                    if(response.error !== undefined) {
                        return response.error
                    }
                    $(this).editable('setValue', newValue)
                }
            }
        },{
            field: "status",
            title: "可用状态",
            sortable: true,
            editable: {
                pk:'_id',
                url: '/replyManager/saveColumnField',
                type: 'select',
                defaultValue: '1',
                emptytext:'请选择',
                source: [
                    { value: '1', text: "可用" }
                    ,{ value: '0', text: "停用" }
                ],
                params: function(params) {
                    let data = $('#tableListtag').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    return {
                        params: {status:params.value},
                        _id: data[index]._id
                    }
                },
                validate: function (value) {
                    value = $.trim(value);
                    if (!value) {
                        return '值不能为空';
                    }
                    let data = $('#tableListtag').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    if ((data[index].name === '' || data[index].name === undefined) && data[index]._id.indexOf('tag_') >= 0) {
                        return '名称不能为空'
                    }
                    return ''
                },
                success: function(response, newValue) {
                    if(response.error !== undefined) {
                        return response.error
                    }
                    $(this).editable('setValue', newValue)
                }
            }
        }]
}

tableColumns.log = {
    search: false,
    columns: [
        {
            field: "createTime",
            title: "上传时间",
            sortable: true,
        }, {
            field: "admin",
            title: "上传人",
            sortable: true
        },{
            field: "desc",
            title: "备注",
            sortable: false
        },{
            field: "path",
            title: "文件查看",
            formatter:function (value, row, index) {
                if(row.path !== '' && row.path !== undefined) {
                    return [
                        '<a href="javascript:void(0)"  onclick="" title="点击查看文件明细">',
                        '查看错误日志文件',
                        '</a>'
                    ].join('')
                }
            }
        }
    ]
}

tableColumns.log = {
    search: false,
    columns: [
    {
        field: "createTime",
        title: "上传时间",
        sortable: true,
    }, {
        field: "admin",
        title: "上传人",
        sortable: true
    },{
        field: "desc",
        title: "备注",
        sortable: false
    },{
        field: "path",
        title: "文件查看",
            formatter:function (value, row, index) {
                if(row.path !== '' && row.path !== undefined) {
                    return [
                        '<a href="javascript:void(0)"  onclick="" title="点击查看文件明细">',
                        '查看错误日志文件',
                        '</a>'
                    ].join('')
                }
            }
        }
    ]
}

tableColumns.column = {
    search: false,
    onExpandRow: function (index, row, $detail) {
        if (!row.hasChild || Number(row.hasChild) === 0) {
            showMessage('子栏目不可用','')
            return
        }
        $.ajax({
            url: '/client/getTables/',
            success:function (result) {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    row.tables = result
                    expandColumnTable($detail.html("<div style='height: 40px;'><button id='btn_" + row._id + "' type='button' class='btn btn-success' onclick='addColumnChild(this)'>添加子栏目</button></div>" +
                        "<table id='sub_" + row._id + "' class='display table table-no-bordered table-hover'></table>").find('table'), row, index);
                }
            }
        })
    },
    detailView: true,
    columns: [
        {
            field: "name",
            title: "栏目名称",
            editable: {
                pk:'_id',
                type: 'text',
                url: '/client/saveColumnField',
                emptytext:'请输入栏目名称',          //编辑框的标题
                placeholder:'请输入栏目名称',
                params: function(params) {
                    let data = $('#columnFields').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    return {
                        params: {name:params.value},
                        _id: data[index]._id
                    }
                },
                success: function(response, newValue) {
                    $(this).editable('setValue', newValue)
                },
                validate: function (value) {
                    value = $.trim(value);
                    if (!value) {
                        return '值不能为空';
                    }
                    let data = $('#columnFields').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    for (let i = 0; i<data.length;i++){
                        if (data[i].name === value && i !== index) {
                            return '栏目名称不能重复'
                        }
                    }
                    return ''
                }
            }
        }, {
            field: "sort",
            title: "显示顺序",
            sortable: true,
            editable: {
                pk:'_id',
                type: 'number',
                url: '/client/saveColumnField',
                placeholder:'请输入栏目显示顺序',
                params: function(params) {
                    let data = $('#columnFields').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    return {
                        params: {sort:Number(params.value)},
                        _id: data[index]._id
                    }
                },
                success: function(response, newValue) {
                    if(response.error !== undefined) {
                        return response.error
                    }
                    $(this).editable('setValue', newValue)
                },
                validate: validateField
            }
        }, {
            field: "hasChild",
            title: "是否有子栏目",
            editable: {
                pk:'_id',
                url: '/client/saveColumnField',
                type: 'select',
                source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                params: function(params) {
                    let data = $('#columnFields').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    if (Number(params.value) === 0) {
                        return {
                            params: {hasChild:Number(params.value),childShowMode:''},
                            _id: data[index]._id
                        }
                    }
                    return {
                        params: {hasChild:Number(params.value)},
                        _id: data[index]._id
                    }
                },
                success: function(response, newValue) {
                    if(response.error !== undefined) {
                        return response.error
                    }
                    $(this).editable('setValue', newValue)
                    if (Number(newValue) === 0) {
                        $(this).closest('td').next().find('.editable').editable('setValue', '')
                    }

                    let data = $('#columnFields').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    data[index].hasChild = Number(newValue) === 0 ? false : true
                    data[index].childShowMode = Number(newValue) === 0 ? '' : data[index].childShowMode
                },
                validate: validateField
            }
        }, {
            field: "childShowMode",
            title: "子栏目显示方式",
            editable: {
                url: '/client/saveColumnField',
                type: 'select',
                source: [{ value: 'tab', text: "Tab" },{ value: 'menu', text: "Menu" } ],
                emptytext: '无',
                params: function(params) {
                    let data = $('#columnFields').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    return {
                        params: {childShowMode:params.value},
                        _id: data[index]._id
                    }
                },
                success: function(response, newValue) {
                    if(response.error !== undefined) {
                        return response.error
                    }
                    $(this).editable('setValue', newValue)
                },
                validate: function (value) {
                    value = $.trim(value);
                    if (!value) {
                        return '值不能为空';
                    }

                    let data = $('#columnFields').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    if(!data[index].hasChild || Number(data[index].hasChild) === 0) {
                        return '子栏目不可用'
                    }
                    return ''
                }
            }
        },{
            field: "operate",
            title: "操作",
            formatter: function (value, row, index) {
                let a = []
                if (row.status === 1) {
                    return a.join('') + (['<a href="javascript:void(0)"  data-toggle="tooltip" onclick="operateEvents(\''+ row._id +'\',\'' + index  +'\',\'columnFields\',\'\setColumnStatus\',\'confirmColumnModal\')" title="停用栏目">',
                        '<i class="fa fa-lg fa-lock"></i>',
                        '</a>']).join('')
                } else if (row.status === 0){
                    return a.join('') + ([
                        '<a href="javascript:void(0)"  data-toggle="tooltip" onclick="operateEvents(\''+ row._id + '\',\'' + index  +'\',\'columnFields\',\'setColumnStatus\',\'confirmColumnModal\')" title="启用栏目">',
                        '<i class="fa fa-lg fa-unlock"></i>',
                        '</a>']).join('')
                }
            }
        }
    ]
}

tableColumns.index = {
    search:false,
    toolbar:'#toolbarindex',
    onExpandRow: function (index, row, $detail) {
        if (!row.showButton || Number(row.showButton) === 0) {
            showMessage('按钮不可用','')
            return
        }
        expandIndexTable($detail.html("<div style='height: 40px;'><button id='btn_" + row._id + "' type='button' class='btn btn-success' onclick='addIndexButton(this)'>添加按钮</button></div>" +
                        "<table id='sub_" + row._id + "' class='display table table-no-bordered table-hover'></table>").find('table'), row, index);
    },
    detailView: true,
    columns: [
    {
        field: "name",
        title: "栏目名称",
        editable: {
            pk:'_id',
            type: 'text',
            url: '/client/index/saveColumnField',
            emptytext:'请输入栏目名称',          //编辑框的标题
            placeholder:'请输入栏目名称',
            params: function(params) {
                let data = $('#tableListindex').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {
                    params: {name:params.value,sort:data[index].sort},
                    _id: data[index]._id
                }
            },
            success: function(response, newValue) {
                if(response.error !== undefined) {
                    return response.error
                }
                if (response.newId) {
                    let data = $('#tableListindex').bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].name = newValue
                    $('#tableListindex').bootstrapTable('updateRow',{index: i, row: data[i]})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            validate: function (value) {
                value = $.trim(value);
                if (!value) {
                    return '值不能为空';
                }
                let data = $('#tableListindex').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                for (let i = 0; i<data.length;i++){
                    if (data[i].name === value && i !== index) {
                        return '栏目名称不能重复'
                    }
                }
                return ''
            }
        }
    }, {
        field: "sort",
        title: "显示顺序",
        sortable: true,
        editable: {
            pk:'_id',
            type: 'number',
            url: '/client/index/saveColumnField',
            placeholder:'请输入栏目显示顺序',
            params: function(params) {
                let data = $('#tableListindex').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {
                    params: {sort:Number(params.value)},
                    _id: data[index]._id
                }
            },
            success: function(response, newValue) {
                if(response.error !== undefined) {
                    return response.error
                }
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateIndex(value, this)
            }
        }
    }, {
        field: "refTable",
        title: "关联数据",
        editable: {
            pk:'_id',
            url: '/client/index/saveColumnField',
            type: 'select',
            source: '/client/getRefTable',
            params: function(params) {
                let data = $('#tableListindex').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {
                    params: {refTable:params.value},
                    _id: data[index]._id
                }
            },
            success: function(response, newValue) {
                if(response.error !== undefined) {
                    return response.error
                }
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateIndex(value, this)
            }
        }
    }, {
        field: "showMode",
        title: "栏目显示方式",
        editable: {
            url: '/client/index/saveColumnField',
            type: 'select',
            source: [
                { value: 'name', text: "姓氏" }
                ,{ value: 'book', text: "家谱" }
                ,{ value: 'txt', text: "卡片式文字" }
                ,{ value: 'image', text: "卡片式图片" } ],
            emptytext: '无',
            params: function(params) {
                let data = $('#tableListindex').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {
                    params: {showMode:params.value},
                    _id: data[index]._id
                }
            },
            success: function(response, newValue) {
                if(response.error !== undefined) {
                    return response.error
                }
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateIndex(value, this)
            }
        }
    },{
        field: "showButton",
        title: "是否显示按钮",
        editable: {
            url: '/client/index/saveColumnField',
            type: 'select',
            source: [
                { value: '0', text: "否" }
                ,{ value: '1', text: "是" } ],
            emptytext: '无',
            params: function(params) {
                let data = $('#tableListindex').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {
                    params: {showButton:params.value},
                    _id: data[index]._id
                }
            },
            success: function(response, newValue) {
                if(response.error !== undefined) {
                    return response.error
                }
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateIndex(value, this)
            }
        }
    },{
        field: "contentTitle",
        title: "内容标题",
        class: 'contentTitle',
        editable: {
            url: '/client/index/saveColumnField',
            type: "select",
            emptytext:'无',
            params: function(params) {
                let data = $('#tableListindex').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {
                    params: {contentTitle:params.value},
                    _id: data[index]._id
                }
            },
            success: function(response, newValue) {
                if(response.error !== undefined) {
                    return response.error
                }
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateIndex(value, this)
            }
        }
    },{
        field: "contentSubTitle",
        title: "内容副标题",
        class: 'contentSubTitle',
        editable: {
            url: '/client/index/saveColumnField',
            type: "select",
            emptytext:'无',
            params: function(params) {
                let data = $('#tableListindex').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {
                    params: {contentSubTitle:params.value},
                    _id: data[index]._id
                }
            },
            success: function(response, newValue) {
                if(response.error !== undefined) {
                    return response.error
                }
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateIndex(value, this)
            }
        }
    },{
        field: "content",
        title: "内容",
        class: 'content',
        editable: {
            url: '/client/index/saveColumnField',
            type: "select",
            emptytext:'无',
            params: function(params) {
                let data = $('#tableListindex').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {
                    params: {content:params.value},
                    _id: data[index]._id
                }
            },
            success: function(response, newValue) {
                if(response.error !== undefined) {
                    return response.error
                }
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateIndex(value, this)
            }
        }
    },{
        field: "showMore",
        title: "是否显示更多",
        editable: {
            url: '/client/index/saveColumnField',
            type: 'select',
            emptytext:'无',
            source: [
                { value: '0', text: "否" }
                ,{ value: '1', text: "是" } ],
            emptytext: '无',
            params: function(params) {
                let data = $('#tableListindex').bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                return {
                    params: {showMore:params.value},
                    _id: data[index]._id
                }
            },
            success: function(response, newValue) {
                if(response.error !== undefined) {
                    return response.error
                }
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateIndex(value, this)
            }
        }
    },{
        field: "operate",
        title: "操作",
        formatter: function (value, row, index) {
            let a = ['<a href="javascript:void(0)"  data-toggle="tooltip" onclick="operateEvents(\''+ row._id +'\',\'' + index  +'\',\'tableListindex\',\'\delIndex\',\'confirmIndexModal\')" title="删除栏目">',
                '<i class="fa fa-lg fa-trash"></i>',
                '</a>&nbsp;&nbsp;']
            if (row.status === 1) {
                return a.join('') + (['<a href="javascript:void(0)"  data-toggle="tooltip" onclick="operateEvents(\''+ row._id +'\',\'' + index  +'\',\'tableListindex\',\'\setIndexStatus\',\'confirmIndexModal\')" title="停用栏目">',
                    '<i class="fa fa-lg fa-lock"></i>',
                    '</a>']).join('')
            } else if (row.status === 0){
                return a.join('') + ([
                    '<a href="javascript:void(0)"  data-toggle="tooltip" onclick="operateEvents(\''+ row._id + '\',\'' + index  +'\',\'tableListindex\',\'setIndexStatus\',\'confirmIndexModal\')" title="启用栏目">',
                    '<i class="fa fa-lg fa-unlock"></i>',
                    '</a>']).join('')
            }
        }
    }]
}

function expandTable($detail, row, index) {
    $.ajax({
        url: '/data/getField/' + row._id,
        success:function (result) {
            if (result.error) {
                showMessage(result.error, '')
            } else {
                row.fields = result.data
                buildTable($detail.html("<div style='height: 40px;'><button id='btn_" + row._id + "' type='button' class='btn btn-success' onclick='addSubField(this)'>添加字段</button></div>" +
                    "<table id='sub_" + row._id + "' class='display table table-no-bordered table-hover'></table>").find('table'), row, index);
            }
        }
    })
}

function expandColumnTable($el, row, index) {
    columns = [ {
        field: 'childName',
        title: '子栏目标题',
        editable: {
            type:'text',
            url: '/client/child',
            emptytext: '请输入子栏目标题',
            params: function(params) {
                return setColumnChildParam(row, 'childs.$.childName', params.value, this)
            },
            success: function(response, newValue) {
                if (response.newId) {
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].childName = newValue
                    $('#sub_' + row._id).bootstrapTable('updateRow',{index: i, row: data[i]})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            error: function (response, newValue) {
                return response.error
            },
            validate: function (value) {
                value = $.trim(value);
                if (!value) {
                    return '标题不能为空'
                }
                let data = $('#sub_' + row._id).bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                for (let i = 0; i<data.length;i++){
                    if (data[i].childName === value && i !== index) {
                        return '标题不能重复'
                    }
                }
            }
        }
    },{
        field: "sort",
        title: "显示顺序",
        editable: {
            pk:'_id',
            type: 'number',
            url: '/client/child',
            placeholder:'请输入子栏目显示顺序',
            emptytext: "0",
            params: function(params) {
                return setColumnChildParam(row, 'childs.$.sort', Number(params.value), this)
            },
            success: function(response, newValue) {
                if (response.newId) {
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].sort = newValue
                    $('#sub_' + row._id).bootstrapTable('updateRow',{index: i, row: data[i]})
                    // row.childs.push({_id: response.newId, childName: newValue})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            validate: validateField
        }
    },{
        field: "childTable",
        title: "关联资料库",
        editable: {
            type: 'select2',
            source: row.tables,
            isMultiple:false,
            url: '/client/child',
            emptytext: '请选择资料库',
            params: function(params) {
                return setColumnChildParam(row, 'childs.$.childTable', params.value, this)
            },
            success: function(response, newValue) {
                if (response.newId) {
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].childTable = newValue
                    $('#sub_' + row._id).bootstrapTable('updateRow',{index: i, row: data[i]})
                    // row.childs.push({_id: response.newId, childTable: newValue})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            select2: {
                placeholder:'请选择关联资料库',
                allowClear: true,
                multiple:false,
                name: 'childTable',
                minimumInputLength: 1,
                width: '230px'
            },
            validate: function (value) {
                value = $.trim(value);
                if (!value) {
                    return '关联资料库不能为空'
                }
            }
        }
    }, {
        field: "operate",
        title: "操作",
        formatter: function (value, subRow, index) {
            let id = 'sub_' + row._id
            // console.log(row._id)
             // let data = $('#sub_' + row._id).bootstrapTable('getData')
            return ['<a href="javascript:void(0)"  onclick="deleteColumnChild(\''+ subRow._id +'\',\'' + index + '\',\'' + row._id + '\')" title="删除">',
                '<i class="fa fa-lg fa-trash-o"></i>',
                '</a>&nbsp;&nbsp;',
                '<a href="javascript:void(0)"  data-toggle="tooltip" data-tip-class="tooltip-primary" onclick="operateEvents(\''+ row._id + '\',\'' + index  +'\',\'' + id + '\',\'editChild\',\'columnChildModal\')" title="编辑子栏目">',
                    '<i class="fa fa-lg fa-edit"></i>',
                    '</a>'].join('')
        }
    }]
    var data = []
    if (row.childs.length > 0) {
        data = row.childs
    } else {
        data = [{
            columnId: '',
            index:0,
            _id:row._id + '_1',
            childName:'',
            childTable: ''
        }]
    }

    $el.bootstrapTable({
        striped: true,
        columns: columns,
        data: data,
        detailView: false,
        uniqueId: "_id",
    })
}

function expandIndexTable($el, row, index) {
    columns = [ {
        field: 'title',
        title: '按钮标题',
        editable: {
            type:'text',
            url: '/client/index/button',
            emptytext: '请输入按钮标题',
            params: function(params) {
                return setIndexButtonParam(row, 'buttons.$.title', params.value, this)
            },
            success: function(response, newValue) {
                if (response.newId) {
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].title = newValue
                    $('#sub_' + row._id).bootstrapTable('updateRow',{index: i, row: data[i]})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            error: function (response, newValue) {
                return response.error
            },
            validate: function (value) {
                value = $.trim(value);
                if (!value) {
                    return '标题不能为空'
                }
                let data = $('#sub_' + row._id).bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                for (let i = 0; i<data.length;i++){
                    if (data[i].title === value && i !== index) {
                        return '标题不能重复'
                    }
                }
            }
        }
    },{
        field: "handle",
        title: "绑定事件",
        editable: {
            pk:'_id',
            type: 'text',
            url: '/client/index/button',
            placeholder:'请输入按钮绑定事件',
            emptytext: "请输入按钮绑定事件",
            params: function(params) {
                return setIndexButtonParam(row, 'buttons.$.handle', params.value, this)
            },
            success: function(response, newValue) {
                if (response.newId) {
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].handle = newValue
                    $('#sub_' + row._id).bootstrapTable('updateRow',{index: i, row: data[i]})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            validate: validateField
        }
    },{
        field: "handleTable",
        title: "绑定资料库",
        editable: {
            url: '/client/index/button',
            type: "select",
            source: '/client/getRefTable',
            emptytext: '请选择按钮事件绑定的资料库',
            params: function(params) {
                return setIndexButtonParam(row, 'buttons.$.handleTable', params.value, this)
            },
            success: function(response, newValue) {
                if (response.newId) {
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].handleTable = newValue
                    $('#sub_' + row._id).bootstrapTable('updateRow',{index: i, row: data[i]})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            validate: function (value) {
                value = $.trim(value);
                if (!value) {
                    return '按钮事件绑定的资料库不能为空'
                }
                let data = $('#sub_' + row._id).bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                for (var i in data){
                    if (data[i].handleTable === value && Number(i) !== index) {
                        return '按钮事件绑定的资料库不能重复'
                    }
                }
            }
        }
    },{
        field: "handleTableField",
        title: "绑定资料库关联字段",
        class: "handleTableField",
        editable: {
            url: '/client/index/button',
            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
            emptytext: '资料库字段',
            params: function(params) {
                return setIndexButtonParam(row, 'buttons.$.handleTableField', params.value, this)
            },
            success: function(response, newValue) {
                if (response.newId) {
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].handleTableField = newValue
                    $('#sub_' + row._id).bootstrapTable('updateRow',{index: i, row: data[i]})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            validate: function (value) {
                value = $.trim(value)
                if (!value) {
                    return '绑定资料库关联字段不能为空'
                }
                return ''
            }
        }
    },{
        field: 'handleField',
        title: '绑定参数值',
        editable: {
            type: 'select',
            url: '/client/index/button',
            emptytext: '请选择按钮事件绑定参数值',
            source: [{ value: 'contentTitle', text: "主标题" },{ value: 'contentSubTitle', text: "副标题" },{ value: 'content', text: "内容" } ],
            params: function(params) {
                return setIndexButtonParam(row, 'buttons.$.handleField', params.value, this)
            },
            success: function(response, newValue) {
                if (response.newId) {
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].handleField = newValue
                    $('#sub_' + row._id).bootstrapTable('updateRow',{index: i, row: data[i]})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            validate: validateField
        }
    }, {
        field: "operate",
        title: "操作",
        formatter: function (value, subRow, index) {
            let id = 'sub_' + row._id
            return ['<a href="javascript:void(0)"  onclick="deleteIndexButton(\''+ subRow._id +'\',\'' + index + '\',\'' + row._id + '\')" title="删除">',
                '<i class="fa fa-lg fa-trash-o"></i>',
                '</a>'].join('')
        }
    }]
    var data = []
    if (row.buttons.length > 0) {
        data = row.buttons
    } else {
        data = [{
            index:0,
            _id:row._id + '_1',
            title:'',
            handle: '',
            handleTable:'',
            handleField:'',
            handleTableField:''
        }]
    }

    $el.bootstrapTable({
        striped: true,
        columns: columns,
        data: data,
        detailView: false,
        uniqueId: "_id",
        onEditableSave:function (aa,bb,cc,$el) {
            if (aa === 'handleTable') {
                $el.closest('tr').find('td.handleTableField .editable').editable('option','source', '/client/getRefFields?tablename=' + bb[aa])
                $el.closest('tr').find('td.handleTableField .editable').editable('option','value', '')

                bb.handleTableField = ''
            }
        }
    })

    data.forEach( function( o, index ) {
        if (o.handleTable !== '') {
            $('#' + o._id).find('td.handleTableField .editable').editable('option', 'source', '/client/getRefFields?tablename=' + o.handleTable)
            $('#' + o._id).find('td.handleTableField .editable').editable('option', 'value', o.handleTableField)
        }
    })
}

function buildTable($el, row, index) {
    columns = [{
        checkbox: true
    },
        {
            field: 'title',
            title: '显示标题',
            editable: {
                type: 'text',
                url: '/data/saveField',
                emptytext:'请输入字段显示标题',          //编辑框的标题
                placeholder:'请输入字段显示标题',
                disabled: false,
                params: function(params) {
                    return setParam(row, 'title', params.value, $(this))
                },
                success: function(response, newValue) {
                    updateField(response, newValue, 'title', row, $(this))
                },
                validate: validateField
            }
        },
        {
            field: 'needShow',
            title: '是否可见',
            editable: {
                type: 'select',
                url: '/data/saveField',
                source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                disabled: true,
                params: function(params) {
                    return setParam(row, 'needShow', Number(params.value), $(this))
                },
                success: function(response, newValue) {
                    updateField(response, newValue, 'needShow', row, $(this))
                },
                validate: validateField
            }
        },
        {
            field: 'viewSort',
            title: '显示顺序',
            editable: {
                url: '/data/saveField',
                type: "number",              //编辑框的类型。支持text|textarea|select|date|checklist等
                emptytext:'请输入显示顺序',          //编辑框的标题
                placeholder:'请输入显示顺序',
                disabled: true,
                params: function(params) {
                    return setParam(row, 'viewSort', params.value, $(this))
                },
                success: function(response, newValue) {
                    updateField(response, newValue, 'viewSort', row, $(this))
                }
            }
        },
        {
            field: 'needSort',
            title: '需要排序',
            editable: {
                url: '/data/saveField',
                type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
                source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                title: "请选择",           //编辑框的标题
                disabled: true,           //是否禁用编辑
                validate: validateField,
                params: function(params) {
                    return setParam(row, 'needSort', Number(params.value), $(this))
                },
                success: function(response, newValue) {
                    updateField(response, newValue, 'needSort', row, $(this))
                }
            }
        },
        {
            field: 'needQuery',
            title: '需要查询',
            editable : {
                url: '/data/saveField',
                type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
                source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                title: "请选择",           //编辑框的标题
                disabled: true,             //是否禁用编辑
                validate: validateField,
                params: function(params) {
                    return setParam(row, 'needQuery', Number(params.value), $(this))
                },
                success: function(response, newValue) {
                    updateField(response, newValue, 'needQuery', row, $(this))
                }
            }
        },{
            field: 'hasFile',
            title:'关联文件',
            editable: {
                url: '/data/saveField',
                type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
                source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                title: "请选择",           //编辑框的标题
                disabled: true,           //是否禁用编辑
                validate: validateField,
                params: function(params) {
                    return setParam(row, 'hasFile', Number(params.value), $(this))
                },
                success: function(response, newValue) {
                    updateField(response, newValue, 'hasFile', row, $(this))
                }
            }
        },{
            field: 'refTable',
            title: '关联表名',
            class: 'refTable',
            editable: {
                url: '/data/saveField',
                type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
                source: '/data/getRefTable?tableId=' + row._id.toString(),          //编辑框的标题
                disabled: true,           //是否禁用编辑
                emptytext: '无',
                validate: validateField,
                params: function(params) {
                    return setParam(row, 'refTable', params.value, $(this))
                },
                success: function(response, newValue) {
                    updateField(response, newValue, 'refTable', row, $(this))
                }
            }
        },{
            field: 'refField',
            title: '关联表字段',
            class: 'refField',
            editable: {
                url: '/data/saveField',
                type: "select",
                disabled: true,           //是否禁用编辑
                emptytext: '无',
                validate: validateField,
                params: function(params) {
                    return setParam(row, 'refField', params.value, $(this))
                },
                success: function(response, newValue) {
                    updateField(response, newValue, 'refField', row, $(this))
                }
            }
        },{
            title:'操作',
            formatter: function (value, row, index) {
                return [
                    '<a href="javascript:void(0)"  onclick="deleteField(\''+ index +'\',\'' + row.tableId + '\')" title="删除">',
                    '<i class="fa fa-lg fa-trash-o"></i>',
                    '</a>'
                ].join('')
            }
        }
    ]

    var data = []
    if (row.fields.length > 0) {
        row.fields.forEach(function (e,index) {
            data.push({
                title: e.title,
                viewSort:e.viewSort || '',
                needShow:Number(e.needShow),
                needSort: Number(e.needSort),
                needQuery: Number(e.needQuery),
                hasFile:Number(e.hasFile),
                canEmpty:Number(e.canEmpty),
                canDuplicate:Number(e.canDuplicate),
                refDir:Number(e.refDir),
                needGroup:Number(e.needGroup),
                refTable:e.refTable || '',
                refField:e.refField || '',
                tableId: e.tableId,
                _id:e._id.toString()
            })
        })
    } else {
        data = [{
            title: '',
            viewSort:'1',
            needShow:1,
            needSort: 0,
            needQuery: 0,
            hasFile:0,
            canEmpty:1,
            canDuplicate:1,
            needGroup:0,
            refDir:0,
            refTable:'',
            refField:'',
            tableId: row._id,
            _id:row._id + '_1'
        }]
    }

    $el.bootstrapTable({
        columns: columns,
        striped: true,
        data: data,
        detailView: false,
        uniqueId: "_id",
    })
    if (row.fields.length > 0) {
        $el.find('tr:not(:first)').find('td:not(.refField)').find('.editable').editable('option', 'disabled', false)
    }
    var tmp = $el.find('tr:not(:first)').find('td.refField')
    for (var i = 0; i < tmp.length; i++) {
        if(data[i].refTable !== '') {
            $el.find('tr:not(:first)').find('td.refField').eq(i).find('.editable').editable('option', 'disabled', false)
            $el.find('tr:not(:first)').find('td.refField').eq(i).find('.editable').editable('option', 'source', '/data/getRefField?tableName='+data[i].refTable)
            $el.find('tr:not(:first)').find('td.refField').eq(i).find('.editable').editable('option','value',data[i].refField)
            $el.find('tr:not(:first)').find('td.refTable').eq(i).find('.editable').editable('option', 'value', data[i].refTable)
        } else {
            $el.find('tr:not(:first)').find('td.refField').eq(i).find('.editable').editable('option', 'disabled', true)
            $el.find('tr:not(:first)').find('td.refField').eq(i).find('.editable').editable('option','value','')
        }
    }
}

function deleteColumnChild(obj,index, tableId) {
    var data = $('#sub_'+tableId).bootstrapTable('getData')
    // var obj = data[index]._id
    $('#sub_' + tableId).bootstrapTable('removeByUniqueId',obj)
    if (obj && obj.indexOf('_') < 0) {
        $.ajax({
            url: '/client/child/' + obj,
            type: 'delete',
            success:function (result) {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    showMessage('子栏目删除成功', 'success')
                }
            }
        })
    }

    if(data.length === 0) {
        $('#sub_' + tableId).hide()
    }
}

function deleteIndexButton(obj,index, tableId) {
    var data = $('#sub_'+tableId).bootstrapTable('getData')
    // var obj = data[index]._id
    $('#sub_' + tableId).bootstrapTable('removeByUniqueId',obj)
    if (obj && obj.indexOf('_') < 0) {
        $.ajax({
            url: '/client/index/button/' + obj,
            type: 'delete',
            success:function (result) {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    showMessage('子栏目删除成功', 'success')
                }
            }
        })
    }

    data.forEach( function( o, index ) {
        if (o.handleTable !== '') {
            $('#' + o._id).find('td.handleTableField').find('.editable').editable('option', 'source', '/data/getRefField?tableName='+o.handleTable)
            $('#' + o._id).find('td.handleTableField').find('.editable').editable('option', 'value', o.handleTableField)
        }
    })

    if(data.length === 0) {
        $('#sub_' + tableId).hide()
    }
}


function deleteField(index, tableId) {
    var data = $('#sub_'+tableId).bootstrapTable('getData')
    var obj = data[index]._id
    $('#sub_' + tableId).bootstrapTable('removeByUniqueId',obj)
    if (obj && obj.indexOf('_') < 0) {
        $.ajax({
            url: '/data/field/' + obj,
            type: 'delete',
            success:function (result) {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    showMessage('字段删除成功', 'success')
                }
            }
        })
    }

    data.forEach( function( o, index ) {
        if (o._id.indexOf('_') < 0 || o.title !== '') {
            $('#' + o._id).find('td:not([class=refField])').find('.editable').editable('option', 'disabled', false)
        }
        if (o.refTable !== '') {
            $('#' + o._id).find('td.refField').find('.editable').editable('option', 'disabled', false)
            $('#' + o._id).find('td.refField').find('.editable').editable('option', 'source', '/data/getRefField?tableName='+o.refTable)
            $('#' + o._id).find('td.refField').find('.editable').editable('option', 'value', o.refField)
        } else {
            $('#' + o._id).find('td.refField').find('.editable').editable('option', 'disabled', true)
            $('#' + o._id).find('td.refField').find('.editable').editable('option', 'value', '')
        }
    })

    if(data.length === 0) {
        $('#sub_' + tableId).hide()
    }
}

function  setParam(row, field,value, obj) {
    var data = row.fields
    var index = obj.parents('tr').data('index')
    var tmp = data[index]
    var pk
    try {
        pk = tmp._id
    } catch (e) {

    }

    var param = {
        data: {},
        fieldId: pk,
        tableId: row._id.toString()
    }
    param.data[field] = value
    if (field === 'title' && pk === undefined) {
        param.data['viewSort'] = (index + 1)
    }
    return param
}

function updateField(result, newValue, field, row, obj) {
    if(result.error !== undefined) {
        return result.error
    }
    var index = obj.closest('tr').data('index')
    var data = $('#sub_' + row._id.toString()).bootstrapTable('getData')
    if (result.data !== undefined) {
        row.fields.push(result.data)
        data[index]._id = result.data._id.toString()
    }
    obj.closest('tr').find('td:not([class=refField])').find('.editable-disabled').editable('option', 'disabled', false)
    obj.editable('setValue', newValue)
    var tmp = data[index][field]
    data[index][field] = newValue
    if (field === 'refTable') {
        if (newValue !== '') {
            obj.closest('tr').find('td.refField').find('.editable').editable('option', 'disabled', false)
            if (newValue !== tmp) {
                data[index].refField = ''
                obj.closest('tr').find('td.refField').find('.editable').editable('option', 'source', '/data/getRefField?tableName='+newValue)
                obj.closest('tr').find('td.refField').find('.editable').editable('option', 'value', '')
            } else {
                obj.closest('tr').find('td.refField').find('.editable').editable('option', 'value', data[index].refField)
            }
            obj.closest('td').next().find('.editable').editable('show')
        } else {
            data[index].refField = ''
            obj.closest('tr').find('td.refField').find('.editable').editable('option', 'disabled', true)
            obj.closest('tr').find('td.refField').find('.editable').editable('option', 'value', '')
        }
    } else {
        obj.closest('td').next().find('.editable').editable('show')
    }
}

function validateField(value) {
    value = $.trim(value);
    if (!value) {
        return '值不能为空';
    }
    return ''
}

function validateIndex(value,obj) {
    value = $.trim(value);
    if (!value) {
        return '值不能为空';
    }
    let data = $('#tableListindex').bootstrapTable('getData')
    let row = $(obj).parents('tr').data('index')
    if ((data[row].name === '' || data[row].name === undefined) && data[row]._id.indexOf('index_') >= 0) {
        return '名称不能为空'
    }
    let v1 = data[row].contentSubTitle
    let v2 = data[row].contentTitle
    let v3 = data[row].content
    if (obj.dataset.name === 'contentSubTitle') {
        if (v2 === value || v3 === value) {
            return '字段不能重复'
        }
    } else if (obj.dataset.name === 'contentTitle') {
        if (v1 === value || v3 === value) {
            return '字段不能重复'
        }
    } else if (obj.dataset.name === 'content') {
        if (v2 === value || v1 === value) {
            return '字段不能重复'
        }
    }
    return ''
}

function validateTemplateField(value, id, obj) {
    value = $.trim(value);
    if (!value) {
        return '值不能为空';
    }

    let data = $('#sub_' + id).bootstrapTable('getData')
    let index = $(obj).parents('tr').data('index')
    if (!data[index].fieldId || data[index].fieldId === '' || data[index].fieldId === undefined) {
        return '请先选择字段'
    }
    return ''
}

function addTagField () {
    var length = $('#tableListtag').bootstrapTable('getData').length
    var new_id = 'tag_' + (length + 1)
    $('#tableListtag').bootstrapTable('insertRow', {
        index: length,
        row: {
            name: '',
            icon:'',
            status: 1,
            _id: new_id
        }
    })
}

function addIndexField () {

    var datas = $('#tableListindex').bootstrapTable('getData')
    var new_id = 'index_' + (length + 1)


    let max = 0
    if (datas.length > 0) {
        datas.sort(function (a,b) {
            return Number(a.sort) - Number(b.sort)
        })
        max = Number(datas[datas.length-1].sort) + 1
    }

    $('#tableListindex').bootstrapTable('insertRow', {
        index: length,
        row: {
            name: '',
            sort:max,
            refTable: '',
            showMode:'',
            showButton:0,
            contentTitle:'',
            contentSubTitle:'',
            content:'',
            showMore:0,
            _id: new_id
        }
    })

    $('#tableListindex').bootstrapTable('getData').forEach( function( o, index ) {
        if (o.refTable !== '') {
            $('#' + o._id).find('td.contentSubTitle .editable').editable('option', 'source', '/client/getRefFields?tablename=' + o.refTable)
            $('#' + o._id).find('td.contentSubTitle .editable').editable('option', 'value', o.contentSubTitle)

            $('#' + o._id).find('td.contentTitle .editable').editable('option', 'source', '/client/getRefFields?tablename=' + o.refTable)
            $('#' + o._id).find('td.contentTitle .editable').editable('option', 'value', o.contentTitle)
            $('#' + o._id).find('td.content .editable').editable('option', 'source', '/client/getRefFields?tablename=' + o.refTable)
            $('#' + o._id).find('td.content .editable').editable('option', 'value', o.content)
        }
    })
}

function addColumnChild (obj) {
    var id = obj.id.replace('btn_', 'sub_')
    $('#' + id).show()
    var length = $('#' + id).bootstrapTable('getData').length
    var new_id = id.replace('sub_', '') + '_' + (length + 1)

    $('#' + id).bootstrapTable('insertRow', {
        index: length,
        row: {
            _id: new_id,
            childName: '',
            childTable:''
        }
    })
}

function addIndexButton (obj) {
    var id = obj.id.replace('btn_', 'sub_')
    $('#' + id).show()
    var length = $('#' + id).bootstrapTable('getData').length
    var new_id = id.replace('sub_', '') + '_' + (length + 1)

    $('#' + id).bootstrapTable('insertRow', {
        index: length,
        row: {
            _id: new_id,
            title:'',
            handle: '',
            handleTable:'',
            handleField:'',
            handleTableField:''
        }
    })

    $('#' + id).bootstrapTable('getData').forEach( function( o, index ) {
        if (o.handleTable !== '') {
            $('#' + o._id).find('td.handleTableField .editable').editable('option', 'source', '/client/getRefFields?tablename=' + o.handleTable)
            $('#' + o._id).find('td.handleTableField .editable').editable('option', 'value', o.handleTableField)
        }
    })
}

function addSubField (obj) {
    var id = obj.id.replace('btn_', 'sub_')
    $('#' + id).show()
    var length = $('#' + id).bootstrapTable('getData').length
    var new_id = id.replace('sub_', '') + '_' + (length + 1)
    $('#' + id).bootstrapTable('insertRow', {
        index: length,
        row: {
            title: '',
            viewSort:(length + 1) || 1,
            needShow:1,
            needSort: 0,
            needQuery: 0,
            hasFile:0,
            refDir:0,
            refTable:'',
            refField:'',
            canEmpty:1,
            canDuplicate:1,
            needGroup:0,
            _id: new_id,
            tableId: id.replace('sub_', '')
        }
    })

    $('#' + id).bootstrapTable('getData').forEach( function( o, index ) {
        if (o._id.indexOf('_') < 0 || o.title !== '') {
            $('#' + o._id).find('td:not([class=refField])').find('.editable').editable('option', 'disabled', false)
        }
        if (o.refTable !== '') {
            $('#' + o._id).find('td.refField').find('.editable').editable('option', 'disabled', false)
            $('#' + o._id).find('td.refField').find('.editable').editable('option', 'source', '/data/getRefField?tableName='+o.refTable)
            $('#' + o._id).find('td.refField').find('.editable').editable('option', 'value', o.refField)
        }
        if (index === length) {
            var oid = o._id
            setTimeout(function() {
                $('#' + oid).find('.editable').first().editable('show')
            }, 200)
        }
    })
}

function expandTemplate($detail, row, index) {
    if (row.fields.length === 0) {
        if (row.type === 'marc') {
            buildMarcTable($detail.html("<div style='height: 40px;'><button id='btn_" + row._id + "' type='button' class='btn btn-success' onclick='addMarcField(this)'>添加字段</button></div>" +
                "<table id='sub_" + row._id + "' class='display table table-no-bordered table-hover'></table>").find('table'), row, index);
        } else if (row.type === 'excel') {
            buildExcelTable($detail.html("<div style='height: 40px;'><button id='btn_" + row._id + "' type='button' class='btn btn-success' onclick='addExcelField(this)'>添加字段</button></div>" +
                "<table id='sub_" + row._id + "' class='display table table-no-bordered table-hover'></table>").find('table'), row, index);
        }
    } else {
        $.ajax({
            url: '/template/fields/' + row._id,
            success:function (result) {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    row.fields = result
                    if (row.type === 'marc') {
                        buildMarcTable($detail.html("<div style='height: 40px;'><button id='btn_" + row._id + "' type='button' class='btn btn-success' onclick='addMarcField(this)'>添加字段</button></div>" +
                            "<table id='sub_" + row._id + "' class='display table table-no-bordered table-hover'></table>").find('table'), row, index);
                    } else if (row.type === 'excel') {
                        buildExcelTable($detail.html("<div style='height: 40px;'><button id='btn_" + row._id + "' type='button' class='btn btn-success' onclick='addExcelField(this)'>添加字段</button></div>" +
                            "<table id='sub_" + row._id + "' class='display table table-no-bordered table-hover'></table>").find('table'), row, index);
                    }
                }
            }
        })
    }
}

function buildMarcTable($el, row, index) {
    columns = [ {
        field: 'fieldId',
        title: '字段标题',
        editable: {
            type:'select',
            source: row.infos,
            url: '/template/field',
            params: function(params) {
                return setTemplateParam(row, 'fields.$.fieldId', params.value, this)
            },
            success: function(response, newValue) {
                if (response.newId) {
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].fieldId = newValue
                    $('#sub_' + row._id).bootstrapTable('updateRow',{index: i, row: data[i]})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            error: function (response, newValue) {
                return response.error
            },
            validate: function (value) {
                value = $.trim(value);
                if (!value) {
                    return '标题不能为空'
                }
                let data = $('#sub_' + row._id).bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                for (let i = 0; i<data.length;i++){
                    if (data[i].fieldId === value && i !== index) {
                        return '标题不能重复'
                    }
                }
            }
        }
    },{
        field: 'canDuplicate',
        title: '可重复',
        editable : {
            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
            url: '/template/field',
            params: function(params) {
                return setTemplateParam(row, 'fields.$.canDuplicate', Number(params.value), this)
            },
            success: function(response, newValue) {
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateTemplateField(value, row._id, this)
            }
        }
    },{
        field: "marcMark",
        title: "文件对应marc标识符",
        editable: {
            type: 'select2',
            source: row.typeFields,
            isMultiple:true,
            url: '/template/field',
            params: function(params) {
                return setTemplateParam(row, 'fields.$.marcMark', params.value, this)
            },
            success: function(response, newValue) {
                $(this).editable('setValue', newValue)
            },
            select2: {
                placeholder:'请选择marc标识符',
                allowClear: true,
                multiple: true,
                name: 'marcMark',
                minimumInputLength: 1,
                width: '230px'
            },
            validate: function (value) {
                return validateTemplateField(value, row._id, this)
            }
        }
    },{
        field: 'markCanDuplicate',
        title: '标识符重复匹配',
        editable : {
            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
            url: '/template/field',
            params: function(params) {
                return setTemplateParam(row, 'fields.$.markCanDuplicate', Number(params.value), this)
            },
            success: function(response, newValue) {
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateTemplateField(value, row._id, this)
            }
        }
    }, {
        field: "operate",
        title: "删除",
        formatter: function (value, row, index) {
            let a = ['<a class="delTable" href="javascript:void(0)"  onclick="deleteTemplateField(\''+ row._id +'\',\'' + index + '\',\'' + row.templateId + '\')" title="删除">',
                '<i class="fa fa-lg fa-trash-o"></i>',
                '</a>']
                // console.log(a.join(''))
            return a.join('')
        }
    }]
    var data = []
    if (row.fields.length > 0) {
        data = row.fields
    } else {
        data = [{
            fieldId: '',
            marcMark:'',
            title:'',
            _id:row._id + '_' + 1,
            canDuplicate: 1,
            markCanDuplicate: 0
        }]
    }

    $el.bootstrapTable({
        striped: true,
        columns: columns,
        data: data,
        detailView: false,
        uniqueId: "_id",
    })
}

function buildExcelTable($el, row, index) {
    columns = [ {
        field: 'fieldId',
        title: '字段标题',
        editable: {
            type:'select',
            source: row.infos,
            url: '/template/field',
            params: function(params) {
                return setTemplateParam(row, 'fields.$.fieldId', params.value, this)
            },
            success: function(response, newValue) {
                if (response.newId) {
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let i = $(this).parents('tr').data('index')
                    data[i]._id = response.newId
                    data[i].fieldId = newValue
                    $('#sub_' + row._id).bootstrapTable('updateRow',{index: i, row: data[i]})
                } else {
                    $(this).editable('setValue', newValue)
                }
            },
            error: function (response, newValue) {
              return response.error
            },
            validate: function (value) {
                value = $.trim(value);
                if (!value) {
                    return '标题不能为空'
                }
                let data = $('#sub_' + row._id).bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                for (let i = 0; i<data.length;i++){
                    if (data[i].fieldId === value && i !== index) {
                        return '标题不能重复'
                    }
                }
            }
        }
    },{
        field: 'canDuplicate',
        title: '可重复',
        editable : {
            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
            url: '/template/field',
            params: function(params) {
                return setTemplateParam(row, 'fields.$.canDuplicate', Number(params.value), this)
            },
            success: function(response, newValue) {
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                return validateTemplateField(value, row._id, this)
            }
        }
    },{
        field: 'canEmpty',
        title: '可为空值',
        editable : {
            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
            url: '/template/field',              //是否禁用编辑
            validate: function (value) {
                return validateTemplateField(value, row._id, this)
            },
            params: function(params) {
                return setTemplateParam(row, 'fields.$.canEmpty', Number(params.value), this)
            },
            success: function(response, newValue) {
                $(this).editable('setValue', newValue)
            },
        }
    },{
        field: 'refDir',
        title:'文件目录',
        editable: {
            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
            url: '/template/field',              //是否禁用编辑
            validate: function (value) {
                return validateTemplateField(value, row._id, this)
            },
            params: function(params) {
                return setTemplateParam(row, 'fields.$.refDir', Number(params.value), this)
            },
            success: function(response, newValue) {
                $(this).editable('setValue', newValue)
            }
        }
    },{
        field: 'needGroup',
        title: '需要分组',
        editable : {
            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
            url: '/template/field',              //是否禁用编辑
            validate: function (value) {
                return validateTemplateField(value, row._id, this)
            },
            params: function(params) {
                return setTemplateParam(row, 'fields.$.needGroup', Number(params.value), this)
            },
            success: function(response, newValue) {
                $(this).editable('setValue', newValue)
            }
        }
    },{
        field: "index",
        title: "文件对应列数",
        editable: {
            type: 'number',
            emptytext:'请输入列数,默认从0开始',
            url: '/template/field',
            params: function(params) {
                return setTemplateParam(row, 'fields.$.index', params.value, this)
            },
            success: function(response, newValue) {
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                value = $.trim(value);

                let data = $('#sub_' + row._id).bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')
                if (!data[index].fieldId || data[index].fieldId === '' || data[index].fieldId === undefined) {
                    return '请先选择字段'
                }

                if (!value) {
                    return '对应列数不能为空'
                } else if(/^[0-9]*[0-9][0-9]*$/.test(value)){
                    let data = $('#sub_' + row._id).bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    for (let i = 0; i < data.length;i++){
                        if (Number(data[i].index) === Number(value) && i !== index) {
                            return '列数不能重复'
                        }
                    }
                } else {
                    return '列数为从0开始的正整数'
                }

                return '';
            }
        }
    },{
        field: "filePath",
        class: 'filePath',
        title: "字段对应文件位置",
        editable: {
            type: 'text',
            emptytext:'无',
            placeholder:'请输入文件位置',
            url: '/template/field',
            params: function(params) {
                return setTemplateParam(row, 'fields.$.filePath', params.value, this)
            },
            success: function(response, newValue) {
                $(this).editable('setValue', newValue)
            },
            validate: function (value) {
                let data = $('#sub_' + row._id).bootstrapTable('getData')
                let index = $(this).parents('tr').data('index')

                if (!data[index].fieldId || data[index].fieldId === '' || data[index].fieldId === undefined) {
                    return '请先选择字段'
                }

                if(data[index].hasFile) {
                    return value === '' ? '文件位置不能为空' : ''
                }
                return ''
            }
        }
    }, {
        field: "operate",
        title: "删除",
        formatter: function (value, row, index) {
            let a = ['<a class="delTable" href="javascript:void(0)"  onclick="deleteTemplateField(\''+ row._id +'\',\'' + index + '\',\'' + row.templateId + '\')" title="删除">',
                '<i class="fa fa-lg fa-trash-o"></i>',
                '</a>']
            return a.join('')
        }
    }]
    var data = []
    if (row.fields.length > 0) {
        data = row.fields
    } else {
        data = [{
            fieldId: '',
            index:0,
            _id:row._id + '_1',
            title:'',
            filePath : '',
            needGroup: 0,
            canDuplicate: 1,
            canEmpty: 1,
            refDir:0
        }]
    }

    $el.bootstrapTable({
        striped: true,
        columns: columns,
        data: data,
        detailView: false,
        uniqueId: "_id",
    })
}

function setRefTableParam(row, field, value, obj){
    var data =  $('#sub_' + row._id).bootstrapTable('getData')
    var index = $(obj).parents('tr').data('index')

    var param = {
        data: {},
        _id: data[index]._id,
        cId: row._id,
        childs: {}
    }

    var tmp = {}

    if (data[index]._id.indexOf('_') > 0) {
        var str = field.replace('childs.$.','')
        tmp[str] = value
        param.childs = tmp
    } else {
        param.data[field] = value
    }
    return param
}

function setColumnChildParam(row, field, value, obj){
    var data =  $('#sub_' + row._id).bootstrapTable('getData')
    var index = $(obj).parents('tr').data('index')

    var param = {
        data: {},
        _id: data[index]._id,
        cId: row._id,
        childs: {}
    }

    var tmp = {}

    if (data[index]._id.indexOf('_') > 0) {
        var str = field.replace('childs.$.','')
        tmp[str] = value
        param.childs = tmp
    } else {
        param.data[field] = value
    }
    return param
}

function setIndexButtonParam(row, field, value, obj){
    var data =  $('#sub_' + row._id).bootstrapTable('getData')
    var index = $(obj).parents('tr').data('index')

    var param = {
        data: {},
        _id: data[index]._id,
        cId: row._id,
        buttons: {}
    }

    var tmp = {}

    if (data[index]._id.indexOf('_') > 0) {
        var str = field.replace('buttons.$.','')
        tmp[str] = value
        param.buttons = tmp
    } else {
        param.data[field] = value
    }
    return param
}

function  setTemplateParam(row, field,value, obj) {

    var data =  $('#sub_' + row._id).bootstrapTable('getData')
    var index = $(obj).parents('tr').data('index')

    var param = {
        data: {},
        subId: data[index]._id,
        tableId: row.tableId,
        templateId: row._id,
    }

    if (data[index]._id.indexOf('_') > 0) {
        param.field = field.replace('fields.$.','')
        param.value = value
    } else {
        param.data[field] = value
    }
    return param
}

function deleteTemplateField (id, index, templateId) {
    $('#sub_' + templateId).bootstrapTable('removeByUniqueId',id)
    $.ajax({
        url: '/template/field/' + id + '?templateId=' + templateId,
        type: 'delete',
        success:function (result) {
            if (result.error) {
                showMessage(result.error, '')
            } else {
                showMessage('字段删除成功', 'success')
            }
        }
    })
}

function addExcelField(obj){
    var id = obj.id.replace('btn_', 'sub_')
    var pid = obj.id.replace('btn_','')
    var p_datas = $('#tableListtemplate').bootstrapTable('getData')
    let index = $('#'+pid).data('index')
    let datas = $('#' + id).bootstrapTable('getData')
    let length = datas.length
    if (length === p_datas[index].infos.length) {
        showMessage('无可用字段可添加','')
        return
    }
    let max = 0
    if (length > 0) {
        datas.sort(function (a,b) {
            return Number(a.index) - Number(b.index)
        })
        max = Number(datas[length-1].index) + 1
    }
    $('#' + id).bootstrapTable('insertRow', {
        index: length + 1,
        row: {
            fieldId: '',
            index:max,
            _id:id + '_' + (length + 1),
            title:'',
            filePath : '',
            needGroup: 0,
            canDuplicate: 1,
            canEmpty: 1,
            refDir:0
        }
    })
    setTimeout(function () {
        $('#' + id + '_' + (length + 1)).children().first().find('.editable').editable('show')
    }, 500)
}

function addMarcField(obj){
    var id = obj.id.replace('btn_', 'sub_')
    let datas = $('#' + id).bootstrapTable('getData')
    let length = datas.length

    var pid = obj.id.replace('btn_','')
    var p_datas = $('#tableListtemplate').bootstrapTable('getData')
    let index = $('#'+pid).data('index')
    if (length === p_datas[index].infos.length) {
        showMessage('无可用字段可添加','')
        return
    }

    $('#' + id).bootstrapTable('insertRow', {
        index: length + 1,
        row: {
            fieldId: '',
            marcMark:'',
            title:'',
            _id:id + '_' + (length + 1),
            canDuplicate: 1,
            markCanDuplicate: 0
        }
    })
    setTimeout(function () {
        $('#' + id + '_' + (length + 1)).children().first().find('.editable').editable('show')
    }, 500)
}
