// IIFE to ensure safe use of $
(function( $ ) {
  window.initializeTooltips = function() {
    var $tooltip = $('<div class="tooltip">Accept/Reject change</div>').appendTo($('.container'));
    window.$changes = $('.change');
    var focusOn = -1;

    var setFocus = function(index, changes){
      var pos = window.$changes.eq(index).position();
      $tooltip.css({
        top: pos.top - $tooltip.outerHeight() - 20,
        left: pos.left,
        opacity: 1
      });
    }

    var focusPrevious = function(changes){
      window.$changes = $('.change');
      if(focusOn > 0) {
        focusOn -= 1;        
      }
      setFocus(focusOn);
    }

    var focusNext = function(changes){
      window.$changes = $('.change');
      if(focusOn < window.$changes.length - 1) {
        focusOn += 1;        
      }      
      setFocus(focusOn);
    }        

    if($changes.length) {
      setFocus(focusOn,$changes);
    }
    // Attach keyboard controls
    document.onkeydown = checkKey;

    function checkKey(e) {
        e = e || window.event;

        if (e.keyCode == '38') {
            // Prevent default behavior
            e.stopPropagation();
            e.preventDefault();  
            e.returnValue = false;
            e.cancelBubble = true;
            focusPrevious();
        }
        else if (e.keyCode == '40') {
            // Prevent default behavior
            e.stopPropagation();
            e.preventDefault();  
            e.returnValue = false;
            e.cancelBubble = true;
            focusNext();
        }
    }    

  }

window.hideTooltips = function() {
  $('.tooltip').hide();
}

})(jQuery);