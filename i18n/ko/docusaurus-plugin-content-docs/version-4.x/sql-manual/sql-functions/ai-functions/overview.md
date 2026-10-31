---
{
    "title": "개요 | AI 함수",
    "language": "ko",
    "description": "AI Function은 인공지능(AI) 기능을 기반으로 Doris가 제공하는 기본 제공 함수입니다.",
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

AI Function은 인공지능(AI) 기능을 기반으로 Doris가 제공하는 기본 제공 함수입니다. 사용자는 SQL 쿼리에서 AI를 직접 호출하여 다양한 지능형 텍스트 작업을 수행할 수 있습니다. AI Function은 Doris의 Resource 메커니즘을 통해 여러 주요 AI 공급자(예: OpenAI, Anthropic, DeepSeek, Gemini, Ollama, MoonShot 등)에 연결됩니다.

사용되는 AI는 Doris 외부에서 제공되어야 하며 텍스트 분석을 지원해야 합니다.

---

## AI Resource 구성 {#configure-ai-resource}

AI Function을 사용하기 전에 AI API에 대한 액세스 정보를 중앙에서 관리할 수 있도록 AI 유형의 Resource를 생성해야 합니다.

### 예: AI Resource 생성 {#example-create-ai-resource}

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

**4.1.5부터**, AI Resource에는 일반 `ai.*`, 텍스트 embedding `ai.embed.*` 또는 멀티모달 embedding `ai.embed.mm.*` 중 하나 이상의 완전한 연결 그룹이 포함되어야 합니다. 각 구성 그룹에는 `endpoint`, `provider_type`, `model_name`이 필요하며, provider가 `LOCAL`인 경우를 제외하고 `api_key`도 필요합니다. 아래의 필수 연결 필드는 스칼라 AI 함수와 `AI_AGG`가 사용하는 일반 그룹에 해당합니다. 텍스트 `EMBED`는 일반 그룹보다 `ai.embed.*`를 우선 사용하고, JSON 멀티모달 `EMBED`는 `ai.embed.mm.*`, `ai.embed.*`, 일반 그룹 순으로 사용합니다. 이전 버전에서는 일반 그룹이 필요합니다. 8개 필드와 예시는 [전용 embedding 속성](../../../ai/ai-function-overview.md#dedicated-embedding-properties)을 참조하세요.

`type`: 필수이며 반드시 `ai`여야 합니다. ai의 유형 식별자로 사용됩니다.

`ai.provider_type`: 일반 모델 그룹에서 필수입니다. 외부 AI 공급자를 지정합니다. 지원되는 공급자는 OpenAI, Anthropic, Gemini, DeepSeek, Local, MoonShot, MiniMax, Zhipu, QWen, Baichuan, VoyageAI 및 Jina입니다. 다른 공급자의 API가 [OpenAI](https://platform.openai.com/docs/overview), [Anthropic](https://docs.anthropic.com/en/api/messages-examples) 또는 [Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1)와 호환되는 경우 해당 호환 provider 유형을 지정합니다.

유효한 provider 유형이라고 해서 모든 AI 함수를 지원하는 것은 아닙니다. 예를 들어 VoyageAI와 Jina는 embedding을 지원하지만 텍스트 생성 모델로 사용할 수 없습니다.

`ai.endpoint`: 일반 모델 그룹에서 필수입니다. AI API 엔드포인트를 지정합니다.

`ai.model_name`: 일반 모델 그룹에서 필수입니다. 모델 이름을 지정합니다.

`ai.api_key`: 일반 모델 그룹의 API 키입니다. `ai.provider_type = local`인 경우를 제외하고 필수입니다.

`ai.temperature`: 선택 사항입니다. 생성 콘텐츠의 무작위성을 제어하며 0에서 1 사이의 부동 소수점 값을 허용합니다.
기본값은 -1이며, 이 매개변수가 설정되지 않았음을 의미합니다.

`ai.max_token`: 선택 사항입니다. 생성 콘텐츠의 최대 토큰 수를 제한합니다.
기본값은 -1이며, 이 매개변수가 설정되지 않았음을 의미합니다. Anthropic의 기본값은 2048입니다.

`ai.max_retries`: 선택 사항입니다. 단일 요청의 최대 재시도 횟수입니다. 기본값은 3입니다.

`ai.retry_delay_second`: 선택 사항입니다. 재시도 전 지연 시간(초)입니다. 기본값은 0입니다.

`ai.enable_structured_output` (**4.2부터**): 선택 사항인 Boolean이며 기본값은 `true`입니다. Doris는 스칼라 AI 함수의 입력 행을 배치로 묶습니다. 이 옵션을 활성화하면 응답 형식의 안정성을 높이기 위해 provider별 형식 필드가 추가됩니다. Doris는 구성된 모델이 이를 지원하는지 확인하지 않으며, LOCAL과 MiniMax에서는 이러한 필드를 생략합니다. 모델 또는 엔드포인트가 이를 거부하면 `false`로 설정하세요. 일괄 처리, 시스템 프롬프트 형식 지침 및 응답 검증은 계속 활성화됩니다. 이 속성은 `AI_AGG` 또는 `EMBED`에 적용되지 않습니다.

`ai.dimensions`: 선택 사항이며 [EMBED](./distance-functions/embed.md) 출력의 벡터 차원을 제어합니다.
**설정하기 전에 `ai.model_name`에 지정한 모델이 사용자 지정 벡터 차원을 지원하는지 확인하세요.**
그렇지 않으면 모델 호출이 실패할 수 있습니다.

### 전용 Embedding 모델 구성(4.1.5부터) {#dedicated-embedding-model-configuration-since-415}

4.1.5 버전부터 하나의 AI Resource에서 일반 모델, 텍스트 embedding 모델 및 멀티모달 embedding 모델을 별도로 구성할 수 있습니다. 하나 이상의 완전한 그룹이 필요합니다. 그룹에 연결 속성 또는 API 키를 하나라도 설정하면 해당 그룹에 `endpoint`, `provider_type`, `model_name`을 포함해야 하며, `LOCAL`이 아닌 provider에는 `api_key`도 포함해야 합니다. 누락된 필드는 다른 그룹에서 상속되지 않습니다.

| 모델 그룹 | 연결 속성 | API 키 | 사용 용도 |
| --- | --- | --- | --- |
| 일반 | `ai.endpoint`, `ai.provider_type`, `ai.model_name` | `ai.api_key` | 텍스트 생성 및 기타 AI 함수, 전용 embedding 그룹이 구성되지 않은 경우의 폴백 |
| 텍스트 embedding | `ai.embed.endpoint`, `ai.embed.provider_type`, `ai.embed.model_name` | `ai.embed.api_key` | `EMBED()`의 텍스트 입력, 멀티모달 입력의 폴백 |
| 멀티모달 embedding | `ai.embed.mm.endpoint`, `ai.embed.mm.provider_type`, `ai.embed.mm.model_name` | `ai.embed.mm.api_key` | `EMBED()`의 JSON 멀티모달 입력 |

텍스트 `EMBED()`는 먼저 텍스트 embedding 그룹을 선택하고, 없으면 일반 그룹을 선택합니다. 멀티모달 `EMBED()`는 멀티모달 embedding 그룹, 텍스트 embedding 그룹, 일반 그룹 순으로 선택합니다. 선택된 provider와 모델은 실제 미디어 유형을 지원해야 합니다. embedding 그룹만 있는 Resource는 해당 `EMBED()` 호출을 처리할 수 있지만, 일반 모델이 필요한 텍스트 생성 함수는 처리할 수 없습니다.

예를 들어 텍스트 embedding에만 사용하는 Resource에는 일반 생성 모델이 필요하지 않습니다.

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

연결 값을 서비스 구성으로 바꾸세요. 성공적으로 생성되면 `Query OK`가 반환됩니다. `ai.dimensions` 및 재시도 매개변수와 같은 공유 설정은 Resource 구성에서 계속 가져옵니다.

### 추론 강도: `ai.effort`(4.1.5부터) {#reasoning-effort-aieffort-since-415}

4.1.5 버전부터 선택적 문자열 속성 `ai.effort`로 추론 강도를 지정할 수 있습니다. 기본적으로 설정되지 않으며 provider로 전송되지 않습니다. 값은 소문자로 지정해야 하며 provider의 검증을 받습니다.

| Provider | 허용되는 값 |
| --- | --- |
| `ANTHROPIC` | `low`, `medium`, `high`, `xhigh`, `max` |
| `GEMINI` | `minimal`, `low`, `medium`, `high` |
| 기타 provider의 속성 검증 | `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` |

속성 검증을 통과했다고 해서 모든 모델이 해당 강도 수준을 지원하는 것은 아닙니다. 서비스와 모델이 지원하는 값을 선택하세요. `ai.effort`는 `ai.max_token`을 대체하지 않습니다.

`ALTER RESOURCE`에서 빈 문자열을 지정하면 `ai.effort` 설정이 제거됩니다.

### 생성, 변경 및 삭제 권한(4.1.5부터) {#create-alter-and-drop-permissions-since-415}

AI Resource를 생성하려면 전역 `ADMIN` 권한이 필요합니다. 4.1.5 버전부터 FE 구성 [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user)으로 생성자의 ID를 추가로 제한할 수 있습니다. 기본값 `*`은 ID 제한을 추가하지 않습니다.

4.1.5 버전부터 `root`가 새로 생성한 AI Resource는 `root`만 변경하거나 삭제할 수 있습니다. 다른 계정은 `ADMIN` 권한이 있어도 거부됩니다. 업그레이드 전에 존재했고 이 표시가 없는 Resource에는 소급하여 표시가 추가되지 않습니다. 다른 Resource에는 기존 권한 검사가 계속 적용됩니다.

---

## Resource 선택 및 Session 변수 {#resource-selection-and-session-variables}

사용자가 AI 관련 함수를 호출할 때 Resource를 지정하는 방법은 다음 두 가지입니다.

- Resource를 명시적으로 지정: 함수 호출 시 Resource 이름을 직접 전달합니다.
- Resource를 암시적으로 지정: Session 변수를 미리 설정하면 함수가 해당 Resource를 자동으로 사용합니다.

Session 변수 설정 형식:
```sql
SET default_ai_resource='resource_name';
```

함수 호출 형식:
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### Resource 선택 우선순위 {#resource-selection-priority}

AI_Function을 호출하면 다음 순서로 사용할 Resource를 결정합니다.

1. 호출에서 사용자가 명시적으로 지정한 Resource
2. 전역 기본 Resource(`default_ai_resource`)

예:

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

- `AI_MASK`: 민감 정보 마스킹

- `AI_SENTIMENT`: 감정 분석

- `AI_SIMILARITY`: 텍스트 의미적 유사성 비교

- `AI_SUMMARIZE`: 텍스트 요약

- `AI_TRANSLATE`: 번역

- `AI_AGG`: 여러 텍스트에 대한 행 간 집계 분석 수행

### 예시 {#examples}

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

각 함수의 자세한 기능과 사용 방법은 해당 함수의 문서를 참조하세요.
