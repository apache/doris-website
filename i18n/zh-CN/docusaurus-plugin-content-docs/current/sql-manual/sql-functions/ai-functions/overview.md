---
{
    "title": "综述",
    "language": "zh-CN",
    "description": "AI Function 是 Doris 提供的基于大语言模型能力的内置函数，用户可以在 SQL 查询中直接调用 AI 执行多种文本智能任务。"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 描述

AI Function 是 Doris 提供的基于大语言模型能力的内置函数，用户可以在 SQL 查询中直接调用 AI 执行多种文本智能任务。AI Function 通过 Doris 的资源机制对接多个主流 AI 厂商(如 OpenAI、Anthropic、DeepSeek、Gemini、Ollama MoonShot等)

所使用的 AI 必须由 Doris 外部提供，且支持文本分析

---

## 配置 AI 资源
在使用 AI Function 前，需先创建 AI 类型的 Resource，集中管理 AI API 的访问信息

### 示例：创建 AI Resource

```sql
CREATE RESOURCE "ai_resource_name"
PROPERTIES (
    'type' = 'ai',
    'ai.provider_type' = 'openai',
    'ai.endpoint' = 'https://endpoint_example',
    'ai.model_name' = 'model_example',
    'ai.api_key' = 'sk-xxx',
    'ai.temperature' = '0.7',
    'ai.max_token' = '1024',
    'ai.max_retries' = '3',
    'ai.retry_delay_second' = '1',
    'ai.max_concurrency' = '4',
    'ai.dimensions' = '1024'
);
 ```

##### 参数说明

`type`: 必填，且必须为 `ai`，作为 ai 的类型标识。

`ai.provider_type`: 通用模型配置组的必填项，外部 AI 厂商类型。目前支持 OpenAI、Anthropic、Gemini、DeepSeek、Local、MoonShot、MiniMax、Zhipu、QWen、Baichuan、VoyageAI 和 Jina。若其他厂商的 API 格式与 [OpenAI](https://platform.openai.com/docs/overview)/[Anthropic](https://docs.anthropic.com/en/api/messages-examples)/[Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1) 相同，可填写对应的兼容厂商类型。

Provider 类型校验通过不代表它支持全部 AI 函数。例如 VoyageAI 和 Jina 用于 Embedding，不能作为文本生成模型使用。

`ai.endpoint`: 通用模型配置组的必填项，AI API 接口地址。

`ai.model_name`: 通用模型配置组的必填项，模型名称。

`ai.api_key`: 通用模型配置组的 API 密钥，除 `ai.provider_type = local` 的情况外必填。

`ai.temperature`: 可选，控制生成内容的随机性，取值范围为 0 到 1 的浮点数。默认值为 -1，表示不设置该参数。

`ai.max_token`: 可选，限制生成内容的最大 token 数。默认值为 -1，表示不设置该参数。Anthropic 默认值为 2048。

`ai.max_retries`: 可选，单次请求的最大重试次数。默认值为 3。

`ai.retry_delay_second`: 可选，重试前的延迟时间（秒）。开发分支默认值为 1，Doris 4.1.5 的默认值为 0。

`ai.max_concurrency`: 可选，单个执行实例同时保持在途的批量请求数上限，适用于标量 AI 函数（`ai_filter`、`ai_classify`、`ai_sentiment`、`ai_summarize`、`ai_translate`、`ai_generate`、`ai_extract`、`ai_mask`、`ai_fix_grammar`、`ai_similarity`）。必须为正整数。默认值为 1，表示一个 Block 内的各批次逐个发送；大于 1 时多个批次并发发送。请根据模型服务商的限流或连接配额设置：当执行计划包含多个 Scan 实例时，服务商同时收到的请求数最多为 `实例数 × ai.max_concurrency`。可通过 `ALTER RESOURCE` 修改。不适用于 `embed` 和 `ai_agg`。批次大小由 Session 变量 `ai_context_window_size` 单独控制。

`ai.dimensions`: 可选，控制[EMBED](./distance-functions/embed.md)输出的向量维度。**设置前务必确认`ai.model_name`所填模型支持自定义向量维度**，否则可能会导致模型调用失败。

### Embedding 专用模型配置（4.1.5 起）

自 4.1.5 版本起，一个 AI Resource 可以分别配置通用模型、文本 Embedding 模型和多模态 Embedding 模型。至少提供一个完整配置组；一旦填写某组的任一连接属性或 API Key，就必须补齐该组的 `endpoint`、`provider_type` 和 `model_name`，且非 `LOCAL` Provider 还必须填写该组的 `api_key`。不同配置组不会互相补齐缺失字段。

| 配置组 | 连接属性 | API Key | 使用场景 |
| --- | --- | --- | --- |
| 通用模型 | `ai.endpoint`、`ai.provider_type`、`ai.model_name` | `ai.api_key` | 文本生成等 AI 函数，以及未配置 Embedding 专用组时的回退 |
| 文本 Embedding | `ai.embed.endpoint`、`ai.embed.provider_type`、`ai.embed.model_name` | `ai.embed.api_key` | `EMBED()` 的文本输入；也可作为多模态输入的回退 |
| 多模态 Embedding | `ai.embed.mm.endpoint`、`ai.embed.mm.provider_type`、`ai.embed.mm.model_name` | `ai.embed.mm.api_key` | `EMBED()` 的 JSON 多模态输入 |

文本 `EMBED()` 优先使用文本 Embedding 组，否则使用通用组；多模态 `EMBED()` 按多模态 Embedding 组、文本 Embedding 组、通用组的顺序选择。最终 Provider 和模型仍需支持实际传入的媒体类型。只配置 Embedding 组的 Resource 可用于相应的 `EMBED()` 调用，但不能用于要求通用模型的文本生成函数。

例如，仅用于文本 Embedding 的 Resource 无需同时配置通用生成模型：

```sql
CREATE RESOURCE "text_embed_resource"
PROPERTIES (
    "type" = "ai",
    "ai.embed.provider_type" = "openai",
    "ai.embed.endpoint" = "https://<embedding-service>/v1/embeddings",
    "ai.embed.model_name" = "<embedding-model>",
    "ai.embed.api_key" = "<api-key>"
);
```

将连接信息替换为实际服务配置后，创建成功返回 `Query OK`。`ai.dimensions`、重试次数等公共参数仍按 Resource 配置使用。

### 推理强度 `ai.effort`（4.1.5 起）

自 4.1.5 版本起，可选字符串属性 `ai.effort` 用于指定模型推理强度。默认不设置，也不发送该参数。取值使用小写，并受 Provider 校验约束：

| Provider | 允许的值 |
| --- | --- |
| `ANTHROPIC` | `low`、`medium`、`high`、`xhigh`、`max` |
| `GEMINI` | `minimal`、`low`、`medium`、`high` |
| 其他 Provider 的属性校验 | `none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max` |

属性校验通过不代表所有模型都支持该强度；应选择目标服务和模型支持的值。`ai.effort` 不会替代 `ai.max_token`。

### 创建、修改与删除权限（4.1.5 起）

创建 AI Resource 需要全局 `ADMIN` 权限。自 4.1.5 版本起，FE 配置 [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user) 可进一步限制创建者身份，默认 `*` 不增加身份限制。

自 4.1.5 版本起新建、且由 `root` 创建的 AI Resource，只能由 `root` 修改或删除，即使其他账号有 `ADMIN` 权限也会被拒绝。升级前已存在、未记录该标记的 Resource 不会被追溯标记。其他资源仍执行原有权限检查。

---

## 资源指定与 Session 变量

当用户调用 AI 相关函数时，可以通过以下两种方式指定资源：

- 显式指定资源：在函数调用时直接传入资源名称。
- 隐式指定资源：通过预先设置 Session 变量，函数会自动使用对应的资源。

设置 Session 变量方法如下
```sql
SET default_ai_resource='resource_name';
```

函数调用格式如下：
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### 资源指定的优先级

当调用一个AI_Function时， 它会按照以下顺序确认选择哪个资源:

1. 用户在调用时明确指定的resource
2. 全局默认resource(default_ai_resource)

示例:
```sql
SET default_ai_resource='global_default_resource';
SELECT AI_SENTIMENT('this is a test'); -- 调用名为'global_default_resource'的资源
SELECT AI_SENTIMENT('invoke_resource', 'this is a test'); --调用名为'invoke_resource'的资源
```

---

## AI Functions

Doris当前支持的 AI Function包括:

- `AI_CLASSIFY`: 信息分类

- `AI_EXTRACT`: 提取信息

- `AI_FILTER`：筛选信息

- `AI_FIXGRAMMAR`： 修改病句

- `AI_GENERATE`： 生成信息

- `AI_MASK`： 掩盖敏感信息

- `AI_SENTIMENT`： 情感分析

- `AI_SIMILARITY`： 文本语义相似性比较

- `AI_SUMMARIZE`： 文本摘要

- `AI_TRANSLATE`： 翻译

- `AI_AGG`: 对多条文本进行跨行聚合分析。

### 示例

1. `AI_TRANSLATE`
```sql
SELECT AI_TRANSLATE('resource_name', 'this is a test', 'Chinese');
-- 这是一个测试
```

2. `AI_SENTIMENT`
```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SENTIMENT('Apache Doirs is a great DBMS.');
-- positive
```

函数功能及其用法详细请见具体函数的文档
