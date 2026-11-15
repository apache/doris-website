---
{
    "title": "CREATE TABLE",
    "language": "ru",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "Создаёт новую таблицу в текущей или указанной базе данных. Таблица может содержать несколько столбцов; определение каждого столбца включает имя, тип данных,"
}
---

## Описание {#description}

Создаёт новую таблицу в текущей или указанной базе данных. Таблица может содержать несколько столбцов; определение каждого столбца включает имя, тип данных и, при необходимости, следующие атрибуты:

- Является ли столбец ключевым
- Имеет ли столбец семантику агрегации
- Является ли столбец вычисляемым
- Обязательно ли указывать значение (NOT NULL)
- Является ли столбец автоинкрементным
- Есть ли значение по умолчанию при вставке
- Есть ли значение по умолчанию при обновлении

Кроме того, команда поддерживает следующие варианты:

- CREATE TABLE … AS SELECT (создание таблицы, заполненной данными; также называется CTAS)
- CREATE TABLE … LIKE (создание пустой копии существующей таблицы)

## Синтаксис {#syntax}

```sql
CREATE [ TEMPORARY | EXTERNAL ] TABLE [ IF NOT EXISTS ] <table_name>
    (<columns_definition> [ <indexes_definition> ])
    [ ENGINE = <table_engine_type> ]
    [ <key_type> KEY (<key_cols>)
        [ ORDER BY (<cluster_cols>) ]
    ]
    [ COMMENT '<table_comment>' ]
    [ <partitions_definition> ]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]
    [ <roll_up_definition> ]
    [ PROPERTIES (
          -- Table property
          <table_property>
          -- Additional table properties
          [ , ... ])
    ]
```

> Примечание: `ORDER BY` поддерживается начиная с версии 4.1.0.

Где:

```sql
columns_definition
  : -- Column definition
    <col_name> <col_type>
      [ KEY ]
      [ <col_aggregate_type> ]
      [ [ GENERATED ALWAYS ] AS (<col_generate_expression>) ]
      [ [NOT] NULL ]
      [ AUTO_INCREMENT(<col_auto_increment_start_value>) ]
      [ DEFAULT <col_default_value> ]
      [ ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>) ]
      [ COMMENT '<col_comment>' ]
    -- Additional column definitions
    [ , <col_name> <col_type> [ ... ] ]
```

```sql
indexes_definition
  : -- Index definition
    INDEX [ IF NOT EXISTS ]
      <index_name> (<index_cols>)
      [ USING <index_type> ]
      [ PROPERTIES (
            -- Table property
            <index_property>
            -- Additional table properties
            [ , ... ])
      ]
      [ COMMENT '<index_comment>' ]
    -- Additional index definitions
    [ , <index_name> (<index_cols>) [ ... ] ]
```

```sql
partitions_definition
  : AUTO PARTITION BY RANGE(<auto_partition_function>(<auto_partition_arguments>))
    <origin_partitions_definition>
  | AUTO PARTITION BY LIST(<partition_cols>)
    <origin_partitions_definition>
  | PARTITION BY <partition_type> (<partition_cols>)
    <origin_partitions_definition>
```

- Где:

    ```sql
    <origin_partitions_definition>
    : (
        -- Partition definition
        <one_partition_definition>
        -- Additional partition definition
        [ , ... ]
      )

    <one_partition_definition>
    : PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES LESS THAN <partition_value_list>
    | PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES [ <partition_lower_bound>, <partition_upper_bound>)
    | FROM <partition_lower_bound> TO <partition_upper_bound>
        INTERVAL <n> [ <datetime_unit> ]
    | PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES IN {
            (<partition_value> [, <partition_value> [ ... ] ])
            | <partition_value>
        }
    ```

```sql
roll_up_definition
  : ROLLUP (
        -- Rollup definition
        <rollup_name> (<rollup_cols>)
        [ DUPLICATE KEY (<duplicate_cols>) ]
        -- Additional rollup definition
        [ , <rollup_name> (<rollup_cols>) [ ... ] ]
    )
```

## Варианты синтаксиса {#varaint-syntax}

### CREATE TABLE ... AS SELECT (также называется CTAS) {#create-table--as-select-also-referred-to-as-ctas}

Создаёт таблицу и заполняет её данными, возвращёнными запросом `query`:

```sql
CREATE
    [ EXTERNAL ]
    TABLE [ IF NOT EXISTS ] <table_name>
    [ ( <column_definitions> ) ]
    [ <index_definitions> ]
    [ ENGINE = <storage_engine_type> ]
    [ <partitioning_key_type> KEY ( <key_columns> )
        [ ORDER BY ( <clustering_columns> ) ]
    ]
    [ COMMENT '<table_description>' ]
    [ <partition_definitions> ]
    [ DISTRIBUTED BY { HASH ( <distribution_columns> ) | RANDOM }
        [ BUCKETS { <number_of_buckets> | AUTO } ]
    ]
    [ <rollup_definitions> ]
    [ PROPERTIES (
          "<table_properties>"
          [ , ... ]
    ) ]
[ AS ] <query>;
```

> Примечание: `ORDER BY` поддерживается начиная с версии 4.1.0.

