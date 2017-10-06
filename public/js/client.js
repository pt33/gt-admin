$(document).ready(function () {
    var refTableData = []
    var images = []
    var param = {}

    columnConfirmClick = ()=>{
        let type = $('#columnStatus').val()
        if (type === 'lock') {
            url = '/client/columnStatus/' + $('#columnId').val() + '/0'
            msg = '栏目停用成功'
        } else if (type === 'unlock') {
            url = '/client/columnStatus/' + $('#columnId').val() + '/1'
            msg = '栏目启用成功'
        }
        $.ajax({
            url: url,
            success:function (result) {
                if (result.error) {
                    showMessage(result.error,'')
                } else if (result.statusCode === 200){
                    showMessage(msg,'success')
                    setTimeout(function() {
                        $("#columnFields").bootstrapTable('refresh')
                        $('#confirmColumnModal').modal('hide')
                    }, 500)
                }
            }
        })
    }

    indexConfirmClick = ()=>{
        let type = $('#indexStatus').val()
        if (type === 'lock') {
            url = '/client/indexStatus/' + $('#indexId').val() + '/0'
            msg = '栏目停用成功'
        } else if (type === 'unlock') {
            url = '/client/indexStatus/' + $('#indexId').val() + '/1'
            msg = '栏目启用成功'
        } else if (type === 'delete') {
            url = '/client/delIndex/' + $('#indexId').val()
            msg = '栏目删除成功'
        }

        $.ajax({
            url: url,
            success:function (result) {
                if (result.error) {
                    showMessage(result.error,'')
                } else if (result.statusCode === 200){
                    showMessage(msg,'success')
                    setTimeout(function() {
                        $('#confirmIndexModal').modal('hide')
                        initIndexs()
                    }, 500)
                }
            }
        })
    }

    changeChildView = (id,name)=> {
        if (name === 'showDetail') {
            if (Number(id.replace(name, '')) === 0) {
                $('#childSubView').hide()
                clearChildSubView()
                images = []
            } else {
                $('#childSubView').show()
                initChildSubView({})
                images = []
            }
        } else if (name === 'hasRef') {
            if (Number(id.replace(name, '')) === 0) {
                $('#childRefTable').hide()
            } else {
                $('#childRefTable').show()
            }
        } else if (name === 'showMode') {
            $('#childSubView').hide()
            clearChildSubView()
            images = []
            if (id.replace(name, '') === 'group') {
                $('#childGroupTable').show()
                if($('#childSearchTable').css('display') === 'block') {
                    $('#childGroupTable').removeClass('col-sm-12')
                    $('#childGroupTable').addClass('col-sm-6')
                    $('#childSearchTable').removeClass('col-sm-12')
                    $('#childSearchTable').addClass('col-sm-6')
                    $('#childSearchTable').bootstrapTable('refresh')
                    $('#childGroupTable').bootstrapTable('refresh')
                } else {
                    $('#childGroupTable').removeClass('col-sm-6')
                    $('#childGroupTable').addClass('col-sm-12')
                    $('#childGroupTable').bootstrapTable('refresh')
                }
            } else if (id.replace(name, '') === 'page') {
                $('#childSubView').show()
                initChildSubView({})
                images = []
                $('#childGroupTable').hide()
                if($('#childSearchTable').css('display') === 'block') {
                    $('#childSearchTable').removeClass('col-sm-6')
                    $('#childSearchTable').addClass('col-sm-12')
                    $('#childSearchTable').bootstrapTable('refresh')
                }
            } else {
                $('#childGroupTable').hide()
                if($('#childSearchTable').css('display') === 'block') {
                    $('#childSearchTable').removeClass('col-sm-6')
                    $('#childSearchTable').addClass('col-sm-12')
                    $('#childSearchTable').bootstrapTable('refresh')
                }
            }
        } else if (name === 'showSearch') {
            if (Number(id.replace(name, '')) === 0) {
                $('#childSearchTable').hide()
                if($('#childGroupTable').css('display') === 'block') {
                    $('#childGroupTable').removeClass('col-sm-6')
                    $('#childGroupTable').addClass('col-sm-12')
                    $('#childGroupTable').bootstrapTable('refresh')
                }
            } else {
                $('#childSearchTable').show()
                if($('#childGroupTable').css('display') === 'block') {
                    $('#childGroupTable').removeClass('col-sm-12')
                    $('#childGroupTable').addClass('col-sm-6')
                    $('#childSearchTable').removeClass('col-sm-12')
                    $('#childSearchTable').addClass('col-sm-6')
                    $('#childSearchTable').bootstrapTable('refresh')
                    $('#childGroupTable').bootstrapTable('refresh')
                } else {
                    $('#childSearchTable').removeClass('col-sm-6')
                    $('#childSearchTable').addClass('col-sm-12')
                    $('#childSearchTable').bootstrapTable('refresh')
                }
            }
        } else if (name === 'refFile') {
            if (Number(id.replace(name, '')) === 0) {
                $('#fileRefDiv').hide()
            } else {
                $('#fileRefDiv').show()
            }
        } else if (name === 'refFile') {
            if (Number(id.replace(name, '')) === 0) {
                $('#fileRefDiv').hide()
            } else {
                $('#fileRefDiv').show()
            }
        }
    }

    clearChildSubView = () => {
        $('#childSubView').find('input[type=radio]').each(function (index, e) {
            if (e.checked) {
                $(e).iCheck('uncheck')
            }
        })
    }

    initChildSubView = (data) => {
        $('#childSubView').find('input[type=radio]').each(function (index, e) {
            var key = data[e.name]
            $('#'+ e.name + Number(key)).iCheck('check')
        })
        if ($('#refFile1').checked) {
            $('#fileRefDiv').show()
        } else {
            $('#fileRefDiv').hide()
        }
    }

    addRefTable = () => {
        var length = $('#childRefTableFields').bootstrapTable('getData').length
        var new_id = $('#columnTable').val() + '_' + (length + 1)
        $('#childRefTableFields').bootstrapTable('insertRow', {
            index: length,
            row: {
                refTable: '',
                showMode: '',
                showField:'',
                refTitle: '',
                _id: new_id
            }
        })
        initRefTableValue()
    }

    initRefTableValue = () => {
        $('#childRefTableFields').bootstrapTable('getData').forEach( function( o, index ) {
            if (o.refTable !== '') {
                $('#' + o._id).find('td.refShowField .editable').editable('option', 'source', '/client/getRefFields?tablename=' + o.refTable)
                $('#' + o._id).find('td.refShowField .editable').editable('option', 'value', o.showField)
                $('#' + o._id).find('td.refField .editable').editable('option','source', '/client/getRefFields?tablename=' + o.refTable)
                $('#' + o._id).find('td.refField .editable').editable('option','value', o.refField)
            }
        })
    }

    initChildRefTable = () => {
        $("#childRefTableFields").bootstrapTable('destroy')
        $.ajax({
            url: '/client/getRefTable',
            success:function (result) {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    if (refTableData.length === 0) {
                        refTableData =  [{
                            refTable: '',
                            showField:'',
                            showMode:'',
                            refTitle:'',
                            _id:$('#columnTable').val() +'_1',
                        }]
                    }
                    // var subResult = result
                    $("#childRefTableFields").bootstrapTable({
                        striped: true,                      //是否显示行间隔色
                        cache: false,                        //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
                        pagination: false,                   //是否显示分页（*）
                        sortable: false,                     //是否启用排序
                        showColumns: false,                  //是否显示所有的列
                        showRefresh: false,                  //是否显示刷新按钮
                        clickToSelect: false,                //是否启用点击选中行
                        uniqueId:'_id',
                        width: 200,
                        data: refTableData,
                        columns: getRefTableColumn(result,[]),
                        onEditableSave:function (aa,bb,cc,$el) {
                            if (aa === 'refTable') {
                                $el.closest('tr').find('td.refShowField .editable').editable('option','source', '/client/getRefFields?tablename=' + bb[aa])
                                $el.closest('tr').find('td.refShowField .editable').editable('option','value', '')

                                $el.closest('tr').find('td.refField .editable').editable('option','source', '/client/getRefFields?tablename=' + bb[aa])
                                $el.closest('tr').find('td.refField .editable').editable('option','value', '')
                                bb.showField = []
                                bb.refField = ''
                            }
                        }
                    })
                    initRefTableValue()
                }
            }
        })
    }

    function getRefTableColumn(result,data) {
        return [ {
            field: 'refTable',
            title: '资料库名称',
            editable: {
                type:'select',
                source: result,
                showbuttons:false,
                emptytext: '请选择关联资料库',
                validate: function (value) {
                    value = $.trim(value);
                    if (!value) {
                        return '名称不能为空'
                    }
                    let data = $('#childRefTableFields').bootstrapTable('getData')
                    let index = $(this).parents('tr').data('index')
                    for (let i = 0; i<data.length;i++){
                        if (data[i].refTable === value && i !== index) {
                            return '资料库不能重复'
                        }
                    }
                }
            }
        },{
            field: 'showMode',
            title: '显示形式',
            editable : {
                type: "select",
                emptytext: '无',
                showbuttons:false,//编辑框的类型。支持text|textarea|select|date|checklist等
                source: [{ value: 'page', text: "单条" },{ value: 'list', text: "列表" } ],
                validate: validateField
            }
        },{
            field: 'showField',
            class: 'refShowField',
            title: '显示字段',
            editable: {
                type: 'checklist',
                emptytext: '请选择显示字段',
                // showbuttons: false,
                validate: function (value) {
                    value = $.trim(value)
                    if (!value) {
                        return '显示字段不能为空'
                    }
                    return ''
                }
            }
        },{
            field: 'tableField',
            title: '关联字段',
            editable: {
                type: 'select',
                emptytext: '请选择关联字段',
                source:'/client/getRefFields?tablename=' + $('#columnTable').val(),
                validate: function (value) {
                    value = $.trim(value)
                    if (!value) {
                        return '关联字段不能为空'
                    }
                    return ''
                }
            }
        },{
            field: 'refField',
            class: 'refField',
            title: '被关联字段',
            editable: {
                type: 'select',
                emptytext: '请选择被关联字段',
                validate: function (value) {
                    value = $.trim(value)
                    if (!value) {
                        return '被关联字段不能为空'
                    }
                    return ''
                }
            }
        },{
            field: "refTitle",
            title: "显示标题",
            editable: {
                type: 'text',
                showbuttons:false,
                emptytext:'请输入显示标题',          //编辑框的标题
                placeholder:'请输入显示标题',
                validate: function (value) {
                    value = $.trim(value);
                    if (!value) {
                        return '显示标题不能为空'
                    }
                }
            }
        }, {
            field: "operate",
            title: "删除",
            formatter: function (value, row, index) {
                return ['<a href="javascript:void(0)"  onclick="deleteChildRefTable(\''+ row._id +'\',\'' + index + '\')" title="删除">',
                    '<i class="fa fa-lg fa-trash-o"></i>',
                    '</a>'].join('')
            }
        }]
    }

    initChildSearchTable = () => {
        $("#childSearchTableFields").bootstrapTable('destroy')
        $.ajax({
            url: '/client/getSearchFields?tablename=' + $('#columnTable').val() + '&columnId=' + $('#columnId').val(),
            success:function (result) {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    $("#childSearchTableFields").bootstrapTable({
                        striped: true,                      //是否显示行间隔色
                        cache: false,                        //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
                        pagination: false,                   //是否显示分页（*）
                        sortable: false,                     //是否启用排序
                        showColumns: false,                  //是否显示所有的列
                        showRefresh: false,                  //是否显示刷新按钮
                        clickToSelect: false,                //是否启用点击选中行
                        uniqueId:'_id',
                        width: 200,
                        height: 300,
                        data: result,
                        columns: [ {
                            field: 'title',
                            title: '字段名称',
                        },{
                            field: 'canSearch',
                            title: '搜索项',
                            editable : {
                                type: "select",
                                emptytext: '无',
                                showbuttons:false,//编辑框的类型。支持text|textarea|select|date|checklist等
                                source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                                validate: validateField
                            }
                        },{
                            field: 'searchMode',
                            title: '搜索模式',
                            editable : {
                                type: "select",
                                emptytext: '无',
                                showbuttons:false,//编辑框的类型。支持text|textarea|select|date|checklist等
                                source: [{ value: 'high', text: "高级搜索" },{ value: 'normal', text: "普通搜索" } ],
                                validate: validateField
                            }
                        },{
                            field: 'searchType',
                            title: '搜索项类型',
                            editable : {
                                type: "select",
                                emptytext: '无',
                                showbuttons:false,//编辑框的类型。支持text|textarea|select|date|checklist等
                                source: [{ value: 'text', text: "文本" },{ value: 'date', text: "日期" },{ value: 'area', text: "地区" },{ value: 'name', text: "姓氏" } ],
                                validate: validateField
                            }
                        }],
                        onEditableSave:function (aa,bb,cc,$el) {
                            let data = $('#childSearchTableFields').bootstrapTable('getData')
                            let index = $el.parents('tr').data('index')
                            if (aa === 'canSearch') {
                                if (Number(bb[aa]) === 0) {
                                    data[index].searchMode = ''
                                    data[index].searchType = ''
                                    $('#childSearchTableFields').bootstrapTable('updateRow',{index: index, row: data[index]})
                                }
                            } else {
                                if (data[index].canSearch === '' || Number(data[index].canSearch) === 0 || data[index].canSearch === undefined) {
                                    data[index][aa] = bb[aa]
                                    data[index].canSearch = 1
                                    $('#childSearchTableFields').bootstrapTable('updateRow',{index: index, row: data[index]})
                                }
                            }
                        }
                    })
                }
            }
        })
    }

    initChildGroupTable = () => {
        $("#childGroupTableFields").bootstrapTable('destroy')
        $.ajax({
            url: '/client/getGroupFields?tablename=' + $('#columnTable').val() + '&columnId=' + $('#columnId').val(),
            success:function (result) {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    $("#childGroupTableFields").bootstrapTable({
                        striped: true,                      //是否显示行间隔色
                        cache: false,                        //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
                        pagination: false,                   //是否显示分页（*）
                        sortable: false,                     //是否启用排序
                        showColumns: false,                  //是否显示所有的列
                        showRefresh: false,                  //是否显示刷新按钮
                        clickToSelect: false,                //是否启用点击选中行
                        uniqueId:'_id',
                        width: 200,
                        height: 300,
                        data: result,
                        columns: [ {
                            field: 'title',
                            title: '字段名称',
                        },{
                            field: 'groupShow',
                            title: '分组展示',
                            editable : {
                                type: "select",
                                emptytext: '无',
                                showbuttons:false,//编辑框的类型。支持text|textarea|select|date|checklist等
                                source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                                validate: validateField
                            }
                        },{
                            field: 'showMode',
                            title: '展示方式',
                            editable : {
                                type: "select",
                                emptytext: '无',
                                showbuttons:false,//编辑框的类型。支持text|textarea|select|date|checklist等
                                source: [{ value: 'list', text: "列表" },{ value: 'page', text: "单页" },{ value: 'map', text: "地图" } ],
                                validate: validateField
                            }
                        },{
                            field: 'groupType',
                            title: '分组类型',
                            editable : {
                                type: "select",
                                emptytext: '无',
                                showbuttons:false,//编辑框的类型。支持text|textarea|select|date|checklist等
                                source: [{ value: 'area', text: "按区域" },{ value: 'name', text: "按姓氏" },{ value: 'field', text: "按字段" }],
                                validate: validateField
                            }
                        },{
                            field: 'groupTitle',
                            title: '展示标题',
                            editable : {
                                type: "text",
                                emptytext: '无',
                                placeholder:'请输入分组展示标题',
                                showbuttons:false,
                                validate: validateField
                            }
                        }],
                        onEditableSave:function (aa,bb,cc,$el) {
                            let data = $('#childGroupTableFields').bootstrapTable('getData')
                            let index = $el.parents('tr').data('index')
                            if (aa === 'groupShow') {
                                if (Number(bb[aa]) === 0) {
                                    data[index].showMode = ''
                                    data[index].groupType = ''
                                    data[index].groupTitle = ''
                                    $('#childGroupTableFields').bootstrapTable('updateRow',{index: index, row: data[index]})
                                }
                            } else {
                                if (data[index].groupShow === '' || Number(data[index].groupShow) === 0 || data[index].groupShow === undefined) {
                                    data[index][aa] = bb[aa]
                                    data[index].groupShow = 1
                                    $('#childGroupTableFields').bootstrapTable('updateRow',{index: index, row: data[index]})
                                }
                            }
                        }
                    })
                }
            }
        })
    }

    deleteChildRefTable = (id, index) => {
        // var data = $('#childRefTableFields').bootstrapTable('getData')
         $('#childRefTableFields').bootstrapTable('removeByUniqueId',id)
        if (id && id.indexOf('_') < 0) {
            $.ajax({
                url: '/data/refTable/' + id,
                type: 'delete',
                success:function (result) {
                    if (result.error) {
                        showMessage(result.error, '')
                    } else {
                        showMessage('关联资料库删除成功', 'success')
                    }
                }
            })
        }
    }

    saveChildSearch = () => {
        param = {searchs:[],refTables:[],detail:{}, groupFields:[]}

        var checkRef = false, checkSearch = false, checkGroup = false

        $('#childMainView').find('input[type=radio]').each(function (e, obj) {
            if (obj.checked) {
                param[obj.name] = obj.id.replace(obj.name,'')
            }
            if (obj.name === 'hasRef') {
                if (Number(obj.id.replace(obj.name, '')) === 1 && obj.checked) {
                    checkRef = true
                }
            } else if (obj.name === 'showSearch') {
                if (Number(obj.id.replace(obj.name, '')) === 1 && obj.checked) {
                    checkSearch = true
                }
            } else if (obj.name === 'showMode') {
                if (obj.id.replace(obj.name, '') === 'group' && obj.checked) {
                    checkGroup = true
                }
            }
        })

        if($('#childSubView').css('display') === 'block') {
            $('#childSubView').find('input[type=radio]').each(function (e, obj) {
                if (obj.checked) {
                    param.detail[obj.name] = obj.id.replace(obj.name,'')
                }
            })
            if ($('#childGroupTitle').val() === '') {
                showMessage('请选择明细标题项','')

                setTimeout(function () {
                    $('#childGroupTitle').focus()
                },200)
                return
            } else {
                param.detail.groupTitle = $('#childGroupTitle').val()
            }
            if ($('#refFile1')[0].checked) {
                if ($('#fileRefTable').val() === '') {
                    showMessage('请选择影像文件对应资料库','')
                    setTimeout(function () {
                        $('#fileRefTable').focus()
                    },200)
                    return
                }
                if ($('#fileMainField').val() === '') {
                    showMessage('请选择关联字段','')
                    setTimeout(function () {
                        $('#fileMainField').focus()
                    },200)
                    return
                }
                if ($('#fileRefField').val() === '') {
                    showMessage('请选择被关联字段','')
                    setTimeout(function () {
                        $('#fileRefField').focus()
                    },200)
                    return
                }

                param.detail.refFile = '1'
                param.detail.refTable = $('#fileRefTable').val()
                param.detail.mainField = $('#fileMainField').val()
                param.detail.refField = $('#fileRefField').val()
            } else {
                param.detail.refFile = '0'
                param.detail.refTable = ''
                param.detail.mainField = ''
                param.detail.refField = ''
            }
        }

        let check = true

        if (checkSearch) {
            let data1 = $('#childSearchTableFields').bootstrapTable('getData')
            for (let i in data1) {
                let e = data1[i]
                let tmp = {}
                tmp.name = e.name
                tmp.fieldId = e._id
                tmp.title = e.title
                tmp.canSearch = e.canSearch === undefined ? 0 : e.canSearch
                if(Number(tmp.canSearch) === 1) {
                    if (e.searchMode === '') {
                        showMessage('搜索模式不能为空','')
                        setTimeout(function () {
                            $('#childSearchTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                        }, 500)
                        check = false
                        return false
                    } else if (e.searchType === '') {
                        showMessage('搜索项类型不能为空','')
                        setTimeout(function () {
                            $('#childSearchTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                        }, 500)
                        check = false
                        return false
                    }
                    tmp.searchMode = e.searchMode
                    tmp.searchType = e.searchType
                    param.searchs.push(tmp)
                }
            }
        }

        if (checkRef) {
            let data2 = $('#childRefTableFields').bootstrapTable('getData')
            for (let i in data2) {
                let e = data2[i]
                let tmp = {}
                if (e.refTable !== undefined && e.refTable !== '') {
                    if (e.showMode === undefined || e.showMode === '') {
                        check = false
                        showMessage('显示形式不能为空','')
                        setTimeout(function () {
                            $('#childRefTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                        }, 500)
                        return false
                    } else if (e.showField === undefined || e.showField.length === 0) {
                        check = false
                        showMessage('显示字段不能为空','')
                        setTimeout(function () {
                            $('#childRefTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                        }, 500)
                        return false
                    } else if (e.tableField === undefined || e.tableField === '') {
                        check = false
                        showMessage('关联字段不能为空','')
                        setTimeout(function () {
                            $('#childRefTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                        }, 500)
                        return false
                    } else if (e.refField === undefined || e.refField === '') {
                        check = false
                        showMessage('被关联字段不能为空','')
                        setTimeout(function () {
                            $('#childRefTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                        }, 500)
                        return false
                    } else if (e.refTitle === undefined || e.refTitle === '') {
                        check = false
                        showMessage('显示标题不能为空','')
                        setTimeout(function () {
                            $('#childRefTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                        }, 500)
                        return false
                    }
                } else {
                    check = false
                    showMessage('关联资料库不能为空','')
                    setTimeout(function () {
                        $('#childRefTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                    }, 500)
                    return false
                }
                tmp.refTable = e.refTable
                tmp.showField = e.showField
                tmp.showMode = e.showMode
                tmp.refTitle = e.refTitle
                tmp.tableField = e.tableField
                tmp.refField = e.refField
                param.refTables.push(tmp)
            }
        }

        if (checkGroup) {
            let data3 = $('#childGroupTableFields').bootstrapTable('getData')
            for (let i in data3) {
                let e = data3[i]
                let tmp = {}
                tmp.name = e.name
                tmp.fieldId = e._id
                tmp.groupShow = e.groupShow === undefined ? 0 : e.groupShow

                if(Number(tmp.groupShow) === 1) {
                    if (e.showMode === '') {
                        showMessage('展示方式不能为空','')
                        setTimeout(function () {
                            $('#childGroupTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                        }, 500)
                        check = false
                        return false
                    } else if (e.groupType === '') {
                        showMessage('分组类型不能为空','')
                        setTimeout(function () {
                            $('#childGroupTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                        }, 500)
                        check = false
                        return false
                    } else if (e.groupTitle === '') {
                        showMessage('展示标题不能为空','')
                        setTimeout(function () {
                            $('#childGroupTableFields').find('tr#'+e._id + ' .editable-empty').first().editable('show')
                        }, 500)
                        check = false
                        return false
                    }
                    tmp.showMode = e.showMode
                    tmp.groupTitle = e.groupTitle
                    tmp.groupType = e.groupType
                    param.groupFields.push(tmp)
                }
            }
        }

        if (check) {
            if($('#childSubView').css('display') === 'block') {
                var files = $("#imageUploder").pluploadQueue().files
                if (files.length !== 0) {
                    $("#imageUploder").pluploadQueue().start()
                    return
                }
            }
            if ($('#imgPaths').val() !== '') {
                param.detail.bgImgs = $('#imgPaths').val()
            }
            $.ajax({
                url: '/client/saveChild',
                type: 'post',
                data: {columnId:$('#columnId').val(), param: param},
                success:function (result) {
                    if (result.error) {
                        showMessage(result.error, '')
                    } else {
                        showMessage('子栏目编辑成功', 'success')
                    }
                }
            })
        }
    }

    setChildValue = (data) => {
        $('#childMainView').find('input[type=radio]').each(function (e, obj) {
            if (data[obj.name] !== undefined) {
                if (typeof data[obj.name] === 'string') {
                    $('#'+ obj.name + data[obj.name]).iCheck('check')
                } else {
                    $('#'+ obj.name + Number(data[obj.name])).iCheck('check')
                }
            }
            if (obj.name === 'showDetail') {
                if (Number(data[obj.name]) === 1 && $('#'+ obj.name + Number(data[obj.name]))[0].checked) {
                    $('#childSubView').show()
                    initChildSubView(data.detail)
                } else {
                    $('#childSubView').hide()
                    clearChildSubView()
                }
            } else if (obj.name === 'hasRef') {
                if (Number(data[obj.name]) === 1) {
                    $('#childRefTable').show()
                    refTableData = data.refTables
                    initChildRefTable()
                } else {
                    $('#childRefTable').hide()
                }
            } else if (obj.name === 'showSearch') {
                if (Number(data[obj.name]) === 0) {
                    $('#childSearchTable').hide()
                } else {
                    $('#childSearchTable').show()
                }
            } else if (obj.name === 'showMode') {
                if (!data.showDetail) {
                    $('#childSubView').hide()
                    clearChildSubView()
                }

                if (data[obj.name] === 'group') {
                    $('#childGroupTableFields').show()
                    if($('#childSearchTable').css('display') === 'block') {
                        $('#childGroupTable').removeClass('col-sm-12')
                        $('#childGroupTable').addClass('col-sm-6')
                        $('#childSearchTable').removeClass('col-sm-12')
                        $('#childSearchTable').addClass('col-sm-6')
                    } else {
                        $('#childGroupTable').removeClass('col-sm-6')
                        $('#childGroupTable').addClass('col-sm-12')
                    }
                } else if (data[obj.name] === 'page') {
                    $('#childSubView').show()
                    initChildSubView(data.detail)
                } else {
                    $('#childGroupTable').hide()
                    if($('#childSearchTable').css('display') === 'block') {
                        $('#childSearchTable').removeClass('col-sm-6')
                        $('#childSearchTable').addClass('col-sm-12')
                    }
                }
            }
        })
        if (data.detail !== undefined) {
            $('#childSubView').find('input[type=radio]').each(function (e, obj) {
                if (data.detail[obj.name] !== undefined) {
                    $('#'+ obj.name + data.detail[obj.name]).iCheck('check')
                }
            })
        }
    }

    initChildGroupTitleField = (tablename, value) => {
        $('#groupTitleField').load('/client/getGroupTitleField?tablename='+tablename, function () {
            $('#childGroupTitle').val(value)
        })
    }

    initFileRefTableField = (tablename, value) => {
        $('#fileRefTableDiv').load('/client/getFileRefTable?tablename='+tablename, function () {
            $('#fileRefTable').val(value)
        })
    }

    initFileRefField = (tablename, value) => {
        if (tablename !== '' && tablename !==  undefined) {
            $('#fileRefFieldDiv').load('/client/getFileRefField?tablename='+tablename, function () {
                $('#fileRefField').val(value)
            })
        }
    }

    initFileMainField = (tablename, value) => {
        $('#fileMainFieldDiv').load('/client/getFileMainField?tablename='+tablename, function () {
            $('#fileMainField').val(value)
        })
    }

    initImageUploader = ()=>{
        if ($("#imageUploder").pluploadQueue()) {
            $("#imageUploder").pluploadQueue().destroy()
        }

        $("#imageUploder").pluploadQueue({
            dragdrop: true,
            multiple_queues: true,
            filters : {
                max_file_size : '1024mb',
                prevent_duplicates: true,
                mime_types: [
                    {title: '图片', extensions: 'jpg,gif,png'}
                ]
            },headers:{
                "x-access-token" : storage['aesToken']
            },
            multipart:true,
            chunk_size: 0,
            rename: false,
            renameByClick: false,
            // fileTemplate: '<div class="file"><div class="file-progress-bar"></div><div class="file-wrapper"><div class="file-icon"><i class="icon icon-file-o"></i></div><div class="content"><div class="file-name"></div><div class="file-size small text-muted">0KB</div></div><div class="actions"><div class="file-status" data-toggle="tooltip" data-placement="bottom"><i class="icon"></i> <span class="text"></span></div><a data-toggle="tooltip" data-placement="bottom" class="btn btn-link btn-download-file" target="_blank"><i class="icon icon-download-alt"></i></a><button type="button" data-toggle="tooltip" class="btn btn-link btn-reset-file" title="Repeat" data-placement="bottom"><i class="icon icon-repeat"></i></button><button type="button" data-toggle="tooltip" title="Remove" data-placement="bottom" class="btn btn-link btn-delete-file"><i class="icon icon-trash text-danger"></i></button></div></div></div>',
            autoUpload: false,            // 当选择文件后立即自动进行上传操作
            url: '/client/upload',
            multi_selection: true,
            resize : {width : 240, height : 320, quality : 90},
            flash_swf_url : '/plugins/plupload/js/Moxie.swf',
            silverlight_xap_url : '/plugins/plupload/js/Moxie.xap',
            init:{
                Error: function(uploader,errObjecs) {
                    showMessage(errObjecs.message, '');
                }
            }
        })

        $('#imageUploder').pluploadQueue().bind('UploadComplete', imageUploadedComplete)

        $('#imageUploder').pluploadQueue().bind('FileUploaded', imageFileUploaded)
    }

    imageFileUploaded = (uploader,file,responseObject) =>{
        if (responseObject.response.error) {
            showMessage(responseObject.response.error)
            $('#imageUploder').pluploadQueue().stop()
        } else {
            images.push(JSON.parse(responseObject.response))
        }
    }

    imageUploadedComplete = (uploader,files)=> {
        param.detail.bgImgs = JSON.stringify(images)

        $.ajax({
            url: '/client/saveChild',
            type: 'post',
            data: {columnId:$('#columnId').val(), param: param},
            success:function (result) {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    showMessage('子栏目编辑成功', 'success')
                    initImageUploader()
                    reloadImageView(images)
                }
            }
        })
    }

    reloadImageView = (data) => {
        if (data.length > 0) {
            var ary = []
            ary.push('<ol class="carousel-indicators">')
            for (var i in data) {
                if (Number(i) === 0) {
                    ary.push('<li data-target="#myCarousel" data-slide-to="' + i + '" class="active"></li>')
                } else {
                    ary.push('<li data-target="#myCarousel" data-slide-to="' + i + '"></li>')
                }
            }
            ary.push('</ol>')
            ary.push('<div class="carousel-inner">')
            for (var i in data) {
                if (Number(i) === 0) {
                    ary.push('<div class="item active">')
                    ary.push('<img src="/upload' + data[i] + '"></div>')
                } else {
                    ary.push('<div class="item">')
                    ary.push('<img src="/upload' + data[i] + '"></div>')
                }
            }
            ary.push('</div>')
            $('#myCarousel').html(ary.join(''))
            $('#imgPaths').val(JSON.stringify(data))
        }
    }

    initImageView = (data) => {
        if ((data.showDetail || data.showMode === 'page') && data.detail.bgImgs.length > 0) {
            var ary = []
            ary.push('<ol class="carousel-indicators">')
            for (var i in data.detail.bgImgs) {
                if (Number(i) === 0) {
                    ary.push('<li data-target="#myCarousel" data-slide-to="' + i + '" class="active"></li>')
                } else {
                    ary.push('<li data-target="#myCarousel" data-slide-to="' + i + '"></li>')
                }
            }
            ary.push('</ol>')
            ary.push('<div class="carousel-inner">')
            for (var i in data.detail.bgImgs) {
                if (Number(i) === 0) {
                    ary.push('<div class="item active">')
                    ary.push('<img src="/upload' + data.detail.bgImgs[i] + '"></div>')
                } else {
                    ary.push('<div class="item">')
                    ary.push('<img src="/upload' + data.detail.bgImgs[i] + '"></div>')
                }
            }
            ary.push('</div>')
            $('#myCarousel').html(ary.join(''))
            $('#imgPaths').val(JSON.stringify(data.detail.bgImgs))
        } else {
            $('#myCarousel').html('')
            $('#imgPaths').val('')
        }
    }

    changeRefField = (obj)=> {
        initFileRefField(obj.value,'')
    }
})

initColumns = ()=> {
    tableOptions.url = '/client/columns'
    tableOptions.columns = tableColumns['column'].columns
    tableOptions.search = false
    tableOptions.showRefresh = false
    tableOptions.showColumns = false
    tableOptions.pagination = false
    tableOptions.detailView = tableColumns['column'].detailView
    tableOptions.onExpandRow = tableColumns['column'].onExpandRow
    tableOptions.height = 350
    $("#columnFields").bootstrapTable(tableOptions)
    clearModalView()
}

initIndexs = ()=> {

    $("#tableListindex").bootstrapTable('destroy')
    $.ajax({
        url: '/client/index',
        success:function (result) {
            if (result.error) {
                showMessage(result.error, '')
            } else {
                // var subResult = result
                $("#tableListindex").bootstrapTable({
                    striped: true,                      //是否显示行间隔色
                    cache: false,                        //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
                    pagination: false,                   //是否显示分页（*）
                    sortable: false,                     //是否启用排序
                    showColumns: false,                  //是否显示所有的列
                    showRefresh: false,                  //是否显示刷新按钮
                    clickToSelect: false,                //是否启用点击选中行
                    uniqueId:'_id',
                    data: result,
                    columns: tableColumns['index'].columns,
                    detailView : tableColumns['index'].detailView,
                    onExpandRow : tableColumns['index'].onExpandRow,
                    onEditableSave:function (aa,bb,cc,$el) {
                        if (aa === 'refTable') {
                            $el.closest('tr').find('td.contentTitle .editable').editable('option','source', '/client/getRefFields?tablename=' + bb[aa])
                            $el.closest('tr').find('td.contentTitle .editable').editable('option','value', '')

                            $el.closest('tr').find('td.content .editable').editable('option','source', '/client/getRefFields?tablename=' + bb[aa])
                            $el.closest('tr').find('td.content .editable').editable('option','value', '')

                            $el.closest('tr').find('td.contentSubTitle .editable').editable('option','source', '/client/getRefFields?tablename=' + bb[aa])
                            $el.closest('tr').find('td.contentSubTitle .editable').editable('option','value', '')

                            bb.contentTitle = ''
                            bb.content = ''
                            bb.contentSubTitle = ''
                        }
                    }
                })
                if (result.length > 0) {
                    initRefContentValue()
                }
            }
        }
    })
}

initRefContentValue = () => {

    $('#tableListindex').bootstrapTable('getData').forEach( function( o, index ) {
        if (o.refTable !== '') {
            $('#' + o._id).find('td.contentTitle .editable').editable('option', 'source', '/client/getRefFields?tablename=' + o.refTable)
            $('#' + o._id).find('td.contentTitle .editable').editable('option', 'value', o.contentTitle)
            $('#' + o._id).find('td.contentSubTitle .editable').editable('option', 'source', '/client/getRefFields?tablename=' + o.refTable)
            $('#' + o._id).find('td.contentSubTitle .editable').editable('option', 'value', o.contentSubTitle)
            $('#' + o._id).find('td.content .editable').editable('option','source', '/client/getRefFields?tablename=' + o.refTable)
            $('#' + o._id).find('td.content .editable').editable('option','value', o.content)
        }
    })
}