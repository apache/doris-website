---
{
    "title": "EMBED",
    "language": "ru",
    "description": "Создаёт вектор эмбеддинга для текста, изображения, видео или аудио."
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

## Описание {#description}

Создаёт вектор эмбеддинга для текстовых или мультимодальных входных данных. Этот вектор можно использовать для вычисления сходства, поиска и других задач.

:::note
Мультимодальные эмбеддинги поддерживаются начиная с Apache Doris 4.1.4.
:::

Для создания мультимодального эмбеддинга передайте объект JSON, описывающий файл изображения, видео или аудио. Перед использованием определённого типа мультимедиа убедитесь, что настроенный провайдер ИИ и модель поддерживают этот тип.

### Провайдеры с поддержкой мультимодальных эмбеддингов {#providers-that-support-multimodal-embedding}

| Провайдер | Поддерживаемые типы мультимедиа |
| --- | --- |
| `voyageai` | Изображения (`image/`), видео (`video/`) |
| `qwen` | Изображения (`image/`), видео (`video/`) |
| `jina` | Изображения (`image/`), видео (`video/`) |
| `gemini` | Изображения (`image/`), видео (`video/`), аудио (`audio/`) |

При вызове функции создания мультимодального эмбеддинга с любым другим провайдером возвращается ошибка `<provider> does not support multimodal Embed feature.` При передаче типа мультимедиа, который провайдер не поддерживает, возвращается ошибка `<provider> only supports <types> multimodal embed, got <type>`.

## Синтаксис {#syntax}

Начиная с версии 4.1.5, для ресурса ИИ можно настроить отдельные группы моделей `ai.embed.*` и `ai.embed.mm.*` для текстовых и мультимодальных эмбеддингов. При текстовом вводе сначала выбирается группа текстовых эмбеддингов, затем общая группа. При мультимодальном вводе в формате JSON сначала выбирается группа мультимодальных эмбеддингов, затем группа текстовых эмбеддингов, затем общая группа. Требования к настройке приведены в разделе [Настройка ресурса ИИ](../overview.md#dedicated-embedding-model-configuration-since-415).

```sql
EMBED([<resource_name>], <input>)
```

## Параметры {#parameters}

| Параметр         | Описание |
| ----------------- | ----------- |
| `<resource_name>` | Необязательный параметр. Ресурс ИИ, используемый для создания эмбеддинга. Если не указан, Doris использует переменную сеанса `default_ai_resource`. |
| `<input>`         | Содержимое для создания эмбеддинга. Может быть строкой для текстового эмбеддинга или объектом JSON для мультимодального эмбеддинга. |

Объект JSON для мультимодального эмбеддинга содержит следующие поля:

| Поле | Обязательность | Описание |
| ----- | -------- | ----------- |
| `uri` | Да | URL с протоколом `http://` или `https://` либо URI для S3-совместимого хранилища в формате `s3://<bucket>/<key>`. |
| `content_type` | Да | MIME-тип мультимедиа. Распознаются значения, начинающиеся с `image/`, `video/` или `audio/`. Провайдер ИИ и модель должны поддерживать этот тип мультимедиа. |
| `endpoint` | Для URI S3-совместимого хранилища | Конечная точка S3-совместимого хранилища. |
| `region` | Для URI S3-совместимого хранилища | Регион хранилища. |
| `ak` | Нет | Ключ доступа для аутентификации AK/SK. |
| `sk` | Нет | Секретный ключ для аутентификации AK/SK. |
| `role_arn` | Нет | ARN роли IAM для аутентификации на основе роли. |
| `external_id` | Нет | Внешний идентификатор, используемый при принятии роли IAM. |

Для URL с протоколом HTTP или HTTPS обязательны только поля `uri` и `content_type`. Для URI S3-совместимого хранилища Doris использует учётные данные хранилища, чтобы создать предварительно подписанный URL. Поддерживается аутентификация как по AK/SK, так и с помощью роли IAM.

Срок действия предварительно подписанного URL задаётся переменной сеанса `file_presigned_url_ttl_seconds` в секундах и по умолчанию составляет `3600` (1 час). Если мультимедийные файлы большие и провайдеру требуется больше времени для их получения, увеличьте это значение:

```sql
SET file_presigned_url_ttl_seconds = 7200;
```

## Возвращаемое значение {#return-value}

Тип возвращаемого значения — `ARRAY<FLOAT>`, представляющий созданный вектор.

Возвращает NULL, если входное значение равно NULL.

Размерность и значения вектора зависят от провайдера ИИ и модели.

## Примеры мультимодальных эмбеддингов {#multimodal-examples}

В следующем примере создаётся эмбеддинг для изображения, доступного по URL с протоколом HTTPS:

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

В следующем примере видео считывается из S3-совместимого хранилища с использованием аутентификации AK/SK:

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

Вместо AK/SK можно использовать аутентификацию с помощью роли IAM. В следующем примере создаётся эмбеддинг изображения:

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

Приведённые выше результаты служат примерами. Фактическая размерность эмбеддинга зависит от настроенного провайдера и модели.

## Пример для текста {#text-example}

Следующая таблица имитирует свод правил компании.

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

После векторизации текста можно выполнять следующие операции:

1. Поиск информации для ответов на вопросы (с помощью `COSINE_DISTANCE`)
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

2. Поиск подходящей информации для анализа проблемы (с помощью `L2_DISTANCE`)
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

3. Поиск релевантных текстов и рекомендации на основе содержания статей (с помощью `INNER PRODUCT`)
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

4. Поиск содержимого с минимальными различиями (с помощью `L1_DISTANCE`)
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
