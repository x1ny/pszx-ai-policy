#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import https from "node:https"
import config from "./deploy-test.config.js"

const redeployUrl = process.env.RANCHER_REDEPLOY_URL || config.rancherRedeployUrl
const token = process.env.RANCHER_DEPLOY_TOKEN || config.rancherDeployToken
const insecureTls = process.env.DEPLOY_INSECURE_TLS
  ? process.env.DEPLOY_INSECURE_TLS === "1"
  : config.insecureTls

function fail(message) {
  console.error(`\nError: ${message}\n`)
  process.exit(1)
}

if (!redeployUrl) fail("missing RANCHER_REDEPLOY_URL")
if (!token) fail("missing RANCHER_DEPLOY_TOKEN")

execFileSync("node", ["scripts/build-push.js", "test"], { stdio: "inherit" })

const url = new URL(redeployUrl)
const request = https.request(
  {
    hostname: url.hostname,
    port: url.port || 443,
    path: `${url.pathname}${url.search}`,
    method: "POST",
    rejectUnauthorized: !insecureTls,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Length": 0,
    },
  },
  (response) => {
    let body = ""
    response.on("data", (chunk) => (body += chunk))
    response.on("end", () => {
      if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
        fail(`Rancher redeploy failed: HTTP ${response.statusCode}\n${body}`)
      }
      console.log(`Test deployment triggered: HTTP ${response.statusCode}`)
      if (body) console.log(body)
    })
  },
)
request.on("error", (error) => fail(`Rancher request failed: ${error.message}`))
request.end()
