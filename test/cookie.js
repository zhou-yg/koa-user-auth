/**
 * Created by zyg on 16/10/2.
 */
var koa = require('koa')

var auth = require('../index');

var app = koa();

app.use(auth({
  authServer:'http://localhost:8999/'
}));

app.use(function *() {


  console.log(this.request);
});


app.listen(3000);