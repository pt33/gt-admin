var storage = window.localStorage
var fileUploads = []
var fieldAry = {}
var subListFields = []
var detailListFields = []
var queryLimit = 10
var queryParam = {key:{}}
// let myModalTrigger = new $.zui.ModalTrigger({backdrop:'static',loadingIcon:'icon-spinner-snake',keyboard:false})
var templateId = ''
var pdfOptions = {
    pdfOpenParams: {
        scrollbar: '1', toolbar: '0', statusbar: '1', messages: '0', navpanes: '0' }
}

var opts = {
    lines: 13 // The number of lines to draw
    , length: 20 // The length of each line
    , width: 5 // The line thickness
    , radius: 30 // The radius of the inner circle
    , scale: 0.5 // Scales overall size of the spinner
    , corners: 1 // Corner roundness (0..1)
    , color: '#000' // #rgb or #rrggbb or array of colors
    , opacity: 0.25 // Opacity of the lines
    , rotate: 0 // The rotation offset
    , direction: 1 // 1: clockwise, -1: counterclockwise
    , speed: 1 // Rounds per second
    , trail: 60 // Afterglow percentage
    , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
    , zIndex: 2e9 // The z-index (defaults to 2000000000)
    , className: 'spinner' // The CSS class to assign to the spinner
    , top: '50%' // Top position relative to parent
    , left: '50%' // Left position relative to parent
    , shadow: false // Whether to render a shadow
    , hwaccel: false // Whether to use hardware acceleration
    , position: 'absolute' // Element positioning
}
try{
    $.fn.editable.defaults.mode = 'inline'
    $.fn.editable.defaults.ajaxOptions = {type: 'put'}
} catch (e) {

}

$.ajaxSetup ({
    cache: true,
    async: true,
    headers: {
        "x-access-token" : storage['aesToken']
    }
})

$(document).ready(function () {

    let remindMe = storage['remindMe']
    if (remindMe) {
        $('#name').val(storage['username'])
        $('#password').val(storage['password'])
        $("#remindMe").prop('checked', true)
    }

    $(window).resize(function () {
        try {
            $("table[id*='tableList']").bootstrapTable('resetView', {
                height: getCardHeight()
            })

            $('#filePanel').css('height', getFileViewHeight())

            changeSubContent()
            changeReplyContent()
        } catch (e){

        }
    })
})

getChildrenNode = (obj)=> {
    obj.childNodes.forEach(function (e) {
        if (e.childNodes.length > 0 && e.nodeName !== 'SELECT'){
            getChildrenNode(e)
        } else {
            if (e.nodeName === 'INPUT') {
                if (e.id !== '') {
                    $("input[id=" + e.id + "]").val('')
                    $("label[id=" + e.id + "-error]").text('')
                } else {
                    let input = $("input:checkbox[value="+ e.attributes['value'].value +"]")[0]
                    if (input) {
                        input.checked = false
                    }
                }
            } else if (e.nodeName === 'SELECT') {
                if (e.id !== '') {
                    $("SELECT[id=" + e.id + "]").val('')
                    $("label[id=" + e.id + "-error]").text('')
                }
            }
        }
    })
}

