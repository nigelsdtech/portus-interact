'use strict';

var cheerio = require('cheerio'),
    request = require('request');


/**
 * A module for interacting with Portus
 * @module portusInteract
 */

// Some object variables
var
    _portusPassword,
    _portusRequest,
    _portusUsername;

// Some default configs
var _cfg = {
  portus : {
    baseUrl: 'https://portusonline.net/OpenBenefits/',
    forever: true,
    gzip: true,
    loginForm: {
      formName : 'aspnetForm',
      passwordField : 'ctl01$ctl00$SiteContentPlaceHolder$ContentMainBody$ctlLogin$Password',
      usernameField : 'ctl01$ctl00$SiteContentPlaceHolder$ContentMainBody$ctlLogin$UserName'
    },
    loggedInCookieName : '.Staffcare',
    payslip4uUri: 'readdata/samlresponse.aspx?n=Payslip4U',
    payslip4uLoginForm: {
      formName : 'SSOLogin'
    },
    reqTimeout: (1000*10)
  }
}

//loggedInCookieName : '.OpenBenefits$Preferences',


/**
 * Portus Interact constructor.
 * @param {object} params Params to be passed in
 * @constructor
 */
function PortusInteract(params) {

  this._portusUsername = params.username
  this._portusPassword = params.password


  // Set configs of the local object using prototype configs
  this._cfg = _cfg;

  // Setup the request defaults
  this._portusRequest = request.defaults({
    baseUrl            : this._cfg.portus.baseUrl,
    timeout            : this._cfg.portus.reqTimeout,
    followAllRedirects : true,
    jar                : true,
    headers: {
      'Upgrade-Insecure-Requests' : '1',
      'User-Agent'                : 'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36'
    }
  });

}


var method = PortusInteract.prototype;


/**
 * portusInteract.doPortusLogin
 *
 * @desc Log in to the portus site
 *
 * @alias portusInteract.doPortusLogin
 * @memberOf! portusInteract(v1)
 *
 * @param  {object=} params - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the response. Returns callback(error,isLoggedIn)
 * @return {boolean} isLoggedIn - Indicates a successful login
 */
method.doPortusLogin = function(params, callback) {

  var self = this

  // Go to the login site
  self._getPortusLoginForm(null, function (err, form) {

    if (err) { callback(err); return null }

    var formInputs = form.inputs;
    formInputs[self._cfg.portus.loginForm.usernameField] = self._portusUsername,
    formInputs[self._cfg.portus.loginForm.passwordField] = self._portusPassword;

    self._portusRequest.post({
      uri: form.attribs.action,
      form: formInputs
    }, function (err, resp, body) {

      if (err) { callback(err); return null }
      var cookies = resp.request.headers.cookie.split(';')

      for (var i = 0 ; i < cookies.length ; i ++ ) {
        var cookie = cookies[i].trim()
	var cookieName = cookie.split('=')[0]

        // We know we're logged in if we have this cookie
        if (cookieName == self._cfg.portus.loggedInCookieName) {
          callback(null, true)
          return null
        }
      }

      callback(null, false)
    })

  })
}

/**
 * portusInteract.getPayslipsList
 *
 * @desc Get the list of available payslips
 *
 * @alias portusInteract.getPayslipsList
 * @memberOf! portusInteract(v1)
 *
 * @param  {object=} params - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the response. Returns callback(error,payslipLinks)
 * @return {string[]} payslipLinks - Links to all returned payslips
 */
method.getPayslipsList = function(params, callback) {

  var self = this

  // Go to the login site
  self._getPayslipsLoginForm(null, function (err, form) {

    if (err) { callback(err); return null }


    /*
    var $ = cheerio.load(body)
    var f = $('#'+self._cfg.portus.loginForm.formName)

    var form = {};

    // Get all the form attributes
    var attribs = f.attr()
    form['attribs'] = attribs


    // Get all the form inputs
    var inputs = f.find('input');
    form['inputs'] = {}
    for (var i = 0; i < inputs.length; i++) {
      form['inputs'][inputs.get(i).attribs.name] = inputs.get(i).attribs.value
    }
    */

    callback(null, [])


  })
}

/**
 * portusInteract._getPayslipsLoginForm
 *
 * @desc Get form fields for logging in to the portus site
 *
 * @alias portusInteract._getPayslipsLoginForm
 * @memberOf! portusInteract(v1)
 *
 * @param  {object=} params - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the response. Returns callback(error,form)
 * @return {object=} form - The form needing to be submitted
 */
method._getPayslipsLoginForm = function(params, callback) {

  var self = this

  // Go to the login site
  self.doPortusLogin(null, function (err, isLoggedIn) {

    if (err) { callback(err); return null }
    if (!isLoggedIn) { callback('portusInteract._getPayslipsLoginForm: Could not log in'); return null }

    self._portusRequest.get({
      uri: self._cfg.portus.payslip4uUri,
    }, function (err, resp, body) {

      if (err) { callback(err); return null }

      var $ = cheerio.load(body)
      var f = $('#'+self._cfg.portus.payslip4uLoginForm.formName)

      // The test of being in the right place is if we're able to find the right login form
      if (f.length != 1) { callback('portusInteract._getPayslipsLoginForm: Correct login form not received.'); return null }

      var form = {};

      // Get all the form inputs
      var inputs = f.find('input');
      form['inputs'] = {}
      for (var i = 0; i < inputs.length; i++) {
        form['inputs'][inputs.get(i).attribs.name] = inputs.get(i).attribs.value
      }

      callback(null, form)

    })
  });
}

/**
 * portusInteract._getPortusLoginForm
 *
 * @desc Get form fields for logging in to the portus site
 *
 * @alias portusInteract._getPortusLoginForm
 * @memberOf! portusInteract(v1)
 *
 * @param  {object=} params - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the response. Returns callback(error,form)
 * @return {object=} form - The form needing to be submitted
 */
method._getPortusLoginForm = function(params, callback) {

  var self = this

  // Go to the login site
  this._portusRequest.get('', function (err, resp, body) {

    if (err) { callback(err); return null }

    var $ = cheerio.load(body)
    var f = $('#'+self._cfg.portus.loginForm.formName)

    var form = {};

    // Get all the form attributes
    var attribs = f.attr()
    form['attribs'] = attribs


    // Get all the form inputs
    var inputs = f.find('input');
    form['inputs'] = {}
    for (var i = 0; i < inputs.length; i++) {
      form['inputs'][inputs.get(i).attribs.name] = inputs.get(i).attribs.value
    }

    callback(null, form)

  });
}


module.exports = PortusInteract;
