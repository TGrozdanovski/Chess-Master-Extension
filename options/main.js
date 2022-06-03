$(document).ready(function() {
    /*chrome.storage.sync.clear(function() {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
    });*/


    $('#update').click(function() {
        var text = $(this).text();
        $(this).text('Loading...');
        var id = +(new Date());
        var url = 'https://chess-master.info/json/update.json?id='+id;
        fetch(url).then(response => {
            return response.json();
        }).then(data => {
            $('#update').text(text);
            if (data && data.lichessSelector) {
                var obj = {
                    lichessSelector: data.lichessSelector,
                    autoStep: data.autoStep || 'Auto Step'
                };
                chrome.storage.sync.set(obj, function() {
                    console.log(obj);
                });   
            }
        });
        
        

       
    })

    chrome.storage.sync.get(null, function(items) {
        console.log('Value ' , items);
        var first = items.first || 'red';
        var second = items.second || 'red';
        var ponder = items.ponder || 'blue';
        var autostepKey = items.autostepKey || 'KeyQ';

        $('#autostepKey').val(autostepKey);

        $('.color-item').find('.fa-check').css({ display: 'none' });

        $('[data-container="first"]').find('.color-item.'+first).find('.fa-check').css({ display: 'inline-block' });
        $('[data-container="second"]').find('.color-item.'+second).find('.fa-check').css({ display: 'inline-block' });
        $('[data-container="ponder"]').find('.color-item.'+ponder).find('.fa-check').css({ display: 'inline-block' });


        var status = items.status || 'on';
        readStatus(status);

        var ponder_status = items.ponder_status || 'off';
        readPonderStatus(ponder_status);

        var show_borders = items.show_borders || 'on';
        readShowBorder(show_borders);

    });

    $('.color-item').click(function() {

        var container = $(this).closest('.color-cont').data('container');
        $(this).closest('.color-cont').find('.fa-check').css({ display: 'none' });
        $(this).find('.fa-check').css({ display: 'inline-block' });

        var value =  $(this).data('val');

        var obj = {};
        obj[container] = value;

        chrome.storage.sync.set(obj, function() {
            console.log('Value is set to ' + value, obj);
        });


    });

    $('#status').click(function() {
        var val = $(this).data('val');
        var obj = {};
        if (val == "on") {
            $(this).removeClass('btn-primary');
            $(this).addClass('btn-danger');
            $(this).data('val', 'off');
            $(this).text('Stopped');
            obj['status'] = "off";
        } else {
            $(this).removeClass('btn-danger');
            $(this).addClass('btn-primary');
            $(this).data('val', 'on');
            $(this).text('Working');
            obj['status'] = "on";
        }

   
        chrome.storage.sync.set(obj, function() {
            console.log(obj);
        });     
    })

    $('#ponder_status').click(function() {
        var val = $(this).data('val');
        var obj = {};
        if (val == "on") {
            $(this).removeClass('btn-primary');
            $(this).addClass('btn-danger');
            $(this).data('val', 'off');
            $(this).text('No');
            obj['ponder_status'] = "off";
            $('.ponder').hide();
        } else {
            $(this).removeClass('btn-danger');
            $(this).addClass('btn-primary');
            $(this).data('val', 'on');
            $(this).text('Yes');
            obj['ponder_status'] = "on";
            $('.ponder').show();
        }


        chrome.storage.sync.set(obj, function() {
            console.log(obj);
        });
    })

    $('#show_borders').click(function() {
        var val = $(this).data('val');
        var obj = {};
        if (val == "on") {
            $(this).removeClass('btn-primary');
            $(this).addClass('btn-danger');
            $(this).data('val', 'off');
            $(this).text('No');
            obj['show_borders'] = "off";
            $('.borders').hide();
        } else {
            $(this).removeClass('btn-danger');
            $(this).addClass('btn-primary');
            $(this).data('val', 'on');
            $(this).text('Yes');
            obj['show_borders'] = "on";
            $('.borders').show();

        }


        chrome.storage.sync.set(obj, function() {
            console.log(obj);
        });
    })

    $('#autostepKey').change(function() {
        var value = $(this).val();
        if (!['Space', 'KeyQ', 'ControlRight', 'ControlLeft'].includes(value)) {
            value = 'KeyQ';
        }
        var obj = {};
        obj['autostepKey'] = value;
        chrome.storage.sync.set(obj, function() {
            console.log(obj);
        });

    })

    function readStatus(status) {
        if (status == "off") {
            $("#status").addClass('btn-danger');
            $("#status").attr('data-val', 'off');
            $("#status").text('Stopped');
        } else {
            $("#status").addClass('btn-primary');
            $("#status").attr('data-val', 'on');
            $("#status").text('Working');
        }
    }

    function readPonderStatus(status) {        
        if (status == "off") {
            $("#ponder_status").addClass('btn-danger');
            $("#ponder_status").attr('data-val', 'off');
            $("#ponder_status").text('No');
            setTimeout(function() {
                $('.ponder').hide();
            },0)
        } else {
            $("#ponder_status").addClass('btn-primary');
            $("#ponder_status").attr('data-val', 'on');
            $("#ponder_status").text('Yes');
            $('.ponder').show();
        }
    }

    function readShowBorder(status) {
        if (status == "off") {
            $("#show_borders").addClass('btn-danger');
            $("#show_borders").attr('data-val', 'off');
            $("#show_borders").text('No');  
            $('.borders').hide();       
        } else {
            $("#show_borders").addClass('btn-primary');
            $("#show_borders").attr('data-val', 'on');
            $("#show_borders").text('Yes');   
            $('.borders').show();         
        }
    }




});