---
{
    "title": "LLM_Function",
    "language": "zh-CN"
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

LLM Function 是 Doris 提供的基于大语言模型能力的内置函数，用户可以在 SQL 查询中直接调用 LLM 执行多种文本智能任务。LLM Function 通过 Doris 的资源机制对接多个主流 LLM 厂商(如 OpenAI、Anthropic、DeepSeek、Gemini、Ollama MoonShot等)

所使用的 LLM 必须由 Doris 外部提供，且支持文本分析

---

## 配置 LLM 资源
在使用 LLM Function 前，需先创建 LLM 类型的 Resource，集中管理 LLM API 的访问信息

### 示例：创建 LLM Resource

```sql
CREATE RESOURCE "llm_resource_name"
PROPERTIES (
    'type' = 'llm',
    'llm.provider_type' = 'openai',
    'llm.endpoint' = 'https://endpoint_example',
    'llm.model_name' = 'model_example',
    'llm.api_key' = 'sk-xxx',
    'llm.temperature' = '0.7',
    'llm.max_token' = '1024',
    'llm.max_retries' = '3',
    'llm.retry_delay_second' = '1'
);
 ```

##### 参数说明

`type`: 必填，且必须为 `llm`，作为 llm 的类型标识。

`llm.provider_type`: 必填，外部LLM厂商类型。目前支持的厂商有：OpenAI、Anthropic、Gemini、DeepSeek、Local、MoonShot、MiniMax、Zhipu、QWen、Baichuan。若有不在上列的厂商，但其 API 格式与 [OpenAI](https://platform.openai.com/docs/overview)/[Anthropic](https://docs.anthropic.com/en/api/messages-examples)/[Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1) 相同的，可直接填入三者中格式相同的厂商。

`llm.endpoint`: 必填，LLM API 接口地址。

`llm.model_name`: 必填，模型名称

`llm_api_key`: 除`llm.provider_type = local`的情况外必填，API 密钥。

`llm.temperature`: 可选，控制生成内容的随机性，取值范围为 0 到 1 的浮点数。默认值为 -1，表示不设置该参数。

`llm.max_tokens`: 可选，限制生成内容的最大 token 数。默认值为 -1，表示不设置该参数。Anthropic 默认值为 2048。

`llm.max_retries`: 可选，单次请求的最大重试次数。默认值为 3。

`llm.retry_delay_second`: 可选，重试的延迟时间（秒）。默认值为 0。

---

## 资源指定与 Session 变量

当用户调用 LLM 相关函数时，可以通过以下两种方式指定资源：

- 显式指定资源：在函数调用时直接传入资源名称。
- 隐式指定资源：通过预先设置 Session 变量，函数会自动使用对应的资源。

设置 Session 变量方法如下
```sql
SET default_llm_resource='resource_name';
```

函数调用格式如下：
```sql
SELECT LLM_FUNCTION([<resource_name>], <args...>);
```

### 资源指定的优先级

当调用一个LLM_Function时， 它会按照以下顺序确认选择哪个资源:

1. 用户在调用时明确指定的resource
2. 全局默认resource(default_llm_resource)

示例:
```sql
SET default_llm_resource='global_default_resource';
SELECT LLM_SENTIMENT('this is a test'); -- 调用名为'global_default_resource'的资源
SELECT LLM_SENTIMENT('invoke_resource', 'this is a test') --调用名为'invoke_resource'的资源
```

---

## LLM Functions

Doris当前支持的 LLM Function包括:

- `LLM_CLASSIFY`: 信息分类

- `LLM_EXTRACT`: 提取信息

- `LLM_FIXGRAMMAR`： 修改病句

- `LLM_GENERATE`： 生成信息

- `LLM_MASK`： 掩盖敏感信息

- `LLM_SENTIMENT`： 情感分析

- `LLM_SUMMARIZE`： 文本摘要

- `LLM_TRANSLATE`： 翻译

### 示例

1. `LLM_TRANSLATE`
```sql
SELECT LLM_TRANSLATE('resource_name', 'this is a test', 'Chinese');
-- 这是一个测试
```

2. `LLM_SENTIMENT`
```sql
SET default_llm_resource = 'resource_name';
SELECT LLM_SENTIMENT('Apache Doirs is a great DBMS.');
-- positive
```

函数功能及其用法详细请见具体函数的文档
