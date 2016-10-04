/**
 * Created by zyg on 16/7/15.
 */
var shortid = require('shortid')
var request = require('request')

var url = require('url')

const PROTOCOL = 'http';
const KEY = 'magicalpixi-authId';

function parseCookie(cookieHeader) {
  var cookie = {};
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    cookies.forEach(function (item) {
      const crumbs = item.split('=');
      if (crumbs.length > 1) {
        cookie[crumbs[0].trim()] = crumbs[1].trim();
      }
    });
  }

  return cookie;
}

function defaultConfig(config) {

  var defautls = {
    authServer: '',
    shortidIndex: 0,
    cookieExpires: 2 * 3600 * 1000
  };

  var final = Object.assign({}, defautls, config);

  if (!final.authServer) {
    throw 'no auth server'
  }

  return final;

}

function buildValidateUrl(server, authId) {

  return url.resolve(server,`/api/auth?authId=${authId}`);
}

function validateId(url) {
  return new Promise(resolve=> {

    request(url, (err, body, res)=> {
      console.log(url,body.statusCode,res);
      if (body.statusCode >= 400) {
      } else {

      }
      
      resolve(body.statusCode < 400);
    });
  });
}

function addGetParam(url, param) {
  if (!/\?/.test(url)) {
    url += '?'
  }

  var paramStr = Object.keys(param).map((k)=> {
    return `${k}=${param[k]}`;
  }).join('&');

  return url + encodeURI(paramStr)
}

function rediectTo(ctx, config) {

  var authId = shortid.generate();
  var expireTime = new Date(Date.now() + config.cookieExpires).toGMTString();

  ctx.set('Set-Cookie', `${KEY}=${authId}; expires=${expireTime}`);

//  console.log(ctx.host,ctx.url,ctx.headers);

  ctx.redirect(addGetParam(config.authServer, {
    redirectTo: encodeURIComponent(`${PROTOCOL}://${ctx.host}${ctx.url}`),
    key: authId
  }));
}

module.exports = function (config) {

  config = defaultConfig(config);

  shortid.worker(config.shortidIndex);

  return function *(next) {

    var cookie = parseCookie(this.request.header.cookie);

    console.log(cookie)

    //未登陆
    if (!cookie[KEY]) {

      rediectTo(this, config)

    } else {

      var r = yield validateId(buildValidateUrl(config.authServer, cookie[KEY]));

      if (r) {
        yield next;
      }else{
        //验证失败,继续
        rediectTo(this, config)
      }
    }
  };
}