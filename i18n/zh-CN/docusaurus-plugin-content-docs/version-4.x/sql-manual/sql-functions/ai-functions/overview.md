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
    'ai.dimensions' = '1024'
);
 ```

##### 参数说明

`type`: 必填，且必须为 `ai`，作为 ai 的类型标识。

`ai.provider_type`: 必填，外部AI厂商类型。目前支持的厂商有：OpenAI、Anthropic、Gemini、DeepSeek、Local、MoonShot、MiniMax、Zhipu、QWen、Baichuan。若有不在上列的厂商，但其 API 格式与 [OpenAI](https://platform.openai.com/docs/overview)/[Anthropic](https://docs.anthropic.com/en/api/messages-examples)/[Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1) 相同的，可直接填入三者中格式相同的厂商。

`ai.endpoint`: 必填，AI API 接口地址。

`ai.model_name`: 必填，模型名称

`ai_api_key`: 除`ai.provider_type = local`的情况外必填，API 密钥。

`ai.temperature`: 可选，控制生成内容的随机性，取值范围为 0 到 1 的浮点数。默认值为 -1，表示不设置该参数。

`ai.max_tokens`: 可选，限制生成内容的最大 token 数。默认值为 -1，表示不设置该参数。Anthropic 默认值为 2048。

`ai.max_retries`: 可选，单次请求的最大重试次数。默认值为 3。

`ai.retry_delay_second`: 可选，重试的延迟时间（秒）。默认值为 0。

`ai.dimensions`: 可选，控制[EMBED](./distance-functions/embed.md)输出的向量维度。**设置前务必确认`ai.model_name`所填模型支持自定义向量维度**，否则可能会导致模型调用失败。

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