operateEvents = (id, index, tableId, type, showModal) =>{
    let data = $('#'+tableId).bootstrapTable('getData')[index]
    clearModalView()
    if(type === 'editTable') {
        $('#tableId').val(data._id)
        $('#tableModelTitle').html('编辑资料库')
        $('#tableName').val(data.title)
        $("#tableType").val(data.type)
        $('#chooseTableType').val(data.type)
    } else if (type === 'deleteTable') {
        $('#tableId').val(data._id)
    } else if (type === 'deleteTemplate') {
        $('#templateId').val(data._id)
    } else if (type === 'editRole') {
        let roleId = data._id.toString()
        let roleName = data.name
        let menus = data.menus

        $('#roleModelTitle').html('编辑角色')
        $('#roleName').val(roleName)
        $('#roleId').val(roleId)
        menus.forEach(function(e){
            let input = $("input:checkbox[value="+ e +"]")[0]
            input.checked = true
        })
    } else if (type === 'deleteRole') {
        $('#roleId').val(data._id.toString())
    } else if (type === 'deleteAdmin') {

        let adminId = data._id.toString()

        $('#adminId').val(adminId)
        $('#adminConfirmType').val('del')
        $('#adminConfirmTitle').html('是否确认删除该管理员账号？')
    } else if (type === 'resetAdmin') {
        let adminId = data._id.toString()

        $('#adminId').val(adminId)
        $('#resetName').val(data.username)
        $('#adminConfirmType').val('reset')
        $('#adminConfirmTitle').html('是否确认重置该管理员账号密码？')

    } else if (type === 'setAdminStatus') {
        let adminId = data._id.toString()
        let status = Number(data.status)

        $('#adminId').val(adminId)
        $('#adminConfirmType').val(status === 1 ? 'lock' : 'unlock')
        $('#adminConfirmTitle').html(status === 1 ? '是否确认冻结该管理员账号？' : '是否确认解冻该管理员账号？')
    } else if (type === 'showFile') {
        $('#showFileModelBody').load('/upload/' + id)
    } else if (type === 'showDetail') {
        let val = data[id]
        subListFields.forEach(function (e) {
            if (e.name === id) {
                $('#showListDetailModelContent').load('/admins/data/getListDetail?value='+val+'&refField='+e.refField+'&refTable='+e.refTable, function () {
                    if (data[e.refTable] > 1) {
                        detailListFields = JSON.parse($('#detailFieldInfo').val())
                        showSubListDetail(detailListFields, '/data/subListByRef', e.refField, val, $('#detailTableId').val(), e.refTable)
                    }
                })
                return false
            }
        })
    } else if (type === 'showFileList') {
        let wh = window.innerHeight
        $('#mainPageInner').load( '/data/getFileList?paths=' + JSON.stringify(data.paths) + '&value=' + id + '&tableId=' + $('#subTableId').val() + '&tableName=' + tableId + '&wh=' + window.innerHeight + '&ww=' + window.innerWidth, function() {
            $( "#filePanel" ).sortable();
            $( "#filePanel" ).disableSelection();

            let pdfs = $("div[id*='pdf-']")
            let pageNum = Number($('#pdf-view-page').val())
            let h = Number($('#pdf-view-h').val())
            let w = Number($('#pdf-view-w').val())

            let ph
            let bl,check = 0

            let cls = 'col-md-3'

            pdfOptions.width = '100%'
            pdfOptions.height = '100%'

            if(h > w) {
                bl = h/w
            } else {
                cls = 'col-md-4'
                bl = h/w
                check = 1
            }
            $(".div-pdf").addClass(cls)
            let pw = $(".div-pdf")[0].clientWidth - 20
            if (check === 1) {
                ph = Math.ceil(pw * bl) - 12
            } else {
                ph = Math.ceil(pw * bl) - 25
            }

            $(".div-pdf").css('height',(ph + 60) +'px')
            $("div[id*=pdf-]").css('height',ph +'px')
            for (let i = 0; i < pdfs.length; i++) {
                let o = pdfs[i]
                let url = o.className.split(' ')[0]
                PDFObject.embed('/upload/'+url, o, pdfOptions);
            }
            // $('#fileListSortCard').sortable()
            $('#filePanel').css('height', getFileViewHeight() + 'px')
            // $('#filePanel').css('scrollHeight', getFileViewHeight() + ph + 'px')
            let page = 0

            $('#filePanel').on('scroll', function () {
                // let h2 = $('#filePanel').height() * (page + 1)
                let h3 = $('#filePanel').scrollTop()
                let h4 = $('#filePanel')[0].scrollHeight
                let h5 = $('#filePanel')[0].offsetHeight
                console.log(h3, h4, h5, h4 - h5 - h3)
                if ((h4 - h3 - h5) < 50) {
                    if (page === Math.ceil(data.paths.length / pageNum)) {
                        return
                    }
                    page++
                    $.ajax({
                        url: '/data/getFileList',
                        type: 'post',
                        data: {paths: data.paths, page: page, pageNum: pageNum, pdfClass: cls},
                        success:function (result) {
                            let ary = result.split('\n\n')
                            for(let i = 1;i < ary.length;i++) {
                                let e = ary[i]
                                $('#filePanel').append(e)
                                let tmp1 = $(".div-pdf").last()[0]
                                let tmp = $("div[id*='pdf-']").last()[0]
                                let url = tmp.className.split(' ')[0]
                                $(tmp).css('height', ph +'px')
                                $(tmp1).css('height',(ph + 60) +'px')
                                PDFObject.embed('/upload/'+ url,tmp, pdfOptions)
                            }
                            $('#filePanel').css('height', getFileViewHeight() + 'px')
                        }
                    })
                }
            })
        })
    } else if (type === 'setColumnStatus') {
        let adminId = data._id.toString()
        let status = Number(data.status)

        $('#columnId').val(adminId)
        $('#columnStatus').val(status === 1 ? 'lock' : 'unlock')
        $('#columnConfirmTitle').html(status === 1 ? '是否确认停用该栏目？' : '是否确认启用该栏目？')
    } else if (type === 'editChild') {
        $('#columnId').val(data._id.toString())
        // $('#childId').val(data._id.toString())
        $('#columnTable').val(data.childTable)
    } else if (type === 'setIndexStatus') {
        let adminId = data._id.toString()
        let status = Number(data.status)

        $('#indexId').val(adminId)
        $('#indexStatus').val(status === 1 ? 'lock' : 'unlock')
        $('#confirmIndexTitle').html(status === 1 ? '是否确认停用该栏目？' : '是否确认启用该栏目？')
    } else if (type === 'delIndex') {
        let adminId = data._id.toString()
        let status = Number(data.status)

        $('#indexId').val(adminId)
        $('#indexStatus').val('delete')
        $('#confirmIndexTitle').html('是否确认删除该栏目？')
    }

    if (showModal !== 'showFileListModel') {
        $('#' + showModal).modal({
            show     : true
        })
        if(type === 'editChild') {
            initChildSearchTable()
            initChildGroupTable()
            initChildRefTable()
            initImageUploader()

            $('input').on('ifChecked', function(event){
                changeChildView(this.id,this.name)
            })

            $.ajax({
                url: '/client/getChild?columnId=' + $('#columnId').val(),
                success: function (result) {
                    if (result.error) {
                        return result.error
                    } else {
                        setChildValue(result)
                        initImageView(result)
                        if (!result.detail) {
                            result.detail = {}
                        }
                        initChildGroupTitleField(data.childTable, result.detail.groupTitle)
                        initFileRefTableField(data.childTable, result.detail.refTable)
                        initFileMainField(data.childTable, result.detail.mainField)
                        initFileRefField(result.detail.refTable, result.detail.refField)
                    }
                }
            })

            $('#' + showModal).on('hide.bs.modal', function() {
                $("#childRefTableFields").bootstrapTable('destroy')
                $("#childSearchTableFields").bootstrapTable('destroy')
                $("#childGroupTableFields").bootstrapTable('destroy')
                $('#childSubView').hide()
                $('#childRefTable').hide()
            })
        }
    }

    if (showModal === 'showListDetailModel') {
        $('#showListDetailModel').on('shown', function() {
            let h = $('#showListDetailModelBody').clientHeight
            let h1 = window.innerHeight
            $('#showListDetailModelContent').css('height', (h > h1) ? '75%' : (h + 120)+'px')
        })
    }
    //
    if (showModal === 'showFileModel') {
        $('#showFileModel').on('shown', function() {
            let h = $('#showFileModelBody').clientHeight
            let h1 = window.innerHeight
            $('#showFileModelContent').css('height', (h > h1) ? '80%' : (h + 120)+'px')
        })
    }
}

