$(document).ready(function () {

    $("#tableList" + name).bootstrapTable('resetView', {
        height: getCardHeight()
    })

    // showTagList = (obj) => {
    //     $(obj).parents('.nav-tabs').find('li.active').first().removeClass('active')
    //     $(obj).parents('li').last().addClass('active')
    //
    //     let prev = $("div[id='questionList']")
    //     prev.removeClass('active')
    //     prev.css('display', 'none')
    //     $("#tagList").css('display', 'block')
    //     $("#tableListtag").addClass('active')
    //     initList('tag')
    // }

    showQuestionList = (obj) => {
        $(obj).parents('.nav-tabs').find('li.active').first().removeClass('active')
        $(obj).parents('li').last().addClass('active')

        let prev = $("div[id='tagList']")
        prev.removeClass('active')
        prev.css('display', 'none')
        $("#questionList").css('display', 'block')
        $("#questionListreplyManager").addClass('active')
    }

    showContent = (id) => {
        $('#questionLoadDiv').load('/replyManager/detail?id=' + id, function () {
            if ($('#grid-gallery').length > 0) {
                new CBPGridGallery(document.getElementById('grid-gallery'))
            }
            $('#questionLoadDiv').css('height', window.innerHeight - 110)
            changeBtn()
            $('.message-options button[class*=status]').hide()
            $('.message-options button.status' + $('#detail_status').val()).show()
            $('.message-options button.status' + $('#detail_status').val()+$('#detail_reply').val()).show()
            $('.message-options button.status' + $('#detail_status').val()+$('#detail_reply').val()+$('#detail_isCommonly').val()).show()

        })
    }

    showReply = (id) => {
        $('#replyLoadDiv').load('/replyManager/reply/detail?id=' + id, function () {
            if ($('#grid-gallery').length > 0) {
                new CBPGridGallery(document.getElementById('grid-gallery'))
            }
            $('#replyLoadDiv').css('height', window.innerHeight - 110)

            $('#questionContent').summernote({
                lang: 'zh-CN',
                placeholder: '请输入问题回复...',
                minHeight: 250,
                maxHeight: 800,
                focus: true,
                autoLink: false,
                height: 300,
                toolbar: false,
                disableDragAndDrop: true,
                disableResizeEditor: true,
                callbacks: {
                    onChange: function(contents, $editable) {
                        $('.note-editor.note-frame .note-placeholder').css('color', 'gray')
                        $('.note-editor.note-frame .note-placeholder').hide()
                        $('.note-editor.note-frame .note-editable').css('borderColor', '#ddd')
                    }
                }
            })

        })
    }

    changeSubContent = () => {
        if ($('.mailbox-content').length > 0 && $('#questionLoadDiv').length > 0) {
            $('#questionLoadDiv').css('height', window.innerHeight - 110)
        }
    }

    changeReplyContent = function(){
        if ($('.mailbox-content').length > 0 && $('#replyLoadDiv').length > 0) {
            $('#replyLoadDiv').css('height', window.innerHeight - 110)
        }
    }

    qaConfirmClick = () => {

        var users = []
        var check = $('.replyCheck:checked')
        var url = '/replyManager/change'
        var type = 'put'
        var data = {
            id: $('#qid').val(),
            status: $('#qaStatus').val()
        }

        if ($('#qaStatus').val() === '2') {
            for (var i in check) {
                users.push(check[i].value)
            }
            url = '/replyManager/send'
            type = 'post'
            data = {
                ids: [$('#qid').val()],
                users: users
            }
        }

        $.ajax({
            url: url,
            type: type,
            data: data,
            success: (result) => {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    $('#confirmQuestionModal').modal('hide')
                    showMessage('操作成功', 'success')
                    $('#cnts').val(result.info)
                    setTimeout(function () {
                        $('#questionLoadDiv').load('/replyManager/detail?id=' + $('#qid').val(), function () {
                            if ($('#grid-gallery').length > 0) {
                                new CBPGridGallery(document.getElementById('grid-gallery'))
                            }
                            $('#questionLoadDiv').css('height', window.innerHeight - 110)
                            changeBtn()

                            $('.message-options button[class*=status]').hide()
                            $('.message-options button.status' + $('#detail_status').val()).show()
                            $('.message-options button.status' + $('#detail_status').val()+$('#detail_reply').val()).show()
                            $('.message-options button.status' + $('#detail_status').val()+$('#detail_reply').val()+$('#detail_isCommonly').val()).show()
                        })
                    }, 1000)
                }
            }
        })
    }

    changeStatus = (status) => {
        $('#qaStatus').val(status)
        if (Number(status) === 0) {
            $('#qaConfirmTitle').html('是否确认撤消之前的操作？')
        } else if (Number(status) === 1) {
            $('#qaConfirmTitle').html('是否确认通过？')
        } else if (Number(status) === 2) {
            var check = $('.replyCheck:checked')
            if (check.length === 0) {
                showMessage('请选择需要指派的古籍馆专家', '')
                return
            }
            $('#qaConfirmTitle').html('是否确认指派？')
        } else if (Number(status) === -1) {
            $('#qaConfirmTitle').html('是否确认拒绝？')
        } else if (Number(status) === -2) {
            $('#qaConfirmTitle').html('是否确认删除？')
        } else if (Number(status) === 3) {
            $('#qaConfirmTitle').html('是否确认标星？')
        } else if (Number(status) === 4) {
            $('#qaConfirmTitle').html('是否确认置灰？')
        }
        $('#confirmQuestionModal').modal({
            show: true
        })
    }

    reloadQAList = (param, obj) => {
        $('#startTime').val('')
        $('#endTime').val('')
        $('#title').val('')
        $('#questionNav li.active').removeClass('active')
        $(obj).parents('li').first().addClass('active')
        checkedIds = {}
        queryStr = JSON.parse(param)
        if ($("#tableListreplyManager:visible").length === 0) {
            $('#questionLoadDiv').load('/replyManager/reload', function () {
                reloadList('replyManager')
                changeBtn()
            })
        } else {
            $("#tableListreplyManager").bootstrapTable('refresh')
            changeBtn()
        }
    }

    reloadReplyList = (param, obj) => {
        $('#reply_s').val('')
        $('#reply_e').val('')
        $('#reply_title').val('')
        $('#replyNav li.active').removeClass('active')
        $(obj).parents('li').first().addClass('active')
        queryStr = JSON.parse(param)
        if ($("#tableListreply:visible").length === 0) {
            $('#replyLoadDiv').load('/replyManager/reply/reload', function () {
                reloadList('replyManager/reply')
                changeBtn()
            })
        } else {
            $("#tableListreply").bootstrapTable('refresh')
            changeBtn()
        }
    }

    changeBtn = function () {
        if (Object.keys(checkedIds).length === 0 || $("#tableListreplyManager").bootstrapTable('getSelections').length === 0) {
            $('#toolbarreplyManager button[class*=status]').hide()
        } else {
            if (queryStr.status !== undefined && $("#tableListreplyManager").bootstrapTable('getSelections').length !== 0) {
                $('#toolbarreplyManager button.status' + queryStr.status).show()

                if(queryStr.reply !== undefined && queryStr.reply !== '') {
                    var tmp = queryStr.reply !== Number(0) ? 1 : 0
                    $('#toolbarreplyManager button.status' + queryStr.status+tmp).show()
                }

                if(queryStr.isCommonly !== undefined && queryStr.isCommonly !== '') {
                    $('#toolbarreplyManager button.status' + queryStr.status+'1'+queryStr.isCommonly).show()
                }
            }
        }

        $('span[id*=cnt]').html('')
        if ($('#cnts').val() !== '') {
            var tmp = $('#cnts').val()
            var cnts = JSON.parse(tmp)
            for (var i in cnts) {
                $('#cnt' + cnts[i].status).html('')
                $('#cnt' + cnts[i].status).html(cnts[i].cnt)
            }
        }
    }

    searchQA = () => {
        var s = $('#startTime').val()
        var e = $('#endTime').val()
        var key = $('#title').val()

        if (s !== '' && e !== '') {
            queryStr.createTime = {"$gte": new Date(s + "T00:00:00"), "$lte": new Date(e + "T00:00:00")}
        } else if (s !== '') {
            queryStr.createTime = {"$gte": new Date(s + "T00:00:00")}
        } else if (e !== '') {
            queryStr.createTime = {"$lte": new Date(e + "T00:00:00")}
        }
        if (key !== '') {
            queryStr.title = {$regex: key}
        }
        $("#tableListreplyManager").bootstrapTable('refresh')
    }

    searchReply = () => {
        var s = $('#reply_s').val()
        var e = $('#reply_e').val()
        var key = $('#reply_title').val()

        if (s !== '' && e !== '') {
            queryStr.createTime = {"$gte": new Date(s + "T00:00:00"), "$lte": new Date(e + "T00:00:00")}
        } else if (s !== '') {
            queryStr.createTime = {"$gte": new Date(s + "T00:00:00")}
        } else if (e !== '') {
            queryStr.createTime = {"$lte": new Date(e + "T00:00:00")}
        }
        if (key !== '') {
            queryStr.title = {$regex: key}
        }
        $("#tableListreply").bootstrapTable('refresh')
    }

    reSearchReply = () => {
        $('#reply_s').val('')
        $('#reply_e').val('')
        $('#reply_title').val('')
        delete queryStr.title
        delete queryStr.createTime
        $("#tableListreply").bootstrapTable('refresh')
    }

    reSearch = () => {
        $('#startTime').val('')
        $('#endTime').val('')
        $('#title').val('')
        delete queryStr.title
        delete queryStr.createTime
        $("#tableListreplyManager").bootstrapTable('refresh')
        changeBtn()
    }

    batchOP = (status) => {
        $('#qaStatus').val(status)
        if (Number(status) === 1) {
            $('#batchConfirmTitle').html('是否确认批量通过？')
        } else if (Number(status) === -1) {
            $('#batchConfirmTitle').html('是否确认批量拒绝？')
        } else if (Number(status) === 2) {
            var check = $('.replyCheck:checked')
            if (check.length === 0) {
                showMessage('请选择需要指派的古籍馆专家', '')
                return
            }
            $('#batchConfirmTitle').html('是否确认指派？')
        } else if (Number(status) === -2) {
            $('#batchConfirmTitle').html('是否确认批量删除？')
        } else if (Number(status) === 0) {
            $('#batchConfirmTitle').html('是否确认批量撤消？')
        } else if (Number(status) === 3) {
            $('#batchConfirmTitle').html('是否确认批量标星？')
        } else if (Number(status) === 4) {
            $('#batchConfirmTitle').html('是否确认批量置灰？')
        }
        $('#batchConfirmModal').modal({
            show: true
        })
    }

    batchConfirmClick = () => {
        var ids = Object.keys(checkedIds)
        var users = []
        var check = $('.replyCheck:checked')
        var url = '/replyManager/batch'
        var type = 'put'
        var data = {
            ids: ids,
            status: $('#qaStatus').val()
        }

        if ($('#qaStatus').val() === '2') {

            for (var i in check) {
                users.push(check[i].value)
            }
            url = '/replyManager/send'
            type = 'post'
            data = {
                ids: ids,
                users: users
            }
        }

        $.ajax({
            url: url,
            type: type,
            data: data,
            success: (result) => {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    $('#batchConfirmModal').modal('hide')
                    $('#cnts').val(result.info)
                    showMessage('批量操作成功', 'success')
                    setTimeout(function () {
                        checkedIds = {}
                        $('.replyCheck:checked').attr('checked', false)
                        $("#tableListreplyManager").bootstrapTable('refresh')
                        changeBtn()
                    }, 1000)
                }
            }
        })
    }

    changeRelyBtn = function () {
        $('span[id*=cnt]').html('')
        if ($('#cnts').val() !== '') {
            var tmp = $('#cnts').val()
            var cnts = JSON.parse(tmp)
            for (var i in cnts) {
                $('#cnt' + cnts[i].status).html(cnts[i].cnt)
            }
        }
    }

    resetMyEvent = function (e) {
        // if (e.bubbles) {
        e.originalEvent.stopPropagation()
        // }
        var types = e.originalEvent.clipboardData.types
        var content = ''
        for (var i in types) {
            if (types[i] === 'text/html') {
                content = e.originalEvent.clipboardData.getData('text/html')
                break;
            } else if (types[i] === 'text/plain') {
                content = e.originalEvent.clipboardData.getData('text/plain')
            }
        }

        if (content === '') {
            $('#questionContent').attr('data-notify-msg', '输入有误，只能输入文字信息')
            $('#questionContent').attr('data-notify-type', 'error')
            SEMICOLON.widget.notifications($('#questionContent'))
            return
        }
        var contentsContainer = $('<div></div>').html(content)
        contentsContainer.removeAttr('style')
        contentsContainer.children().each(function (e, obj) {
            if (obj.innerHTML !== '') {
                obj.removeAttribute('style')
                if ($(obj).children().length !== 0) {
                    $(obj).children().removeAttr('style')
                    clearStyle(obj)
                }
            } else {
                if (obj.outerHTML.indexOf('br') < 0)
                    contentsContainer[0].removeChild(obj)
            }
        })

        $('#questionContent').summernote('pasteHTML', contentsContainer.html())
        $('.note-editor.note-frame .note-placeholder').css('color', 'gray')
        $('.note-editor.note-frame .note-placeholder').hide()
        $('.note-editor.note-frame').css('borderColor', '#ddd')
    }

    function clearStyle(dom) {
        $(dom).children().each(function (e, obj) {
            if (obj.innerHTML !== '') {
                obj.removeAttribute('style')
                if ($(obj).children().length !== 0) {
                    $(obj).children().removeAttr('style')
                    clearStyle(obj)
                }
            } else {
                if (obj.outerHTML.indexOf('br') < 0)
                    $(dom)[0].removeChild(obj)
            }
        })
    }

    backToReply = function() {
        $('#replyLoadDiv').load('/replyManager/reply/reload', function () {
            reloadList('replyManager/reply')
            // changeRelyBtn()
        })
    }

    backToQuestion = function() {
        $('#questionLoadDiv').load('/replyManager/reload', function () {
            reloadList('replyManager')
            changeBtn()
        })
    }

    commitReply = function() {
        var checkNote = $('#questionContent').summernote('isEmpty')
        if(checkNote) {
            $('#questionContent').summernote('focus')
            $('.note-editor.note-frame .note-placeholder').css('color','#d43f3a')
            $('.note-editor.note-frame .note-placeholder').show()
            $('.note-editor.note-frame .note-editable').css('borderColor', '#d43f3a')
            return
        }
        var str = $('#questionContent').summernote('code')
        $.ajax({
            url: '/replyManager/reply/comment',
            type: 'post',
            data: {
                qid: $('#qId').val(),
                tid: $('#tid').val(),
                content:encodeURI(str),
                adminname: $('#admin_name').val()
            },
            success: (result) => {
                if (result.error) {
                    showMessage(result.error, '')
                } else {
                    showMessage('操作成功', 'success')
                    $('#cnts').val(result.info)
                    changeRelyBtn()
                    showReply($('#tid').val())
                }
            }
        })
    }

    showTagList = function (obj) {
        $('#questionNav li.active').removeClass('active')
        $(obj).parents('li').first().addClass('active')
        checkedIds = {}

        $('#questionLoadDiv').load('/replyManager/tag', function () {
            initList('tag')
            changeBtn()
        })
    }
})


