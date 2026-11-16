---
title: 'Apache Doris и Vane: мультимодальные данные для бизнес-аналитики'
summary: 'Преобразуйте записи обращений в службу поддержки в текст и эмбеддинги, доступные для поиска, а затем свяжите результаты с обращениями, заказами и производственными партиями в Apache Doris.'
description: 'Практический сценарий работы с Apache Doris и Vane: транскрибирование аудио, создание эмбеддингов, поиск по отзывам и сопоставление результатов с бизнес-данными.'
keywords:
  - 'Apache Doris'
  - 'Vane'
  - 'мультимодальная аналитика'
  - 'векторный поиск'
  - 'транскрибирование аудио'
date: '2026-10-29'
author: 'Apache Doris'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-vane-multimodal-analytics/cover.jpg'
---
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

Заказы, обращения в службу поддержки и сведения о производственных партиях уже хранятся в базах данных. Но многие подробности из отзывов клиентов остаются в записях разговоров, расшифровках и вложениях.

Чтобы ответить на вопрос «Какие ещё клиенты сообщали о похожей проблеме и какие производственные партии с ней связаны?», команде может понадобиться прослушать записи, описать проблему и поочерёдно проверить бизнес-системы. Данные есть, но выполнять по ним единый запрос по-прежнему сложно.

Apache Doris и Vane связывают эти источники. Vane преобразует аудио, изображения и видео в текст, предварительные классификации и эмбеддинги. **Doris включает эти результаты в существующую модель бизнес-данных**, где их можно связать с заказами, обращениями и производственными партиями. По тем же записям можно искать похожие случаи и проводить бизнес-анализ, сохраняя ссылки на исходные материалы.

## Мультимодальные данные в бизнес-запросах {#bring-multimodal-data-into-business-queries}

Поиск данных для корпоративных ИИ-систем обычно не ограничивается поиском семантически похожего содержимого. Запросы также учитывают бизнес-условия: модель продукта, период, тип оборудования и заказы или партии, которые нужно исследовать.

Когда бизнес-данные, текстовый и векторный поиск находятся в Doris, эти условия можно учитывать в одном процессе работы с SQL:

- **Сначала сузьте область поиска, затем найдите похожие материалы.** Если устройство X1 не включается, сначала ограничьте поиск по модели и датам, а затем найдите отзывы с описаниями вроде «выключатель не реагирует» и «включаю, но ничего не происходит». При исследовании кода неисправности можно также добавить поиск по тексту.
- **От поиска переходите к анализу.** Свяжите найденные отзывы через обращения с заказами и партиями. Задав статус проверки, область анализа и правила устранения дубликатов, можно изучить распределение предполагаемых проблем по партиям и во времени.
- **Используйте существующие бизнес-данные и процессы работы с SQL.** Фильтрацию, поиск, соединение и агрегацию можно выполнять в одной среде данных. Это сокращает дублирование бизнес-полей, работу по синхронизации и необходимость собирать результаты на стороне приложения.

Так можно найти подходящие материалы, проследить их связь с бизнес-данными и проанализировать распределение результатов.

## Doris и Vane: от файлов к данным для анализа {#doris-and-vane-from-files-to-usable-data}

Чтобы превратить файл в данные, доступные для запросов, могут потребоваться разбор и разбиение документов на фрагменты, расшифровка аудио, извлечение кадров из видео, выделение бизнес-полей и создание эмбеддингов. Например, запись разговора со службой поддержки можно преобразовать в записи сегментов с идентификатором обращения, расшифровкой, предполагаемой категорией неисправности и эмбеддингом, сохранив URI исходной записи и временные метки.

Эти этапы требуют разных вычислительных ресурсов. Один исходный файл может превратиться во множество сегментов, а чтение, декодирование и инференс выполняются с разной скоростью. Даже после создания рабочего прототипа на Python команде предстоит управлять пакетной обработкой, параллельным выполнением, повторным использованием моделей и обработкой сбоев.

![Бизнес-данные поступают напрямую в Doris, а Vane преобразует документы, изображения, аудио и видео в текст, поля и эмбеддинги для поиска и анализа с объединением данных в SQL](/images/blogs/apache-doris-vane-multimodal-analytics/multimodal-data-flow.png)