loadList = (data, tableId, tableName) =>{
    let fields = []
    queryParam = {}
    for(let i=0;i<data.length;i++) {
        let e = data[i]
        if (!e.needShow)
            continue
        fields.push({
            field:e.name,
            title:e.title,
            sortable:e.needSort,
            width:"50px",
            class:'hasFile_' + Number(e.hasFile).toString() + ' refTable_' + ((e.refTable !== '' && e.refTable !== undefined) ? '1' : '0'),
            formatter: function (value, row, index) {
                if (row.children && row.children.length > 0 && this.title.indexOf('目录名称') >= 0) {
                    let field = this.field
                    let ary = ['<a href="#collapse_'+row._id+'" data-toggle="collapse" style="font-size: 16px;color:"><i class="icon-expand-alt" id="expand_'+row._id+'"></i>&nbsp;' +value+ '</a>',
                        '<div class="collapse" id="collapse_'+row._id+'">',
                        '<div class="with-padding">']
                    row.children.forEach(function (e) {
                        ary.push('<p>&nbsp;&nbsp;' + e[field] + '</p>')
                    })
                    ary.push('</div></div>')

                    return ary.join('')
                }

                if (this.class.indexOf('hasFile_1') >= 0 && value !== '' && value !== undefined) {
                    if (value.lastIndexOf('.') > 0) {
                        let fileText = value.substring(0,value.lastIndexOf("."))
                        let test1 = fileText.lastIndexOf("/")
                        let test2 = fileText.lastIndexOf("\\")
                        let test= Math.max(test1, test2)
                        let name = fileText.substring(test + 1)
                        let tblname = 'tableList' + tableName
                        return [
                            '<a href="javascript:void(0)"  onclick="operateEvents(\''+ value + '\',\'' + index  +'\',\'' + tblname + '\',\'showFile\',\'showFileModel\')"  title="查看文件明细">',
                            name,
                            '</a>'
                        ].join('')
                    } else {
                        let data = $('#tableList'+tableName).bootstrapTable('getData')[index]
                        if (data.paths && data.paths.length > 0) {
                            let tblname = 'tableList' + tableName
                            return [
                                '<a href="javascript:void(0)"  onclick="operateEvents(\''+ value + '\',\'' + index  +'\',\'' + tblname + '\',\'showFileList\',\'showFileListModel\')"  title="查看文件列表">',
                                value,
                                '</a>'
                            ].join('')
                        } else {
                            return value
                        }
                    }
                } else if (this.class.indexOf('refTable_1') > 0 && value !== '' && value !== undefined) {
                    let tmp = this.field
                    let result = value
                    subListFields.forEach(function (e) {
                        if(e.name === tmp && e.refTable !== '' && row[e.refTable] !== 0) {
                            let tblname = 'tableList' + tableName
                            result = [
                                '<a href="javascript:void(0)"  onclick="operateEvents(\''+ tmp + '\',\'' + index  +'\',\'' + tblname + '\',\'showDetail\',\'showListDetailModel\')" title="点击查看明细数据">',
                                value,
                                '</a>'
                            ].join('')
                            return false
                        }
                    })
                    return result
                } else {
                    return value
                }
            }
        })
    }

    fields.push(
    {
        field: "operate",
        title: "操作",
        width: "60px",
        formatter: function (value, row, index) {
            return [
                '<a class="editTable" href="javascript:void(0)"  onclick="operateEvents(\'' + row._id +'\',\'edit\')" title="编辑">',
                '<i class="fa fa-lg fa-edit" style="font-size:18px;"></i>',
                '</a> &nbsp;',
                '<a class="delTable" href="javascript:void(0)"  onclick="operateEvents(\''+ row._id +'\',\'delete\')" title="删除">',
                '<i class="fa fa-lg fa-trash-o" style="font-size:18px;"></i>',
                '</a>'
            ].join('')
        }
    })

    let toolbar = '#toolbar' + tableName

    tableOptions.url = '/data/subList'
    tableOptions.columns = fields
    tableOptions.search = false
    tableOptions.detailView = false
    tableOptions.toolbar = '#toolbar' + tableName
    tableOptions.toolbarAlign = 'left'
    tableOptions.buttonsAlign = 'left'
    // tableOptions.fixedColumns = true
    // tableOptions.fixedNumber = 1
    tableOptions.queryParams = function (param) {
        let query = {
            page: param.offset
            , limit: param.limit
            , key: queryParam.key
            , sort: {}
            , tableId: tableId
            , tableName: tableName
        }
        if (param.sort !== undefined) {
            query.sort[param.sort] = param.order
        } else {
            query.sort['_id'] = 'asc'
        }
        queryLimit = param.limit
        return query
    }
    tableOptions.rowStyle = function (row, index) {
        return {}
    }
    $("#tableList"+tableName).bootstrapTable(tableOptions)

    let prev = $("div[class='tab-pane active']")
    prev.removeClass('active')
    prev.css('display','none')
    $("#tabContent"+tableName).addClass('active')
    $("#tabContent"+tableName).css('display','block')

    setTimeout(function() {
        $("#tableList" + tableName).bootstrapTable('resetView', {
            height: getCardHeight()
        })
    }, 100)
}

