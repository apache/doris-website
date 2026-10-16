---
{
    "title": "Overview | Ai Functions",
    "language": "en",
    "description": "AI Function is a built-in function provided by Doris based on Artificial Intelligence (AI) capabilities.",
    "sidebar_label": "Overview"
}
---

# Overview

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

## Description

AI Function is a built-in function provided by Doris based on Artificial Intelligence (AI) capabilities. Users can directly call AI in SQL queries to perform various intelligent text tasks. AI Function connects to multiple mainstream AI providers (such as OpenAI, Anthropic, DeepSeek, Gemini, Ollama, MoonShot, etc.) through Doris's resource mechanism.

The AI used must be provided externally by Doris and support text analysis.

---

## Configure AI Resource

Before using AI Function, you need to create a Resource of type AI to centrally manage access information for the AI API.

### Example: Create AI Resource

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

##### Parameter Description

`type`: Required, must be `ai`, used as the type identifier for ai.

`ai.provider_type`: Required for the general model group. Specifies the external AI provider. Supported providers include OpenAI, Anthropic, Gemini, DeepSeek, Local, MoonShot, MiniMax, Zhipu, QWen, Baichuan, VoyageAI, and Jina. If another provider uses an API compatible with [OpenAI](https://platform.openai.com/docs/overview), [Anthropic](https://docs.anthropic.com/en/api/messages-examples), or [Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1), specify the corresponding compatible provider type.

A valid provider type does not imply support for every AI function. For example, VoyageAI and Jina support embedding and cannot serve as text generation models.

`ai.endpoint`: Required for the general model group. Specifies the AI API endpoint.

`ai.model_name`: Required for the general model group. Specifies the model name.

`ai.api_key`: API key for the general model group. Required unless `ai.provider_type = local`.

`ai.temperature`: Optional. Controls the randomness of generated content. Accepts a float value between 0 and 1. 
The default value is -1, which means this parameter is not set.

`ai.max_token`: Optional. Limits the maximum number of tokens for generated content.
The default value is -1, which means this parameter is not set. The default value for Anthropic is 2048.

`ai.max_retries`: Optional. The maximum number of retries for a single request. The default value is 3.

`ai.retry_delay_second`: Optional. The delay time (in seconds) before retrying. The default value is 0.

`ai.dimensions`: Optional, control the vector dimension of [EMBED](./distance-functions/embed.md) output. 
**Make sure to confirm that the model filled in `ai.model_name` supports custom vector dimension before setting**, 
otherwise it may cause model call failure.

### Dedicated Embedding Model Configuration (Since 4.1.5)

Since version 4.1.5, an AI Resource can configure a general model, a text embedding model, and a multimodal embedding model separately. At least one complete group is required. If any connection property or API key is set for a group, that group must include `endpoint`, `provider_type`, and `model_name`, plus `api_key` for non-`LOCAL` providers. Missing fields are not inherited from other groups.

| Model group | Connection properties | API key | Usage |
| --- | --- | --- | --- |
| General | `ai.endpoint`, `ai.provider_type`, `ai.model_name` | `ai.api_key` | Text generation and other AI functions; fallback when no dedicated embedding group is configured |
| Text embedding | `ai.embed.endpoint`, `ai.embed.provider_type`, `ai.embed.model_name` | `ai.embed.api_key` | Text input to `EMBED()`; fallback for multimodal input |
| Multimodal embedding | `ai.embed.mm.endpoint`, `ai.embed.mm.provider_type`, `ai.embed.mm.model_name` | `ai.embed.mm.api_key` | JSON multimodal input to `EMBED()` |

Text `EMBED()` selects the text embedding group first, then the general group. Multimodal `EMBED()` selects the multimodal embedding group, then the text embedding group, then the general group. The selected provider and model must support the actual media type. A resource with only embedding groups can serve the corresponding `EMBED()` calls, but cannot serve text generation functions that require a general model.

For example, a resource used only for text embedding does not need a general generation model:

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

Replace the connection values with your service configuration. Successful creation returns `Query OK`. Shared settings such as `ai.dimensions` and retry parameters still come from the resource configuration.

### Reasoning Effort: `ai.effort` (Since 4.1.5)

Since version 4.1.5, the optional string property `ai.effort` specifies reasoning effort. By default, it is unset and is not sent to the provider. Use lowercase values, subject to provider validation:

| Provider | Accepted values |
| --- | --- |
| `ANTHROPIC` | `low`, `medium`, `high`, `xhigh`, `max` |
| `GEMINI` | `minimal`, `low`, `medium`, `high` |
| Property validation for other providers | `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` |

Passing property validation does not mean every model supports that effort level. Choose a value supported by your service and model. `ai.effort` does not replace `ai.max_token`.

### Create, Alter, and Drop Permissions (Since 4.1.5)

Creating an AI Resource requires global `ADMIN` privileges. Since version 4.1.5, the FE configuration [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user) can further restrict the creator's identity. Its default value, `*`, adds no identity restriction.

An AI Resource newly created by `root` since version 4.1.5 can only be altered or dropped by `root`; other accounts are rejected even if they have `ADMIN` privileges. Resources that existed before the upgrade and lack this marker are not marked retroactively. Other resources retain the existing privilege checks.

---

## Resource Selection and Session Variables

When users call AI-related functions, resources can be specified in the following two ways:

- Explicitly specify the resource: directly pass the resource name when calling the function.
- Implicitly specify the resource: set the Session variable in advance, and the function will automatically use the corresponding resource.

Set Session variable format:
```sql
SET default_ai_resource='resource_name';
```

Function call format:
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### Resource Selection Priority

When calling an AI_Function, it determines which resource to use in the following order:

1. The resource explicitly specified by the user in the call
2. The global default resource (`default_ai_resource`)

Example:

```sql
SET default_ai_resource='global_default_resource';
SELECT AI_SENTIMENT('this is a test'); -- Uses resource named 'global_default_resource'
SELECT AI_SENTIMENT('invoke_resource', 'this is a test'); --Uses resource named 'invoke_resource'
```

---

## AI Functions

Currently supported AI Functions in Doris include:

- `AI_CLASSIFY`: Information classification

- `AI_EXTRACT`: Information extraction

- `AI_FILTER`：Filter information

- `AI_FIXGRAMMAR`: Grammar correction

- `AI_GENERATE`: Text generation

- `AI_MASK`: Masking sensitive information

- `AI_SENTIMENT`: Sentiment analysis

- `AI_SIMILARITY`: Text semantic similarity comparison

- `AI_SUMMARIZE`: Text summarization

- `AI_TRANSLATE`: Translation

- `AI_AGG`: Perform cross-line aggregation analysis on multiple texts

### Examples

1. `AI_TRANSLATE`
```sql
SELECT AI_TRANSLATE('resource_name', 'this is a test', 'Chinese');
-- 这是一个测试
```

2. `AI_SENTIMENT`
```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SENTIMENT('Apache Doris is a great DBMS.');
```

For detailed function and usage, please refer to the documentation of each specific function.

