# proxubaum

> o proxubaum o proxubaum, how thy proxy is so verdant

a very bad proxy powered by `unblocker`, the same code used for the original (now deceased) **nodeunblocker.com**.
it works. sometimes. probably.

> ** for the kiddies** : use this to play games when you should be studying ig

if a site explodes, renders like a corrupted geocities page, or refuses to load entirely — that is considered **expected behavior**.

---

## what is this?

`proxubaum` is a small web proxy built with:

* `express`
* `unblocker`
* `serverless-http`

the idea is simple: take a request like

```
/proxy/https://example.com
```

and pipe it through `unblocker` so the site loads through the proxy.

in theory.

in practice some sites will:

* break
* partially render
* refuse to load images
* implode due to CSP
* or break the proxy itself

this is normal.

---

## quick start

### 1. clone the repository

```
git clone https://github.com/linuxfandudeguy/proxubaum
cd proxubaum
```

### 2. install dependencies (use bun)

if you are cloning the repo **just use bun**.

```
bun install
```

yes `npm` will probably work.
no i will not test it.

---

### 3. run the server

if running locally:


```
node src/index.js
```
*
once running, open:

```
http://localhost:3000/proxy/https://example.com
```

and witness the magic.

---

## serverless deployment (important)

lmao you will need to fix this if running locally lol
------------

the `src/index.js` file is wrapped with `serverless-http`.

this means the express app is exported like this:

```js
module.exports = serverless(app)
```

so platforms like:

* Netlify
* Vercel
* other serverless environments

can run the proxy as a **serverless function instead of a normal server**.

because of this, your routing may look like:

```
/.netlify/functions/index/proxy/https://example.com
```

or with redirects configured:

```
/proxy/https://example.com
```

depending on how your hosting platform rewrites paths.

---

## why do some sites break?

good question.

possible reasons include:

* CSP headers
* websocket weirdness
* javascript doing suspicious modern frontend framework things
* weird ahh bot protection
* unblocker being old


fixes may involve:

* patching HTML responses
* rewriting URLs harder
* teaching a pig how to speak in javascript and make it read my code and debug it for me

research is ongoing.

---

## known issues
* sites with aggressive CSP explode
* modern SPAs sometimes refuse to function
* some sites just dont work

again: **expected behavior**.

---

## contributing

if you somehow make this less terrible:

1. open a pull request
2. explain what black magic you used
3. accept my confusion

---

## license

idk probably MIT or something reasonable.

---

## final note

this proxy is not fast, not secure, and not guaranteed to work.

but it **does proxy things**, which is technically the goal.
