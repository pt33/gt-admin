$(document).ready(function () {
  var $uploadValidator
  var spinner

  initUploadValiate = () => {
      $uploadValidator = $('#uploadData').validate({
          rules: {
              fileType: {
                  required: true
                },
              dataFrom: {
                  required: true
                },
              needWordChange: {
                  required: true
                }
            },
          messages: {
              fileType: {
                  required: '文件类型不能为空'
                },
              dataFrom: {
                  required: '数据来源不能为空'
                },
              needWordChange: {
                  required: '请选择文字转换模式'
                }
            }
        })
    }

  initUploader = () => {
      fileUploads = []
      if ($('#uploader').pluploadQueue()) {
          $('#uploader').pluploadQueue().destroy()
        }

      $('#uploader').pluploadQueue({
          rename: false,
          dragdrop: true,
          multiple_queues: true,
          filters: {
              max_file_size: '1024mb',
              prevent_duplicates: true,
              mime_types: [
                    {title: 'marc文件', extensions: 'iso'},
                    {title: 'excel', extensions: 'xlsx'},
                    {title: 'excel', extensions: 'xls'},
                    {title: 'xml', extensions: 'xml'}
                ]
            }, 
headers: {
              'x-access-token': storage['aesToken']
            },
          multipart: true,
          chunk_size: 0,
          rename: false,
          renameByClick: false,
          autoUpload: false,            // 当选择文件后立即自动进行上传操作
          url: '/data/upload',
          resize: {
              width: 200,
              height: 200,
              quality: 90,
              crop: true // crop to exact dimensions
            },
          flash_swf_url: '/plugins/plupload/js/Moxie.swf',
          silverlight_xap_url: '/plugins/plupload/js/Moxie.xap',
          init: {
              Error: function (uploader, errObjecs) {
                  spinner.stop()
                  $('#loadingModal').modal('hide')
                  showMessage(errObjecs.message, '')
                }
            }
        })
      $('#uploader').pluploadQueue().bind('UploadComplete', UploadComplete)
      $('#uploader').pluploadQueue().bind('FilesAdded', FilesAdded)
      $('#uploader').pluploadQueue().bind('FileUploaded', FileUploaded)
    }

  UploadComplete = (uploader, files) => {
      $.ajax({
          url: '/data/parse',
          type: 'post',
          data: {
              sourceFrom: $('#dataFrom').val(),
              tableId: $('#uploadData')[0].className.split(' ')[1],
              fields: $('#fileType').val() === 'excel'
                    ? JSON.stringify($('#uploadFields').bootstrapTable('getData'))
                    : JSON.stringify($('#uploadMarcFields').bootstrapTable('getData')),
              type: $('#fileType').val(),
              wordNeedChange: $('#needWordChange').val(),
              parseDirection: $('#fileType').val() === 'excel' ? $('#parseDirection').val() : '',
              tableName: $('#dataName').val(),
              paths: JSON.stringify(fileUploads)
            },
          success: (result) => {
              spinner.stop()
              $('#loadingModal').modal('hide')
              if (Number(result.statusCode) !== 200) {
                  showMessage(result.msg, '')
                } else {
                  $('#uploadResult').css('display', 'block')
                  $('#uploadMsg').html(result.msg)
                  initUploader()
                }
            }
        })
    }

  FileUploaded = (uploader, file, responseObject) => {
      if (responseObject.response.error) {
          showMessage(responseObject.response.error)
          $('#uploader').pluploadQueue().stop()
        } else {
          fileUploads.push(JSON.parse(responseObject.response))
        }
    }

  FilesAdded = (uploader, files) => {
      var type = $('#fileType').val()
      for (var i in files) {
          if (type === 'marc') {
              if (files[i].name.indexOf('.iso') < 0) {
                  showMessage('文件类型错误', '')
                  $('#uploader').pluploadQueue().removeFile(files[i])
                }
            } else if (type === 'excel') {
              if (files[i].name.indexOf('.xlsx') < 0 && files[i].name.indexOf('.xls') < 0) {
                  showMessage('文件类型错误', '')
                  $('#uploader').pluploadQueue().removeFile(files[i])
                }
            } else if (type === 'xml') {
              if (files[i].name.indexOf('.xml') < 0) {
                  showMessage('文件类型错误', '')
                  $('#uploader').pluploadQueue().removeFile(files[i])
                }
            } else {
              showMessage('文件类型错误', '')
              $('#uploader').pluploadQueue().removeFile(files[i])
            }
        }
    }

  uploadData = async () => {
      initUploadValiate()
      var $valid = await $('#uploadData').valid()
        if (!$valid) {
          $uploadValidator.focusInvalid()
            return false
        } else {
          let fields
          if ($('#fileType').val() === 'excel') {
              let dict = $('#parseDirection').val()
              if (dict === '') {
                  showMessage('请选择excel文件解析方向', '')
                  setTimeout(function () {
                      $('#parseDirection').focus()
                    }, 500)
                  return
                }
              fields = $('#uploadFields').bootstrapTable('getData')
            } else if ($('#fileType').val() === 'marc') {
              fields = $('#uploadMarcFieldDiv').bootstrapTable('getData')
            }
          if (fields.length === 0) {
              showMessage('请添加需要解析的字段', '')
              return
            } else {
              let files = $('#uploader').pluploadQueue().files
              if (!files || files.length === 0) {
                  showMessage('请选择要上传的文件', '')
                  return
                }
            }
          for (let i = 0; i < fields.length; i++) {
              let tmp = fields[i]
              if (tmp.hasFile && (tmp.filePath === '' || tmp.filePath === undefined)) {
                  showMessage('请输入关联文件的路径', '')
                  setTimeout(function () {
                      $('#uploadFields').find('tr:not(:first)').find('td.filePath').eq(i).find('.editable').editable('show')
                    }, 500)
                    //
                  return
                }
            }

          $('#uploader').pluploadQueue().start()

          $('#loadingModal').modal({
              show: true,
              keyboard: false,
              backdrop: 'static'
            })

          var target = document.getElementById('loadingDiv')
          spinner = new Spinner(opts).spin(target)
        }
    }
})
