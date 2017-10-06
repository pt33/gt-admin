$(document).ready(function () {
    var $adminValidator
    initAdminValiate = ()=>{
        $adminValidator = $("#addAdminForm").validate({
            rules: {
                adminName: {
                    required: true,
                    remote: {
                        url: "/admins/checkAdminName",     //后台处理程序
                        type: "post",               //数据发送方式
                        dataType: "json",           //接受数据格式
                        data: {                     //要传递的数据
                            name: function() {
                                return $("#adminName").val();
                            }
                        }
                    }
                },
                adminRole: {
                    required: true
                }
            },
            messages: {
                adminName: {
                    required: '系统账户不能为空',
                    remote: '系统账户已存在'
                },
                adminRole: {
                    required: '请选择账户角色'
                }
            }
        })
    }

    saveAdmin = async ()=>{
        initAdminValiate()
        var $valid = await $("#addAdminForm").valid();
        if(!$valid) {
            $adminValidator.focusInvalid();
            return false;
        } else {
            $.ajax({
                url: '/admins/save',
                type: 'post',
                data: {
                    username: $('#adminName').val(),
                    password: ($('#adminPassword').val() | '123456'),
                    roleId: $('#adminRole').val()
                },
                success: (result) => {
                    if (result.error) {
                        showMessage(result.error, '')
                    } else {
                        showMessage(result.msg ? result.msg : '账户创建成功', 'success')
                        setTimeout(function () {
                            reloadList('admins')
                            $('#addAdminModal').modal('hide')
                        }, 1000)
                    }
                }
            })
        }
    }

    adminConfirmClick = () =>{
        let url, msg
        let type = $('#adminConfirmType').val()
        let methodType = 'get'
        if (type === 'reset') {
            url = '/admins/reset/' + $('#adminId').val() + '/' + $('#resetName').val()
            msg = '密码重置成功'
            methodType = 'put'
        } else if (type === 'lock') {
            url = '/admins/setStatus/' + $('#adminId').val() + '/-1'
            msg = '账号冻结成功'
        } else if (type === 'unlock') {
            url = '/admins/setStatus/' + $('#adminId').val() + '/1'
            msg = '账号解冻成功'
        } else if (type === 'del') {
            url = '/admins/' + $('#adminId').val()
            msg = '账号删除成功'
            methodType = 'delete'
        }
        $.ajax({
            url: url,
            type:methodType,
            success:function (result) {
                if (result.error) {
                    showMessage(result.error,'')
                } else if (result.statusCode === 200){
                    showMessage(msg,'success')
                    setTimeout(function() {
                        reloadList('admins')
                        $('#confirmAdminModal').modal('hide')
                    }, 500)
                }
            }
        })
    }
})