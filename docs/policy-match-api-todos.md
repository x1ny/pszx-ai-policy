# 政策找企业接口待补齐事项

本文档记录政策页面当前因后端接口缺失而暂时无法完成的功能。接口补齐后，前端可按本文档快速完成对接。

## 1. 政策找企业列表缺少总数信息

状态：待后端补齐

现有接口：

```http
POST /api/policy-copilot/v1/matches/enterprises-by-policy
```

当前请求支持：

```json
{
  "policyId": 12,
  "projectId": 4,
  "keyword": null,
  "matchLevels": ["high", "medium", "low"],
  "pageNum": 1,
  "pageSize": 20
}
```

当前返回的 `data` 只有：

```json
{
  "schemaVersion": "1.0",
  "analysisId": null,
  "items": [],
  "message": null
}
```

缺少以下分页信息：

```text
total       企业匹配总数
pages       总页数
hasNext     是否存在下一页
```

说明：经过真实接口验证，`pageNum` 和 `pageSize` 当前可以影响返回结果，但没有总数和分页元数据，前端无法准确展示总页数和“共 N 家”。

建议在列表接口返回中补充：

```json
{
  "schemaVersion": "1.0",
  "analysisId": null,
  "items": [],
  "message": null,
  "total": 100,
  "pages": 5,
  "hasNext": true
}
```

前端接入方式：

- 使用 `items` 渲染当前页企业。
- 使用 `total` 展示匹配企业总数。
- 使用 `pages` 或 `hasNext` 控制分页。
- 不再根据当前页数量推算总数。

## 2. 缺少政策匹配企业统计接口

状态：待后端新增

政策页面右上角需要展示：

- 匹配企业总数。
- 高匹配企业数。
- 中匹配企业数。
- 低匹配企业数。

当前 OpenAPI 中没有独立的统计接口，也不能使用列表接口的当前页数量代替这些统计值。

建议新增独立接口，路径可由后端最终确定，例如：

```http
GET /api/policy-copilot/v1/matches/enterprises-by-policy/summary
```

建议请求参数：

```text
policyId   必填
projectId  可选
```

建议返回：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "total": 100,
    "highCount": 20,
    "mediumCount": 50,
    "lowCount": 30
  }
}
```

字段含义：

| 字段 | 含义 |
|---|---|
| `total` | 当前政策/项目下的匹配企业总数 |
| `highCount` | 高匹配企业数 |
| `mediumCount` | 中匹配企业数 |
| `lowCount` | 低匹配企业数 |

统计口径需要与列表接口保持一致，至少应受以下条件影响：

- `policyId`
- `projectId`
- 当前政策匹配结果范围

如果后端使用“风险企业”命名，请明确与前端“高/中/低匹配”的对应关系，避免统计口径不一致。

## 3. 前端待办

后端接口补齐后：

1. 更新 `src/api/schema.ts` 的 OpenAPI 来源文件并重新生成类型。
2. 在政策页面使用 `openapi-react-query` 接入列表分页元数据。
3. 使用独立统计接口填充页面右上角四项统计。
4. 删除当前统计位置的 `-` 占位值。
5. 验证切换项目和匹配等级后，列表与统计口径一致。

## 4. 验收标准

- 列表接口返回总数和分页信息。
- 修改 `pageNum/pageSize` 后列表结果正确变化。
- 统计接口不受当前页 `pageNum/pageSize` 影响。
- 统计接口的总数与各等级数量口径明确。
- 政策页面右上角能够展示真实统计数据。
- 无统计数据时仍返回明确的空值或 `0`，不能缺字段导致前端无法判断。