### CREATE TABLE ... LIKE {#create-table--like}

Создаёт новую таблицу с теми же определениями столбцов, что и у существующей таблицы, без копирования данных. Все свойства столбцов воспроизводятся в новой таблице. Если указан список имён `rollup`, соответствующие `rollup` исходной таблицы также воспроизводятся:

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```

## Обязательные параметры {#required-parameters}

**<name>**

> Указывает идентификатор (то есть имя) таблицы; он должен быть уникальным в базе данных, где создаётся таблица.
>
> Идентификатор должен начинаться с буквы (при включённой поддержке имён Unicode — с буквы любого языка) и не может содержать пробелы или специальные символы, если только весь идентификатор не заключён в обратные кавычки (например, ``My Object``).
>
> В идентификаторах нельзя использовать зарезервированные ключевые слова.
>
> Подробнее см. [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<col_name>**

> Указывает идентификатор (то есть имя) столбца. Он должен быть уникальным в создаваемой таблице.
>
> Идентификатор должен начинаться с буквы (при включённой поддержке имён Unicode — с буквы любого языка), цифры или символа `@` и не может содержать пробелы или специальные символы, если только весь идентификатор не заключён в обратные кавычки (например, ``My Object``).
>
> Подробнее см. [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<col_type>**

> Указывает тип данных столбца.
>
> Сведения о типах данных, которые можно задавать для столбцов таблицы, см. в разделе [Типы данных](../../../basic-element/sql-data-types/data-type-overview.md).

**<query>**

> Обязательный параметр в CTAS. Указывает оператор SELECT, данные из которого заполняют таблицу.

**<source_table>**

> Обязательный параметр в CREATE TABLE ... LIKE. Указывает исходную таблицу для копирования.

## Необязательные параметры {#optional-parameters}

### Параметры модели данных {#data-model-related-parameters}

**<key_type>**

> Модель данных таблицы. Возможные значения: DUPLICATE (детальная модель), UNIQUE (модель с первичным ключом), AGGREGATE (агрегатная модель). Подробнее о моделях данных см. в разделе [Модель данных](../../../../table-design/data-model/intro.mdx).

**<key_cols>**

> Ключевые столбцы таблицы. В Doris ключевые столбцы должны занимать первые K позиций в таблице. В пределах одного tablet данные упорядочены по этим столбцам. Ограничения для ключей и рекомендации по выбору ключевых столбцов см. в подразделах раздела [Модель данных](../../../../table-design/data-model/intro.mdx).

**<cluster_cols>**

> Столбцы локальной сортировки данных. Их можно использовать только для модели данных UNIQUE (модели с первичным ключом). Если указаны `<cluster_cols>`, данные сортируются по `<cluster_cols>`, а не по `<key_cols>`.

**<col_aggregate_type>**

> Способ агрегации столбца. Его можно использовать только в таблицах с агрегатной моделью. Подробнее о способах агрегации см. в разделе [Агрегатная модель](../../../../table-design/data-model/aggregate.md).

### Параметры распределения по корзинам {#bucketing-related-parameters}

**<distribute_cols> и <bucket_count>**

> Столбцы распределения по корзинам и количество корзин. В детальной модели для распределения можно выбрать любые столбцы; в агрегатной модели и модели с первичным ключом они должны совпадать с ключевыми столбцами. Количество корзин может быть любым положительным целым числом. Подробнее см. в разделах [Ручная настройка корзин](../../../../table-design/data-partitioning/data-bucketing#1-manually-set-the-number-of-buckets) и [Автоматическая настройка корзин](../../../../table-design/data-partitioning/data-bucketing#2-automatically-set-the-number-of-buckets).

### Параметры значений столбцов по умолчанию {#column-default-value-related-parameters}

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> Вычисляемый столбец. Значение текущего столбца вычисляется выражением `<col_generate_expression>` на основе предшествующих столбцов. Это особый тип столбца таблицы: его значение вычисляется по значениям других столбцов, а не вставляется или обновляется пользователем напрямую. Функция позволяет заранее вычислять результаты выражений и сохранять их в базе данных, что полезно при частых запросах или сложных вычислениях.

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> При загрузке данных Doris присваивает уникальное в пределах таблицы значение строкам, для которых не задано значение автоинкрементного столбца. `<col_auto_increment_start_value>` задаёт начальное значение такого столбца. Подробнее см. раздел [Автоинкрементные столбцы](../../../../table-design/auto-increment.md).

**DEFAULT <col_default_value>**

> Значение столбца по умолчанию. Оно используется при записи строки, если этот столбец не указан. Если значение по умолчанию не задано явно, используется NULL. Допустимые значения по умолчанию:
>
> - NULL: доступно для всех типов; значением по умолчанию будет NULL.
> - Числовые литералы: доступны только для числовых типов.
> - Строковые литералы: используются для строковых столбцов; столбцы UUID также принимают допустимые текстовые значения UUID по умолчанию.
> - UUID_V4() / UUID_V7(): динамические значения по умолчанию для столбцов UUID, включая псевдонимы этих функций. Если столбец не указан, значение создаётся для каждой строки. См. [Тип UUID](../../../basic-element/sql-data-types/uuid.md).
> - CURRENT_DATE: доступно только для типов даты. В качестве значения по умолчанию используется текущая дата.
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]: доступно только для типов `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`. В качестве значения по умолчанию используется текущая временная метка. Параметр `<defaultValuePrecision>` задаёт точность времени; `TIMESTAMP_NS` поддерживает до 9 цифр.
> - PI: доступно только для типов double. В качестве значения по умолчанию используется число пи.
> - E: доступно только для типов double. В качестве значения по умолчанию используется математическая константа e.
> - BITMAP_EMPTY: доступно только для столбцов типа bitmap. Заполняет столбец пустой bitmap.

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> Если при обновлении данных значение этого столбца не указано, в него записывается текущая временная метка. Доступно только для таблиц UNIQUE (модель с первичным ключом).

### Параметры индексов {#index-related-parameters}

**<index_name>**

> Указывает идентификатор (то есть имя) индекса. Он должен быть уникальным в создаваемой таблице. Подробнее об идентификаторах см. [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<index_cols>**

> Список столбцов, для которых создаётся индекс. Эти столбцы должны существовать в таблице.

**<index_type>**

> Тип индекса. В настоящее время поддерживается только INVERTED.

**<index_property>**

> Свойства индекса. Подробнее см. раздел [Инвертированный индекс](../../../../table-design/index/inverted-index/overview.md).

### Параметры автоматического секционирования {#auto-partition-related-parameters}

Подробное описание секционирования см. в разделе [Автоматическое секционирование](../../../../table-design/data-partitioning/auto-partitioning.md).

### Параметры ручного секционирования {#manual-partitioning-related-parameters}

Подробное описание секционирования см. в разделе «Ручное секционирование».

**<partition_type>**

> Doris поддерживает секционирование RANGE и LIST. Подробнее см. раздел [Ручное секционирование](../../../../table-design/data-partitioning/manual-partitioning.md).

**<partition_name>**

> Идентификатор (то есть имя) секции. Он должен быть уникальным в создаваемой таблице. Подробнее об идентификаторах см. [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**VALUES LESS THAN <partition_value_list>**

> Секционирование RANGE. Диапазон данных секции простирается от нижней границы до `<partition_value_list>`.
>
> Если `<partition_value_list>` обозначает верхнюю границу, его можно сократить до `MAX_VALUE`.
>
> Формат `<partition_value_list>`: `((col_1_value, ...), (col_1_value, ...), ...)`

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> Секционирование RANGE. Диапазон данных секции простирается от `<partition_lower_bound>` до `<partition_upper_bound>`. Создаётся только одна секция.
>
> Формат `<partition_lower_bound>` и `<partition_upper_bound>`: `(col_1_value, ...)`

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> Секционирование RANGE. Диапазон данных секций простирается от `<partition_lower_bound>` до `<partition_value_list>`. Секция создаётся через каждый интервал `<n>`.
>
> Формат `<partition_lower_bound>` и `<partition_upper_bound>`: `(col_1_value, ...)`

**VALUES IN {**

          **(<partition_value> [, <partition_value> [ ... ] ])**

          **| <partition_value>**

      **}**

> Секционирование LIST. Строки, в которых значение столбца секционирования равно `<partition_value>`, относятся к этой секции.
>
> Формат `<partition_value>`: `(col_1_value, ...)`


### Параметры синхронных материализованных представлений {#synchronized-materialized-view-related}

:::caution Примечание
Возможности создания синхронных материализованных представлений через rollup ограничены, поэтому такой способ больше не рекомендуется. Рекомендуется создавать синхронные материализованные представления отдельными операторами. Подробнее см. оператор [CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) и раздел [Синхронное материализованное представление](../../../../query-acceleration/materialized-view/sync-materialized-view.md).
:::

**<rollup_name>**

> Идентификатор (то есть имя) синхронного материализованного представления. Он должен быть уникальным в создаваемой таблице. Подробнее об идентификаторах см. [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<rollup_cols>**

> Столбцы, входящие в синхронное материализованное представление.

### Параметры свойств таблицы {#table-property-related-parameters}

Приведённые ниже свойства относятся к таблицам OLAP. Задавайте их значения строками в кавычках в `PROPERTIES ("name" = "value", ...)`. Свойства необязательны, если они не требуются для определённой функции; ограничения для конкретного режима развёртывания указаны в описаниях.

**<table_property>**

| Имя свойства | Назначение |
| :------------ | :-------- |
| replication_num | Количество реплик. По умолчанию — 3. Если узлов BE меньше 3, необходимо указать количество реплик не больше числа узлов BE. После версии 0.15 это свойство автоматически преобразуется в `replication_allocation`: например, `"replication_num" = "3"` преобразуется в `"replication_allocation" = "tag.location.default:3"`. |
| replication_allocation | Задаёт распределение реплик по Tags. Это свойство может полностью переопределить действие `replication_num`. |
| min_load_replica_num | Задаёт минимальное количество реплик, необходимое для успешной загрузки данных; значение по умолчанию — -1. Если значение этого свойства меньше или равно 0, для успешной загрузки данных по-прежнему требуется большинство реплик. |
| storage_medium | Указывает исходный носитель для хранения данных таблицы. |
| storage_cooldown_time | Задаёт время окончания использования исходного носителя данных таблицы. После этого данные автоматически переводятся на носитель первого уровня. |
| colocate_with | Если требуется функция Colocation Join, этот параметр задаёт Colocation Group. |
| bloom_filter_columns | Заданный пользователем список имён столбцов, для которых нужен индекс Bloom Filter. Для каждого столбца создаётся отдельный индекс Bloom Filter, а не составной. Например: `"bloom_filter_columns" = "k1, k2, k3"` |
| compression | Начиная с версии 4.0.3 для таблиц Doris по умолчанию используется сжатие ZSTD. До версии 4.0.3 по умолчанию использовалось LZ4F. |
| function_column.sequence_col | В модели Unique Key можно указать столбец Sequence. При совпадении ключевых столбцов операция REPLACE выполняется согласно столбцу Sequence: большее значение заменяет меньшее, иначе замена невозможна. `function_column.sequence_col` связывает столбец последовательности с конкретным столбцом таблицы, тип которого может быть целочисленным либо типом даты или времени (`DATE`, `DATETIME`, `TIMESTAMP_NS`). После создания тип этого столбца изменить нельзя. Если задано `function_column.sequence_col`, свойство `function_column.sequence_type` игнорируется. |
| function_column.sequence_type | В модели Unique Key можно указать столбец Sequence. При совпадении ключевых столбцов операция REPLACE выполняется согласно столбцу Sequence: большее значение заменяет меньшее, иначе замена невозможна. Здесь требуется указать только тип столбца последовательности: целочисленный либо тип даты или времени (`DATE`, `DATETIME`, `TIMESTAMP_NS`). Doris создаст скрытый столбец последовательности. |
| enable_unique_key_merge_on_write | Определяет, использует ли таблица Unique реализацию Merge-on-Write. До версии 2.1 это свойство по умолчанию было отключено, а начиная с версии 2.1 включено. |
| light_schema_change | Определяет, используется ли оптимизация Light Schema Change. Если задано `true`, добавление и удаление столбцов значений можно выполнить быстрее и синхронно. Начиная с версии 2.0.0 функция включена по умолчанию. |
| disable_auto_compaction | Определяет, отключено ли автоматическое уплотнение этой таблицы. Если задано `true`, фоновый процесс автоматического уплотнения пропускает все tablets таблицы. |
| enable_duplicate_without_keys_by_default | Если задано `true` и при создании таблицы не указана модель Unique, Aggregate или Duplicate, по умолчанию создаётся таблица модели Duplicate без столбцов сортировки и префиксных индексов. |
| skip_write_index_on_load | Определяет, нужно ли пропускать запись индексов при загрузке данных в эту таблицу. Если задано `true`, индексы не записываются при загрузке данных (в настоящее время это действует только для инвертированных индексов), а создаются позже при уплотнении. Это позволяет избежать повторных затрат CPU и IO на запись индексов при первой записи и уплотнении и повысить производительность загрузки с высокой пропускной способностью. |
| compaction_policy | Задаёт политику объединения при уплотнении таблицы; поддерживаются только time_series или size_basedtime_series: когда объём rowsets на диске достигает определённого размера, выполняется объединение версий. Объединённый rowset сразу переходит к этапу base compaction. Это уменьшает усиление записи при уплотнении в сценариях непрерывной загрузки. Параметры с префиксом time_series_compaction управляют выполнением уплотнения по этой политике. |
| time_series_compaction_goal_size_mbytes | При политике уплотнения time_series задаёт размер входных файлов для каждого уплотнения; размер выходного файла сопоставим с размером входного. |
| time_series_compaction_file_count_threshold | При политике уплотнения time_series задаёт минимальное количество входных файлов для каждого уплотнения. Если количество файлов в tablet превышает заданное значение, запускается уплотнение. |
| time_series_compaction_time_threshold_seconds | При политике уплотнения time_series задаёт максимальный интервал между уплотнениями в секундах: уплотнение запускается, если оно долго не выполнялось. |
| time_series_compaction_level_threshold | При политике уплотнения time_series значение этого параметра по умолчанию — 1. Значение 2 включает повторное объединение уже объединённых сегментов, чтобы довести их размер до time_series_compaction_goal_size_mbytes и сократить количество сегментов. |
| group_commit_interval_ms | Задаёт интервал формирования пакета Group Commit для этой таблицы. Единица измерения — мс; значение по умолчанию — 10000ms, то есть 10s. Момент выполнения Group Commit зависит от того, какое значение достигается первым: `group_commit_interval_ms` или `group_commit_data_bytes`. |
| group_commit_data_bytes | Задаёт размер пакета данных Group Commit для этой таблицы. Единица измерения — байты; значение по умолчанию — 134217728, то есть 128MB. Момент выполнения Group Commit зависит от того, какое значение достигается первым: `group_commit_interval_ms` или `group_commit_data_bytes`. |
| enable_mow_light_delete | Определяет, разрешена ли запись Delete predicate операторами Delete в таблицах Unique с Mow. Включение повышает производительность Delete, но частичное обновление столбцов после Delete может привести к ошибкам в данных. Отключение снижает производительность Delete ради корректности. По умолчанию — `false`. Это свойство можно включить только для таблиц Unique Merge-on-Write. |
| Свойства динамического секционирования | Подробнее о динамическом секционировании см. [Секционирование данных — динамическое секционирование](../../../../table-design/data-partitioning/dynamic-partitioning) |
| enable_unique_key_skip_bitmap_column | Определяет, включена ли [функция гибкого обновления столбцов](../../../../data-operate/update/partial-column-update.md#flexible-column-update) в таблицах Unique Merge-on-Write. Это свойство можно включить только для таблиц Unique Merge-on-Write. |
| changelog.enable | Включает для таблицы [changelog](../../../../data-operate/incremental/changelog), который записывает изменения на уровне строк для потребления через Table Stream и инкрементальных запросов `@incr`. Поддерживаются только таблицы Duplicate Key и Unique Key Merge-on-Write (без ключей кластеризации). Свойство можно включить только при создании таблицы, после чего отключить его нельзя; его нельзя использовать вместе с `binlog.enable` (CCR). На FE требуется `enable_feature_changelog = true`. Доступно начиная с версии 5.0.0. |
| changelog.need_historical_value | Определяет, записывает ли changelog значения до изменения (образ до изменения); по умолчанию — `false`. Значение `true` допустимо только для таблиц Unique Key Merge-on-Write; от него зависят потоки Table Stream типов `min_delta` / `detail`. После создания изменить нельзя. |
| changelog.ttl_seconds | Срок хранения записей об изменениях в секундах; по умолчанию — `86400` (один день). Должен быть больше `0`. Можно изменить через `ALTER TABLE`. |

#### Дополнительные свойства таблиц OLAP {#additional-olap-table-properties}

| Свойство | Тип значения | По умолчанию | Описание |
| --- | --- | --- | --- |
| `short_key` | Целое число | Вычисляется автоматически | Количество первых столбцов сортировки, используемых префиксным индексом. Должно быть положительным и не превышать количество столбцов сортировки; столбец VARCHAR может быть только последним среди выбранных. |
| `bloom_filter_fpp` | Число с плавающей точкой | `0.05` | Вероятность ложноположительного результата для `bloom_filter_columns` в диапазоне `[0.0001, 0.05]`. Действует только при настройке столбцов Bloom Filter. См. [Bloom Filter](../../../../table-design/index/bloomfilter.md). |
| `storage_type` | Строка | `COLUMN` | Организация хранения. Допускается только `COLUMN`. Дополнительную копию в строковом формате можно включить свойствами строкового хранения ниже. |
| `storage_format` | Строка | `V2` | Формат хранения сегментов: `V2`, `V3` или `default` (`V2`). `V3` доступен с версии 4.1.0 и хранит метаданные столбцов отдельно. См. [Формат хранения](../../../../table-design/storage-format.md). |
| `inverted_index_storage_format` | Строка | Конфигурация FE | Формат инвертированного индекса: `V2`, `V3` или `default`; начиная с версии 4.2.0 также поддерживается `SNII`. Если свойство не задано или указано `default`, используется конфигурация FE `inverted_index_storage_format`. С версии 4.1.5 создание новых индексов V1 запрещено. См. [Инвертированный индекс](../../../../table-design/index/inverted-index/overview.md). |
| `store_row_column` | Логическое значение | `false` | Хранит дополнительную копию всех столбцов в строковом формате. Требуется `light_schema_change = true`; таблицы Aggregate Key не поддерживаются. См. [Строковое хранение](../../../../table-design/row-store.md). |
| `row_store_columns` | Строка | Не задано | Имена существующих столбцов через запятую, например `k,v1,v2`, для хранения в строковом формате. Задание списка включает строковое хранение для этих столбцов; таблицы Aggregate Key не поддерживаются. См. [Строковое хранение](../../../../table-design/row-store.md). |
| `row_store_page_size` | Длинное целое число | `16384` | Размер страницы строкового хранения в байтах. Должен быть положительным; округляется вверх до кратного 4096 байтам. |
| `storage_page_size` | Длинное целое число | `65536` | Размер страницы столбцовых данных в байтах, от `4096` до `10485760`; округляется вверх до кратного 4096 байтам. |
| `storage_dict_page_size` | Длинное целое число | `262144` | Размер страницы словаря в байтах, от `0` до `104857600`; округляется вверх до кратного 4096 байтам. |
| `storage_policy` | Строка | Не задано | Существующая политика удалённого хранения для таблицы в режиме совмещённого хранения и вычислений. Не поддерживается для таблиц Unique Key Merge-on-Write; игнорируется в режиме разделения хранения и вычислений. См. [Удалённое хранение](../../../../table-design/tiered-storage/remote-storage.md). |
| `storage_vault_name` | Строка | Vault базы данных, затем Vault по умолчанию | Имя Storage Vault в режиме разделения хранения и вычислений. Vault должен существовать, а пользователю требуется право `USAGE` на него. Настройка таблицы имеет приоритет перед настройками базы данных и Vault по умолчанию. См. [Управление Storage Vault](../../../../compute-storage-decoupled/managing-storage-vault.md). |
| `file_cache_ttl_seconds` | Длинное целое число | `0` | Срок защиты кэша TTL в секундах в режиме разделения хранения и вычислений. `0` означает обычное кэширование. Начиная с версии 4.1.4 допустимый диапазон проверяется от `0` до `4611686018427387903`. Это свойство не задаёт срок хранения данных. См. [Файловый кэш](../../../../compute-storage-decoupled/file-cache/file-cache.md). |
| `estimate_partition_size` | Строка | Не задано | Оценка размера одной секции без сжатия, например `10G`; используется с `BUCKETS AUTO` для выбора исходного количества корзин. См. [Распределение по корзинам](../../../../table-design/data-partitioning/data-bucketing.md). |
| `mutable` | Логическое значение | `true` | Определяет, принимает ли секция загружаемые данные. `false` делает её неизменяемой. Настройка на уровне таблицы задаёт значение по умолчанию для её секций. |
| `partition.retention_count` | Целое число | Не задано | Положительное количество исторических секций, сохраняемых в таблице AUTO RANGE PARTITION. Текущие и будущие секции сохраняются. Начиная с версии 4.1.4 нельзя сочетать с включённым динамическим секционированием. См. [Автоматическое секционирование](../../../../table-design/data-partitioning/auto-partitioning.md). |
| `vertical_compaction_num_columns_per_group` | Целое число | `5` | Количество столбцов в группе при вертикальном уплотнении. Должно быть не меньше `1`. |
| `time_series_compaction_empty_rowsets_threshold` | Длинное целое число | `5` | Минимальное количество последовательных пустых rowsets для приоритетного уплотнения. Должно быть не меньше `2`; требуется `compaction_policy = time_series`. |
| `group_commit_mode` | Строка | `off_mode` | Режим Group Commit по умолчанию для этой таблицы: `off_mode`, `sync_mode` или `async_mode`. Поддерживается начиная с версии 4.1.0. Настройка запроса или сеанса имеет приоритет. См. [Group Commit](../../../../data-operate/import/load-best-practices/group-commit-manual.md). |
| `binlog.enable` | Логическое значение | `false` | Включает CCR binlog для этой таблицы. На FE также требуется включить `enable_feature_binlog`. |
| `binlog.ttl_seconds` | Длинное целое число | `86400` | Порог срока хранения CCR binlog в секундах. |
| `binlog.max_bytes` | Длинное целое число | `9223372036854775807` | Порог размера CCR binlog для удаления устаревших данных, в байтах. |
| `binlog.max_history_nums` | Длинное целое число | `9223372036854775807` | Порог количества исторических записей CCR binlog для удаления устаревших данных. |
| `is_being_synced` | Логическое значение | `false` | Помечает целевую таблицу CCR как синхронизируемую. При значении `true` Doris пропускает планирование её динамических секций и игнорирует настройки colocate и политики хранения. Управление этим свойством следует оставить процессу CCR. |
| `partition.inverted_index_storage_format` | Строка | Не задано | Начиная с версии 4.2.0: формат для новых секций в режиме разделения хранения и вычислений — `V2`, `V3` или `SNII`. Требуется конфигурация FE `enable_partition_inverted_index_storage_format_rollout = true`; при выключенном переключателе свойство игнорируется. Существующие секции не преобразуются. |
| `sequence_mapping.<sequence_col>` | Строка | Не задано | Dev: список столбцов Value через запятую, управляемых указанным столбцом Sequence. Требуется таблица Unique Key Merge-on-Read и `light_schema_change = true`. См. [Многопоточное обновление](../../../../data-operate/update/multi-stream-update-for-unique-model.md). |
| `function_column.enable_row_ttl` | Логическое значение | `false` | Экспериментальная функция, доступная с версии 5.0.0: включает TTL на уровне строк при создании таблицы. Таблицы Aggregate Key и сочетания со столбцами Sequence не поддерживаются. См. [TTL на уровне строк](../../../../data-operate/delete/row-ttl.md). |
| `function_column.ttl_col` | Строка | Не задано | Исходный столбец Value для TTL на уровне строк. Требует одновременной настройки `function_column.ttl` и включённого TTL на уровне строк. Ограничения для исходного столбца см. в разделе [TTL на уровне строк](../../../../data-operate/delete/row-ttl.md). |
| `function_column.ttl` | Строка | Не задано | Неотрицательный срок хранения для TTL на основе исходного столбца, например `86400` или `1 day`. Значение без единицы измерения задаётся в секундах. `0` означает истечение срока в момент времени, указанный исходным столбцом. |
| `function_column.ttl_time_zone` | Строка | Зависит от типа исходного столбца | Часовой пояс исходного столбца TTL: `UTC`, `Z` или фиксированное смещение от `-12:00` до `+14:00`. Для исходных столбцов семейства DATE/DATETIME требуется явное значение; для TIMESTAMPTZ по умолчанию используется `+00:00`, и допускается только нулевое смещение. |

Свойства отдельных функций также описаны в разделе [Динамическое секционирование](../../../../table-design/data-partitioning/dynamic-partitioning.md). `PROPERTIES` индексов, `PROPERTIES` столбцов VARIANT и свойства асинхронных материализованных представлений настраиваются отдельно от этих свойств таблицы. Для автоматического сбора статистики задайте `auto_analyze_policy` через `ALTER TABLE`, как описано в разделе [Статистика](../../../../query-acceleration/optimization-technology-principle/statistics.md).

## Требования к правам доступа {#access-control-requirements}

[Пользователь](../../../../admin-manual/auth/authentication-and-authorization.md), выполняющий эту команду SQL, должен иметь как минимум следующие [права](../../../../admin-manual/auth/authentication-and-authorization.md):

| Право | Объект | Описание |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | База данных | |
| SELECT_PRIV | Таблица, представление | При выполнении CTAS требуется SELECT_PRIV на запрашиваемую таблицу, представление или материализованное представление |

## Примечания по использованию {#usage-notes}

- В базе данных (Database) не должно быть таблиц (Table) или представлений (View) с тем же именем.
- Имена таблиц, столбцов и rollup не должны совпадать с [зарезервированными ключевыми словами](../../../basic-element/reserved-keywords.md).
- CREATE TABLE ... LIKE:
  - Команду можно применять только к внутренним таблицам Doris.
  - Копируются только явно указанные rollup.
  - Синхронные материализованные представления не копируются.
- CREATE TABLE ... AS SELECT (CTAS):
  - Если псевдоним имени столбца в списке SELECT является допустимым именем столбца, определения столбцов в CTAS не требуются. Если их опустить, имена и типы данных столбцов определяются по исходному запросу:

    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
  - Имена также можно указать явно с помощью следующего синтаксиса:

    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```

