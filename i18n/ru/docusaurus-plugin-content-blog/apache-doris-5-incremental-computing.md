---
title: 'От загрузки данных в реальном времени к актуальным результатам: инкрементальные вычисления в Apache Doris 5.0'
summary: 'Используйте Changelog, Table Stream и инкрементальное поддержание представлений, чтобы поддерживать актуальность показателей и объединённых таблиц, обрабатывать изменения внутри Doris и передавать обновления в другие системы.'
description: 'Узнайте, как Apache Doris 5.0 использует Changelog, Table Stream и инкрементальное поддержание представлений для расчёта показателей заказов, работы с объединёнными таблицами, ETL и потоками изменений Flink.'
keywords:
  - 'Apache Doris 5.0'
  - 'Changelog'
  - 'Table Stream'
  - 'инкрементальное поддержание представлений'
  - 'Flink Doris Connector'
date: '2026-10-22'
author: 'Apache Doris · Mingyu Chen'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-5-incremental-computing/cover.jpg'
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

Для аналитики в реальном времени недостаточно быстро загружать новые данные. Показатели и денормализованные таблицы, которые используют эти данные, тоже должны отражать актуальное состояние бизнеса.

Представьте заказ в интернет-магазине. Покупатель оплачивает его, сотрудник поддержки меняет адрес доставки, а операционная команда исправляет сумму. Каждое изменение должно отражаться в дашбордах и объединённых бизнес-таблицах. По мере роста объёма данных полные пересчёты по расписанию становятся дорогими: при редких запусках результаты устаревают, а при частых приходится снова и снова сканировать большие таблицы ради нескольких обновлений.

**В Apache Doris 5.0 появилась платформа инкрементальных вычислений на основе Changelog и Table Stream.** Эти компоненты фиксируют и обрабатывают изменения отдельных строк. Инкрементальное поддержание представлений использует такие изменения для обновления сохранённых результатов запросов.

В статье работа этой платформы показана на четырёх сценариях обработки заказов и объясняется, когда применять каждый подход. Эти возможности экспериментальные и требуют явной настройки. Первоначальная версия статьи представляла предварительный обзор Doris 5.0; чтобы опробовать возможности до выпуска, нужны сборки с соответствующими изменениями.

## Changelog и Table Stream: основа {#changelog-and-table-stream-the-foundation}

![Таблица заказов формирует Changelog, изменения из которого независимо обрабатывают два потока Table Stream](/images/blogs/apache-doris-5-incremental-computing/changelog-and-streams.jpg)

Чтобы обновлять показатели и объединённые таблицы после изменения заказа, система должна знать, что изменилось и до какого момента каждый потребитель уже обработал изменения. За эти две задачи отвечают Changelog и Table Stream.

### Changelog фиксирует изменения отдельных строк {#changelog-records-row-level-changes}

Таблица заказов хранит текущее состояние. Changelog фиксирует добавление, обновление и удаление строк. Запрос к таблице показывает, как заказ выглядит сейчас, а чтение Changelog — как он пришёл к этому состоянию.

Предположим, заказ 1 переходит из состояния `created` с суммой 100 в состояние `paid` с суммой 120. Таблица сохраняет новое состояние, но при расчёте агрегата по статусам нужно также вычесть прежние 100 из суммы по `created` группе. Changelog может хранить как прежнюю, так и новую строку. Прежняя строка называется **образом до изменения**. При удалении старые значения также нужны, чтобы определить, что исключить из агрегата.

Для поддерживаемых внутренних таблиц Doris сохраняет изменения строк вместе с временными метками фиксации и порядковыми номерами записей, чтобы потребители могли читать их по порядку. В примерах рассматриваются обновления и удаления, поэтому используются таблицы Unique Key, в которых Changelog и сохранение прежних значений включены при создании.

### Table Stream отслеживает обработку изменений {#table-stream-tracks-consumption}

