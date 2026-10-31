---
{
    "title": "EMBED",
    "language": "ko",
    "description": "텍스트, 이미지, 비디오 또는 오디오 입력에 대한 임베딩 벡터를 생성합니다."
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

## 설명 {#description}

텍스트 또는 다중 모달 입력에 대한 임베딩 벡터를 생성합니다. 이 벡터는 유사도 계산, 검색 및 기타 시나리오에 사용할 수 있습니다.

:::note
다중 모달 임베딩은 Apache Doris 4.1.4부터 지원됩니다.
:::

다중 모달 임베딩을 사용하려면 이미지, 비디오 또는 오디오 파일을 설명하는 JSON 객체를 전달합니다. 미디어 유형을 사용하기 전에 구성된 AI provider와 모델이 해당 유형을 지원하는지 확인하세요.

### 다중 모달 임베딩을 지원하는 Provider {#providers-that-support-multimodal-embedding}

| Provider | 지원되는 미디어 유형 |
| --- | --- |
| `voyageai` | 이미지 (`image/`), 비디오 (`video/`) |
| `qwen` | 이미지 (`image/`), 비디오 (`video/`) |
| `jina` | 이미지 (`image/`), 비디오 (`video/`) |
| `gemini` | 이미지 (`image/`), 비디오 (`video/`), 오디오 (`audio/`) |

다른 provider에서 다중 모달 임베딩을 호출하면 `<provider> does not support multimodal Embed feature.` 오류가 보고됩니다. Provider가 지원하지 않는 미디어 유형을 전달하면 `<provider> only supports <types> multimodal embed, got <type>` 오류가 보고됩니다.

## 구문 {#syntax}

버전 4.1.5부터 AI Resource는 텍스트 및 다중 모달 임베딩을 위해 별도의 `ai.embed.*` 및 `ai.embed.mm.*` 모델 그룹을 구성할 수 있습니다. 텍스트 입력은 텍스트 임베딩 그룹을 먼저 선택한 후 일반 그룹을 선택합니다. JSON 다중 모달 입력은 다중 모달 임베딩 그룹, 텍스트 임베딩 그룹, 일반 그룹 순서로 선택합니다. 구성 요구 사항은 [AI 리소스 구성](../overview.md#dedicated-embedding-model-configuration-since-415)을 참조하세요.

```sql
EMBED([<resource_name>], <input>)
```

## 매개변수 {#parameters}

| 매개변수         | 설명 |
| ----------------- | ----------- |
| `<resource_name>` | 선택 사항. 임베딩을 생성하는 데 사용되는 AI resource입니다. 생략하면 Doris는 세션 변수 `default_ai_resource`를 사용합니다. |
| `<input>`         | 임베딩할 콘텐츠입니다. 텍스트 임베딩에는 문자열을, 다중 모달 임베딩에는 JSON 객체를 사용할 수 있습니다. |

다중 모달 JSON 객체에는 다음 필드가 포함됩니다.

| 필드 | 필수 여부 | 설명 |
| ----- | -------- | ----------- |
| `uri` | 예 | `http://` 또는 `https://` URL, 또는 `s3://<bucket>/<key>` 형식의 S3 호환 URI입니다. |
| `content_type` | 예 | 미디어 MIME 유형입니다. `image/`, `video/` 또는 `audio/`로 시작하는 값이 인식됩니다. AI provider와 모델이 해당 미디어 유형을 지원해야 합니다. |
| `endpoint` | S3 호환 URI인 경우 | S3 호환 스토리지 endpoint입니다. |
| `region` | S3 호환 URI인 경우 | 스토리지 region입니다. |
| `ak` | 아니요 | AK/SK 인증에 사용하는 access key입니다. |
| `sk` | 아니요 | AK/SK 인증에 사용하는 secret key입니다. |
| `role_arn` | 아니요 | 역할 기반 인증에 사용하는 IAM 역할 ARN입니다. |
| `external_id` | 아니요 | IAM 역할을 맡을 때 사용하는 external ID입니다. |

HTTP 또는 HTTPS URL의 경우 `uri`와 `content_type`만 필요합니다. S3 호환 URI의 경우 Doris는 스토리지 자격 증명을 사용해 presigned URL을 생성합니다. AK/SK 및 IAM 역할 인증을 모두 지원합니다.

presigned URL의 수명은 세션 변수 `file_presigned_url_ttl_seconds`로 제어되며, 단위는 초이고 기본값은 `3600`(1시간)입니다. 미디어 파일이 크고 provider가 파일을 가져오는 데 더 오래 걸리는 경우 이 값을 늘리세요.

```sql
SET file_presigned_url_ttl_seconds = 7200;
```

텍스트 입력의 경우 `EMBED`는 구성되어 있으면 resource의 완전한 `ai.embed.*` 연결 그룹을 사용하고, 그렇지 않으면 일반 `ai.*` 그룹을 사용합니다. JSON 다중 모달 입력의 선택 순서는 `ai.embed.mm.*`, `ai.embed.*`, 일반 `ai.*`입니다. 각 그룹에는 `endpoint`, `provider_type`, `model_name`, `api_key`가 포함됩니다(`LOCAL`에서는 `api_key`를 생략할 수 있음). 선택은 완전한 그룹 단위로 이루어지며, 선택된 provider와 모델이 입력 유형을 지원해야 합니다. 임베딩 속성만 포함하는 resource도 해당 `EMBED` 호출에 사용할 수 있습니다. [전용 임베딩 속성](../../../../ai/ai-function-overview.md#dedicated-embedding-properties)을 참조하세요.

## 반환 값 {#return-value}

반환 유형은 생성된 벡터를 나타내는 `ARRAY<FLOAT>`입니다.

입력 값이 NULL이면 NULL을 반환합니다.

벡터의 차원과 값은 AI provider와 모델에 따라 달라집니다.

## 다중 모달 예시 {#multimodal-examples}

다음 예시는 HTTPS URL을 통해 사용할 수 있는 이미지의 임베딩을 생성합니다.

```sql
SELECT ARRAY_SIZE(
    EMBED(
        'multimodal_embed_resource',
        CAST('{
            "uri": "https://example.com/images/product.png",
            "content_type": "image/png"
        }' AS JSON)
    )
) AS image_embedding_dimension;
```

```text
+---------------------------+
| image_embedding_dimension |
+---------------------------+
|                      2560 |
+---------------------------+
```

다음 예시는 AK/SK 인증을 사용해 S3 호환 스토리지에서 비디오를 읽습니다.

```sql
SELECT ARRAY_SIZE(
    EMBED(
        'multimodal_embed_resource',
        CAST('{
            "uri": "s3://example-bucket/videos/demo.mp4",
            "content_type": "video/mp4",
            "endpoint": "s3.us-east-1.amazonaws.com",
            "region": "us-east-1",
            "ak": "<access_key>",
            "sk": "<secret_key>"
        }' AS JSON)
    )
) AS video_embedding_dimension;
```

```text
+---------------------------+
| video_embedding_dimension |
+---------------------------+
|                      2560 |
+---------------------------+
```

AK/SK 대신 IAM 역할 인증을 사용할 수도 있습니다. 다음 예시는 이미지 임베딩을 생성합니다.

```sql
SELECT ARRAY_SIZE(
    EMBED(
        'multimodal_embed_resource',
        CAST('{
            "uri": "s3://example-bucket/images/product.png",
            "content_type": "image/png",
            "endpoint": "s3.us-east-1.amazonaws.com",
            "region": "us-east-1",
            "role_arn": "arn:aws:iam::<account_id>:role/<role_name>",
            "external_id": "<external_id>"
        }' AS JSON)
    )
) AS image_embedding_dimension;
```

```text
+---------------------------+
| image_embedding_dimension |
+---------------------------+
|                      3072 |
+---------------------------+
```

앞의 결과는 예시입니다. 실제 임베딩 차원은 구성된 provider와 모델에 따라 달라집니다.

## 텍스트 예시 {#text-example}

다음 표는 회사의 행동 강령을 시뮬레이션합니다.

```sql
CREATE TABLE knowledge_base (
    id BIGINT,
    title STRING,
    content STRING,
    embedding ARRAY<FLOAT> COMMENT 'Generated embedding vectors by the EMBED function'
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES (
    "replication_num" = "1"
);

SET default_ai_resource = 'embed_resource_name';

-- `embedding` is the embedding vector generated by the function EMBED according to the corresponding tag of the content.
INSERT INTO knowledge_base (id, title, content, embedding) VALUES
(1, "Travel Reimbursement Policy",
    "Employees must submit a reimbursement request within 7 days after the business trip, with invoices and travel approval attached.",
    EMBED("travel reimbursement policy")),
(2, "Leave Policy",
    "Employees must apply for leave in the system in advance. If the leave is longer than three days, approval from the direct manager is required.",
    EMBED("leave request policy")),
(3, "VPN User Guide",
    "To access the internal network, employees must use VPN. For the first login, download and install the client and configure the certificate.",
    EMBED("VPN guide intranet access")),
(4, "Meeting Room Reservation",
    "Meeting rooms can be reserved in advance through the OA system, with time and number of participants specified.",
    EMBED("meeting room booking reservation")),
(5, "Procurement Request Process",
    "Departments must fill out a procurement request form for purchasing items. If the amount exceeds $5000, financial approval is required.",
    EMBED("procurement request process finance"));
```

텍스트를 벡터화하면 다음과 같은 작업을 수행할 수 있습니다.

1. 질문 응답 검색(`COSINE_DISTANCE` 사용)
```sql
SELECT
    id, title, content,
    COSINE_DISTANCE(embedding, EMBED("How to apply for travel reimbursement?")) AS score
FROM knowledge_base
ORDER BY score ASC
LIMIT 2;
```

```text
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+--------------------+
| id   | title                       | content                                                                                                                                 | score              |
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+--------------------+
|    1 | Travel Reimbursement Policy | Employees must submit a reimbursement request within 7 days after the business trip, with invoices and travel approval attached.        | 0.4463210454563673 |
|    5 | Procurement Request Process | Departments must fill out a procurement request form for purchasing items. If the amount exceeds $5000, financial approval is required. | 0.5726841578491431 |
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+--------------------+
```

2. 문제 분석 매칭(`L2_DISTANCE` 사용)
```sql
SELECT
    id, title, content,
    L2_DISTANCE(embedding, EMBED("How to access the company intranet")) AS distance
FROM knowledge_base
ORDER BY distance ASC
LIMIT 2;
```

```text
+------+-----------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
| id   | title                       | content                                                                                                                                     | distance           |
+------+-----------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
|    3 | VPN User Guide              | To access the internal network, employees must use VPN. For the first login, download and install the client and configure the certificate. | 0.5838271122253775 |
|    1 | Travel Reimbursement Policy | Employees must submit a reimbursement request within 7 days after the business trip, with invoices and travel approval attached.            |  1.272394695975331 |
+------+-----------------------------+---------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
```

3. 문서 콘텐츠를 기반으로 텍스트 관련성을 매칭하고 추천(`INNER PRODUCT` 사용)
```sql
SELECT
    id, title, content,
    INNER_PRODUCT(embedding, EMBED("Leave system request leader approval")) AS score
FROM knowledge_base
WHERE id != 2
ORDER BY score DESC
LIMIT 2;
```

```text
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------------+
| id   | title                       | content                                                                                                                                 | score               |
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------------+
|    5 | Procurement Request Process | Departments must fill out a procurement request form for purchasing items. If the amount exceeds $5000, financial approval is required. |    0.33268885332504 |
|    4 | Meeting Room Reservation    | Meeting rooms can be reserved in advance through the OA system, with time and number of participants specified.                         | 0.29224032230852487 |
+------+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------------+
```

4. 차이가 가장 작은 콘텐츠 찾기(`L1_DISTANCE` 사용)
```sql
SELECT
    id, title, content,
    L1_DISTANCE(embedding, EMBED("Procurement application process")) AS distance
FROM knowledge_base
ORDER BY distance ASC
LIMIT 3;
```

```text
+------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
| id   | title                       | content                                                                                                                                        | distance           |
+------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
|    5 | Procurement Request Process | Departments must fill out a procurement request form for purchasing items. If the amount exceeds $5000, financial approval is required.        |  18.66882028897362 |
|    4 | Meeting Room Reservation    | Meeting rooms can be reserved in advance through the OA system, with time and number of participants specified.                                |  30.90449328294426 |
|    2 | Leave Policy                | Employees must apply for leave in the system in advance. If the leave is longer than three days, approval from the direct manager is required. | 31.060405636536416 |
+------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------+--------------------+
```
