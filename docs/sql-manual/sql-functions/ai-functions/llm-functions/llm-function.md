---
{
    "title": "LLM_Function",
    "language": "en"
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

## Description

LLM Function is a built-in function provided by Doris based on large language model (LLM) capabilities. Users can directly call LLM in SQL queries to perform various intelligent text tasks. LLM Function connects to multiple mainstream LLM providers (such as OpenAI, Anthropic, DeepSeek, Gemini, Ollama, MoonShot, etc.) through Doris's resource mechanism.

The LLM used must be provided externally by Doris and support text analysis.

---

## Configure LLM Resource

Before using LLM Function, you need to create a Resource of type LLM to centrally manage access information for the LLM API.

### Example: Create LLM Resource

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
    'llm.retry_delay_second' = '1',
    'llm.dimensions' = '1024';
);
 ```

##### Parameter Description

`type`: Required, must be `llm`, used as the type identifier for llm.

`llm.provider_type`: Required, external LLM provider type. Currently supported providers include: OpenAI, Anthropic, Gemini, DeepSeek, Local, MoonShot, MiniMax, Zhipu, QWen, Baichuan, VoyageAI(only for EMBED feature). If there are providers not listed above but their API format is the same as [OpenAI](https://platform.openai.com/docs/overview)/[Anthropic](https://docs.anthropic.com/en/api/messages-examples)/[Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1), you can directly fill in the corresponding provider.

`llm.endpoint`: Required, LLM API endpoint.

`llm.model_name`: Required, model name.

`llm_api_key`: Required except when `llm.provider_type = local`, API key.

`llm.temperature`: Optional. Controls the randomness of generated content. Accepts a float value between 0 and 1. 
The default value is -1, which means this parameter is not set.

`llm.max_tokens`: Optional. Limits the maximum number of tokens for generated content. 
The default value is -1, which means this parameter is not set. The default value for Anthropic is 2048.

`llm.max_retries`: Optional. The maximum number of retries for a single request. The default value is 3.

`llm.retry_delay_second`: Optional. The delay time (in seconds) before retrying. The default value is 0.

`llm.dimensions`: Optional, control the vector dimension of [EMBED](https://doris.apache.org/docs/dev/sql-manual/sql-functions/ai-functions/distance-functions/embed) output. 
**Make sure to confirm that the model filled in llm.model_name supports custom vector dimension before setting**, 
otherwise it may cause model call failure.

---

## Resource Selection and Session Variables

When users call LLM-related functions, resources can be specified in the following two ways:

- Explicitly specify the resource: directly pass the resource name when calling the function.
- Implicitly specify the resource: set the Session variable in advance, and the function will automatically use the corresponding resource.

Set Session variable format:
```sql
SET default_llm_resource='resource_name';
```

Function call format:
```sql
SELECT LLM_FUNCTION([<resource_name>], <args...>);
```

### Resource Selection Priority

When calling an LLM_Function, it determines which resource to use in the following order:

1. The resource explicitly specified by the user in the call
2. The global default resource (`default_llm_resource`)

Example:

```sql
SET default_llm_resource='global_default_resource';
SELECT LLM_SENTIMENT('this is a test'); -- Uses resource named 'global_default_resource'
SELECT LLM_SENTIMENT('invoke_resource', 'this is a test') --Uses resource named 'invoke_resource'
```

---

## LLM Functions

Currently supported LLM Functions in Doris include:

- `LLM_CLASSIFY`: Information classification

- `LLM_EXTRACT`: Information extraction

- `LLM_FILTER`：Filter information

- `LLM_FIXGRAMMAR`: Grammar correction

- `LLM_GENERATE`: Text generation

- `LLM_MASK`: Masking sensitive information

- `LLM_SENTIMENT`: Sentiment analysis

- `LLM_SIMILARITY`: Text semantic similarity comparison

- `LLM_SUMMARIZE`: Text summarization

- `LLM_TRANSLATE`: Translation

- `LLM_AGG`: Perform cross-line aggregation analysis on multiple texts

### Examples

1. `LLM_TRANSLATE`
```sql
SELECT LLM_TRANSLATE('resource_name', 'this is a test', 'Chinese');
-- 这是一个测试
```

2. `LLM_SENTIMENT`
```sql
SET default_llm_resource = 'resource_name';
SELECT LLM_SENTIMENT('Apache Doris is a great DBMS.');
```

For detailed function and usage, please refer to the documentation of each specific function.
