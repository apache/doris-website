---
{
    "title": "개요 | AI 함수",
    "language": "ko",
    "description": "AI 함수는 인공지능(AI) 기능을 기반으로 Doris에서 제공하는 내장 함수입니다.",
    "sidebar_label": "개요"
}
---

# 개요 {#overview}

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

## 설명 {#description}

AI 함수는 인공지능(AI) 기능을 기반으로 Doris에서 제공하는 내장 함수입니다. 사용자는 SQL 쿼리에서 AI를 직접 호출하여 다양한 지능형 텍스트 작업을 수행할 수 있습니다. AI 함수는 Doris의 리소스 메커니즘을 통해 여러 주요 AI 공급자(OpenAI, Anthropic, DeepSeek, Gemini, Ollama, MoonShot 등)에 연결됩니다.

사용하는 AI는 Doris 외부에서 제공되어야 하며 텍스트 분석을 지원해야 합니다.

---

## AI Resource 구성 {#configure-ai-resource}

AI 함수를 사용하려면 AI API 접근 정보를 중앙에서 관리할 수 있도록 AI 유형의 Resource를 생성해야 합니다.

### 예제: AI Resource 생성 {#example-create-ai-resource}

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

##### 매개변수 설명 {#parameter-description}

`type`: 필수 항목이며, 반드시 `ai`여야 합니다. ai의 유형 식별자로 사용됩니다.

