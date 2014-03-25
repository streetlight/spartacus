define([
  'i18n-abide-utils',
  'jquery',
  'log'
], function(i18n, $, log) {

  'use strict';

  var console = log('pin');
  var pinMaxLength = 4;
  var pinBuffer;

  var numericRx = /^\d$/;

  // Placeholders for jQuery elements.
  var $pseudoInputs;
  var $pinInput;
  var $submitButton;
  var $errorMessage;
  var $content;

  function getPin() {
    return pinBuffer;
  }

  function focusPin() {
    console.log('Focusing pin');
    pinBuffer = '';
    updatePinUI();
    $pinInput.focus();
  }

  function updatePinUI() {
    console.log('Updating pin UI');
    var numFilled = pinBuffer.length;
    $pseudoInputs.each(function(index, elm) {
      var $elm = $(elm);
      if (index + 1 <= numFilled) {
        $elm.addClass('filled');
      } else {
        $elm.removeClass('filled');
      }
    });
    $submitButton.prop('disabled', (pinBuffer.length !== pinMaxLength));
  }

  function handleKeyPress(e) {
    var key = String.fromCharCode(e.charCode);
    // Check if [0-9]
    if (numericRx.test(key) && pinBuffer.length !== pinMaxLength) {
      pinBuffer += key;
    // OR if this is a backspace.
    } else if (e.keyCode === 8 && pinBuffer.length > 0) {
      pinBuffer = pinBuffer.slice(0, -1);
    } else {
      showError(i18n.gettext('Pin can only contain digits.'));
      return false;
    }
    hideError();
    updatePinUI();
    // We don't need to fill up the input at all :).
    return false;
  }

  function showError(errorMessage) {
    $errorMessage.text(errorMessage);
    $errorMessage.removeClass('hidden');
  }

  function hideError() {
    $errorMessage.addClass('hidden');
  }

  function init() {
    $pseudoInputs = $('.pinbox span');
    $pinInput = $('#pin');
    $submitButton = $('button.continue');
    $errorMessage = $('.err-msg');
    $content = $('.content');
    $content.on('click', function(e) {
      focusPin();
      e.preventDefault();
    });
    $pinInput.on('keypress', handleKeyPress);
    focusPin();
  }

  function resetPinUI() {
    pinBuffer = '';
    updatePinUI();
  }

  return {
    init: init,
    showError: showError,
    getPin: getPin,
    resetPinUI: resetPinUI,
  };

});