- Секционирование и распределение по корзинам
  - Для таблицы необходимо указать столбцы распределения по корзинам, но секции указывать необязательно. Подробнее см. документацию по [секционированию данных](../../../../table-design/data-partitioning/data-bucketing.md).
  - Таблицы Doris могут быть секционированными и несекционированными. Это свойство определяется при создании таблицы и впоследствии не меняется. В секционированной таблице секции можно добавлять и удалять позднее; в несекционированную таблицу добавить секции впоследствии нельзя.
  - После создания таблицы столбцы секционирования и распределения по корзинам изменить нельзя: нельзя менять их типы, добавлять или удалять такие столбцы.
- Динамическое секционирование
  - Эта функция предназначена прежде всего для автоматического управления секциями. По заданным правилам Doris периодически добавляет новые секции или удаляет старые. Подробнее см. документацию по [динамическому секционированию](../../../../table-design/data-partitioning/dynamic-partitioning.md).
- Автоматическое секционирование
  - Документация по автоматическому секционированию приведена в разделе [Автоматическое секционирование](../../../../table-design/data-partitioning/auto-partitioning.md).
- Синхронные материализованные представления
  - При создании таблицы можно создать несколько синхронных материализованных представлений (ROLLUP). Их также можно добавить после создания таблицы. Указание в операторе создания таблицы позволяет создать все синхронные материализованные представления за один раз.
  - Если синхронные материализованные представления созданы вместе с таблицей, все последующие операции загрузки данных будут синхронно формировать данные для них. Количество материализованных представлений может влиять на скорость загрузки данных.
  - Вводные сведения см. в документации по [синхронным материализованным представлениям](../../../../query-acceleration/materialized-view/sync-materialized-view.md).
