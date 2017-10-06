$(document).ready(function () {
    var top_pad
    collapseSidebar = ()=> {
        return
        $('body').toggleClass("small-sidebar")
    }

    $('#loginBtn').resize(function () {
        if (this.clientWidth < 100) {
            $('#logoutSpan').hide()
            $(".accordion-menu").find(".li").css('padding', '0px')
            // $(".accordion-menu").find(".li").css('height', '0px 0px')
        } else {
            $('#logoutSpan').show()
            $(".accordion-menu").find(".li").css('padding', top_pad + 'px 24px')
        }
    })

    loginOut = ()=>{
        let remindMe = storage['remindMe']
        let username = storage['username']
        let password = storage['password']
        window.localStorage.clear()
        if (remindMe) {
            storage['remindMe'] = remindMe
            storage['username'] = username
            storage['password'] = password
        }
        window.parent.location.href='/'
    }

    $('.page-sidebar').resize(function() {
        resetMenu()
    })

    resetMenu()
})

resetMenu = ()=>{
    let menus = JSON.parse(storage['menus'])
    let h = window.innerHeight
    let h1 = $('.sidebar-header')[0].clientHeight

    if (menus.length > 0) {
        let tmp = ( h - h1 - 40) / (menus.length + 1)
        // console.log(tmp)
        let mark = 0
        if (tmp < 52) {
            mark = 5
            $('#mainBody').addClass('compact-menu')
        } else {
            $('#mainBody').removeClass('compact-menu')
        }
        $(".accordion-menu").find(".li").each(function (index, node) {
            for (let i = 0; i < node.childNodes.length; i++) {
                let obj = node.childNodes[i]
                if (obj.nodeName === 'A') {
                    let padding
                    if (mark === 0) {
                        padding = Math.ceil(((h - 50 - h1) / (menus.length + 1) - 57) / 2)
                        top_pad = padding < mark ? mark : padding
                    } else {
                        padding = Math.ceil(((h - 50 - h1) / (menus.length + 1) - 26) / 2)
                        top_pad = padding < mark ? mark : padding
                    }
                    obj.style.padding = Math.min(top_pad,25) + "px 24px"
                }
            }
        })
    }
}

showPage = (obj,url) =>{
    $('ul li.active').removeClass('active')
    $(obj).parents(':first').addClass('active')
    if(url === '/reply') {
        url = '/replyManager/reply'
    }
    $("#mainPageInner").load(url, function(responseTxt,statusTxt,xhr){
        if(statusTxt=="success") {
            if (url === '/validword') {
                $('#vaildwordInput').tagsinput({
                    cancelConfirmKeysOnEmpty: true,
                    tagClass: 'label btn-instagram p-v-xxs p-h-xs m',
                    onTagExists: function(item, $tag) {
                        showMessage('该标签已存在', '')
                    }
                })
                $('#vaildwordInput').on('beforeItemAdd', function(event) {
                    var tag = event.item;

                    if (!event.options || !event.options.preventPost) {
                        $.ajax({
                            url: '/validword/add',
                            type: 'post',
                            data: {name:tag},
                            success: (result) => {
                                if (result.error) {
                                    showMessage(result.error, '')
                                } else {
                                    showMessage('关键词增加成功', 'success')
                                }
                            }
                        })
                    }
                });

                $('#vaildwordInput').on('beforeItemRemove', function(event) {
                    var tag = event.item;
                    if (!event.options || !event.options.preventPost) {
                        $.ajax({
                            url: '/validword/'+tag,
                            type: 'delete',
                            success: (result) => {
                                if (result.error) {
                                    showMessage(result.error, '')
                                } else {
                                    showMessage('关键词删除成功', 'success')
                                }
                            }
                        })
                    }
                });

                return
            }
            if (url.indexOf('client') > 0) {
                $('input').iCheck({
                    radioClass: 'iradio_square-blue',
                    checkboxClass: 'icheckbox_square-blue',
                    increaseArea: '20%' // optional
                })
                initColumns()
                initIndexs()
                return
            }

            if (url.indexOf('question') > 0) {
                $('#loginBtn').resize(function () {
                    if (this.clientWidth < 100) {
                        $('#logoutSpan').hide()
                        $(".accordion-menu").find(".li").css('padding', '0px')
                        // $(".accordion-menu").find(".li").css('height', '0px 0px')
                    } else {
                        $('#logoutSpan').show()
                        $(".accordion-menu").find(".li").css('padding', top_pad + 'px 24px')
                    }
                })
            }

            if (url === '/replyManager') {
                $('#questionLoadDiv').load('/replyManager/reload',function () {
                    initList('replyManager')
                    queryStr = {status: 0}
                    changeBtn()
                    $('.date-picker').datetimepicker({
                        language: "zh-CN",
                        endDate:new Date(),
                        orientation: "top auto",
                        startView:'month',
                        minView:'month',
                        format:'yyyy-mm-dd',
                        autoclose: true
                    })
                    $('tableListreplyManager').bootstrapTable('height', getCardHeight())
                })
            } else {
                if (url === '/replyManager/reply') {
                    $('#replyLoadDiv').load('/replyManager/reply/reload',function () {
                        initList('reply')
                        queryStr = {status: 0}
                        changeRelyBtn()
                        $('.date-picker').datetimepicker({
                            language: "zh-CN",
                            endDate:new Date(),
                            orientation: "top auto",
                            startView:'month',
                            minView:'month',
                            format:'yyyy-mm-dd',
                            autoclose: true
                        })
                        $('tableListreply').bootstrapTable('height', getCardHeight())
                    })
                } else {
                    initList(url.replace('/',''))
                }
            }

        } else if(statusTxt=="error") {
            showMessage('Error: '+xhr.status+': '+xhr.statusText,'')
        }
    })
}

reloadPage = (url)=>{
    $("#mainPageInner").load(url, function(responseTxt,statusTxt,xhr){
        if(statusTxt=="success") {
            initList(url.replace('/',''))
        } else if(statusTxt=="error") {
            showMessage('Error: '+xhr.status+': '+xhr.statusText,'')
        }
    })
}