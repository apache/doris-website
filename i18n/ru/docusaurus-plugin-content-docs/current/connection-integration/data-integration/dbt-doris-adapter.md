---
{
    "title": "Адаптер dbt",
    "sidebar_label": "Адаптер dbt",
    "language": "ru",
    "description": "Установите dbt-for-apache-doris 1.1.1 и настройте модели, источники в External Catalog, целевые таблицы Iceberg и асинхронные материализованные представления.",
    "keywords": [
        "Apache Doris dbt",
        "dbt Doris Adapter",
        "dbt-for-apache-doris",
        "dbt Doris profile",
        "Doris data transformation",
        "Doris incremental model",
        "Doris insert_overwrite",
        "Doris microbatch",
        "Doris source freshness",
        "Doris asynchronous materialized view",
        "dbt External Catalog",
        "dbt debug connection error"
    ]
}
---

<!-- Knowledge Type: Integration Guide / Capability Definition -->
<!-- Use Case: Apache Doris data transformation with dbt / ELT modeling -->

[dbt](https://docs.getdbt.com/docs/introduction) управляет этапом преобразования данных в процессе ELT (извлечение, загрузка, преобразование). Адаптер `dbt-for-apache-doris` компилирует модели dbt в SQL для Doris и выполняет операции создания таблиц, преобразования данных, тестирования и документирования через порт запросов MySQL процесса Doris Frontend (FE).

Исходные данные уже должны быть доступны для запросов через Doris: в таблицах Internal Catalog или через настроенные External Catalog. Адаптер выполняет преобразования; он не загружает и не синхронизирует исходные данные.

:::caution

`dbt-for-apache-doris` предоставляется и поддерживается VeloDB. Он не входит в проект Apache Doris, не выпускается и не одобряется сообществом Apache Doris. Оцените адаптер перед использованием в промышленной среде, проверьте целостность пакета и сведения о его выпуске, а также соблюдайте лицензию стороннего проекта. О проблемах с адаптером сообщайте в [проект `dbt-for-apache-doris`](https://github.com/velodb/dbt-for-apache-doris/issues).

:::

<!-- Knowledge Type: Version Requirements / Environment Requirements / Released Versions -->
<!-- Use Case: Pre-installation version check / Environment preparation / Release lookup -->

## Требования к среде {#environment-requirements}

| Компонент | Требование |
| --- | --- |
| Python | 3.10 или новее |
| dbt Core | 1.12.x (устанавливается вместе с адаптером) |

## Выпущенные версии {#released-versions}

| Версия |
| --- |
| [1.1.1](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.1) |
| [1.1.0](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.0) |

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Adapter installation / Installation verification -->

## Установка {#installation}

В следующих командах в качестве примера установки используется опубликованный [выпуск `v1.1.1`](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.1). Чтобы установить другой выпуск, замените версию в спецификации пакета для `pip`.

Установите адаптер из PyPI в изолированной среде Python:

```shell
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install "dbt-for-apache-doris==1.1.1"
dbt --version
```

В Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install "dbt-for-apache-doris==1.1.1"
dbt --version
```

Для этого примера раздел `Plugins` в выводе `dbt --version` должен содержать `doris: 1.1.1`. dbt Core и MySQL Connector/Python устанавливаются как зависимости.

<!-- Knowledge Type: Operational Steps / Minimal Example -->
<!-- Use Case: Connect dbt to Doris / Validate an end-to-end model build -->

## Настройка подключения {#configure-the-connection}

Создайте проект dbt:

```shell
dbt init doris_demo
cd doris_demo
```

Добавьте конфигурацию подключения к Doris в `~/.dbt/profiles.yml`. Не храните учетные данные в системе контроля версий; в этом примере пароль считывается из переменной среды:

```yaml
doris_demo:
  target: dev
  outputs:
    dev:
      type: doris
      host: 127.0.0.1
      port: 9030
      username: dbt_user
      password: "{{ env_var('DORIS_PASSWORD') }}"
      schema: analytics
      threads: 4
```

| Параметр | Рекомендуемое значение | Поведение |
| --- | --- | --- |
| `type` | Должно быть `doris` | Выбирает адаптер Doris |
| `host` | Явно укажите адрес Doris FE | Если параметр не задан, базовая конфигурация учетных данных использует `127.0.0.1`; в диалоге `dbt init` значение по умолчанию отсутствует |
| `port` | Обычно `9030` | Если параметр не задан, используется `9030`; это порт запросов FE, а не порт HTTP |
| `username` | Явно укажите отдельного пользователя Doris | Если параметр не задан, базовая конфигурация учетных данных использует `root`; в диалоге `dbt init` значение по умолчанию отсутствует |
| `password` | Считывайте из переменной среды | По умолчанию используется пустая строка |
| `schema` | Укажите целевую базу данных Doris | В диалоге `dbt init` по умолчанию предлагается `dbt`; в базовой конфигурации учетных данных значение по умолчанию равно `None` |
| `threads` | Задайте с учетом возможностей FE и нагрузки | В диалоге `dbt init` по умолчанию предлагается `1` |
| `database` | Не указывайте для Internal Catalog; для внешнего целевого объекта укажите существующий Doris Catalog | Соответствует Doris Catalog в v1.1.1 |

В v1.1.1 путь dbt `database.schema.identifier` соответствует пути Doris `catalog.database.table`. Для Internal Catalog не указывайте `database`, а в `schema` задайте базу данных Doris. Для внешнего целевого объекта укажите в `database` существующий Doris Catalog, а в `schema` базу данных в этом Catalog. Адаптер может попытаться создать отсутствующую целевую базу данных, если Catalog это поддерживает. Учетной записи dbt нужны разрешения на чтение источников, а также на создание, изменение, удаление целевых объектов и запись в них. Поддержка записи в External Catalog также зависит от коннектора Doris.

Убедитесь, что в `dbt_project.yml` указан тот же профиль:

```yaml
name: doris_demo
version: "1.0.0"
config-version: 2
profile: doris_demo

model-paths: ["models"]

models:
  doris_demo:
    +materialized: view
```

В macOS или Linux проверьте подключение командой:

```shell
export DORIS_PASSWORD='your_password'
dbt debug
```

В Windows PowerShell:

```powershell
$env:DORIS_PASSWORD = 'your_password'
dbt debug
```

<!-- Knowledge Type: Operational Steps / Minimal Example -->
<!-- Use Case: Validate an end-to-end model build -->

## Построение первой модели {#build-the-first-model}

Следующий SQL создает исходную таблицу для этого примера. Коэффициент репликации `1` подходит только для кластера разработки с одним BE:

```sql
CREATE DATABASE IF NOT EXISTS raw;

CREATE TABLE IF NOT EXISTS raw.orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_time DATETIME,
    amount DECIMAL(18, 2),
    status VARCHAR(20),
    updated_at DATETIME,
    is_valid BOOLEAN
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO raw.orders VALUES
    (1, 101, '2026-08-01 10:00:00', 20.00, 'PAID', '2026-08-01 10:05:00', true),
    (2, 102, '2026-08-01 11:00:00', 35.00, 'PAID', '2026-08-01 11:05:00', true);
```

Объявите источник в `models/sources.yml`:

```yaml
version: 2

sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
```

Создайте `models/fct_daily_sales.sql`:

```sql
{{
  config(
    materialized='table',
    duplicate_key=['order_date'],
    distributed_by=['order_date'],
    buckets=1,
    properties={'replication_num': '1'}
  )
}}

select
    cast(order_time as date) as order_date,
    sum(amount) as sales_amount
from {{ source('raw', 'orders') }}
group by cast(order_time as date)
```

Добавьте тесты данных в `models/schema.yml`:

```yaml
version: 2

models:
  - name: fct_daily_sales
    description: Daily sales summary
    columns:
      - name: order_date
        description: Order date
        data_tests:
          - not_null
          - unique
      - name: sales_amount
        description: Daily sales amount
        data_tests:
          - not_null
```

Запустите модель и тесты:

```shell
dbt build --select fct_daily_sales
```

При успешном выполнении создается `analytics.fct_daily_sales`. Для промышленной среды задайте количество реплик и бакетов в соответствии с конфигурацией кластера.

Если источник находится в другой базе данных Doris, предпочтительно задать `schema` напрямую:

```yaml
sources:
  - name: finance
    schema: finance_raw
    tables:
      - name: payments
```

В v1.1.1 параметр `database` источника задает имя Doris Catalog. Для чтения из другой базы данных в Internal Catalog задайте только `schema`, как показано выше. В проектах, где для источников в других базах данных в v1.1.0 использовалось `database: finance_raw`, перед обновлением необходимо перенести это значение в `schema`.

## External Catalog в v1.1.1 {#external-catalogs-in-v111}

Адаптер может читать источники в External Catalog и получать сведения об их таблицах и столбцах для `dbt docs generate`. Сначала создайте Catalog в Doris, затем укажите его имя в поле `database` источника:

```yaml
sources:
  - name: lakehouse
    database: hive_catalog
    schema: ods
    tables:
      - name: orders
```

`{{ source('lakehouse', 'orders') }}` разрешается в `hive_catalog.ods.orders`. Поле `schema` задает имя базы данных внутри этого Catalog. Адаптер поддерживает имена объектов с указанием Catalog; при этом именно коннектор каждого Catalog определяет, какие операции DDL и записи может выполнять Doris.

Чтобы создать целевую таблицу Iceberg, сначала [настройте Iceberg Catalog с поддержкой записи](../../lakehouse/catalogs/iceberg-catalog). Задайте следующие поля в существующей конфигурации подключения профиля:

```yaml
database: iceberg_catalog
schema: analytics
```

Создайте `models/iceberg_sample.sql`:

```sql
{{ config(materialized='table', engine='iceberg') }}

select cast(1 as int) as id
```

Явное приведение к `INT` позволяет избежать автоматического определения типа как `TINYINT`, который не поддерживается для столбцов Iceberg.

Выполните `dbt run --select iceberg_sample`. Команда создает `iceberg_catalog.analytics.iceberg_sample`. Catalog должен существовать; его база данных должна существовать либо dbt должен иметь возможность ее создать, а целевой объект должен поддерживать запись. Параметр `engine='iceberg'` добавляет явное указание движка; если не задавать `engine`, Doris определяет его по целевому Catalog. Определение движка по Catalog проверено на Doris 4.1.3. Более ранние выпуски Doris могут требовать явного указания движка.

| Целевой объект Iceberg | Поведение в v1.1.1 |
| --- | --- |
| `table` | Создает таблицу Iceberg; при повторных запусках заменяет ее через создание резервной копии и переименование |
| `incremental` | Поддерживает `append`, `merge`, `insert_overwrite` и `microbatch`, описанные ниже |
| Seed и Snapshot | Поддерживаются; публикация Snapshot и полное обновление Seed используют резервную копию и переименование. Обычная перезагрузка использует INSERT OVERWRITE для непартиционированных таблиц; перезагрузка партиционированных таблиц использует нативный MERGE и требует V2+. Для партиционированных Seed версии V1 используйте `dbt seed --full-refresh` |
| `view` и `materialized_view` | Целевые объекты должны находиться в Internal Catalog; представления и материализованные представления Internal Catalog могут обращаться к источникам в External Catalog |

Для Iceberg стратегии `merge`, `microbatch` и перезагрузка партиционированных Seed требуют выпуска Doris с нативной поддержкой Iceberg `MERGE INTO` и таблицы Iceberg V2 или новее. Эти сценарии проверены на Doris 4.1.3; [в документации Doris поддержка Iceberg MERGE отмечена как экспериментальная начиная с 4.1.0](../../lakehouse/catalogs/iceberg-catalog#merge-into). Замена внешней таблицы не атомарна: между переименованиями ее имя ненадолго становится недоступным, а при сбое старая таблица может остаться под резервным именем. Перед использованием в промышленной среде проверьте выпуск Doris, коннектор Catalog и процедуру восстановления в изолированном тестовом проекте.

Адаптер отклоняет объявления `constraints` на уровне модели или столбцов до записи в целевой объект типа Table, View, Incremental или MV. Контракты моделей по-прежнему проверяют имена и типы столбцов. Для проверки данных после записи используйте `data_tests`, например `not_null`; такие тесты не создают ограничений, обеспечиваемых базой данных.

[Пять запускаемых демонстрационных проектов Doris](https://github.com/velodb/dbt-for-apache-doris/tree/3fb9cc75f9dcdd756b472847728bbdf42fb3b128/examples/doris-demos) охватывают модели, тесты, источники в других базах данных, инкрементальную обработку, снимки и асинхронные материализованные представления. По умолчанию в демонстрационной среде используется `dbt-for-apache-doris==1.1.1`.

<!-- Knowledge Type: Capability Reference / Configuration Parameters / Architecture Decision -->
<!-- Use Case: Materialization selection / Incremental processing / Materialized views -->

## Материализации {#materializations}

`dbt-for-apache-doris` поддерживает следующие основные материализации:

| Материализация | Объект Doris или поведение | Сценарий использования |
| --- | --- | --- |
| `view` | Представление Doris в Internal Catalog | Простые преобразования, которые всегда должны читать актуальные исходные данные |
| `table` | Полностью перестраиваемая таблица Duplicate Key в Internal Catalog или таблица Iceberg с поддержкой записи | Результаты ограниченного объема, для которых нужна стабильная производительность запросов |
| `incremental` | Добавляет, обновляет или перезаписывает данные в соответствии со стратегией | Инкрементальная обработка больших таблиц |
| `materialized_view` | Асинхронное материализованное представление Doris в Internal Catalog | Обновление под управлением Doris и прозрачное переписывание запросов |
| `ephemeral` | Компилируется в CTE в зависимых моделях | Повторное использование SQL без создания объекта Doris |

Seed и снимки также могут создавать таблицы Doris. В настоящее время адаптер не включает отдельную материализацию `partition`; для замены партиций используйте инкрементальную стратегию `insert_overwrite`. В приведенных ниже примерах сохраняется `replication_num=1`, чтобы они также работали в кластере разработки с одним BE; в реальных развертываниях используйте количество реплик, подходящее для промышленной среды.

### Представление {#view}

```sql
{{ config(materialized='view') }}

select order_id, customer_id, amount
from {{ source('raw', 'orders') }}
where status = 'PAID'
```

Каждый запуск обновляет определение представления. Представление не хранит данные; стоимость запроса зависит от SQL представления и запроса, который его использует.

### Таблица {#table}

```sql
{{
  config(
    materialized='table',
    duplicate_key=['event_date', 'event_id'],
    partition_by=['event_date'],
    partition_type='RANGE',
    partition_by_init=[
      "PARTITION p_before_202608 VALUES LESS THAN ('2026-08-01')",
      "PARTITION p202608 VALUES LESS THAN ('2026-09-01')",
      "PARTITION pmax VALUES LESS THAN (MAXVALUE)"
    ],
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select
    cast(order_time as date) as event_date,
    order_id as event_id,
    status as event_type
from {{ source('raw', 'orders') }}
```

Для целевых объектов в Internal Catalog материализация `table` создает таблицу Duplicate Key и полностью заменяет ее при последующих запусках. Целевые таблицы Iceberg не используют ключи Doris OLAP или распределение по умолчанию. Модели таблиц принимают следующие параметры создания таблицы:

| Параметр | Тип и значение по умолчанию | Описание |
| --- | --- | --- |
| `duplicate_key` | Строка или список; необязательный | Столбцы Duplicate Key |
| `partition_by` | Строка или список; необязательный | Столбцы партиционирования |
| `partition_type` | `RANGE` или `LIST`; по умолчанию `RANGE` | Тип партиционирования, используемый с `partition_by` |
| `partition_by_init` | Список строк; необязательный | Определения партиций Doris, используемые с `partition_by` при создании таблицы |
| `distributed_by` | Строка или список; необязательный | Столбцы хеш-распределения |
| `buckets` | Положительное целое число; по умолчанию `10`, если формируется Hash Distribution | Количество хеш-бакетов; используется только с `distributed_by` |
| `replication_num` | Положительное целое число или строка с числом; необязательный | Количество реплик; параметр верхнего уровня переопределяет одноименный ключ в `properties` |
| `properties` | Словарь; необязательный | Пары «ключ-значение», включаемые в Doris `PROPERTIES` |

Столбцы Duplicate Key, партиционирования и распределения должны присутствовать в результате модели и соответствовать правилам создания таблиц Doris. Адаптер включает `partition_by_init` и `properties` в оператор `CREATE TABLE`; Doris проверяет определения партиций, имена и значения свойств. Специфичные для OLAP параметры, такие как `duplicate_key` и `distributed_by`, не подходят для целевых таблиц Iceberg. Обычная модель `table` в настоящее время не предоставляет настройки Aggregate Key или отдельной конфигурации Unique Key. Для вставки и обновления по Unique Key используйте инкрементальную стратегию `merge`.

### Инкрементальная материализация {#incremental}

Для стратегий `append`, `merge` и `insert_overwrite` инкрементальная модель состоит из двух частей:

- SQL модели, обычно с `is_incremental()`, определяет, какие строки источника возвращает текущий запуск.
- `incremental_strategy` определяет, как адаптер записывает эту порцию данных в целевой объект.

Microbatch не использует такой способ фильтрации. dbt Core добавляет временные фильтры на основе контекста порции и параметра `event_time`, настроенного для вышестоящих ресурсов.

| Стратегия | Целевой объект Doris и поведение | Основные требования |
| --- | --- | --- |
| `append` | `INSERT INTO` в таблицу OLAP Duplicate Key или таблицу Iceberg с поддержкой записи | Не задавайте `unique_key` |
| `merge` | Вставка или обновление полной строки через `INSERT INTO` в таблице OLAP Unique Key; нативный `MERGE INTO` в Iceberg | Требует `unique_key`; для Iceberg также нужны нативная поддержка MERGE и таблицы V2+ |
| `insert_overwrite` | Для OLAP: перезапись всей таблицы, именованных или динамически определяемых партиций; для Iceberg: перезапись всей таблицы, динамических или статических партиций | Отклоняет `unique_key`; статическая область в Iceberg задается сопоставлением столбцов и значений |
| `microbatch` | Для OLAP: перезапись строго соответствующей RANGE-партиции; для Iceberg: замена одного окна UTC с помощью нативного MERGE | Настройте `event_time`, `batch_size` и `begin`; для Iceberg требуются нативный MERGE и V2+ |

Если стратегия не задана, наличие `unique_key` выбирает `merge`; иначе адаптер использует `append`. Адаптер поддерживает все четыре режима `on_schema_change`: `ignore`, `fail`, `append_new_columns` и `sync_all_columns`.

Стратегии `delete+insert` и `delete_insert` отклоняются. Для вставки и обновления по Doris Unique Key используйте `merge`. Для целевых объектов OLAP стратегия `merge` использует `INSERT INTO` для полной строки с семантикой Doris Unique Key. Для целевых объектов Iceberg она формирует нативный `MERGE INTO` и отклоняет дублирующиеся ключи источника до записи. Каждая порция должна содержать не более одной строки для каждого `unique_key`. Чтобы использовать Sequence Column, задайте видимый столбец через `function_column.sequence_col` в `properties` и продолжайте использовать `merge`. Отдельный параметр `sequence_col` и параметр `function_column.sequence_type` со скрытым столбцом `__DORIS_SEQUENCE_COL__` в настоящее время не поддерживаются.

В следующем примере выполняется вставка или обновление полной строки по `order_id`:

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key=['order_id'],
    distributed_by=['order_id'],
    buckets=16,
    properties={'replication_num': '1'},
    on_schema_change='append_new_columns'
  )
}}

select
    order_id,
    customer_id,
    amount,
    updated_at
from {{ source('raw', 'orders') }}

{% if is_incremental() %}
where updated_at >= (
    select coalesce(max(updated_at), '1970-01-01 00:00:00')
    from {{ this }}
)
{% endif %}
```

Чтобы перезаписать именованные партиции Doris в Internal Catalog:

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    duplicate_key=['event_date', 'event_id'],
    partition_by=['event_date'],
    partition_type='RANGE',
    partition_by_init=[
      "PARTITION p_before_202607 VALUES LESS THAN ('2026-07-01')",
      "PARTITION p202607 VALUES LESS THAN ('2026-08-01')",
      "PARTITION p202608 VALUES LESS THAN ('2026-09-01')",
      "PARTITION pmax VALUES LESS THAN (MAXVALUE)"
    ],
    overwrite_partitions=['p202607', 'p202608'],
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select event_date, event_id, event_type
from (
    select
        cast(order_time as date) as event_date,
        order_id as event_id,
        status as event_type,
        order_time
    from {{ source('raw', 'orders') }}
) events

{% if is_incremental() %}
where order_time >= '2026-07-01'
  and order_time < '2026-09-01'
{% endif %}
```

Первый запуск создает целевую таблицу через CTAS и не выполняет `INSERT OVERWRITE`. Поэтому в примере используется `partition_by_init` для создания всех необходимых целевых партиций. После создания целевой таблицы параметр `overwrite_partitions` управляет областью перезаписи:

- Не задан: перезаписывается вся таблица.
- Список имен партиций: перезаписываются только эти партиции.
- `'*'`: Doris динамически перезаписывает партиции, затронутые порцией данных.

Динамическая перезапись OLAP не может определить, какую партицию очистить, если порция данных пуста. Укажите имена партиций, если пустая порция исходных данных должна очищать целевые данные.

Для целевых таблиц Iceberg не задавайте `overwrite_partitions`, чтобы использовать нативную динамическую перезапись партиционированных таблиц. Чтобы заменить одну статическую область, задайте непустое сопоставление столбцов и значений, например `overwrite_partitions={'dt': '2025-01-25'}`. Модель должна возвращать все строки в этой области. Для непартиционированной целевой таблицы модель должна возвращать полный результат для замены; пустой результат очищает таблицу. Пустой результат для статической области также очищает эту область. Сопоставление, содержащее `NULL`, использует нативный MERGE и требует Iceberg V2+.

### Microbatch {#microbatch}

`microbatch` использует контекст порции данных dbt Core. Следующий пример предназначен для таблицы OLAP в Internal Catalog и перезаписывает одну точно соответствующую RANGE-партицию для каждого окна UTC. Настройте поле `event_time` для каждого непосредственного вышестоящего ресурса и для целевой модели. Для источника `raw.orders`, созданного выше в примере первой модели, добавьте следующую конфигурацию в существующее объявление таблицы:

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          event_time: order_time
```

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='microbatch',
    event_time='event_time',
    batch_size='day',
    begin=modules.datetime.datetime(2026, 8, 1, 0, 0, 0),
    duplicate_key=['event_id', 'event_time'],
    partition_by=['event_time'],
    partition_type='RANGE',
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select
    order_id as event_id,
    order_time as event_time,
    status as event_type
from {{ source('raw', 'orders') }}
```

Для целевой таблицы OLAP в Internal Catalog параметр `event_time` должен быть именем столбца без кавычек и указывать на тот же единственный столбец, что и `partition_by`. Параметр `batch_size` поддерживает `hour`, `day`, `month` и `year`. Целевая таблица относится к типу Duplicate Key: `duplicate_key` задает ключ таблицы Doris и не является dbt `unique_key`. Не задавайте `unique_key`, `overwrite_partitions` или `partition_by_init`; адаптер определяет границы партиции и целевой объект перезаписи по текущей порции данных. Если вышестоящий `ref()` или `source()` также настраивает `event_time`, dbt Core фильтрует эти входные данные по текущему окну. Порции Microbatch выполняются последовательно и перезаписывают точно соответствующую партицию даже при пустой порции, поэтому строки, удаленные из этого окна, очищаются.

Microbatch в Internal Catalog также может использовать Doris Dynamic Partition, если настроены следующие свойства и они проходят проверку адаптера:

- `dynamic_partition.enable='true'`.
- `dynamic_partition.time_unit` соответствует `batch_size`, а `dynamic_partition.time_zone` равен `UTC`, `Etc/UTC` или `+00:00`.
- `dynamic_partition.create_history_partition='true'` вместе с `dynamic_partition.start` или `dynamic_partition.history_partition_num`.
- `dynamic_partition.prefix` является допустимым идентификатором, а `dynamic_partition.end` является положительным целым числом.
- Для месячных порций параметр `dynamic_partition.start_day_of_month`, если он задан, равен `1`.

При создании таблицы Dynamic Partition Doris также требует положительного значения `dynamic_partition.buckets`; это свойство проверяет Doris, а не адаптер. Окно хранения должно охватывать `begin`, `lookback` и любой диапазон ручного заполнения историческими данными. Для существующего целевого объекта физические свойства, проверяемые адаптером, должны соответствовать конфигурации модели; иначе приведите конфигурацию в соответствие или выполните запуск с `--full-refresh`.

:::caution

Для `append`, `merge` и `insert_overwrite` в пределах партиций адаптер не обнаруживает новые или измененные строки источника автоматически. SQL модели должен возвращать нужную порцию данных. При перезаписи всей таблицы через `insert_overwrite` модель должна возвращать все целевые данные. Каждая порция `merge` должна содержать уникальные значения `unique_key`. dbt Core обеспечивает фильтрацию Microbatch по вышестоящим ресурсам с настроенным `event_time`, поэтому моделям Microbatch не нужен `is_incremental()`. После несовместимых изменений ключей, партиционирования или физического размещения данных выполните `dbt run --full-refresh`. Для Iceberg Microbatch не задавайте `unique_key`, `overwrite_partitions` (включая сопоставления столбцов и значений), `partition_by_init` и свойства OLAP Dynamic Partition. Если настроен `partition_by`, задайте `partition_type='LIST'`. Каждое окно UTC заменяется с помощью нативного MERGE, включая пустые окна.

:::

### Асинхронные материализованные представления {#asynchronous-materialized-views}

Пользователи dbt задают стандартную настройку `materialized='materialized_view'`. Адаптер реализует ее с помощью [асинхронного материализованного представления](../../query-acceleration/materialized-view/async-materialized-view/overview) Doris.

:::note

Проверка версии FE для этой материализации допускает Doris 2.x начиная с 2.1.5, Doris 3.x кроме 3.0.0, Doris 4.x и новее, а также идентифицируемые сборки из исходного кода, сообщающие версию в виде `doris-0.0.0-<git-sha>`. Сборки из исходного кода предназначены только для тестирования при разработке. Эти проверки являются условиями допуска в коде, а не подтверждением того, что каждая допускаемая версия прошла тестирование совместимости.

:::

```sql
{{
  config(
    materialized='materialized_view',
    build_mode='immediate',
    refresh_method='auto',
    refresh_trigger='manual',
    duplicate_key=['order_date'],
    distribution_type='hash',
    distributed_by=['order_date'],
    buckets=8,
    wait_for_refresh=true,
    properties={'replication_num': '1'}
  )
}}

select order_date, sales_amount
from {{ ref('fct_daily_sales') }}
```

| Параметр | Значение по умолчанию | Поддерживаемые значения или формат |
| --- | --- | --- |
| `build_mode` | `immediate` | `immediate`, `deferred` |
| `refresh_method` | `auto` | `auto` позволяет Doris определять область обновления; `complete` обновляет все партиции |
| `refresh_trigger` | `manual` | `manual`, `schedule`, `commit` |
| `refresh_schedule` | - | Обязателен для `schedule`; содержит положительный `interval`, единицу измерения `minute/hour/day/week` и необязательный `start_time` |
| `wait_for_refresh` | `true` | Ожидать ли первоначального построения `BUILD IMMEDIATE` или ручного обновления, запущенного адаптером |
| `refresh_wait_timeout` | `300` | Время ожидания задачи обновления в секундах; положительное целое число |
| `refresh_poll_interval` | `1` | Интервал опроса задачи обновления в секундах; положительное целое число, не превышающее время ожидания |
| `duplicate_key` | - | Столбцы Duplicate Key для асинхронного материализованного представления; строка или список |
| `partition_by` | - | Один столбец партиционирования Doris или выражение функции партиционирования; строка или список из одного элемента |
| `distribution_type` | Выбирается автоматически | `hash`, если задан `distributed_by`; иначе `random` |
| `distributed_by` | - | Столбцы Hash Distribution |
| `buckets` | `auto` | Положительное целое число или `auto` |
| `replication_num` | - | Удобный параметр для задания количества реплик; переопределяет одноименный ключ в `properties` |
| `properties` | `{}` | Свойства асинхронного материализованного представления Doris |
| `on_configuration_change` | `apply` | `apply`, `continue`, `fail` |

`BUILD IMMEDIATE` запускает первоначальное построение при создании или замене определения. Адаптер создает новое определение под временным именем, по умолчанию ожидает первоначального построения, а затем публикует его под целевым именем; дополнительный `REFRESH MATERIALIZED VIEW` не отправляется. `BUILD DEFERRED` создает определение без первоначального построения.

Если определение не изменилось, поведение обновления полностью определяется `refresh_trigger`; параметр `refresh_on_run` в настоящее время отсутствует:

- `manual` отправляет `REFRESH MATERIALIZED VIEW ... AUTO|COMPLETE`, когда последующий `dbt run` выбирает модель, и по умолчанию ожидает успешного завершения.
- `schedule` и `commit` не отправляют запрос на обновление при последующем запуске dbt; Doris запускает его по расписанию или при фиксации изменений в базовой таблице.

Например, настройте ежедневное расписание следующим образом:

```sql
{{
  config(
    materialized='materialized_view',
    build_mode='deferred',
    refresh_method='auto',
    refresh_trigger='schedule',
    refresh_schedule={
      'interval': 1,
      'unit': 'day'
    },
    properties={'replication_num': '1'}
  )
}}

select order_date, sales_amount
from {{ ref('fct_daily_sales') }}
```

`wait_for_refresh=false` отключает опрос задачи, но не отменяет отправку запроса на обновление. Истечение времени ожидания в dbt не отменяет уже отправленную задачу Doris. Адаптер определяет новую отправленную задачу, сравнивая идентификаторы задач Doris MV до и после отправки, поэтому избегайте одновременных ручных обновлений одного и того же целевого объекта.

При изменении SQL модели или конфигурации DDL значение по умолчанию `on_configuration_change=apply` создает временное асинхронное материализованное представление и атомарно заменяет существующее определение. `continue` сохраняет существующее определение без отправки запроса на ручное обновление, а `fail` останавливает выполнение. `--full-refresh` принудительно развертывает определение заново.

<!-- Knowledge Type: Capability Reference / Configuration Parameters -->
<!-- Use Case: Seeds / Snapshots / Source freshness / Grants -->

## Другие возможности dbt {#other-dbt-capabilities}

| Возможность | Поддержка |
| --- | --- |
| Seed | Поместите небольшие CSV-файлы, хранящиеся в системе контроля версий, в `seeds/`, затем выполните `dbt seed`; поддерживаются определение типов, `column_types` и `ref` |
| Snapshot | Определите стратегии `check` или `timestamp` в `snapshots/`, затем выполните `dbt snapshot`; поддерживаются физическое удаление и эволюция схемы. Замена в Internal Catalog атомарна; замена в Iceberg использует резервную копию и переименование |
| Тесты данных | Настройте Generic Tests в YAML или напишите Singular Tests в `tests/`; поддерживаются сценарии ephemeral и `store_failures` |
| Модульные тесты | Задайте тестовые данные в виде встроенных строк или CSV в YAML модели, затем выполните `dbt test --select test_type:unit` |
| Контракты моделей | Задайте `contract.enforced: true` и объявите имена и типы столбцов для моделей Table, View или Incremental; объявления `constraints` отклоняются, а тесты данных не создают ограничений базы данных |
| Сохранение документации | Включите `persist_docs` для сохранения комментариев к объектам и столбцам для основных типов объектов |
| Актуальность источников | Настройте `loaded_at_field` или `loaded_at_query` вместе с `freshness`, затем выполните `dbt source freshness` |
| Права доступа | Используйте стандартную конфигурацию `grants` для прав на таблицы пользователей Doris `user` и `user@host`; роли в качестве получателей прав в настоящее время не поддерживаются |
| Хуки | Используйте `pre_hook` и `post_hook` для выполнения SQL Doris до и после материализаций; побочные эффекты хуков не откатываются транзакционно |
| Документация и происхождение данных | Напишите описания и выполните `dbt docs generate` для получения метаданных объектов и столбцов Internal Catalog и External Catalog, включая асинхронные материализованные представления Internal Catalog |

Seed подходят для небольших данных, хранящихся в системе контроля версий, например кодов стран или сопоставлений статусов, а не для массовой загрузки бизнес-данных. Для больших файлов используйте Doris Stream Load, Broker Load или Doris Connector.

Значения `unique_key` в источнике Snapshot не должны быть `NULL` и должны быть уникальными в пределах каждой порции. При использовании стратегии `timestamp` значение `updated_at` не должно быть `NULL` и не может предшествовать текущей исторической версии для этого ключа.

Чтобы сохранять описания таблиц и столбцов:

```yaml
models:
  - name: fct_daily_sales
    description: Daily sales summary
    config:
      persist_docs:
        relation: true
        columns: true
    columns:
      - name: order_date
        description: Order date
      - name: sales_amount
        description: Daily sales amount
```

### Актуальность источников {#source-freshness}

Проверка актуальности источников поддерживает два способа явного задания временной метки. Для обычного случая со столбцом временных меток используйте `loaded_at_field`:

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          loaded_at_field: updated_at
          freshness:
            warn_after: {count: 1, period: hour}
            error_after: {count: 2, period: hour}
```

Используйте `loaded_at_query`, если для получения временной метки актуальности нужен собственный SQL или агрегация:

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          loaded_at_query: |
            select max(updated_at)
            from {{ this }}
            where is_valid = 1
          freshness:
            warn_after: {count: 1, period: hour}
            error_after: {count: 2, period: hour}
```

При использовании `loaded_at_field` задайте `filter` внутри `freshness`, например `filter: is_valid = 1`, чтобы ограничить строки, участвующие в оценке актуальности. Не задавайте `loaded_at_field` и `loaded_at_query` одновременно. В настоящее время адаптер не определяет время загрузки по метаданным таблицы Doris; явно укажите поле или запрос.

Адаптер использует `utc_timestamp()` в качестве текущего времени, следуя принятому в dbt Core правилу: временные метки актуальности без часового пояса интерпретируются как UTC.

### Права доступа {#grants}

При декларативном назначении прав получателями выступают пользователи Doris:

```yaml
models:
  doris_demo:
    +grants:
      select:
        - analyst
        - reporter@10.0.0.%
```

Имя без `@host` интерпретируется как `username@%`. Права сопоставляются следующим образом: `select` с `SELECT_PRIV`, `insert` с `LOAD_PRIV`, `alter` с `ALTER_PRIV`, `create` с `CREATE_PRIV`, `drop` с `DROP_PRIV` и `show_view` с `SHOW_VIEW_PRIV`. Роли Doris в настоящее время не поддерживаются в `grants`; указывайте конкретных пользователей. Учетная запись, от имени которой запускается dbt, должна иметь возможность просматривать получателей прав и изменять права на целевые объекты.

<!-- Knowledge Type: Command Reference -->
<!-- Use Case: dbt project development / Execution / Testing / Documentation generation -->

## Основные команды {#common-commands}

| Команда | Назначение |
| --- | --- |
| `dbt debug` | Проверить конфигурацию проекта и подключение к Doris |
| `dbt parse` | Разобрать проект без выполнения SQL |
| `dbt compile` | Скомпилировать модели и проверить сгенерированный SQL для Doris |
| `dbt run` | Построить выбранные модели |
| `dbt test` | Выполнить тесты данных и модульные тесты |
| `dbt build` | Выполнить Seed, модели, снимки и тесты в порядке зависимостей |
| `dbt seed` | Загрузить CSV-файлы Seed |
| `dbt snapshot` | Обновить снимки |
| `dbt source freshness` | Оценить актуальность источников |
| `dbt docs generate` | Сгенерировать метаданные каталога, документации и происхождения данных |

Распространенные селекторы:

```shell
# Run one model
dbt run --select fct_daily_sales

# Run the model and all upstream dependencies
dbt build --select +fct_daily_sales

# Run the model and all downstream dependencies
dbt build --select fct_daily_sales+

# Fully rebuild an incremental model
dbt run --select fct_orders --full-refresh
```

<!-- Knowledge Type: Limitations / Architecture Decision -->
<!-- Use Case: Version evaluation / Production readiness review -->

## Текущие ограничения {#current-limitations}

- В настоящее время адаптер не поддерживает моделирование таблиц Aggregate Key и настройку вторичных индексов.
- Поведение записи в External Catalog зависит от коннектора Doris. Catalogs V2 и гарантии записи, специфичные для отдельных коннекторов, не поддерживаются.
- В настоящее время адаптер не реализует настройку SSL, тайм-ауты и повторные попытки, переключение при отказе между несколькими FE, отмену на стороне сервера и полную телеметрию запросов.
- При некоторых изменениях типов Table/View/MV каноническое имя на короткое время становится недоступным, поэтому переключение происходит с кратким перерывом в доступности.

<!-- Knowledge Type: Troubleshooting -->
<!-- Use Case: Connection errors / Catalog and database lookup -->

## Устранение неполадок {#troubleshooting}

### `dbt debug` не удается подключиться {#dbt-debug-cannot-connect}

Убедитесь, что `host` и `port` указывают на доступный порт запросов MySQL процесса FE, и проверьте имя пользователя, пароль и сетевую политику. Порт запросов по умолчанию: `9030`; `8030` обычно является HTTP-портом FE.

### Catalog или база данных не найдены {#catalog-or-database-cannot-be-found}

В v1.1.1 значения `database` в профиле и источниках указывают на Doris Catalog, а `schema` обозначает базу данных внутри него. Для Internal Catalog не задавайте `database`. Если в старом проекте параметр `database` источника использовался для базы данных Doris, перенесите это значение в `schema`. Проверьте, что внешние Catalog уже существуют и видны учетной записи dbt.