- Индексы
  - При создании таблицы можно создать несколько индексов столбцов. Индексы также можно добавить после создания таблицы.
  - Если индекс добавляется позже, а таблица уже содержит данные, потребуется переписать все данные. Поэтому время создания индекса зависит от текущего объёма данных.


## Примеры {#examples}

### Базовые примеры {#basic-examples}

**Детальная модель**

```sql
CREATE TABLE t1
(
  c1 INT,
  c2 STRING
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**Агрегатная модель**

```sql
CREATE TABLE t2
(
  c1 INT,
  c2 INT MAX
)
AGGREGATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**Модель с первичным ключом**

```sql
CREATE TABLE t3
(
  c1 INT,
  c2 INT
)
UNIQUE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**Использование вычисляемых столбцов**

```sql
CREATE TABLE t4
(
  c1 INT,
  c2 INT GENERATED ALWAYS AS (c1 + 1)
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**Задание значений столбцов по умолчанию**

```sql
CREATE TABLE t5
(
  c1 INT,
  c2 INT DEFAULT 10
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```

**Способ распределения по корзинам**

```sql
CREATE TABLE t6
(
  c1 INT,
  c2 INT
)
DUPLICATE KEY(c1)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**Автоматическое секционирование**

```sql
CREATE TABLE t7
(
  c1 INT,
  c2 DATETIME NOT NULL
)
DUPLICATE KEY(c1)
AUTO PARTITION BY RANGE(date_trunc(c2, 'day')) ()
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**Секционирование по диапазону**

```sql
CREATE TABLE t8
(
  c1 INT,
  c2 DATETIME NOT NULL
)
DUPLICATE KEY(c1)
PARTITION BY RANGE(c2) (
  FROM ('2020-01-01') TO ('2020-01-10') INTERVAL 1 DAY
)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**Секционирование по списку**

```sql
CREATE TABLE t9
(
  c1 INT,
  c2 DATE NOT NULL
)
DUPLICATE KEY(c1)
PARTITION BY LIST(c2) (
  PARTITION p1 VALUES IN (('2020-01-01'),('2020-01-02'))
)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```

**Носитель хранения и время охлаждения**

```sql
CREATE TABLE example_db.table_hash
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048),
    v2 SMALLINT DEFAULT "10"
)
UNIQUE KEY(k1, k2)
DISTRIBUTED BY HASH (k1, k2) BUCKETS 32
PROPERTIES(
    "storage_medium" = "SSD",
    "storage_cooldown_time" = "2015-06-04 00:00:00"
);
```

**Настройка стратегии переноса данных таблицы между горячим и холодным уровнями хранения с помощью свойства `storage_policy`**

1. Чтобы связать таблицу со стратегией переноса, сначала необходимо создать ресурс s3 и политику хранения.

    ```sql
    -- Non-partitioned table
    CREATE TABLE IF NOT EXISTS create_table_use_created_policy
    (
        k1 BIGINT,
        k2 LARGEINT,
        v1 VARCHAR(2048)
    )
    UNIQUE KEY(k1)
    DISTRIBUTED BY HASH (k1) BUCKETS 3
    PROPERTIES(
        "storage_policy" = "test_create_table_use_policy",
        "replication_num" = "1"
    );

    -- Partitioned table
    CREATE TABLE create_table_partion_use_created_policy
    (
        k1 DATE,
        k2 INT,
        V1 VARCHAR(2048) REPLACE
    ) PARTITION BY RANGE (k1) (
        PARTITION p1 VALUES LESS THAN ("2022-01-01") ("storage_policy" = "test_create_table_partition_use_policy_1" ,"replication_num"="1"),
        PARTITION p2 VALUES LESS THAN ("2022-02-01") ("storage_policy" = "test_create_table_partition_use_policy_2" ,"replication_num"="1")
    ) DISTRIBUTED BY HASH(k2) BUCKETS 1;
    ```

**Colocation Group**

```sql
CREATE TABLE t1 (
    id int(11) COMMENT "",
    value varchar(8) COMMENT ""
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "colocate_with" = "group1"
);

