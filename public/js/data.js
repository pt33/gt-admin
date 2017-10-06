$(document).ready(function () {
    var marcTypeFiles = []
    var $dataValidator, $templateValidator, $marcTypeValidator
    initDataValiate = ()=>{
        $dataValidator = $("#addTableForm").validate({
            rules: {
                tableName: {
                    required: true,
                    remote: {
                        url: "/data/checkTableName",     //后台处理程序
                        type: "post",               //数据发送方式
                        dataType: "json",           //接受数据格式
                        data: {                     //要传递的数据
                            title: function() {
                                return $("#tableName").val();
                            },
                            tableId: function() {
                                return $("#tableId").val();
                            }
                        }
                    }
                },
                tableType: {
                    required: true
                }
            },
            messages: {
                tableName: {
                    required: '资料库名称不能为空',
                    remote: '资料库已存在'
                },
                tableType: {
                    required: '资料库分类不能为空'
                }
            }
        })
    }

    initTemplateValiate = ()=>{
        $templateValidator = $("#addTemplateForm").validate({
            rules: {
                templateName: {
                    required: true,
                    remote: {
                        url: "/template/checkTemplateName",     //后台处理程序
                        type: "post",               //数据发送方式
                        dataType: "json",           //接受数据格式
                        data: {                     //要传递的数据
                            title: function() {
                                return $("#templateName").val();
                            }
                        }
                    }
                },
                templateType: {
                    required: true
                },
                marcType: {
                    required: true
                },
                templateTable: {
                    required: true
                }
            },
            messages: {
                templateName: {
                    required: '模板名称不能为空',
                    remote: '模板名称已存在'
                },
                templateType: {
                    required: '模板类型不能为空'
                },
                marcType: {
                    required: 'marc模板类型不能为空'
                },
                templateTable: {
                    required: '对应资料库不能为空'
                }
            }
        })
    }

    initMarcTypeValiate=()=>{
        $marcTypeValidator = $("#addMarcTypeForm").validate({
            rules: {
                marcTypeName: {
                    required: true,
                    remote: {
                        url: "/template/checkMarcTypeName",     //后台处理程序
                        type: "post",               //数据发送方式
                        dataType: "json",           //接受数据格式
                        data: {                     //要传递的数据
                            title: function() {
                                return $("#marcTypeName").val();
                            }
                        }
                    }
                }
            },
            messages: {
                marcTypeName: {
                    required: 'marc模板类型名不能为空',
                    remote: 'marc模板类型名已存在'
                }
            }
        })
    }

    addTable = () =>{
        clearModalView()
        $('#tableModelTitle').html('新建资料库')
        $('#addTableModel').modal('show')
    }

    deleteTable = ()=>{
        $.ajax({
            url: '/data/' +  $('#tableId').val(),
            type:'delete',
            success:function (result) {
                if (result.error) {
                    showMessage(result.error,'')
                } else if (result.statusCode === 200){
                    showMessage('资料库删除成功','success')
                    $('#confirmTableModal').modal('hide')
                    setTimeout(function() {
                        reloadPage('/data')
                    }, 1000)
                }
            }
        })
    }

    saveTable = async () => {
        initDataValiate()
        var $valid = await $("#addTableForm").valid();
        var msg = ($('#tableId').val() === undefined || $('#tableId').val() === '') ? '资料库创建成功' : '资料库编辑成功'
        if(!$valid) {
            $dataValidator.focusInvalid();
            return false;
        } else {
            $.ajax({
                url: '/data/save/table',
                type: 'post',
                data: {
                    tableId: $('#tableId').val(),
                    type: $('#tableType').val(),
                    title: $('#tableName').val()
                },
                success: (result) => {
                    if (result.error) {
                        showMessage(result.error, '')
                    } else {
                        showMessage(result.msg ? result.msg : msg, 'success')
                        $('#addTableModel').modal('hide')
                        setTimeout(function () {
                            reloadPage('/data')
                        }, 1000)
                    }
                }
            })
        }
    }

    saveTemplate = async () =>{
        initTemplateValiate()
        var $valid = await $("#addTemplateForm").valid();
        if(!$valid) {
            $templateValidator.focusInvalid();
            return false;
        } else {
            $.ajax({
                url: '/template/save',
                type: 'post',
                data: {
                    tableId: $('#templateTable').val(),
                    type: $('#templateType').val(),
                    typeId: $('#marcType').val(),
                    title: $('#templateName').val()
                },
                success: (result) => {
                    if (result.error) {
                        showMessage(result.error, '')
                    } else {
                        showMessage('模板创建成功', 'success')
                        $('#addTemplateModal').modal('hide')
                        clearModalView()
                        setTimeout(function () {
                            $("#tableListtemplate").bootstrapTable('refresh')
                        }, 1000)
                    }
                }
            })
        }
    }

    changeType = (obj)=> {
        $('#tableType').val($(obj).val())
    }

    showTableDetail = (obj,id, name)=>{
        $('#subTableId').val(id)
        $(obj).parents('.nav-tabs').find('li.active').first().removeClass('active')
        $(obj).parents('li').last().addClass('active')
        queryParam.key = {}
        $.ajax({
            url: '/data/getField/' + id,
            success:function (result) {
                if (result.error) {
                    showMessage(result.error,'')
                } else {
                    subListFields = result.data
                    loadList(result.data, id, name)
                }
            }
        })
    }

    showTableList = (obj) =>{
        queryParam.key = {}
        $(obj).parents('.nav-tabs').find('li.active').first().removeClass('active')
        $(obj).parents('li').last().addClass('active')
        reloadPage('/data')
    }

    showTemplateList = (obj)=>{
        $(obj).parents('.nav-tabs').find('li.active').first().removeClass('active')
        $(obj).parents('li').last().addClass('active')

        let prev = $("div[class='tab-pane active']")
        prev.removeClass('active')
        prev.css('display','none')
        $("#tabTemplate").css('display','block')
        $("#tabTemplate").addClass('active')

        initList('template')
    }

    showErrorList = (obj)=>{
        $(obj).parents('.nav-tabs').find('li.active').first().removeClass('active')
        $(obj).parents('li').last().addClass('active')

        let prev = $("div[class='tab-pane active']")
        prev.removeClass('active')
        prev.css('display','none')
        $("#tabLog").css('display','block')
        $("#tabLog").addClass('active')

        initList('log')

        $('.date-picker').datetimepicker({
            language: "zh-CN",
            endDate:new Date(),
            // hoursDisabled: true,
            // minutesDisabled: true,
            orientation: "top auto",
            autoclose: true
        })
    }

    showLocationList = (obj)=>{
        $(obj).parents('.nav-tabs').find('li.active').first().removeClass('active')
        $(obj).parents('li').last().addClass('active')
        let prev = $("div[class='tab-pane active']")
        prev.removeClass('active')
        prev.css('display','none')
        $("#tabLocation").css('display','block')
        $("#tabLocation").addClass('active')

        initList('location')
    }

    deleteTemplate = ()=>{
        $.ajax({
            url: '/template/' +  $('#templateId').val(),
            type:'delete',
            success:function (result) {
                if (result.error) {
                    showMessage(result.error,'')
                } else if (result.statusCode === 200){
                    showMessage('模板删除成功','success')
                    $('#confirmTemplateModal').modal('hide')
                    setTimeout(function() {
                        $("#tableListtemplate").bootstrapTable('refresh')
                    }, 1000)
                }
            }
        })
    }

    resetCardView = ()=> {
        let h = window.innerHeight
        return h - 320
    }

    showMarc = (obj)=>{
        if (obj.value === 'marc') {
            $.ajax({
                url: '/template/getMarcType',
                success:function (result) {
                    if (result.error) {
                        showMessage(result.error,'')
                    } else {
                        for (var i in result) {
                            $("#marcType").append("<option value='" + result[i]._id.toString() + "'>" +result[i].name+ "</option>")
                        }
                        $('#marcType').show()
                    }
                }
            })
        } else {
            $('#marcType').hide()
            $("#marcType").empty()
            $("#marcType").append("<option value=''>请选择marc模板类型</option>")
            $('#marcType-error').hide()
        }
    }

    showMarcUploader = () =>{
        $('#addMarcTypeModal').modal('show')
        initMarcTypeUploader()


    }

    initMarcTypeUploader = ()=>{
        if ($("#marcTypeUploader").pluploadQueue()) {
            $("#marcTypeUploader").pluploadQueue().destroy()
        }

        $("#marcTypeUploader").pluploadQueue({
            rename : false,
            dragdrop: true,
            multiple_queues: false,
            filters : {
                max_file_size : '1024mb',
                prevent_duplicates: true,
                mime_types: [
                    {title: 'marc文件', extensions: 'iso'},
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
            url: '/template/upload',
            multi_selection: false,
            flash_swf_url : '/plugins/plupload/js/Moxie.swf',
            silverlight_xap_url : '/plugins/plupload/js/Moxie.xap',
            init:{
                Error: function(uploader,errObjecs) {
                    showMessage(errObjecs.message, '');
                }
            }
        })

        $('#marcTypeUploader').pluploadQueue().bind('UploadComplete', marcTypeUploadComplete)
        $('#marcTypeUploader').pluploadQueue().bind('FilesAdded', marcTypeFilesAdded)
        $('#marcTypeUploader').pluploadQueue().bind('FileUploaded', marcTypeFileUploaded)
    }

    marcTypeUploadComplete = (uploader,files)=> {
        $.ajax({
            url: '/template/parse',
            type: 'post',
            data: {
                paths: JSON.stringify(marcTypeFiles),
                name: $('#marcTypeName').val()
            },
            success: (result) => {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    showMessage('marc模板类型解析成功','success')
                    marcTypeFiles = []
                    initMarcTypeUploader()
                    $('#marcTypeName').val('')
                }
            }
        })
    }

    marcTypeFileUploaded = (uploader,file,responseObject) =>{
        if (responseObject.response.error) {
            showMessage(responseObject.response.error)
            $('#marcTypeUploader').pluploadQueue().stop()
        } else {
            marcTypeFiles.push(JSON.parse(responseObject.response))
        }
    }

    marcTypeFilesAdded = (uploader,files)=>{
        for (var i in files) {
            if (files[i].name.indexOf('.iso') < 0 ) {
                showMessage('文件类型错误', '')
                $('#marcTypeUploader').pluploadQueue().removeFile(files[i])
            }
        }
    }

    saveMarcType = async ()=> {
        initMarcTypeValiate()
        var $valid = await $("#addMarcTypeForm").valid();
        if(!$valid) {
            $marcTypeValidator.focusInvalid();
            return false;
        } else {
            if ($('#marcTypeUploader').pluploadQueue().files.length > 1) {
                showMessage('一次只能上传一个文件', '')
            } else if ($('#marcTypeUploader').pluploadQueue().files.length === 0) {
                showMessage('请选择需要解析的文件', '')
            } else {
                $('#marcTypeUploader').pluploadQueue().start()
            }
        }
    }
})