getHeight = (key) =>{
    let h = window.innerHeight
    try {
        // let top = $("table[id*='tableList']").parents('div').find('.fixed-table-toolbar')[0].clientHeight
        if ($("#" + key).parents('#tabContent').length === 1) {
            let height = h - 240 + 15
            return height
        } else {
            let height = h - 220 + 15
            return height
        }
    } catch (e) {
        let top = $("table[id*='tableList']").parents('div').find('.fixed-table-toolbar')[0].clientHeight
        let height = h - top + 5
        return height
    }
}

getCardHeight =()=> {
    let h = window.innerHeight
    let title = 0, page = 0, nav = 0, toolbar = 0, header = 0
    if($('.panel-heading').length !== 0) {
        title = $('.panel-heading')[0].clientHeight
    }

    if($('.nav').length !== 0) {
        nav = $('.nav')[0].clientHeight + 20 + 15

        if ($('.tab-content div[class*=tab-pane]:visible').find('.pagination-detail').length !== 0) {
            if($('.tab-content div[class*=tab-pane]:visible').find('.pagination-detail').parent('div').css('display') !== 'none') {
                page = $('.tab-content div[class*=tab-pane]:visible').find('.pagination-detail')[0].clientHeight + 20
                nav =$('.nav')[0].clientHeight +35
            } else {
                page = -55
            }
        }
    } else {
        if ($('.pagination-detail').length !== 0) {
            if($(".pagination-detail").parent('div').css('display') !== 'none') {
                page = $(".pagination-detail")[0].clientHeight + 20
            } else {
                page = -55
            }
        }
    }
    if($("div[id*='toolbar']").length !== 0) {
        toolbar = $("div[id*='toolbar']")[0].clientHeight + 20
    }

    if($('.row.mailbox-header').length !== 0 ) {
        header = $('.row.mailbox-header')[0].clientHeight + 35
    } else {
        if($('.list-unstyled.mailbox-nav').length !== 0 ) {
            header = 125
        }
    }

    let height = h - 60 - title - page - nav - toolbar - header

    return height
}

getFileViewHeight = ()=>{
    return window.innerHeight - 105
}

importData = (obj)=> {
    let id = obj.id.replace('_btn','')
    $("#mainPageInner").load('/data/getImportTemplate/' + id, function(responseTxt,statusTxt,xhr){
        if(statusTxt=="success") {
            initUploadTable(id)
            initUploader()
            $('#mainBody').css('overflow','scroll')
        } else if(statusTxt=="error") {
            showMessage('Error: '+xhr.status+': '+xhr.statusText,'')
        }
    })
}

changeView = (obj) =>{
    // let ary = $(obj).children()
    // for (let i =0;i<ary.length;i++){
    //     if(ary[i].value === obj.value) {
    //         templateId = ary[i].id
    //         break
    //     }
    // }
    $('#rightCardView').show()
    initUploader()
    if (obj.value === 'excel') {
        $('#uploadCardView').show()
        $('#chooseExcelTemplate').show()
        $('#chooseMarcTemplate').hide()
        $('#uploadMarcFieldDiv').hide()
        $('#marcTypeDiv').hide()
    } else if (obj.value === 'marc'){
        $('#marcTypeDiv').show()
        $('#uploadCardView').hide()
        $('#chooseMarcTemplate').hide()
        $('#chooseExcelTemplate').hide()
        $('#uploadFieldDiv').hide()
        $('#rightCardView').hide()
        // initMarcTable($('#hideTableId').val(), templateId, 'marc')
    } else if (obj.value === 'xml') {
        $('#uploadCardView').hide()
        $('#marcTypeDiv').hide()
        $('#chooseExcelTemplate').hide()
        $('#chooseMarcTemplate').hide()
        $('#uploadFieldDiv').hide()
        $('#uploadMarcFieldDiv').hide()
    } else {
        $('#marcTypeDiv').hide()
        $('#uploadCardView').hide()
        $('#chooseExcelTemplate').hide()
        $('#chooseMarcTemplate').hide()
        $('#uploadFieldDiv').hide()
        $('#uploadMarcFieldDiv').hide()
        $('#rightCardView').hide()
    }
}

