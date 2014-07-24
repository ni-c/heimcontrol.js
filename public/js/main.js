require(["jquery", "bootstrap.min", "/socket.io/socket.io.js"], function() {

  var socket = io.connect();

  require(["plugins"], function() {

    // Delete buttons
    function iDelete() {
      var e = $('#' + $(this).attr('data-delete'));
      e.slideToggle(500, function() {
        e.remove();
      });
    }
    $('.delete').unbind('click', iDelete);
    $('.delete').bind('click', iDelete);

    // Mac address to uppercase
    function iMac() {
      var e = $(this);
      var value = e.val();
      value = value.toUpperCase();
      value = value.replace('-', ':').replace('.', ':');
      e.val(value);
    }
    $('.mac').unbind('keyup', iMac);
    $('.mac').bind('keyup', iMac);

    // Uppercase
    function iUppercase() {
      var e = $(this);
      var value = e.val();
      value = value.toUpperCase();
      e.val(value);
    }
    $('.uppercase').unbind('keyup', iUppercase);    
    $('.uppercase').bind('keyup', iUppercase);

    // Socket buttons
    function iSocketButton() {
      var e = $(this);
      var data = {
          id: e.data('id'),
          value: e.data('value')
      };
      socket.emit(e.data('socket'), data);
    }
    $('.socket').unbind('click', iSocketButton);
    $('.socket').bind('click', iSocketButton);

    function registerSelectSwitch() {
      $('.switch').children('select').change(function() {
        var e = $(this).parent('.switch');
        e.children('.switch-container').children('div').addClass('hidden');
        e.children('.switch-container:not(.no-clear-on-switch)').find('input').val('');
        e.children('.switch-container').find('input').removeAttr('required', '0');
        e.children('.switch-container').find('.' + $(this).val()).each(function() {
          var e = $(this);
          e.removeClass('hidden');
          if (e.attr('data-required')=='1') {
            e.attr('required', 'required');
          }
        });
      });
    };
    registerSelectSwitch();

    if ($('#template').length) {
      $('.add').click(function() {

        // Get current iterator
        var i = $('#iterator').val();
        
        // Clone element
        var element = $('#template').clone();
        $('#' + $(this).data('target')).append(element);
        
        // Set ids
        element.attr('id', i);
        
        element.find('input, select').each(function() {
          $(this).attr('name', $(this).attr('name').replace('%i%', i));
        });
        
        element.find('.delete').attr('data-delete', i);
        
        // Fade in
        element.slideToggle();
        $('html, body').animate({
          scrollTop : $('html, body').height()
        }, 800);
        
        // Call callback
        if ($(this).attr('data-callback')) {
          try {
            eval($(this).attr('data-callback'));
          } catch (e) {
            alert('JavaScript Error: Callback function not found [' + $(this).attr('data-callback') + '].');
          }
        }
        
        // Unbind Events
        $('.delete').unbind('click', iDelete);
        $('.uppercase').unbind('keyup', iUppercase);    
        $('.mac').unbind('keyup', iMac);

        // Bind Events
        $('.delete').bind('click', iDelete);
        $('.uppercase').bind('keyup', iUppercase);
        $('.mac').bind('keyup', iMac);

        // Set new iterator
        $('#iterator').val(++i);
      });
    }
    
    // Socket disconnect
    socket.on('disconnect', function () {
      setTimeout(function() {
        $('.navigation').remove();
        $('#content').empty();
        $('#content').append('<h1>503</h1><h2>I\'m sorry Dave, i\'m afraid i have lost the connection to the server.</h2><p><a href="/login"><h3>Back to Login</h3></a></p>');
      }, 15000);
    });

    // Set login cookie
    require(["/js/jquery.cookie.js"], function() {
      if($('.btn-login').length > 0) {
        $('.btn-login').click(function() {
          if($('#rememberme').is(':checked')) {
            $.cookie("email", $('#email').val());
            $.cookie("password", $('#password').val());
          } else {
            $.cookie("email", null);
            $.cookie("password", null);
          }
        });
        $('#email').focus();
      }
      if($('.login-error').length > 0) {
        $.cookie("email", null);
        $.cookie("password", null);
      }
      if($('.btn-logout').length > 0) {
        $('.btn-logout').click(function() {
          $.cookie("email", null);
          $.cookie("password", null);
        });
      }
    });

  });
});
