var express = require("express")
var Unblocker = require("unblocker")

var app = express()

var PREFIX = "/proxy/"

/* script that will be injected into proxied pages */
var proxyPatch = `
<script>
(function(){

const PREFIX="/proxy/";

function fixProxyUrl(input){

  if(typeof input!=="string") return input;
  if(!input.startsWith(PREFIX)) return input;

  const raw=input.slice(PREFIX.length);

  try{
    decodeURIComponent(raw);
    return input;
  }catch(e){
    return PREFIX+encodeURIComponent(raw);
  }

}

const origFetch=window.fetch;

window.fetch=function(input,init){

  if(typeof input==="string"){
    input=fixProxyUrl(input);

  }else if(input instanceof URL){
    input=fixProxyUrl(input.toString());

  }else if(input instanceof Request){
    const newUrl=fixProxyUrl(input.url);
    if(newUrl!==input.url){
      input=new Request(newUrl,input);
    }
  }

  return origFetch.call(this,input,init);
};

})();
</script>
`

var unblocker = new Unblocker({
  prefix: PREFIX,

  cookies: true,
  hsts: true,
  hpkp: true,
  csp: true,
  redirects: true,
  decompress: true,
  charsets: true,
  urlPrefixer: true,
  metaRobots: true,
  contentLength: true
})

function normalizeUrl(url) {

  if (!url.startsWith("http")) {
    url = "https://" + url
  }

  try {
    var u = new URL(url)

    if (u.pathname === "") {
      u.pathname = "/"
    }

    return u.toString()

  } catch (e) {
    return null
  }

}

app.get("/", function(req, res) {

  res.send(`
  <html>
  <body>
    <h1>Proxubaum</h1>

    <form action="/go">
      <input name="url" placeholder="example.com">
      <button>Go</button>
    </form>

  </body>
  </html>
  `)

})

app.get("/go", function(req, res) {

  var url = req.query.url

  if (!url) return res.send("missing url")

  url = normalizeUrl(url)

  if (!url) return res.send("invalid url")

  var encoded = encodeURIComponent(url)

  res.redirect(PREFIX + encoded)

})

/* decode proxy path */
app.use(PREFIX, function(req, res, next) {

  try {
    req.url = decodeURIComponent(req.url)
  } catch (e) {}

  next()

})

/* inject script into proxied HTML */
app.use(function(req,res,next){

  var send=res.send

  res.send=function(body){

    if(typeof body==="string" && body.includes("<head>")){
      body=body.replace("<head>","<head>"+proxyPatch)
    }

    return send.call(this,body)
  }

  next()

})

app.use(unblocker)

var port = process.env.PORT || 3000

app.listen(port,"0.0.0.0",function(){

  console.log("Proxubaum running on port "+port)

})
