$(document).ready(function () {
    var $validator = $("#loginForm").validate({
        rules: {
            name: {
                required: true
            },
            password: {
                required: true
            }
        },
        messages: {
            name: {
                required: '管理员账号不能为空'
            },
            password: {
                required: '密码不能为空'
            }
        }
    });

    $('#loginBtn').on('click', function () {
        var $valid = $("#loginForm").valid();
        if(!$valid) {
            $validator.focusInvalid();
            return false;
        } else {
            let checked = $("#remindMe").prop('checked')
            if (checked) {
                storage['username'] = $('#name').val()
                storage['password'] = $('#password').val()
                storage['remindMe'] = true
            } else {
                storage['remindMe'] = false
            }

            $.ajax({
                type: 'post',
                data: {name: $('#name').val(), password: $('#password').val()},
                url: '/login',
                success: function (result) {
                    if (result.error) {
                        showMessage(result.error, '')
                    } else {
                        let admin = JSON.parse(result.admin)
                        storage['token'] = result.token
                        storage['userId'] = admin._id.toString()
                        storage['username'] = admin.username
                        storage['roleName'] = admin.roleName
                        storage['menus'] = result.menus
                        let encrypted = CryptoJS.AES.encrypt(storage['token'], '_SALT_G(T#*)')
                        encrypted = encrypted.toString()
                        storage['aesToken'] = encrypted
                        showMessage('登录成功','success')
                        setTimeout(function() {
                            window.location.href = '/index?' + encrypted
                        }, 500)
                    }
                }
            })
        }
    })
})