[Vane](https://github.com/AstroVela/vane) объединяет SQL, пользовательские функции Python (UDF) и функции ИИ в едином потоке обработки данных. Бизнес-идентификаторы, ссылки на источники и результаты обработки сохраняют связь друг с другом, пока движок координирует чтение, декодирование, инференс и обработку результатов. Полученные текст, структурированные поля и векторы загружаются в Doris вместе с бизнес-данными.

В следующем примере с записями разговоров со службой поддержки действия выполняются в таком порядке: **подготовить таблицы Doris → обработать и загрузить данные с помощью Vane → выполнить запрос в Doris**. Здесь приведены фрагменты кода, а не полный автономный конвейер. Инструкции приведены в руководстве [Vane + Doris: поиск по записям разговоров со службой поддержки](https://vane.astrovela.ai/docs/data/tutorials/use-cases/audio-support-doris-search) по настройке среды, подготовке записей, реализации и регистрации UDF, разбиению на сегменты и загрузке данных.

## От записей разговоров со службой поддержки к бизнес-анализу {#from-support-recordings-to-business-analysis}

### Подготовка таблиц и индексов Doris {#prepare-doris-tables-and-indexes}

В SQL-клиенте Doris создайте целевую базу данных и таблицу сегментов. `feedback_segments` хранит текст расшифровки, предполагаемую категорию неисправности, отдельный статус проверки, эмбеддинг размерностью 384 и позиции в исходной записи. В ней также сохраняются поля обращения, модели продукта и даты. Инвертированный индекс поддерживает фильтрацию по тексту, а индекс ANN предназначен для приближённого векторного поиска.

```sql
CREATE DATABASE IF NOT EXISTS vane_support_demo;

CREATE TABLE vane_support_demo.feedback_segments (
    ticket_id VARCHAR(64) NOT NULL,
    segment_id INT NOT NULL,
    -- Business filters.
    product_model VARCHAR(64),
    event_date INT,
    -- AI labels are candidates; load new records with review_status = 'pending'.
    text STRING,
    fault_category VARCHAR(64),
    review_status VARCHAR(32),
    -- Original recording and segment boundaries, in milliseconds.
    source_uri STRING,
    start_ms BIGINT,
    end_ms BIGINT,
    embedding ARRAY<FLOAT> NOT NULL,
    -- Use the English parser for this English-language example.
    INDEX idx_text(text) USING INVERTED PROPERTIES("parser" = "english"),
    -- Match dimensions and distance settings to ingestion and query embeddings.
    INDEX idx_embedding(embedding) USING ANN PROPERTIES(
        "index_type" = "hnsw", "metric_type" = "l2_distance", "dim" = "384"
    )
) ENGINE=OLAP
DUPLICATE KEY(ticket_id, segment_id)
DISTRIBUTED BY HASH(ticket_id) BUCKETS 1
PROPERTIES("replication_num" = "1");
```

Также подготовьте таблицы связей между бизнес-данными из руководства: `ticket_orders` связывает обращения с заказами, а `orders` содержит сведения о производственных партиях. В примере предполагается, что каждому обращению соответствует один заказ, а каждому заказу — одна партия. В реальной системе используйте соответствующие бизнес-таблицы, уже находящиеся в Doris.

### Обработка записей разговоров в Vane {#process-recordings-in-vane}

#### Связь записей разговоров с метаданными обращений {#associate-recordings-with-ticket-metadata}

Vane позволяет передавать ссылки на файлы и метаданные обращений через один конвейер:

```sql
-- Run in Vane: combine file references with business metadata.
WITH files AS (
    SELECT
        ticket_id,
        product_model,
        event_date,
        -- FILE retains the reference; AUDIOFILE is the transcription UDF input.
        audio_file(
            file(f.url, NULL, NULL, NULL, NULL)
        ) AS audio
    -- Enumerate files; transcription reads their contents later.
    FROM list_files('./recordings/*.wav') AS f
    JOIN read_csv('tickets.csv', header = true) AS t
      -- Match T1024.wav to its unique ticket ID; unmatched files are excluded.
      ON regexp_extract(f.url, '([^/]+)\.wav$', 1) = t.ticket_id
)
SELECT ticket_id, product_model, event_date, audio
FROM files;
```

Исходный файл поступает в конвейер вместе со связанными бизнес-данными. Расшифровка, извлечение данных и создание эмбеддингов продолжаются в том же потоке обработки.

#### Расшифровка с сохранением временных меток сегментов {#transcribe-and-retain-segment-timestamps}

При расшифровке сохраняются временные позиции сегментов, чтобы найденный результат можно было сверить с записью:

```python
# Vane batch UDF excerpt. See the tutorial for implementation and registration.
@vane.cls.batch(actor_number=1, gpus=0, return_dtype="VARCHAR")
class SpeechRecognizer:
    # Load once per actor and reuse the model across batches.
    def __init__(self, model_name):
        from faster_whisper import WhisperModel
        self.model = WhisperModel(
            model_name,
            device="cpu",
            compute_type="int8"
        )

    def __call__(self, audios):
        # Transcribe a batch of AUDIOFILE values.
        # Return one JSON string per input, including segment IDs,
        # text, and start/end timestamps in milliseconds.
        # Later SQL expands those segments into rows.
        ...
```

#### Определить предварительные категории и создать эмбеддинги {#extract-candidate-categories-and-generate-embeddings}

Расшифрованные сегменты можно использовать для дальнейшей обработки в SQL. Промпт для классификации задаёт схему JSON и допустимые категории, а при недостатке данных позволяет сохранить неопределённость:

```sql
-- Run in Vane; segments comes from transcription and segment expansion.
SELECT
    ticket_id,
    segment_id,
    text,
    ai_prompt(
        'Classify the fault using only the support recording segment below. '
        || 'Return only a JSON object with the key fault_category. '
        || 'Allowed values: unable_to_start, general_inquiry, other_fault, needs_review. '
        || 'Do not treat negated, hypothetical, or resolved issues as confirmed faults. '
        || 'Use needs_review when evidence is insufficient. Segment: ' || text,
        provider := 'openai',
        model := '...', -- Replace with a text model ID available to your account.
        on_error := 'raise'
    ) AS fault_json
FROM segments;
```

Перед загрузкой проверьте JSON и приведите категории к стандартному виду. Некорректный JSON и значения вне допустимого набора преобразуются в `needs_review`. Даже корректные результаты классификации остаются предварительными метками до независимой проверки. Передача ошибок вызова модели не позволяет принять сбой API за корректный результат классификации.

Создайте эмбеддинг из той же расшифровки:

```sql
-- Vane SELECT expression excerpt.
ai_embed(
    text,
    provider := 'transformers',
    model := 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
    dimensions := 384,
    options := struct_pack(normalize := true)
) AS embedding
```

Для эмбеддингов при загрузке и выполнении запросов необходимо использовать одну и ту же модель и одинаковые настройки обработки. Размерность результата 384 должна соответствовать индексу ANN в Doris и настройкам загрузки; нормализация также должна выполняться одинаково.

Теперь каждая запись представлена текстом, предварительными категориями, векторами и позициями в исходном файле, по которым Doris может выполнять запросы.

#### Загрузить обработанные записи в Doris {#load-the-processed-records-into-doris}

Компонент Vane `DorisStreamLoadSink` использует Doris Stream Load для записи результатов. Каждая строка содержит расшифровку, категорию, статус проверки, эмбеддинг, метаданные обращения, URI исходного файла и границы сегмента. Дальнейший поиск и анализ выполняются в Doris.

### Найти похожие отзывы и проследить их связь с бизнес-данными {#search-feedback-and-trace-its-business-context}

После загрузки данных из руководства выполните следующие SQL-запросы в клиенте Doris.

#### Найти похожие отзывы с учётом бизнес-ограничений {#find-similar-feedback-within-business-constraints}

Сначала просмотрите первый непустой сегмент обращения T1024. Затем используйте его сохранённый вектор для поиска по другим обращениям о модели X1 за сентябрь 2026 года:

```sql
-- Inspect the segment used as the query example.
SELECT ticket_id, segment_id, text
FROM vane_support_demo.feedback_segments
WHERE ticket_id = 'T1024'
  AND length(trim(text)) > 0
ORDER BY segment_id
LIMIT 1;

-- Reuse the same segment's embedding without calling the model again.
WITH query_feedback AS (
    SELECT ticket_id, segment_id, text, embedding
    FROM vane_support_demo.feedback_segments
    WHERE ticket_id = 'T1024'
      AND length(trim(text)) > 0
    ORDER BY segment_id
    LIMIT 1
)
SELECT q.ticket_id AS query_ticket_id,
       q.segment_id AS query_segment_id,
       q.text AS query_text,
       f.ticket_id, f.segment_id, f.text, f.fault_category,
       f.source_uri, f.start_ms, f.end_ms,
       l2_distance_approximate(f.embedding, q.embedding) AS distance
FROM vane_support_demo.feedback_segments f
CROSS JOIN query_feedback q
WHERE f.product_model = 'X1'
  AND f.event_date >= 20260901 AND f.event_date < 20261001
  -- Exclude every segment from the source ticket.
  AND f.ticket_id <> q.ticket_id
ORDER BY distance ASC, f.ticket_id, f.segment_id
LIMIT 3;
```

Чем меньше расстояние, тем ближе векторы. Запрос возвращает до трёх сегментов; одно обращение может встретиться несколько раз. Текст исходного и найденного сегментов помогает проверить, что именно сравнивается. Сходство не подтверждает наличие неисправности.

Чтобы расшифровка обязательно содержала слова «indicator light», добавьте `AND f.text MATCH_ANY 'indicator light'` в условие `WHERE` перед `ORDER BY`. Так текстовый поиск сочетается с ранжированием по векторам.

#### Связать отзывы с заказами и производственными партиями {#join-feedback-to-orders-and-production-batches}

Используйте связи между бизнес-данными, чтобы проследить путь от сегмента через обращение к заказу и партии. `LEFT JOIN` позволяет видеть отзывы, для которых не нашлось соответствий, при проверке качества данных:

```sql
SELECT f.ticket_id, f.segment_id, f.text, f.fault_category,
       t.order_id, o.production_batch,
       f.source_uri, f.start_ms, f.end_ms
FROM vane_support_demo.feedback_segments f
LEFT JOIN vane_support_demo.ticket_orders t ON f.ticket_id = t.ticket_id
LEFT JOIN vane_support_demo.orders o ON t.order_id = o.order_id
WHERE f.product_model = 'X1'
  AND f.event_date >= 20260901 AND f.event_date < 20261001
ORDER BY f.ticket_id, f.segment_id;
```

В демонстрационных данных обращение T1024 связано с O9001, а T1025 — с O9002; оба заказа относятся к B202608. Обращение T1026 связано с O9003 из партии B202609. Эти связи взяты из бизнес-таблиц. URI исходного файла и временные метки в миллисекундах позволяют прослушать исходную запись. Поля заказа или партии, для которых не нашлось соответствий, содержат `NULL`.

#### Подсчитать обращения с предварительной классификацией по партиям {#count-candidate-tickets-by-batch}

Следующий запрос ищет во всей таблице сегментов отзывы, которым ИИ присвоил предварительную категорию `unable_to_start` для заданных модели и периода, исключает повторные обращения и подсчитывает их по партиям. Этот запрос охватывает всю таблицу независимо от предыдущей выборки Top-3.

```sql
WITH candidate_tickets AS (
    SELECT DISTINCT ticket_id
    FROM vane_support_demo.feedback_segments
    WHERE product_model = 'X1'
      AND event_date >= 20260901 AND event_date < 20261001
      -- At least one AI-labeled segment qualifies the ticket; review is separate.
      AND fault_category = 'unable_to_start'
)
SELECT COALESCE(o.production_batch, 'Unmatched batch') AS production_batch,
       COUNT(DISTINCT f.ticket_id) AS candidate_ticket_count
FROM candidate_tickets f
LEFT JOIN vane_support_demo.ticket_orders t ON f.ticket_id = t.ticket_id
LEFT JOIN vane_support_demo.orders o ON t.order_id = o.order_id
GROUP BY COALESCE(o.production_batch, 'Unmatched batch')
ORDER BY candidate_ticket_count DESC, production_batch;
```

`candidate_ticket_count` подсчитывает уникальные обращения, в которых хотя бы один сегмент имеет предварительную метку. Это число не отражает количество сегментов или долю отказов и не означает, что метка подтверждена человеком. Обращения без соответствующей партии остаются в отдельной группе. Если сегментов с такой категорией нет, результат будет пустым.

Vane преобразует записи разговоров в структурированные данные, а Doris связывает их с обращениями, заказами и партиями. Затем в одной среде SQL можно искать похожие записи, прослеживать их связь с бизнес-данными и анализировать результаты по партиям.

## Применение в производстве {#manufacturing-applications}

Один из производителей использует Doris, чтобы объединять данные о производстве, контроле качества, оборудовании и обращениях в службу поддержки для мониторинга производственных линий, анализа выхода годной продукции, отслеживания партий и статистики неисправностей. Затем компания дополнила эту среду документами, изображениями и записями: Vane обрабатывает мультимодальные данные, а Doris обеспечивает полнотекстовый и векторный поиск наряду с существующей аналитикой.

### Связь изменений выхода годной продукции с принятыми ранее корректирующими мерами {#connect-yield-changes-to-past-corrective-actions}

Doris объединяет параметры технологического процесса, результаты испытаний, состояние оборудования и сведения о партиях, чтобы отслеживать выход годной продукции и детализировать данные по этапам производства, оборудованию и сменам. Когда выход годной продукции снижается, инженерам также нужны отчёты о прошлых инцидентах, отчёты 8D и записи об экспериментах, чтобы найти похожие проблемы и действенные меры.

Vane разбирает эти документы, извлекает сведения о симптомах, условиях процесса, корректирующих мерах и результатах проверки, а также создаёт эмбеддинги. При этом сохраняются бизнес-идентификаторы, версии документов и номера страниц. После загрузки в Doris записи позволяют искать по ключевым словам и векторам с ограничениями по продукту или технологическому процессу, а затем объединять результаты с текущими параметрами партий, данными прошлых экспериментов и показателями до и после принятых мер.

Так обнаруженную аномалию можно напрямую сопоставить с прошлым опытом. ИИ может предложить шаги для расследования на основе бизнес-данных и документов, а инженеры — проверить причины и корректирующие меры экспериментально.

### Связь описаний клиентов с данными об эксплуатации и производстве {#connect-customer-descriptions-to-operating-and-manufacturing-data}

Обращения в службу поддержки, коды неисправностей, журналы эксплуатации и сведения о партиях дают одно представление о качестве продукции. Записи разговоров, тексты и фотографии дополняют его. Чтобы понять, описывают ли фразы «не заряжается» и «зарядка прерывается на полпути» одну и ту же проблему, нужен контекст эксплуатации.

Vane расшифровывает звонки и разбирает вложения, извлекает признаки неисправностей и предварительные категории, создаёт векторы и сохраняет идентификаторы обращений и позиции в исходных материалах. Doris сочетает ограничения по модели, дате и ключевым словам с векторным поиском, а затем связывает найденные обращения с журналами эксплуатации, результатами ремонта и партиями. При подсчёте повторы исключаются по обращению или продукту в зависимости от задачи анализа.

Бизнес-пользователи могут изучить исходные материалы и проверить, сосредоточены ли похожие жалобы в одной партии или связаны с определёнными условиями эксплуатации. Так описания клиентов связываются с отслеживанием производства и оценкой масштаба проблемы.

## Начните с одного источника данных {#start-with-one-data-source}

Мультимодальный анализ становится полезным, когда сведения из записей, изображений и видео можно использовать в бизнес-запросах. Vane подготавливает содержимое, а Doris связывает его с клиентами, заказами, обращениями и партиями.

Начните с одного конкретного источника и одного бизнес-вопроса.  [Руководство по работе с записями обращений в службу поддержки](https://vane.astrovela.ai/docs/data/tutorials/use-cases/audio-support-doris-search) содержит полный пример обработки содержимого, семантического поиска и бизнес-анализа в рамках одного рабочего процесса.