Table Stream ссылается на базовую таблицу с включённым Changelog и предоставляет доступ к изменениям, которые этот поток ещё не обработал. Конвейер поддержки клиентов и задача аудита могут создать отдельные потоки для таблицы заказов. Продвижение одного потока не влияет на другой.

Каждый поток отслеживает собственную позицию обработки для каждого раздела. Обычный `SELECT` показывает ожидающие обработки изменения, не сдвигая эту позицию. При выполнении `INSERT INTO ... SELECT ... FROM <stream>`запись в целевую таблицу и сдвиг позиции фиксируются в одной транзакции; при сбое обе операции откатываются.

Потребители выбирают тип потока:

- `append_only` читает добавленные записи.
- `min_delta` сворачивает повторные изменения одного ключа в итоговую дельту.
- `detail` сохраняет каждое изменение отдельно.

Changelog фиксирует **что изменилось**; Table Stream отслеживает **что уже обработано**. Инкрементальное обновление представлений опирается на оба компонента.

## Инкрементальное обновление представлений {#incremental-view-maintenance}

### Как работает IVM {#what-ivm-does}

Материализованное представление хранит результат SQL-запроса. Когда его базовые таблицы меняются, сохранённый результат тоже нужно обновить. **Инкрементальное обновление представлений (IVM)** вычисляет, как вставки, обновления и удаления влияют на этот результат, и применяет соответствующие изменения.

Представление по-прежнему определяется на SQL. Для поддерживаемых агрегатных вычислений и соединений Doris считывает изменения через Changelog и Table Stream, строит инкрементальный план и поддерживает результат в актуальном состоянии. Не нужно вручную описывать обработку каждого изменения или пересчитывать все данные при каждом обновлении.

### Как IVM обновляет результат {#how-ivm-updates-a-result}

![IVM убирает прежний вклад заказа, добавляет новый и фиксирует результат вместе с позицией потока](/images/blogs/apache-doris-5-incremental-computing/ivm.jpg)

Для заказа 1 переход от `created, 100` к `paid, 120` требует вычесть один заказ и 100 из группы со статусом `created` , а затем добавить один заказ и 120 в группу со статусом `paid` .

IVM выполняет три шага:

1. **Считывает изменения базовых таблиц.** Doris создаёт внутренние Table Streams для участвующих базовых таблиц. Задача обновления считывает ожидающие обработки изменения, включая состояния строк до и после изменения.
2. **Вычисляет изменения результата.** Doris строит инкрементальный план на основе определения представления. В этом примере план убирает вклад прежней строки и добавляет вклад новой.
3. **Фиксирует результат и прогресс обработки.** Обновление материализованного представления и позиции потоков фиксируются в одной транзакции. При сбое обе операции откатываются, поэтому результат остаётся согласованным с прогрессом обработки.

Первое обновление должно создать базовое состояние, прежде чем можно будет применять инкрементальные изменения. Обновления выполняются асинхронно, поэтому до завершения обновления данные представления могут отставать от базовых таблиц. Для собственной обработки внутри Doris можно напрямую создавать и использовать Table Streams.

## Четыре практических сценария {#four-practical-scenarios}

### 1. Поддерживайте актуальность показателей по заказам {#1-keep-order-metrics-current}

![При изменении статуса заказа запись вычитается из группы created и добавляется в группу paid](/images/blogs/apache-doris-5-incremental-computing/order-metrics.jpg)

Панель операционных показателей показывает количество заказов, общую и среднюю сумму по каждому статусу. После оплаты заказы переходят из одной группы в другую; исправления сумм и удаления тоже должны менять существующие показатели. Если учитывать только новые заказы, результаты будут неверными.

Для поддерживаемых агрегатных вычислений IVM использует прежние и новые значения из Changelog, чтобы обновлять затронутые группы. Команды определяют показатели на SQL и могут сократить повторное сканирование исторических данных.

