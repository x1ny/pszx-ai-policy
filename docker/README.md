# Cloudreve Frontend Docker 流程

## 本地构建

```bash
docker buildx build --platform linux/amd64 \
  --tag ps-docker-registry.cn-beijing.cr.aliyuncs.com/psdsframework/pszx-nanan-ai-policy:test \
  --file docker/Dockerfile --load .
```

## 构建并推送

```bash
node scripts/build-push.js v0.1.0
node scripts/build-push.js v0.1.0 linux/amd64,linux/arm64
```

不传版本号时使用最新 Git tag。单架构镜像先加载到本地 Docker 再推送，多架构镜像由 Buildx 直接推送。

## 发布版本

```bash
node scripts/release.js       # patch
node scripts/release.js minor
node scripts/release.js major
node scripts/release.js v1.0.0
```

发布脚本默认要求当前分支为 `master`，可通过 `RELEASE_MAIN_BRANCH` 覆盖。

## 测试环境部署

`scripts/deploy-test.js` 默认读取 `scripts/deploy-test.config.js`，因此正常情况下无需重复输入 Rancher 配置。也可以通过环境变量临时覆盖配置文件中的值：

```powershell
$env:RANCHER_REDEPLOY_URL = "https://rancher.example/v3/.../redeploy"
$env:RANCHER_DEPLOY_TOKEN = "token-xxx:xxxxx"
$env:DEPLOY_INSECURE_TLS = "1" # 仅自签名证书环境需要
node scripts/deploy-test.js
```

脚本会先构建并推送 `:test` 镜像，再调用 Rancher redeploy API。当前项目按部署要求将配置文件纳入 Git；如需更换环境，直接修改该配置文件即可。

## 容器运行

```bash
docker run -d -p 80:80 \
  -e API_URL=http://cloudreve:5212 \
  ps-docker-registry.cn-beijing.cr.aliyuncs.com/psdsframework/pszx-nanan-ai-policy:v0.1.0
```

容器运行时由 Nginx 提供静态 SPA：`/api/`、`/login`、`/captchaImage` 转发到 `API_URL`（业务 Java 后端），`/vela/` 转发到 `VELA_API_URL`（AI Agent 的 SSE 流和文件直传，浏览器直连 Vela，不经过 Java 后端）。`/health` 返回 `healthy`，`/api/` 和 `/vela/` 均已关闭代理缓冲并设置长超时，避免 SSE 被截断或攒批。