changeMarcType = (obj)=>{
    if (obj.value !== '') {
        $('#uploadCardView').show()
        $('#chooseMarcTemplate').show()
        $('#rightCardView').show()
        $('#uploadMarcFieldDiv').show()
        initMarcTable($('#hideTableId').val(), obj.value, 'marc')
    }
}

addField = (obj)=> {

    if ($('#fileType').val() === 'excel') {
        $('#uploadFieldDiv').css('display', 'block')

        let datas = $('#uploadFields').bootstrapTable('getData')
        let length = datas.length
        let max = 0
        if (datas.length > 0) {
            datas.sort(function (a,b) {
                return Number(a.index) - Number(b.index)
            })
            max = Number(datas[length-1].index) + 1
        }
        $('#uploadFields').bootstrapTable('insertRow', {
            index: length + 1,
            row: {
                name: '',
                index:max,
                _id:obj + '_' + (length + 1),
                title:'',
                filePath : '',
                needGroup: 0,
                canDuplicate: 1,
                canEmpty: 1,
                refDir:0
            }
        })
        setTimeout(function () {
            $('#uploadFields').bootstrapTable('scrollTo', 'bottom')
        }, 1000)
    } else {
        $('#uploadMarcFieldDiv').css('display', 'block')
        // resetPanel()
        let length = $('#uploadMarcFields').bootstrapTable('getData').length
        $('#uploadMarcFields').bootstrapTable('insertRow', {
            index: length + 1,
            row: {
                name: '',
                marcMark:'',
                title:'',
                _id:obj + '_' + (length + 1),
                canDuplicate: 1,
                markCanDuplicate: 0
            }
        })
        setTimeout(function () {
            $('#uploadMarcFields').bootstrapTable('scrollTo', 'bottom')
        }, 1000)
    }
}

