#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const REGISTRY = "ps-docker-registry.cn-beijing.cr.aliyuncs.com"
const IMAGE_NAME = "psdsframework/pszx-nanan-ai-policy"
const DEFAULT_PLATFORM = "linux/amd64"

function fail(message) {
  console.error(`\nError: ${message}\n`)
  process.exit(1)
}

function latestTag() {
  try {
    return execFileSync("git", ["describe", "--tags", "--abbrev=0"], {
      cwd: ROOT_DIR,
      encoding: "utf8",
    }).trim()
  } catch {
    return ""
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT_DIR, stdio: "inherit" })
  if (result.status !== 0) fail(`command failed: ${command} ${args.join(" ")}`)
}

const dockerInfo = spawnSync("docker", ["info"], { stdio: "ignore" })
if (dockerInfo.status !== 0) fail("Docker is not running")

const version = process.argv[2] || latestTag()
const platform = process.argv[3] || DEFAULT_PLATFORM
if (!version) {
  fail("no version supplied and no git tag exists; run node scripts/release.js first")
}

const image = `${REGISTRY}/${IMAGE_NAME}:${version}`
const args = [
  "buildx",
  "build",
  "--platform",
  platform,
  "--tag",
  image,
  "--file",
  "docker/Dockerfile",
]

if (platform.includes(",")) {
  run("docker", [...args, "--push", "."])
} else {
  run("docker", [...args, "--load", "."])
  run("docker", ["push", image])
}

console.log(`Image published: ${image}`)
