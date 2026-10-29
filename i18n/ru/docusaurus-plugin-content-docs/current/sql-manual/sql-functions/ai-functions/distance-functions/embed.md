---
{
    "title": "EMBED",
    "language": "ru",
    "description": "Генерирует вектор эмбеддинга для текстового, графического, видео- или аудиовхода."
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

Генерирует вектор эмбеддинга для текста или мультимодального входа. Вектор можно использовать для вычисления сходства, поиска и других сценариев.

:::note
Мультимодальный эмбеддинг поддерживается начиная с Apache Doris 4.1.4.
:::

Для мультимодального эмбеддинга передайте JSON-объект, описывающий файл изображения, видео или аудио. Перед использованием типа носителя убедитесь, что настроенные AI Provider и модель его поддерживают.

### Провайдеры, поддерживающие мультимодальный эмбеддинг {#providers-that-support-multimodal-embedding}

| Provider | Поддерживаемые типы носителей |
| --- | --- |
| `voyageai` | Изображение (`image/`), видео (`video/`) |
| `qwen` | Изображение (`image/`), видео (`video/`) |
| `jina` | Изображение (`image/`), видео (`video/`) |
| `gemini` | Изображение (`image/`), видео (`video/`), аудио (`audio/`) |

При вызове мультимодального эмбеддинга у любого другого провайдера возвращается ошибка `<provider> does not support multimodal Embed feature.` Передача типа носителя, который провайдер не поддерживает, возвращает ошибку `<provider> only supports <types> multimodal embed, got <type>`.

## Синтаксис {#syntax}

Начиная с версии 4.1.5 ресурс AI может настраивать отдельные группы моделей `ai.embed.*` и `ai.embed.mm.*` для текстового и мультимодального эмбеддинга. Для текстового входа сначала выбирается группа текстового эмбеддинга, затем общая группа. Для JSON-мультимодального входа сначала выбирается группа мультимодального эмбеддинга, затем группа текстового эмбеддинга и общая группа. Требования к настройке см. в разделе [конфигурация ресурса AI](../overview.md#dedicated-embedding-model-configuration-since-415).

```sql
EMBED([<resource_name>], <input>)
```

## Параметры {#parameters}

| Параметр         | Описание |
| ----------------- | ----------- |
| `<resource_name>` | Необязательный параметр. Ресурс AI, используемый для генерации эмбеддинга. Если параметр опущен, Doris использует переменную сеанса `default_ai_resource`. |
| `<input>`         | Содержимое для эмбеддинга. Это может быть строка для текстового эмбеддинга или JSON-объект для мультимодального эмбеддинга. |

Мультимодальный JSON-объект содержит следующие поля:

| Поле | Обязательное | Описание |
| ----- | -------- | ----------- |
| `uri` | Да | URL `http://` или `https://` либо URI S3-совместимого хранилища в формате `s3://<bucket>/<key>`. |
| `content_type` | Да | MIME-тип носителя. Распознаются значения, начинающиеся с `image/`, `video/` или `audio/`. AI Provider и модель должны поддерживать этот тип носителя. |
| `endpoint` | Для URI S3-совместимого хранилища | Конечная точка S3-совместимого хранилища. |
| `region` | Для URI S3-совместимого хранилища | Регион хранилища. |
| `ak` | Нет | Ключ доступа для аутентификации AK/SK. |
| `sk` | Нет | Секретный ключ для аутентификации AK/SK. |
| `role_arn` | Нет | ARN роли IAM для аутентификации на основе роли. |
| `external_id` | Нет | Внешний идентификатор, используемый при принятии роли IAM. |

Для URL HTTP или HTTPS требуются только `uri` и `content_type`. Для URI S3-совместимого хранилища Doris использует учетные данные хранилища для создания предварительно подписанного URL. Поддерживаются аутентификация AK/SK и аутентификация роли IAM.

Срок действия предварительно подписанного URL задается переменной сеанса `file_presigned_url_ttl_seconds` в секундах; значение по умолчанию — `3600` (1 час). Если медиафайлы большие и провайдеру требуется больше времени для их получения, увеличьте это значение:

```sql
SET file_presigned_url_ttl_seconds = 7200;
```

Для текстового входа `EMBED` использует полную группу подключений ресурса `ai.embed.*`, если она настроена, в противном случае — его общую группу `ai.*`. Для JSON-мультимодального входа порядок выбора: `ai.embed.mm.*`, `ai.embed.*`, затем общая группа `ai.*`. Каждая группа содержит `endpoint`, `provider_type`, `model_name` и `api_key` (необязательный для `LOCAL`). Выбор выполняется по полным группам; выбранные провайдер и модель должны поддерживать тип входа. Ресурс, содержащий только свойства эмбеддинга, допустим для соответствующих вызовов `EMBED`. См. [специализированные свойства эмбеддинга](../../../../ai/ai-function-overview.md#dedicated-embedding-properties).

## Возвращаемое значение {#return-value}

Тип возвращаемого значения — `ARRAY<FLOAT>`, представляющий сгенерированный вектор.

Если входное значение равно NULL, возвращается NULL.

Размерность и значения вектора зависят от AI Provider и модели.

## Примеры мультимодального эмбеддинга {#multimodal-examples}

Следующий пример генерирует эмбеддинг изображения, доступного по URL HTTPS:

```sql
SELECT ARRAY_SIZE(
    EMBED(
        'multimodal_embed_resource',
        CAST('{\n            "uri": "https://example.com/images/product.png",\n            "content_type": "image/png"\n        }' AS JSON)
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

Следующий пример считывает видео из S3-совместимого хранилища с использованием аутентификации AK/SK:

```sql
SELECT ARRAY_SIZE(
    EMBED(
        'multimodal_embed_resource',
        CAST('{\n            "uri": "s3://example-bucket/videos/demo.mp4",\n            "content_type": "video/mp4",\n            "endpoint": "s3.us-east-1.amazonaws.com",\n            "region": "us-east-1",\n            "ak": "<access_key>",\n            "sk": "<secret_key>"\n        }' AS JSON)
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

Вместо AK/SK можно использовать аутентификацию роли IAM. Следующий пример генерирует эмбеддинг изображения:

```sql
SELECT ARRAY_SIZE(
    EMBED(
        'multimodal_embed_resource',
        CAST('{\n            "uri": "s3://example-bucket/images/product.png",\n            "content_type": "image/png",\n            "endpoint": "s3.us-east-1.amazonaws.com",\n            "region": "us-east-1",\n            "role_arn": "arn:aws:iam::<account_id>:role/<role_name>",\n            "external_id": "<external_id>"\n        }' AS JSON)
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

Приведенные результаты являются примерами. Фактическая размерность эмбеддинга зависит от настроенных провайдера и модели.

## Пример с текстом {#text-example}

В следующей таблице моделируется кодекс поведения компании.

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

Векторизация текста позволяет выполнять такие операции, как:

1. Поиск ответа на вопрос (с `COSINE_DISTANCE`)
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

2. Сопоставление для анализа проблем (с `L2_DISTANCE`)
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

3. Сопоставление релевантности текста и рекомендации на основе содержимого статьи (с `INNER PRODUCT`)
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

4. Поиск содержимого с минимальными различиями (с `L1_DISTANCE`)
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
