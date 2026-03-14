const express = require("express")
const Unblocker = require("unblocker")
const serverless = require("serverless-http")

const app = express()

const PREFIX = "/proxy/"

/*
Create proxy
Unblocker already rewrites:
- images
- css
- fonts
- scripts
- fetch
*/
const unblocker = new Unblocker({
  prefix: PREFIX
})

/* simple homepage */
app.get("/", (req,res)=>{
  res.send(`
  <html>
  <head>
    <title>Proxy</title>
  </head>
  <body>
    <h1>Proxy</h1>
    <form action="/go">
      <input name="url" placeholder="https://example.com">
      <button>Go</button>
    </form>
  </body>
  </html>
  `)
})

/* normalize user input */
function normalize(url){
  if(!url.startsWith("http://") && !url.startsWith("https://")){
    url = "https://" + url
  }
  return url
}

/* redirect user into proxy */
app.get("/go",(req,res)=>{
  let url = req.query.url
  if(!url) return res.send("missing url")

  url = normalize(url)

  /* IMPORTANT: do NOT encode */
  res.redirect(PREFIX + url)
})

/* let unblocker handle proxying */
app.use(unblocker)

/* export serverless handler */
module.exports.handler = serverless(app)
