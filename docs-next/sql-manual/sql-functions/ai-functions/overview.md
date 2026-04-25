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

`ai.provider_type`: Required, external AI provider type. Currently supported providers include: OpenAI, Anthropic, Gemini, DeepSeek, Local, MoonShot, MiniMax, Zhipu, QWen, Baichuan. If there are providers not listed above but their API format is the same as [OpenAI](https://platform.openai.com/docs/overview)/[Anthropic](https://docs.anthropic.com/en/api/messages-examples)/[Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1), you can directly fill in the corresponding provider.

`ai.endpoint`: Required, AI API endpoint.

`ai.model_name`: Required, model name.

`ai_api_key`: Required except when `ai.provider_type = local`, API key.

`ai.temperature`: Optional. Controls the randomness of generated content. Accepts a float value between 0 and 1. 
The default value is -1, which means this parameter is not set.

`ai.max_tokens`: Optional. Limits the maximum number of tokens for generated content. 
The default value is -1, which means this parameter is not set. The default value for Anthropic is 2048.

`ai.max_retries`: Optional. The maximum number of retries for a single request. The default value is 3.

`ai.retry_delay_second`: Optional. The delay time (in seconds) before retrying. The default value is 0.

`ai.dimensions`: Optional, control the vector dimension of [EMBED](./distance-functions/embed.md) output. 
**Make sure to confirm that the model filled in `ai.model_name` supports custom vector dimension before setting**, 
otherwise it may cause model call failure.

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

