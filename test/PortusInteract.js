'use strict'

var cfg            = require('config'),
    chai           = require('chai'),
    fs             = require('fs'),
    PortusInteract = require('../PortusInteract.js'),
    should         = chai.should()



describe('Service logging in to Portus with bad credentials', function () {

  this.timeout(1000*10);

  var x;

  before(function (done) {

    x = new PortusInteract({
      username: 'badUser',
      password: 'badPassword'
    });

    done();

  });

  it('should not log in to Portus', function (done) {

    x.doPortusLogin(null, function(err,isLoggedIn) {
      should.not.exist(err);
      isLoggedIn.should.equal(false);
      done();
    });
  });

  it('should not get the Payslip4u login form', function (done) {

      x._getPayslip4uLoginForm(null, function(err,form) {
          should.exist(err);
          done();
      });
  });


})


describe('Service logging in to Portus with good credentials', function () {

  this.timeout(1000*10);

  var p,x;

  var downloadedPayslipLocation;

  before(function (done) {

    p = new PortusInteract({
      username: cfg.portus.username,
      password: cfg.portus.password
    });

    done();

  });


  it('should get the Portus login form fields', function (done) {

      p._getPortusLoginForm(null, function(err,form) {
          should.not.exist(err);
          form.should.be.a('object');
          form.attribs.should.contains.all.keys([
            'method',
            'action'
          ])
          form.inputs.should.contain.all.keys([
            '__VIEWSTATE',
            '__VIEWSTATEGENERATOR',
            '__EVENTVALIDATION',
            'ctl01$ctl00$SiteContentPlaceHolder$ContentMainBody$ctlLogin$UserName',
            'ctl01$ctl00$SiteContentPlaceHolder$ContentMainBody$ctlLogin$Password',
            'ctl01$ctl00$SiteContentPlaceHolder$ContentMainBody$ctlLogin$Login'
          ])

          done();
      });
  });

  it('should log in to Portus', function (done) {

    p.doPortusLogin(null, function(err,isSuccessful) {
      should.not.exist(err);
      isSuccessful.should.equal(true)
      done();
    });
  });

  it('should get the Payslip4U login form fields', function (done) {

      p._getPayslip4uLoginForm(null, function(err,form) {
          should.not.exist(err);
          form.inputs.should.have.all.keys([
            'SAMLResponse',
          ])
          done();
      });
  });

  it('should log in to Payslip4U', function (done) {

      p.doPayslip4uLogin(null, function(err,isLoggedIn) {
          should.not.exist(err);
          isLoggedIn.should.equal(true);
          done();
      });
  });

  it('should get the list of payslips', function (done) {

    p.listPayslips(null, function(err,payslips) {
      should.not.exist(err);
      payslips.should.be.a('array');
      done();
    });
  });

  it('should download the latest payslip', function (done) {

    p.downloadLatestPayslip(null, function(err,downloadedFileLocation) {
      should.not.exist(err);
      downloadedFileLocation.should.be.a('string');
      downloadedPayslipLocation = downloadedFileLocation;
      done();
    });
  });


  after(function (done) {

    fs.stat(downloadedPayslipLocation, function (err, stats) {

      if (err) { throw err }

      if (stats.isFile()) {

        fs.unlink(downloadedPayslipLocation, function() {
          done();
        })
      }
    })
  })
});