`ai.provider_type`: 일반 모델 그룹의 필수 항목입니다. 외부 AI 공급자를 지정합니다. 지원되는 공급자는 OpenAI, Anthropic, Gemini, DeepSeek, Local, MoonShot, MiniMax, Zhipu, QWen, Baichuan, VoyageAI, Jina입니다. 다른 공급자가 [OpenAI](https://platform.openai.com/docs/overview), [Anthropic](https://docs.anthropic.com/en/api/messages-examples) 또는 [Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1)와 호환되는 API를 사용하는 경우, 호환되는 공급자 유형을 지정하세요.

공급자 유형이 유효하다고 해서 모든 AI 함수를 지원하는 것은 아닙니다. 예를 들어 VoyageAI와 Jina는 임베딩을 지원하지만 텍스트 생성 모델로는 사용할 수 없습니다.

`ai.endpoint`: 일반 모델 그룹의 필수 항목입니다. AI API 엔드포인트를 지정합니다.

`ai.model_name`: 일반 모델 그룹의 필수 항목입니다. 모델 이름을 지정합니다.

`ai.api_key`: 일반 모델 그룹의 API 키입니다. `ai.provider_type = local`인 경우를 제외하고 필수입니다.

`ai.temperature`: 선택 항목입니다. 생성되는 콘텐츠의 무작위성을 제어합니다. 0과 1 사이의 부동소수점 값을 허용합니다. 
기본값은 -1이며, 이 매개변수를 설정하지 않음을 의미합니다.

`ai.max_token`: 선택 항목입니다. 생성되는 콘텐츠의 최대 토큰 수를 제한합니다.
기본값은 -1이며, 이 매개변수를 설정하지 않음을 의미합니다. Anthropic의 기본값은 2048입니다.

`ai.max_retries`: 선택 항목입니다. 단일 요청에 대한 최대 재시도 횟수입니다. 기본값은 3입니다.

`ai.retry_delay_second`: 선택 항목입니다. 재시도 전 대기 시간이며, 단위는 초입니다. 개발 브랜치의 기본값은 1이고, Doris 4.1.5에서는 0입니다.

`ai.dimensions`: 선택 항목이며, [EMBED](./distance-functions/embed.md) 출력 벡터의 차원을 제어합니다. 
**설정하기 전에 `ai.model_name`에 지정한 모델이 사용자 지정 벡터 차원을 지원하는지 반드시 확인하세요**. 
그렇지 않으면 모델 호출이 실패할 수 있습니다.

### 전용 임베딩 모델 구성 (4.1.5부터) {#dedicated-embedding-model-configuration-since-415}

버전 4.1.5부터 AI Resource에 일반 모델, 텍스트 임베딩 모델, 멀티모달 임베딩 모델을 각각 구성할 수 있습니다. 필수 항목을 모두 갖춘 그룹이 하나 이상 있어야 합니다. 어떤 그룹에 연결 속성이나 API 키를 하나라도 설정하면 해당 그룹에 `endpoint`, `provider_type`, `model_name`이 포함되어야 합니다. `api_key`도 `LOCAL` 이외의 공급자를 사용하는 경우 필수입니다. 누락된 필드는 다른 그룹에서 상속되지 않습니다.

| 모델 그룹 | 연결 속성 | API 키 | 용도 |
| --- | --- | --- | --- |
| 일반 | `ai.endpoint`, `ai.provider_type`, `ai.model_name` | `ai.api_key` | 텍스트 생성 및 기타 AI 함수. 전용 임베딩 그룹이 구성되지 않은 경우 대체 그룹으로 사용 |
| 텍스트 임베딩 | `ai.embed.endpoint`, `ai.embed.provider_type`, `ai.embed.model_name` | `ai.embed.api_key` | `EMBED()`의 텍스트 입력 처리. 멀티모달 입력의 대체 그룹으로 사용 |
| 멀티모달 임베딩 | `ai.embed.mm.endpoint`, `ai.embed.mm.provider_type`, `ai.embed.mm.model_name` | `ai.embed.mm.api_key` | `EMBED()`의 JSON 멀티모달 입력 처리 |

텍스트 `EMBED()`는 텍스트 임베딩 그룹을 먼저 선택하고, 그다음 일반 그룹을 선택합니다. 멀티모달 `EMBED()`는 멀티모달 임베딩 그룹, 텍스트 임베딩 그룹, 일반 그룹 순으로 선택합니다. 선택된 공급자와 모델은 실제 미디어 유형을 지원해야 합니다. 임베딩 그룹만 있는 리소스는 해당 `EMBED()` 호출을 처리할 수 있지만, 일반 모델이 필요한 텍스트 생성 함수는 처리할 수 없습니다.

예를 들어 텍스트 임베딩에만 사용하는 리소스에는 일반 생성 모델이 필요하지 않습니다.

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

연결 값을 사용하는 서비스의 구성에 맞게 바꾸세요. 생성에 성공하면 `Query OK`가 반환됩니다. `ai.dimensions` 및 재시도 매개변수와 같은 공통 설정은 계속 리소스 구성에서 가져옵니다.

### 추론 강도: `ai.effort` (4.1.5부터) {#reasoning-effort-aieffort-since-415}

버전 4.1.5부터 선택적 문자열 속성인 `ai.effort`로 추론 강도를 지정할 수 있습니다. 기본적으로 설정되지 않으며 공급자에게 전송되지 않습니다. 소문자 값을 사용해야 하며, 공급자의 검증을 통과해야 합니다.

| 공급자 | 허용되는 값 |
| --- | --- |
| `ANTHROPIC` | `low`, `medium`, `high`, `xhigh`, `max` |
| `GEMINI` | `minimal`, `low`, `medium`, `high` |
| 기타 공급자에 대한 속성 검증 | `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` |

속성 검증을 통과했다고 해서 모든 모델이 해당 추론 강도를 지원하는 것은 아닙니다. 사용하는 서비스와 모델이 지원하는 값을 선택하세요. `ai.effort`는 `ai.max_token`을 대체하지 않습니다.

### 생성, 변경 및 삭제 권한 (4.1.5부터) {#create-alter-and-drop-permissions-since-415}

AI Resource를 생성하려면 전역 `ADMIN` 권한이 필요합니다. 버전 4.1.5부터 FE 설정 [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user)을 통해 생성이 허용되는 사용자를 추가로 제한할 수 있습니다. 기본값인 `*`는 사용자에 대한 제한을 추가하지 않습니다.

버전 4.1.5부터 `root`가 새로 생성한 AI Resource는 `root`만 변경하거나 삭제할 수 있습니다. 다른 계정은 `ADMIN` 권한이 있어도 거부됩니다. 업그레이드 전에 이미 존재했고 이 표시가 없는 리소스에는 표시가 소급 적용되지 않습니다. 다른 리소스에는 기존 권한 검사가 유지됩니다.

---

## 리소스 선택 및 세션 변수 {#resource-selection-and-session-variables}

AI 관련 함수를 호출할 때는 다음 두 가지 방식으로 리소스를 지정할 수 있습니다.

- 명시적으로 리소스 지정: 함수를 호출할 때 리소스 이름을 직접 전달합니다.
- 암시적으로 리소스 지정: 세션 변수를 미리 설정하면 함수가 해당 리소스를 자동으로 사용합니다.

세션 변수 설정 형식:
```sql
SET default_ai_resource='resource_name';
```

함수 호출 형식:
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### 리소스 선택 우선순위 {#resource-selection-priority}

AI_Function을 호출하면 다음 순서에 따라 사용할 리소스가 결정됩니다.

1. 사용자가 호출 시 명시적으로 지정한 리소스
2. 전역 기본 리소스 (`default_ai_resource`)

예제:

```sql
SET default_ai_resource='global_default_resource';
SELECT AI_SENTIMENT('this is a test'); -- Uses resource named 'global_default_resource'
SELECT AI_SENTIMENT('invoke_resource', 'this is a test'); --Uses resource named 'invoke_resource'
```

---

## AI 함수 {#ai-functions}

현재 Doris에서 지원하는 AI 함수는 다음과 같습니다.

- `AI_CLASSIFY`: 정보 분류

- `AI_EXTRACT`: 정보 추출

- `AI_FILTER`：정보 필터링

- `AI_FIXGRAMMAR`: 문법 교정

- `AI_GENERATE`: 텍스트 생성

- `AI_MASK`: 민감한 정보 마스킹

- `AI_SENTIMENT`: 감정 분석

- `AI_SIMILARITY`: 텍스트 의미 유사도 비교

- `AI_SUMMARIZE`: 텍스트 요약

- `AI_TRANSLATE`: 번역

- `AI_AGG`: 여러 텍스트에 대한 행 간 집계 분석 수행

### 예제 {#examples}

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

각 함수의 세부 기능과 사용법은 해당 함수의 문서를 참조하세요.
