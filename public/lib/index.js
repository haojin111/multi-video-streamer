$(document).ready(function() {
    $('#uploadForm #sourceType').change(function(event) {
        var value = event.target.value;
        if (value == '1') {
            $("#uploadForm .upload-pan").hide();
            $("#uploadForm .path-pan").show();
        } else {
            $("#uploadForm .upload-pan").show();
            $("#uploadForm .path-pan").hide();
        }
        $('#uploadForm input[name="sourceType"]').val(value);
    });

    $('#uploadForm #uploadBtn').click(function() {
        $('#fromFile').click();
    });

    $('#fromFile').change(function(event) {
        var fd = new FormData(); 
        var files = $(event.target)[0].files[0];
        fd.append('video_file', files); 
        if (files) {
            $.ajax({ 
                url: '/upload', 
                type: 'post', 
                data: fd,
                contentType: false, 
                processData: false, 
                success: function(res){ 
                    $(event.target).val("");
                    if(res.status){ 
                        $("#videoFile").val(res.name);
                    } 
                    else{ 
                        alert(res); 
                    } 
                }, 
            });
        }
    });

    $('#videoListTbl .btn-danger').click(function(event) {
        var tr = $(event.target).closest('tr');
        const id = $(tr).attr('key');

        $.post('/videos/delete/' + id)
        .then(res => {
            location.reload();
        });
    });

    $('#adListTbl .btn-danger').click(function(event) {
        var tr = $(event.target).closest('tr');
        const id = $(tr).attr('key');

        $.post('/ads/delete/' + id)
        .then(res => {
            location.reload();
        });
    });
})