Сначала задайте `enable_feature_changelog = true` и `enable_table_stream = true` в `fe.conf` на каждом FE. Задайте `enable_feature_changelog = true` в `be.conf` на BE для очистки Changelog, затем перезапустите затронутые узлы. См. [предварительные требования для IVM](https://doris.apache.org/docs/dev/query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view/#prerequisites). Создайте таблицу заказов с Unique Key, включив Changelog и сохранение значений строк до изменения:

```sql
CREATE DATABASE incr_article_demo;
USE incr_article_demo;

CREATE TABLE orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_status VARCHAR(16),
    amount DECIMAL(12, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true"
);

INSERT INTO orders VALUES
    (1, 10, 'created', 100.00),
    (2, 20, 'paid',    200.00),
    (3, 10, 'paid',    300.00);
```

Создайте агрегирующее представление и выполните полное обновление. **Дождитесь успешного завершения этого обновления, прежде чем изменять заказы.** Затем внесите изменения и запустите инкрементальное обновление:

```sql
CREATE MATERIALIZED VIEW orders_by_status
BUILD DEFERRED
REFRESH INCREMENTAL FALLBACK ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES ("replication_num" = "1")
AS
SELECT order_status,
       COUNT(*) AS order_count,
       SUM(amount) AS total_amount,
       AVG(amount) AS avg_amount
FROM orders
GROUP BY order_status;

REFRESH MATERIALIZED VIEW orders_by_status COMPLETE;

-- Wait for the complete refresh to succeed before continuing.

INSERT INTO orders VALUES
    (1, 10, 'paid', 120.00),
    (2, 20, 'paid', 180.00);
DELETE FROM orders WHERE order_id = 3;
INSERT INTO orders VALUES (4, 30, 'created', 400.00);

REFRESH MATERIALIZED VIEW orders_by_status INCREMENTAL FALLBACK;
```

`FALLBACK` позволяет при обновлении пересчитать раздел или все данные, если изменение нельзя обработать инкрементально. Это не добавляет поддержку IVM для неподдерживаемых определений представлений.

После завершения обновления группа `paid` содержит заказы 1 и 2 на общую сумму 300, а группа `created` содержит только заказ 4. Ожидаемые значения:

| order_status | order_count | total_amount | avg_amount |
| --- | ---: | ---: | ---: |
| created | 1 | 400.00 | 400.00 |
| paid | 2 | 300.00 | 150.00 |

Эти показатели отражают суммы заказов из примера. Валовые продажи, возвраты и другие показатели для рабочей системы определяйте по правилам вашего бизнеса: возврат средств — это не просто удаление заказа.

### 2. Поддерживайте денормализованную таблицу заказов с данными о клиентах {#2-maintain-a-denormalized-customer-order-table}

![Изменения заказов и данных клиентов обновляют широкую таблицу, полученную левым соединением, в том числе при исправлении городов и позднем поступлении записей о клиентах](/images/blogs/apache-doris-5-incremental-computing/customer-order-table.jpg)

Операционным службам и службе поддержки часто нужны данные о заказах, дополненные сведениями о клиентах. Если обрабатывать только изменения в таблице заказов, можно пропустить переезд клиента или поступление сведений о нём после оформления заказа. IVM поддерживает соединение с учётом изменений в обеих таблицах.

Продолжайте работать с таблицей заказов из предыдущего примера. Создайте таблицу клиентов и представление с соединением, сформируйте исходное состояние, затем измените город клиента 10 и добавьте клиента 30:

```sql
CREATE TABLE customers (
    customer_id BIGINT,
    customer_name VARCHAR(32),
    city VARCHAR(32)
)
UNIQUE KEY(customer_id)
DISTRIBUTED BY HASH(customer_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true"
);

INSERT INTO customers VALUES
    (10, 'Alice', 'Beijing'),
    (20, 'Bob',   'Shanghai');

CREATE MATERIALIZED VIEW orders_with_customer
BUILD DEFERRED
REFRESH INCREMENTAL FALLBACK ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES ("replication_num" = "1")
AS
SELECT o.order_id, o.order_status, o.amount,
       c.customer_name, c.city
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id;

REFRESH MATERIALIZED VIEW orders_with_customer COMPLETE;

-- Wait for the complete refresh to succeed before continuing.

INSERT INTO customers VALUES
    (10, 'Alice', 'Hangzhou'),
    (30, 'Carol', 'Shenzhen');

REFRESH MATERIALIZED VIEW orders_with_customer INCREMENTAL FALLBACK;
```

После обновления у заказа 1 будет указан новый город — Hangzhou, а у заказа 4 появятся ранее отсутствовавшие сведения о клиенте. В этом представлении используются **текущие** атрибуты клиента. Если в отчёте нужен город на момент оформления заказа, это историческое значение необходимо сохранять в модели данных.

### 3. Обрабатывайте изменения между слоями хранилища данных {#3-process-changes-between-warehouse-layers}

![Table Stream сворачивает изменения ODS с помощью min_delta и атомарно записывает итоговые изменения в таблицу DWD вместе с обновлением своей позиции](/images/blogs/apache-doris-5-incremental-computing/warehouse-layers.jpg)

IVM автоматизирует обновление представлений для поддерживаемых SQL-запросов. Более специализированным конвейерам хранилища данных, например для обработки данных из ODS в DWD, могут потребоваться явная логика очистки, объединение повторных обновлений и управление повторными попытками. Table Stream служит основой для таких конвейеров внутри Doris.

Создайте поток, включающий исходное состояние заказов, а затем записывайте текущие строки и последующие изменения в нижестоящую таблицу Unique Key:

```sql
CREATE STREAM orders_dwd_stream ON TABLE orders
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "true"
);

CREATE TABLE dwd_orders (
    order_id BIGINT,
    order_status VARCHAR(16),
    amount DECIMAL(12, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true"
);

INSERT INTO dwd_orders (order_id, order_status, amount, __DORIS_DELETE_SIGN__)
SELECT order_id, order_status, amount,
       CASE WHEN __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE' THEN 1 ELSE 0 END
FROM orders_dwd_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER', 'DELETE');
```

При первом выполнении загружаются текущие заказы. Повторяйте команду `INSERT` для обработки последующих итоговых изменений. `UPDATE_AFTER` заменяет прежнее состояние, а `DELETE` использует маркер удаления, чтобы удалить строку из целевой таблицы. Этот конвейер синхронизации состояния не записывает `UPDATE_BEFORE` в целевую таблицу. Чтобы фиксировать каждое отдельное изменение, создайте отдельный поток типа `detail` и сохраняйте его данные в таблице аудита.

### 4. Передавайте изменения Doris в другие системы с помощью Flink {#4-send-doris-changes-to-other-systems-with-flink}

![Снимок данных Doris и Changelog поступают в источник Flink, а задание может записывать данные в базы данных, Kafka или таблицы озера данных](/images/blogs/apache-doris-5-incremental-computing/flink-changelog.jpg)

Некоторые изменения заказов также нужно передавать в Kafka, озеро данных или другую бизнес-систему. Flink Doris Connector может использовать таблицу Doris как инкрементальный источник.

В Flink SQL Client настройте таблицу заказов как источник:

```sql
SET 'execution.checkpointing.interval' = '10s';
SET 'table.exec.source.cdc-events-duplicate' = 'true';

CREATE TABLE orders_from_doris (
    order_id BIGINT,
    customer_id BIGINT,
    order_status STRING,
    amount DECIMAL(12, 2),
    PRIMARY KEY (order_id) NOT ENFORCED
) WITH (
    'connector' = 'doris',
    'fenodes' = '<fe-host>:8030',
    'table.identifier' = 'incr_article_demo.orders',
    'username' = '<doris-user>',
    'password' = '<doris-password>',
    'source.scan.mode' = 'initial',
    'source.changelog.increment-type' = 'detail'
);

-- Start the source, then run the following changes in a separate Doris SQL session.
SELECT * FROM orders_from_doris;
```

После завершения создания снимка внесите в Doris следующие изменения:

```sql
INSERT INTO orders VALUES (5, 30, 'created', 50.00);
INSERT INTO orders VALUES (5, 30, 'paid',    50.00);
DELETE FROM orders WHERE order_id = 5;
```

Затем вставка, обновление после оплаты и удаление поступят в задание Flink. `initial` сначала считывает существующий снимок, а затем потребляет последующие изменения.

Этот пример рассчитан на **Doris 5.0.0+ и Flink Doris Connector 26.4.0+**. Для использования до выпуска версии требуются сборки Doris и коннектора с изменениями интерфейса Changelog. Целевой приёмник данных должен поддерживать обновления и удаления. Семантика восстановления и доставки также зависит от контрольных точек, срока хранения журнала, устранения дубликатов и поведения приёмника; одна лишь настройка источника не обеспечивает сквозной гарантии.

## Выбор подхода {#choosing-an-approach}

![Большие наборы данных, небольшие порции изменений и частые обновления: выбор между IVM, Table Stream и источником Flink](/images/blogs/apache-doris-5-incremental-computing/selection-guide.jpg)

Инкрементальные вычисления особенно полезны, когда большой набор данных часто меняется. Они дополняют полный пересчёт, а не заменяют его.

| Подход | Когда подходит | Чем вы управляете |
| --- | --- | --- |
| Table Stream | Настраиваемые ETL-процессы внутри базы данных и слои хранилища данных | Чтение изменений, преобразования и расписание; `min_delta` позволяет сворачивать промежуточные обновления, а отслеживаемые позиции помогают выполнять повторные попытки |
| IVM | Поддерживаемые SQL-агрегации и соединения нескольких таблиц | Определение представления на SQL; Doris управляет инкрементальными планами и внутренними потоками, а материализованное представление также может прозрачно ускорять запросы |
| Flink Doris Connector | Передача изменений в Kafka, таблицы озера данных или другие системы | Конвейер Flink и приёмники данных, напрямую читающие Changelog |

![Начните с пилотного проекта по метрикам заказов, проверьте корректность и актуальность результатов, затем переходите к таблицам с соединёнными данными и более широким конвейерам](/images/blogs/apache-doris-5-incremental-computing/pilot.jpg)

По умолчанию записи Changelog хранятся один день. Установите для `changelog.ttl_seconds` значение, покрывающее максимальную ожидаемую задержку потребителя; потребитель не сможет прочитать записи об изменениях после окончания срока их хранения. См. [Changelog](https://doris.apache.org/docs/dev/data-operate/incremental/changelog/) и [Table Stream](https://doris.apache.org/docs/dev/data-operate/incremental/table-stream/) , где описаны поддерживаемые операции и порядок восстановления.

Начните с чётко определённой агрегации по одной таблице, например с подсчёта заказов по статусам. Прежде чем переходить к более сложным конвейерам, проверьте корректность результатов, время обновления, сквозную задержку до появления изменений в результатах и потребление вычислительных ресурсов. В следующей технической статье будут рассмотрены хранение Changelog и построение инкрементальных планов.

Средства инкрементальных вычислений Doris 5.0 позволяют оперативно обновлять зависимые результаты вслед за загрузкой данных в реальном времени. Changelog фиксирует изменения, Table Stream управляет их потреблением, а IVM обновляет результаты поддерживаемых запросов. Вместе они помогают сократить объём повторных вычислений и задержку между изменением бизнес-данных и обновлением зависящих от них результатов. Об этих возможностях объявили до выпуска Doris 5.0; сведения об их доступности ищите в документации проекта и объявлениях о выпусках.