CREATE TABLE t2 (
    id int(11) COMMENT "",
    value1 varchar(8) COMMENT "",
    value2 varchar(8) COMMENT ""
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "colocate_with" = "group1"
);
```

**Индекс**

```sql
CREATE TABLE example_db.table_hash
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.5",
    v1 CHAR(10) REPLACE,
    v2 INT SUM,
    INDEX k1_idx (k1) USING INVERTED COMMENT 'my first index'
)
AGGREGATE KEY(k1, k2)
DISTRIBUTED BY HASH(k1) BUCKETS 32
PROPERTIES (
    "bloom_filter_columns" = "k2"
);
```

**Настройка свойств репликации таблицы**

```sql
CREATE TABLE example_db.table_hash
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.5"
)
DISTRIBUTED BY HASH(k1) BUCKETS 32
PROPERTIES (
    "replication_allocation"="tag.location.group_a:1, tag.location.group_b:2"
);
```

**Динамическое секционирование**

Эта таблица создаёт секции на 3 дня вперёд и удаляет секции, созданные 3 дня назад. Например, если сегодня `2020-01-08`, будут созданы секции с именами `p20200108`, `p20200109`, `p20200110`, `p20200111`. Диапазоны секций:

```Plain
[types: [DATE]; keys: [2020-01-08]; ‥types: [DATE]; keys: [2020-01-09]; )
[types: [DATE]; keys: [2020-01-09]; ‥types: [DATE]; keys: [2020-01-10]; )
[types: [DATE]; keys: [2020-01-10]; ‥types: [DATE]; keys: [2020-01-11]; )
[types: [DATE]; keys: [2020-01-11]; ‥types: [DATE]; keys: [2020-01-12]; )
```

```sql
CREATE TABLE example_db.dynamic_partition
(
    k1 DATE,
    k2 INT,
    k3 SMALLINT,
    v1 VARCHAR(2048),
    v2 DATETIME DEFAULT "2014-02-04 15:36:00"
)
DUPLICATE KEY(k1, k2, k3)
PARTITION BY RANGE (k1) ()
DISTRIBUTED BY HASH(k2) BUCKETS 32
PROPERTIES(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32"
);
```

**Настройка свойств репликации динамических секций**

```sql
CREATE TABLE example_db.dynamic_partition
(
    k1 DATE,
    k2 INT,
    k3 SMALLINT,
    v1 VARCHAR(2048),
    v2 DATETIME DEFAULT "2014-02-04 15:36:00"
)
PARTITION BY RANGE (k1) ()
DISTRIBUTED BY HASH(k2) BUCKETS 32
PROPERTIES(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32",
    "dynamic_partition.replication_allocation" = "tag.location.group_a:3"
 );
```

### Пример CTAS {#ctas-example}

```sql
CREATE TABLE t10
PROPERTIES (
  'replication_num' = '1'
)
AS SELECT * FROM t1;
```

### Пример CREATE TABLE ... LIKE {#create-table--like-example}

```sql
CREATE TABLE t11 LIKE t10;
```