initUploadTable = (obj)=>{
    $.ajax({
        url: '/data/getField?tableId=' + obj,
        success:function (result) {
            if (result.error) {
                return result.error
            } else {
                result.info.unshift({value:'',text:'请选择标题'})
                for(let i = 0;i < result.info.length;i++) {
                    let tmp = result.info[i]
                    fieldAry[tmp.value] = {title: tmp.name
                        , hasFile: tmp.hasFile
                    }
                }
                $("#uploadFields").bootstrapTable({
                    striped: false,                      //是否显示行间隔色
                    cache: false,                        //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
                    pagination: false,                   //是否显示分页（*）
                    sortable: false,                     //是否启用排序
                    showColumns: false,                  //是否显示所有的列
                    showRefresh: false,                  //是否显示刷新按钮
                    clickToSelect: false,                //是否启用点击选中行
                    height:getCardHeight,//每一行的唯一标识，一般为主键列
                    uniqueId:'_id',
                    columns: [ {
                        field: 'name',
                        title: '字段标题',
                        editable: {
                            type:'select',
                            source: result.info,
                            showbuttons:false,
                            validate: function (value) {
                                value = $.trim(value);
                                if (!value) {
                                    return '标题不能为空'
                                }
                                let data = $('#uploadFields').bootstrapTable('getData')
                                let index = $(this).parents('tr').data('index')
                                for (let i = 0; i<data.length;i++){
                                    if (data[i].name === value && i !== index) {
                                        return '标题不能重复'
                                    }
                                }
                                data[index].title = fieldAry[value].title
                                data[index].hasFile = fieldAry[value].hasFile
                            }
                        }
                    },{
                        field: 'canDuplicate',
                        title: '可重复',
                        editable : {
                            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
                            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                            title: "请选择",                 //是否禁用编辑
                            validate: null,
                            showbuttons:false
                        }
                    },{
                        field: 'canEmpty',
                        title: '可为空值',
                        editable : {
                            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
                            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                            title: "请选择",                 //是否禁用编辑
                            validate: null,
                            showbuttons:false,
                        }
                    },{
                        field: 'refDir',
                        title:'文件目录',
                        editable: {
                            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
                            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                            title: "请选择",            //是否禁用编辑
                            showbuttons:false,
                        }
                    },{
                        field: 'needGroup',
                        title: '需要分组',
                        editable : {
                            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
                            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                            title: "请选择",             //是否禁用编辑
                            showbuttons:false,
                        }
                    },{
                        field: "index",
                        title: "文件对应列数",
                        editable: {
                            type: 'number',
                            emptytext:'请输入列数,默认从0开始',
                            showbuttons:false,
                            validate: function (value) {
                                value = $.trim(value);
                                if (!value) {
                                    return '对应列数不能为空'
                                } else if(/^[0-9]*[0-9][0-9]*$/.test(value)){
                                    let data = $('#uploadFields').bootstrapTable('getData')
                                    let index = $(this).parents('tr').data('index')
                                    for (let i = 0; i < data.length;i++){
                                        if (data[i].index === value && i !== index) {
                                            return '列数不能重复'
                                        }
                                    }
                                } else {
                                    return '列数为从0开始的正整数'
                                }
                                // $(this).editable('setValue', value)
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
                            showbuttons:false,
                            validate: function (value) {
                                let data = $('#uploadFields').bootstrapTable('getData')
                                let index = $(this).parents('tr').data('index')
                                if(data[index].hasFile) {
                                    return value === '' ? '文件位置不能为空' : ''
                                }
                                return ''
                            }
                        }
                    }, {
                        field: "operate",
                        title: "删除",
                        formatter: uploadOperate
                    }],
                    onEditableSave:function (aa,bb,cc,$el) {
                        $el.editable('setValue', bb[aa])
                        $el.closest('td').next().find('.editable').editable('show')
                    }
                })
            }
        }
    })
}

initMarcTable = (obj, typeId, type) =>{
    $("#uploadMarcFields").bootstrapTable('destroy')
    $.ajax({
        url: '/data/getField?tableId=' + obj + '&typeId=' + typeId + '&type=' +type,
        success:function (result) {
            if (result.error) {
                showMessage(result.error, '')
            } else {
                result.info.unshift({value:'',text:'请选择标题'})
                for(let i = 0;i < result.info.length;i++) {
                    let tmp = result.info[i]
                    fieldAry[tmp.value] = {title: tmp.name}
                }
                $("#uploadMarcFields").bootstrapTable({
                    striped: true,                      //是否显示行间隔色
                    cache: false,                        //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
                    pagination: false,                   //是否显示分页（*）
                    sortable: false,                     //是否启用排序
                    showColumns: false,                  //是否显示所有的列
                    showRefresh: false,                  //是否显示刷新按钮
                    clickToSelect: false,                //是否启用点击选中行
                    height:getCardHeight,//每一行的唯一标识，一般为主键列
                    uniqueId:'_id',
                    columns: [ {
                        field: 'name',
                        title: '字段标题',
                        editable: {
                            type:'select',
                            source: result.info,
                            showbuttons:false,
                            validate: function (value) {
                                value = $.trim(value);
                                if (!value) {
                                    return '标题不能为空'
                                }
                                let data = $('#uploadMarcFields').bootstrapTable('getData')
                                let index = $(this).parents('tr').data('index')
                                for (let i = 0; i<data.length;i++){
                                    if (data[i].name === value && i !== index) {
                                        return '标题不能重复'
                                    }
                                }
                                data[index].title = fieldAry[value].title
                            }
                        }
                    },{
                        field: 'canDuplicate',
                        title: '可重复',
                        editable : {
                            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
                            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                            title: "请选择",                 //是否禁用编辑
                            validate: null,
                            showbuttons:false
                        }
                    },{
                        field: "marcMark",
                        title: "文件对应marc标识符",
                        editable: {
                            type: 'select2',
                            showbuttons:true,
                            source: result.marcs,
                            isMultiple:true,
                            select2: {
                                placeholder:'请选择marc标识符',
                                allowClear: true,
                                multiple: true,
                                name: 'marcMark',
                                minimumInputLength: 1,
                                width: '230px'
                            },
                            validate: function (value) {
                                value = $.trim(value);
                                if (!value) {
                                    return 'marc标识符不能为空'
                                }
                                return '';
                            }
                        }
                    },{
                        field: 'markCanDuplicate',
                        title: '标识符重复匹配',
                        editable : {
                            type: "select",              //编辑框的类型。支持text|textarea|select|date|checklist等
                            source: [{ value: 0, text: "否" },{ value: 1, text: "是" } ],
                            title: "请选择",                 //是否禁用编辑
                            validate: null,
                            showbuttons:false
                        }
                    }, {
                        field: "operate",
                        title: "删除",
                        formatter: uploadOperate
                    }],
                    onEditableSave:function (aa,bb,cc,$el) {
                        $el.closest('td').next().find('.editable').editable('show')
                    }
                })
            }
        }
    })
}

uploadOperate = (value, row, index) =>{
    return [
        '<a class="delTable" href="javascript:void(0)"  onclick="deleteUpload(\''+ row._id +'\')" title="删除">',
        '<i class="fa fa-lg fa-trash-o"></i>',
        '</a>'
    ].join('')
}

deleteUpload = (id)=> {
    var type = $('#fileType').val()
    if (type === 'excel') {
        let length = $('#uploadFields').bootstrapTable('getData').length
        if (length === 1) {
            $('#uploadFieldDiv').css('display', 'none')
        }
        $('#uploadFields').bootstrapTable('removeByUniqueId',id)
    } else if (type === 'marc') {
        let length = $('#uploadMarcFields').bootstrapTable('getData').length
        if (length === 1) {
            $('#uploadFieldDiv').css('display', 'none')
        }
        $('#uploadMarcFieldDiv').bootstrapTable('removeByUniqueId',id)
    }
}

addTemplate = (name,id)=> {
    let data = []
    if($('#uploadMarcFieldDiv').css('display') !== 'none'){
        data = $('#uploadMarcFields').bootstrapTable('getData')
    } else {
        data = $('#uploadFields').bootstrapTable('getData')
    }
    if (data.length === 0) {
        showMessage('请添加模板字段','')
    } else {
        let check = $('#uploadFields').find('tr:not(:first)').find('td:not(.filePath)').find('.editable-empty')

        if (check.length !== 0) {
            showMessage('缺少参数值','')
            setTimeout(function () {
                $(check.first()).editable('show')
            }, 500)
            //
            return
        } else {
            for(let i = 0; i<data.length;i++) {
                let tmp = data[i]
                if(tmp.hasFile && (tmp.filePath === '' || tmp.filePath === undefined)) {
                    showMessage('请输入关联文件的路径','')
                    setTimeout(function() {
                        $('#uploadFields').find('tr:not(:first)').find('td.filePath').eq(i).find('.editable').editable('show')
                    }, 500)
                    return
                }
            }
        }

        // let templateId
        // let ary = $('#fileType').children()
        // for (let i =0;i<ary.length;i++){
        //     if(ary[i].value === $('#fileType').val().value) {
        //         templateId = ary[i].id
        //         break
        //     }
        // }

        setUpPostAjax(
            '/data/save/template'
            ,{title: name + '模板_' + new Date().getTime()
                , type: $('#fileType').val()
                , typeId:  $('#marcType').val()
                , tableId: id
                , fields: data},
            '模板创建成功',null)
    }
}

getTemplate = (obj, type) =>{
    $.ajax({
        url: '/data/getTemplateById?_id=' + obj.value + '&type=' + type,
        success:function (result) {
            if (result.error) {
                showMessage(result.error, '')
            } else {
                if (type === 'marc') {
                    if (result.length > 0) {
                        $('#uploadFieldDiv').hide()
                        $('#uploadMarcFieldDiv').show()
                        $('#uploadMarcFields').bootstrapTable('load', result)
                    }
                } else {
                    if (result.length > 0) {
                        $('#uploadFieldDiv').show()
                        $('#uploadMarcFieldDiv').hide()
                        $('#uploadFields').bootstrapTable('load', result)
                    }
                }
            }
        }
    })
}

setUpPostAjax = (url, data, msg, obj,pageName)=> {
    $.ajax({
        url: url,
        type: 'post',
        data: data,
        success:function (result) {
            if (result.error) {
                if (url.indexOf('parse') > 0) {
                    $('#uploadResult').css('display','block')
                    $('#uploadMsg').html(result.error)
                } else {
                    showMessage(result.error,'')
                }
            } else {
                uploadedFiles = []
                if (obj) {
                    if (url.indexOf('parse') > 0) {
                        // window.location.reload()
                        // setTimeout(function() {
                            $('#uploadResult').css('display','block')
                            $('#uploadMsg').html(result.msg)
                        // }, 1000)
                    } else {
                        showMessage(result.msg ? result.msg : msg, 'success')
                        setTimeout(function() {
                            obj.modal('hide')
                            initList(name)
                        }, 500)
                    }
                } else {
                    showMessage(result.msg ? result.msg : msg, 'success')
                }
            }
        }
    })
}

backToData = (id, name)=> {
    $("#mainPageInner").load('/data', function(responseTxt,statusTxt,xhr){
        if(statusTxt=="success") {
            $.ajax({
                url: '/data/getField/' + id,
                success:function (result) {
                    if (result.error) {
                        showMessage(result.error,'')
                    } else {
                        $('#li-'+name.replace('tableList','')).parents('.nav-tabs').find('li.active').first().removeClass('active')
                        $('#li-'+name.replace('tableList','')).parents('li').addClass('active')
                        subListFields = result.data
                        $('#subTableId').val(id)
                        loadList(result.data, id, name.replace('tableList',''))
                    }
                }
            })
        } else if(statusTxt=="error") {
            showMessage('Error: '+xhr.status+': '+xhr.statusText,'')
        }
    })
}

backToMain = ()=>{
    $("#mainPageInner").load('/default')
    $('ul li.active').removeClass('active')
    $('#li-main').addClass('active')
}

showSubListDetail = (data, url, refField, refValue, tableId, tableName) =>{
    let fields = []
    for(let i=0;i<data.length;i++) {
        let e = data[i]
        if (!e.needShow)
            continue
        fields.push({
            field:e.name,
            title:e.title,
            sortable:e.needSort,
            width:"50px",
            class:'hasFile_' + Number(e.hasFile).toString() + ' refTable_' + ((e.refTable !== '' && e.refTable !== undefined) ? '1' : '0'),
        })
    }
    let subOptions = {
        url:url,
        striped: true,                      //是否显示行间隔色
        cache: true,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        // sortOrder: "asc",                   //排序方式
        sidePagination: "server",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        pageList: [5, 10, 25, 50, 100],     //可供选择的每页的行数（*）
        search: false,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,
        showColumns: false,                  //是否显示所有的列
        showRefresh: false,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: false,                //是否启用点击选中行
        iconSize:20,
        detailView:false,
        columns : fields,
        // height: getHeight(),                        //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
        uniqueId: "_id",
        queryParams : function (param) {
            let tmp = {}
            tmp[refField] = refValue
            let query = {
                key: tmp
                , tableId: tableId
                , tableName: tableName
            }
            return query
        }
    }

    $('#subListDetail').bootstrapTable(subOptions)
}

function showMessage(msg,type){
    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-top-center",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "1000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

    toastr[type === '' ? 'error' : type](msg,"提示");
}

querySubList = (id, name) =>{
    queryParam = {page: 0, tableId: id, tableName: name, limit: queryLimit,key: {}}
    for (let i = 0;i < subListFields.length; i++) {
        let obj = subListFields[i]
        if (obj.needQuery) {
            if ($('#'+name+'_'+obj.name).val() !== '' && $('#'+name+'_'+obj.name).val() !== undefined) {
                queryParam.key[obj.name] = {$regex: $('#'+name+'_'+obj.name).val()}
            }
        }
    }

    $.ajax({
        url: '/data/subList',
        data: queryParam,
        success:function (result) {
            if (result.error) {
                showMessage(result.error, '')
            } else {
                $('#tableList'+name).bootstrapTable('load', result)
            }
        }
    })
}

initList = (name)=>{
    queryStr = {}
    var tmp = name
    var url = name

    if (name === 'reply') {
        url = 'replyManager/reply'
    } else  if (name.indexOf('reply') === 0) {
        tmp = 'question'
    } else if (name === 'tag') {
        url = 'replyManager/tag'
    }
    tableOptions.url = '/' + url + '/list'
    tableOptions.columns = tableColumns[tmp].columns
    tableOptions.detailView = tableColumns[tmp].detailView
    tableOptions.onExpandRow = tableColumns[tmp].onExpandRow
    tableOptions.search = tableColumns[tmp].search !== undefined ? tableColumns[tmp].search: true
    tableOptions.toolbar = '#toolbar'+name
    tableOptions.toolbarAlign = 'left'
    tableOptions.buttonsAlign = 'left'
    tableOptions.searchAlign = 'left'
    if (tableColumns[tmp].showColumns !== undefined) {
        tableOptions.showColumns = tableColumns[tmp].showColumns
    }
    if (tableColumns[tmp].showRefresh !== undefined) {
        tableOptions.showRefresh = tableColumns[tmp].showRefresh
    }
    if (tableColumns[tmp].onCheck !== undefined) {
        tableOptions.onCheck = tableColumns[tmp].onCheck
    }
    if (tableColumns[tmp].onUncheck !== undefined) {
        tableOptions.onUncheck = tableColumns[tmp].onUncheck
    }
    if (tableColumns[tmp].onCheckAll !== undefined) {
        tableOptions.onCheckAll = tableColumns[tmp].onCheckAll
    }
    if (tableColumns[tmp].onUncheckAll !== undefined) {
        tableOptions.onUncheckAll = tableColumns[tmp].onUncheckAll
    }

    $("#tableList" + name).bootstrapTable(tableOptions)

    clearModalView()

    setTimeout(function() {
        $("#tableList" + name).bootstrapTable('resetView', {
            height: getCardHeight()
        })
    }, 100)
}

reloadList = (name)=>{
    clearModalView()
    $("#tableList" + name).bootstrapTable('refresh')
}

clearModalView = ()=>{
    try{
        let $this = $('.modal')[0]

        let divObj = $("div[id="+ $this.id +"]")[0]
        getChildrenNode(divObj)
    }catch (e) {

    }
}

clearParams = (name) =>{
    $("input[id^='"+name+"_field']").val('')
}

reloadList = (name)=>{
    var tmp = name
    var url = name

    if (name === 'replyManager/reply') {
        name = 'reply'
        tmp = 'reply'
    } else  if (name.indexOf('reply') === 0) {
        tmp = 'question'
    } else if (name === 'taet') {
        url = 'replyManager/tag'
    }
    tableOptions.url = '/' + url + '/list'
    tableOptions.columns = tableColumns[tmp].columns
    tableOptions.detailView = tableColumns[tmp].detailView
    tableOptions.onExpandRow = tableColumns[tmp].onExpandRow
    tableOptions.search = tableColumns[tmp].search !== undefined ? tableColumns[tmp].search: true
    tableOptions.toolbar = '#toolbar'+name
    tableOptions.toolbarAlign = 'left'
    tableOptions.buttonsAlign = 'left'
    tableOptions.searchAlign = 'left'
    if (tableColumns[tmp].showColumns !== undefined) {
        tableOptions.showColumns = tableColumns[tmp].showColumns
    }
    if (tableColumns[tmp].showRefresh !== undefined) {
        tableOptions.showRefresh = tableColumns[tmp].showRefresh
    }
    if (tableColumns[tmp].onCheck !== undefined) {
        tableOptions.onCheck = tableColumns[tmp].onCheck
    }
    if (tableColumns[tmp].onUncheck !== undefined) {
        tableOptions.onUncheck = tableColumns[tmp].onUncheck
    }
    if (tableColumns[tmp].onCheckAll !== undefined) {
        tableOptions.onCheckAll = tableColumns[tmp].onCheckAll
    }
    if (tableColumns[tmp].onUncheckAll !== undefined) {
        tableOptions.onUncheckAll = tableColumns[tmp].onUncheckAll
    }

    $("#tableList" + name).bootstrapTable(tableOptions)

    clearModalView()

    setTimeout(function() {
        $("#tableList" + name).bootstrapTable('resetView', {
            height: getCardHeight()
        })
    }, 100)
}