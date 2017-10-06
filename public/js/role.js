$(document).ready(function () {
    var $roleValidator
    initRoleValiate = ()=>{
        $roleValidator = $("#addRoleForm").validate({
            rules: {
                roleName: {
                    required: true,
                    remote: {
                        url: "/role/checkRoleName",     //后台处理程序
                        type: "post",               //数据发送方式
                        dataType: "json",           //接受数据格式
                        data: {                     //要传递的数据
                            name: function() {
                                return $("#roleName").val();
                            },
                            roleId: function() {
                                return $("#roleId").val();
                            }
                        }
                    }
                },
                menuCheck: {
                    required: true
                }
            },
            messages: {
                roleName: {
                    required: '角色名称不能为空',
                    remote: '角色名称已存在'
                },
                menuCheck: {
                    required: '至少要选择一个菜单'
                }
            }
        })
    }

    saveRole = async ()=>{
        initRoleValiate()
        var $valid = await $("#addRoleForm").valid();
        if(!$valid) {
            $roleValidator.focusInvalid();
            return false;
        } else {
            var msg = ($('#roleId').val() === undefined || $('#roleId').val() === '') ? '角色创建成功' : '角色编辑成功'
            let menus = []
            $("#chooseMenu").find( ":checkbox" ).each( function( index, node ) {
                let input = $("input:checkbox[value="+ node.attributes['value'].value +"]")[0]

                if(input.checked) {
                    menus.push(input.value)
                }
            })
            if(menus.length === 0) {
                // $("#chooseMenu").tooltip('show','请选择角色可操作的菜单')
                return
            }
            $.ajax({
                url: '/role/save',
                type: 'post',
                data: {name: $('#roleName').val(), menus: menus, roleId: $('#roleId').val()},
                success: (result) => {
                    if (result.error) {
                        showMessage(result.error, '')
                    } else {
                        showMessage(result.msg ? result.msg : msg, 'success')
                        setTimeout(function () {
                            reloadList('role')
                            $('#addRoleModal').modal('hide')
                        }, 1000)
                    }
                }
            })
        }
    }

    deleteRole = ()=>{
        $.ajax({
            url: '/role/' + $('#roleId').val(),
            type:'delete',
            success:function (result) {
                if (result.error) {
                    showMessage(result.error,'')
                } else if (result.statusCode === 200){
                    showMessage('角色删除成功','success')
                    setTimeout(function() {
                        reloadList('role')
                        $('#confirmRoleModal').modal('hide')
                    }, 500)
                }
            }
        })
    }
})