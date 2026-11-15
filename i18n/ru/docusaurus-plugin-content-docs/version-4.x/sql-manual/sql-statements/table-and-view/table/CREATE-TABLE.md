---
{
    "title": "CREATE TABLE",
    "language": "ru",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "Создание новой таблицы в текущей или указанной базе данных. Таблица может содержать несколько столбцов; определение каждого столбца включает имя, тип данных,"
}
---

## Описание {#description}

Создаёт новую таблицу в текущей или указанной базе данных. Таблица может содержать несколько столбцов; определение каждого столбца включает имя, тип данных и, при необходимости, следующие атрибуты:

- Является ли столбец ключевым
- Имеет ли столбец семантику агрегации
- Является ли столбец вычисляемым
- Требуется ли значение для столбца (NOT NULL)
- Является ли столбец столбцом с автоинкрементом
- Задано ли значение по умолчанию при вставке
- Задано ли значение по умолчанию при обновлении

Кроме того, команда поддерживает следующие варианты:

- CREATE TABLE … AS SELECT — создание таблицы, сразу заполненной данными; также называется CTAS
- CREATE TABLE … LIKE — создание пустой копии существующей таблицы

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

### CREATE TABLE ... AS SELECT (CTAS) {#create-table--as-select-also-referred-to-as-ctas}

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

Создаёт новую таблицу с такими же определениями столбцов, как у существующей таблицы, без копирования данных. Все свойства столбцов переносятся в новую таблицу. Если указан список имён `rollup`, соответствующие `rollup` исходной таблицы также копируются:

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```

## Обязательные параметры {#required-parameters}

**<name>**

> Задаёт идентификатор (то есть имя) таблицы. Он должен быть уникальным в пределах базы данных, в которой создаётся таблица.
>
> Идентификатор должен начинаться с буквы (или с символа любого языка, если включена поддержка имён Unicode). Пробелы и специальные символы допускаются, только если весь идентификатор заключён в обратные кавычки (например, ``My Object``).
>
> Зарезервированные ключевые слова нельзя использовать в качестве идентификаторов.
>
> Подробнее см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<col_name>**

> Задаёт идентификатор (то есть имя) столбца. Он должен быть уникальным в создаваемой таблице.
>
> Идентификатор должен начинаться с буквы (или с символа любого языка, если включена поддержка имён Unicode), цифры либо символа `@`. Пробелы и специальные символы допускаются, только если весь идентификатор заключён в обратные кавычки (например, ``My Object``).
>
> Подробнее см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<col_type>**

> Задаёт тип данных столбца.
>
> Подробнее о типах данных, которые можно указать для столбцов таблицы, см. в разделе [Типы данных](../../../basic-element/sql-data-types/data-type-overview.md).

**<query>**

> Обязательный параметр для CTAS. Задаёт оператор SELECT, результат которого заполняет таблицу.

**<source_table>**

> Обязательный параметр для CREATE TABLE ... LIKE. Задаёт исходную таблицу, которую нужно скопировать.

## Необязательные параметры {#optional-parameters}

### Параметры модели данных {#data-model-related-parameters}

**<key_type>**

> Модель данных таблицы. Возможные значения: DUPLICATE (модель детальных данных), UNIQUE (модель с первичным ключом) и AGGREGATE (модель агрегации). Подробнее см. в разделе [Модель данных](../../../../table-design/data-model/intro.mdx).

**<key_cols>**

> Ключевые столбцы таблицы. В Doris столбцы Key должны быть первыми K столбцами таблицы. Данные в пределах одного tablet упорядочиваются по этим столбцам. Ограничения на ключи и рекомендации по выбору ключевых столбцов приведены в подразделах раздела [Модель данных](../../../../table-design/data-model/intro.mdx).

**<cluster_cols>**

> Столбцы локальной сортировки данных. Их можно использовать только для модели данных UNIQUE (модели с первичным ключом). Если указаны `<cluster_cols>`, данные сортируются по `<cluster_cols>`, а не по `<key_cols>`.

**<col_aggregate_type>**

> Метод агрегации столбца. Его можно использовать только в таблице с моделью агрегации. Подробнее см. в разделе [Модель агрегации](../../../../table-design/data-model/aggregate.md).

### Параметры распределения по бакетам {#bucketing-related-parameters}

**<distribute_cols> и <bucket_count>**

> Столбцы распределения по бакетам и количество бакетов. В модели детальных данных для распределения можно выбрать любые столбцы; в модели агрегации и модели с первичным ключом они должны совпадать с ключевыми столбцами. Количество бакетов может быть любым положительным целым числом. Подробнее см. в разделах [Ручная настройка бакетов](../../../../table-design/data-partitioning/data-bucketing#1-manually-set-the-number-of-buckets) и [Автоматическая настройка бакетов](../../../../table-design/data-partitioning/data-bucketing#2-automatically-set-the-number-of-buckets).

### Параметры значений столбцов по умолчанию {#column-default-value-related-parameters}

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> Вычисляемый столбец. Его значение формируется выражением `<col_generate_expression>` из значений предшествующих столбцов. Значение такого столбца вычисляется на основе других столбцов, а не вставляется или обновляется пользователем напрямую. Функция позволяет заранее вычислять результаты выражений и хранить их в базе данных, что полезно при частых запросах или сложных вычислениях.

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> При загрузке данных Doris присваивает уникальное в пределах таблицы значение строкам, для которых значение столбца с автоинкрементом не указано. `<col_auto_increment_start_value>` задаёт начальное значение. Подробнее см. в разделе [Столбцы с автоинкрементом](../../../../table-design/auto-increment.md).

**DEFAULT <col_default_value>**

> Значение столбца по умолчанию. Оно используется, если при записи этот столбец не указан. Если значение по умолчанию явно не задано, используется NULL. Допустимые значения по умолчанию:
>
> - NULL: допустимо для всех типов; значением по умолчанию служит NULL.
> - Числовые литералы: допустимы только для числовых типов.
> - Строковые литералы: допустимы только для строковых типов.
> - CURRENT_DATE: допустимо только для типов даты; используется текущая дата.
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]: допустимо только для типов даты и времени; используется текущая временная метка. Параметр `<defaultValuePrecision>` задаёт точность времени.
> - PI: допустимо только для типов double; используется число π.
> - E: допустимо только для типов double; используется математическая константа e.
> - BITMAP_EMPTY: допустимо только для столбца типа bitmap; создаёт пустой bitmap.

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> При обновлении данных, если значение этого столбца не указано, в него записывается текущая временная метка. Допустимо только для таблиц UNIQUE (модели с первичным ключом).

### Параметры индексов {#index-related-parameters}

**<index_name>**

> Задаёт идентификатор (то есть имя) индекса. Он должен быть уникальным в создаваемой таблице. Подробнее см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<index_cols>**

> Список столбцов, для которых создаётся индекс. Эти столбцы должны существовать в таблице.

**<index_type>**

> Тип индекса. Сейчас поддерживается только INVERTED.

**<index_property>**

> Свойства индекса. Подробнее см. в разделе [Инвертированный индекс](../../../../table-design/index/inverted-index/overview.md).

### Параметры автоматического секционирования {#auto-partition-related-parameters}

Подробное описание секционирования приведено в разделе [Автоматическое секционирование](../../../../table-design/data-partitioning/auto-partitioning.md).

### Параметры ручного секционирования {#manual-partitioning-related-parameters}

Подробное описание секционирования приведено в разделе «Ручное секционирование».

**<partition_type>**

> Doris поддерживает секционирование RANGE и LIST. Подробнее см. в разделе [Ручное секционирование](../../../../table-design/data-partitioning/manual-partitioning.md).

**<partition_name>**

> Идентификатор (то есть имя) секции. Он должен быть уникальным в создаваемой таблице. Подробнее см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**VALUES LESS THAN <partition_value_list>**

> Секционирование RANGE. Диапазон данных секции начинается с нижней границы и заканчивается на `<partition_value_list>`.
>
> Если `<partition_value_list>` обозначает верхнюю границу, его можно заменить на `MAX_VALUE`.
>
> Формат `<partition_value_list>`: `((col_1_value, ...), (col_1_value, ...), ...)`.

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> Секционирование RANGE. Диапазон данных секции — от `<partition_lower_bound>` до `<partition_upper_bound>`. Создаётся только одна секция.
>
> Формат `<partition_lower_bound>` и `<partition_upper_bound>`: `(col_1_value, ...)`.

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> Секционирование RANGE. Диапазон данных секций — от `<partition_lower_bound>` до `<partition_value_list>`. Секция создаётся с каждым интервалом `<n>`.
>
> Формат `<partition_lower_bound>` и `<partition_upper_bound>`: `(col_1_value, ...)`.

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> Секционирование LIST. Строки, у которых значение столбца секционирования равно `<partition_value>`, относятся к этой секции.
>
> Формат `<partition_value>`: `(col_1_value, ...)`.


### Параметры синхронных материализованных представлений {#synchronized-materialized-view-related}

:::caution Примечание
Возможности создания синхронных материализованных представлений через rollup ограничены, поэтому этот способ больше не рекомендуется. Рекомендуется создавать такие представления отдельными операторами. Подробнее см. описание оператора [CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) и раздел [Синхронные материализованные представления](../../../../query-acceleration/materialized-view/sync-materialized-view.md).
:::

**<rollup_name>**

> Идентификатор (то есть имя) синхронного материализованного представления. Он должен быть уникальным в создаваемой таблице. Подробнее см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<rollup_cols>**

> Столбцы, включённые в синхронное материализованное представление.

### Параметры свойств таблицы {#table-property-related-parameters}

Следующие свойства относятся к таблицам OLAP. Значения свойств задаются строками в кавычках в `PROPERTIES ("name" = "value", ...)`. Свойства необязательны, если они не требуются для конкретной функции; ограничения для отдельных режимов развёртывания указаны в описаниях.

**<table_property>**

| Имя свойства | Назначение |
| :------------ | :-------- |
| replication_num | Количество реплик. По умолчанию создаются 3 реплики. Если узлов BE меньше 3, необходимо указать количество реплик, не превышающее количество узлов BE. После версии 0.15 это свойство автоматически преобразуется в `replication_allocation`: например, `"replication_num" = "3"` преобразуется в `"replication_allocation" = "tag.location.default:3"`. |
| replication_allocation | Задаёт распределение реплик на основе Tags. Это свойство может полностью заменить `replication_num`. |
| min_load_replica_num | Задаёт минимальное количество реплик, необходимых для успешной загрузки данных. Значение по умолчанию — -1. Если значение свойства меньше или равно 0, для успешной загрузки данных по-прежнему требуется большинство реплик. |
| storage_medium | Задаёт исходный носитель для хранения данных таблицы. |
| storage_cooldown_time | Задаёт время окончания использования исходного носителя для данных таблицы. После этого времени данные автоматически перемещаются на носитель первого уровня. |
| colocate_with | Если требуется функция Colocation Join, этот параметр задаёт Colocation Group. |
| bloom_filter_columns | Список указанных пользователем столбцов, для которых нужно добавить индекс Bloom Filter. Индекс каждого столбца независим, то есть это не составной индекс. Например: `"bloom_filter_columns" = "k1, k2, k3"`. |
| compression | Начиная с версии 4.0.3 для таблиц Doris по умолчанию используется сжатие ZSTD. До версии 4.0.3 по умолчанию использовалось LZ4F. |
| function_column.sequence_col | В модели Unique Key можно задать столбец Sequence. Если значения столбцов Key совпадают, операция REPLACE выполняется по столбцу Sequence: большее значение заменяет меньшее, иначе замены не происходит. Свойство `function_column.sequence_col` сопоставляет столбец последовательности с конкретным столбцом таблицы целочисленного типа либо типа даты и времени (DATE, DATETIME). После создания тип этого столбца изменить нельзя. Если задано `function_column.sequence_col`, свойство `function_column.sequence_type` игнорируется. |
| function_column.sequence_type | В модели Unique Key можно задать столбец Sequence. Если значения столбцов Key совпадают, операция REPLACE выполняется по столбцу Sequence: большее значение заменяет меньшее, иначе замены не происходит. Здесь нужно указать только тип столбца последовательности — целочисленный либо тип даты и времени. Doris создаст скрытый столбец последовательности. |
| enable_unique_key_merge_on_write | Использует ли таблица Unique реализацию Merge-on-Write. До версии 2.1 это свойство по умолчанию было отключено, а начиная с версии 2.1 включено. |
| light_schema_change | Используется ли оптимизация Light Schema Change. Если задано `true`, добавление и удаление столбцов значений выполняется быстрее и синхронно. Начиная с версии 2.0.0 функция включена по умолчанию. |
| disable_auto_compaction | Отключает ли свойство автоматическую компакцию для этой таблицы. Если задано `true`, фоновый процесс автоматической компакции пропускает все tablets таблицы. |
| enable_duplicate_without_keys_by_default | Если задано `true` и при создании таблицы не указаны Unique, Aggregate или Duplicate, по умолчанию создаётся таблица модели Duplicate без столбцов сортировки и префиксных индексов. |
| skip_write_index_on_load | Откладывается ли запись индексов при загрузке данных в эту таблицу. Если задано `true`, при загрузке данных индексы не записываются (сейчас это действует только для инвертированных индексов), а создаются во время компакции. Это помогает избежать повторных затрат CPU и IO на запись индексов при первой записи и компакции и повышает производительность загрузки с высокой пропускной способностью. |
| compaction_policy | Настраивает политику компакции таблицы; поддерживаются только time_series или size_basedtime_series: когда объём rowsets на диске достигает определённого размера, выполняется слияние версий. Объединённый rowset сразу переходит на этап base compaction. Это уменьшает увеличение объёма записи при compact в сценариях непрерывной загрузки. Выполнение компакции по этой политике настраивается параметрами с префиксом time_series_compaction. |
| time_series_compaction_goal_size_mbytes | Если политика компакции — time_series, параметр регулирует размер входных файлов для каждой компакции; размер выходного файла сопоставим с размером входного. |
| time_series_compaction_file_count_threshold | Если политика компакции — time_series, параметр задаёт минимальное количество входных файлов для каждой компакции. Компакция запускается, когда количество файлов в tablet превышает это значение. |
| time_series_compaction_time_threshold_seconds | Если политика компакции — time_series, параметр задаёт максимальный интервал между компакциями в секундах: если компакция долго не выполнялась, она будет запущена. |
| time_series_compaction_level_threshold | Если политика компакции — time_series, значение этого параметра по умолчанию равно 1. При значении 2 ранее объединённые сегменты объединяются ещё раз, чтобы их размер достиг time_series_compaction_goal_size_mbytes и количество сегментов уменьшилось. |
| group_commit_interval_ms | Задаёт интервал формирования пакетов Group Commit для таблицы. Единица измерения — ms; значение по умолчанию — 10000ms, то есть 10s. Момент выполнения Group Commit определяется тем, какое из значений — `group_commit_interval_ms` или `group_commit_data_bytes` — будет достигнуто первым. |
| group_commit_data_bytes | Задаёт размер пакета данных Group Commit для таблицы. Единица измерения — байты; значение по умолчанию — 134217728, то есть 128MB. Момент выполнения Group Commit определяется тем, какое из значений — `group_commit_interval_ms` или `group_commit_data_bytes` — будет достигнуто первым. |
| enable_mow_light_delete | Разрешает ли свойство записывать Delete predicate при выполнении операторов Delete в таблицах Unique с Mow. Включение повышает производительность Delete, но частичное обновление столбцов после Delete может привести к ошибкам в данных. Отключение снижает производительность Delete ради корректности данных. Значение по умолчанию — `false`. Свойство можно включить только для таблиц Unique Merge-on-Write. |
| Свойства динамического секционирования | О динамическом секционировании см. [Секционирование данных — динамическое секционирование](../../../../table-design/data-partitioning/dynamic-partitioning). |
| enable_unique_key_skip_bitmap_column | Включает ли свойство [гибкое обновление столбцов](../../../../data-operate/update/partial-column-update.md#flexible-column-update) в таблицах Unique Merge-on-Write. Его можно включить только для таких таблиц. |

#### Дополнительные свойства таблиц OLAP {#additional-olap-table-properties}

| Свойство | Тип значения | По умолчанию | Описание |
| --- | --- | --- | --- |
| `short_key` | Целое число | Вычисляется автоматически | Количество начальных столбцов сортировки, используемых префиксным индексом. Должно быть положительным и не превышать количество столбцов сортировки; столбец VARCHAR может быть только последним из выбранных. |
| `bloom_filter_fpp` | Число с плавающей точкой | `0.05` | Вероятность ложноположительного результата для `bloom_filter_columns` в диапазоне `[0.0001, 0.05]`. Действует только при настроенных столбцах Bloom Filter. См. [Bloom Filter](../../../../table-design/index/bloomfilter.md). |
| `storage_type` | Строка | `COLUMN` | Организация хранения. Допустимо только `COLUMN`. Для дополнительной копии в строковом формате используйте приведённые ниже свойства строкового хранения. |
| `storage_format` | Строка | `V2` | Формат хранения сегментов: `V2`, `V3` или `default` (`V2`). Формат `V3` доступен с версии 4.1.0 и хранит метаданные столбцов отдельно. См. [Формат хранения](../../../../table-design/storage-format.md). |
| `inverted_index_storage_format` | Строка | Конфигурация FE | Формат инвертированного индекса: `V2`, `V3` или `default`; начиная с версии 4.2.0 также поддерживается `SNII`. Если свойство не задано или установлено в `default`, используется конфигурация FE `inverted_index_storage_format`. Начиная с версии 4.1.5 создание новых индексов V1 отклоняется. См. [Инвертированный индекс](../../../../table-design/index/inverted-index/overview.md). |
| `store_row_column` | Булево значение | `false` | Хранит дополнительную копию всех столбцов в строковом формате. Требует `light_schema_change = true`; таблицы Aggregate Key не поддерживаются. См. [Строковое хранение](../../../../table-design/row-store.md). |
| `row_store_columns` | Строка | Не задано | Разделённые запятыми имена существующих столбцов, например `k,v1,v2`, которые нужно хранить в строковом формате. Указание списка включает строковое хранение этих столбцов; таблицы Aggregate Key не поддерживаются. См. [Строковое хранение](../../../../table-design/row-store.md). |
| `row_store_page_size` | Длинное целое число | `16384` | Размер страницы строкового хранения в байтах. Должен быть положительным; округляется вверх до кратного 4096 байтам. |
| `storage_page_size` | Длинное целое число | `65536` | Размер страницы данных столбца в байтах: от `4096` до `10485760`; округляется вверх до кратного 4096 байтам. |
| `storage_dict_page_size` | Длинное целое число | `262144` | Размер страницы словаря в байтах: от `0` до `104857600`; округляется вверх до кратного 4096 байтам. |
| `storage_policy` | Строка | Не задано | Существующая политика удалённого хранения для таблицы в режиме совмещённых вычислений и хранения. Не поддерживается для таблиц Unique Key Merge-on-Write; игнорируется в режиме раздельных вычислений и хранения. См. [Удалённое хранение](../../../../table-design/tiered-storage/remote-storage.md). |
| `storage_vault_name` | Строка | Vault базы данных, затем Vault по умолчанию | Имя Storage Vault в режиме раздельных вычислений и хранения. Vault должен существовать, а пользователь должен иметь для него привилегию `USAGE`. Настройка таблицы имеет приоритет над настройками базы данных и Vault по умолчанию. См. [Управление Storage Vault](../../../../compute-storage-decoupled/managing-storage-vault.md). |
| `file_cache_ttl_seconds` | Длинное целое число | `0` | Продолжительность защиты кэша TTL в секундах в режиме раздельных вычислений и хранения. Значение `0` означает обычное кэширование. Начиная с версии 4.1.4 проверяемый диапазон — от `0` до `4611686018427387903`. Это свойство не задаёт срок хранения данных. См. [Файловый кэш](../../../../compute-storage-decoupled/file-cache/file-cache.md). |
| `estimate_partition_size` | Строка | Не задано | Оценочный несжатый размер одной секции, например `10G`. Используется вместе с `BUCKETS AUTO` для выбора исходного количества бакетов. См. [Распределение по бакетам](../../../../table-design/data-partitioning/data-bucketing.md). |
| `mutable` | Булево значение | `true` | Принимает ли секция загрузку данных. Значение `false` делает её неизменяемой. Настройка на уровне таблицы задаёт значение по умолчанию для её секций. |
| `partition.retention_count` | Целое число | Не задано | Положительное количество исторических секций, сохраняемых в таблице AUTO RANGE PARTITION. Текущие и будущие секции сохраняются. Начиная с версии 4.1.4 свойство нельзя использовать одновременно с включённым динамическим секционированием. См. [Автоматическое секционирование](../../../../table-design/data-partitioning/auto-partitioning.md). |
| `vertical_compaction_num_columns_per_group` | Целое число | `5` | Количество столбцов в группе при вертикальной компакции. Должно быть не меньше `1`. |
| `time_series_compaction_empty_rowsets_threshold` | Длинное целое число | `5` | Минимальное количество последовательных пустых rowsets для приоритетной компакции. Должно быть не меньше `2`; требуется `compaction_policy = time_series`. |
| `group_commit_mode` | Строка | `off_mode` | Режим Group Commit по умолчанию для таблицы: `off_mode`, `sync_mode` или `async_mode`. Поддерживается с версии 4.1.0. Настройки запроса или сеанса имеют приоритет. См. [Group Commit](../../../../data-operate/import/load-best-practices/group-commit-manual.md). |
| `binlog.enable` | Булево значение | `false` | Включает CCR binlog для таблицы. В FE также должна быть включена настройка `enable_feature_binlog`. |
| `binlog.ttl_seconds` | Длинное целое число | `86400` | Порог срока хранения CCR binlog в секундах. |
| `binlog.max_bytes` | Длинное целое число | `9223372036854775807` | Порог размера CCR binlog для удаления устаревших данных, в байтах. |
| `binlog.max_history_nums` | Длинное целое число | `9223372036854775807` | Порог количества исторических записей CCR binlog для удаления устаревших данных. |
| `is_being_synced` | Булево значение | `false` | Обозначает целевую таблицу CCR как синхронизируемую. Если задано `true`, Doris пропускает планирование её динамических секций и игнорирует настройки colocate и политики хранения. Значением свойства должен управлять процесс CCR. |
| `partition.inverted_index_storage_format` | Строка | Не задано | Начиная с версии 4.2.0 задаёт формат для вновь создаваемых секций в режиме раздельных вычислений и хранения: `V2`, `V3` или `SNII`. Требуется настройка FE `enable_partition_inverted_index_storage_format_rollout = true`; если она выключена, свойство игнорируется. Существующие секции не преобразуются. |

Свойства отдельных функций также описаны в разделе [Динамическое секционирование](../../../../table-design/data-partitioning/dynamic-partitioning.md). Свойства `PROPERTIES` индексов и столбцов VARIANT, а также свойства асинхронных материализованных представлений задаются отдельно от перечисленных свойств таблицы. Для настройки автоматического сбора статистики задайте `auto_analyze_policy` через `ALTER TABLE`, как описано в разделе [Статистика](../../../../query-acceleration/optimization-technology-principle/statistics.md).

## Требования к правам доступа {#access-control-requirements}

[Пользователь](../../../../admin-manual/auth/authentication-and-authorization.md), выполняющий эту команду SQL, должен иметь как минимум следующие [привилегии](../../../../admin-manual/auth/authentication-and-authorization.md):

| Привилегия | Объект | Описание |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | База данных | |
| SELECT_PRIV | Таблица, представление | При выполнении CTAS требуется SELECT_PRIV для запрашиваемой таблицы, представления или материализованного представления. |

## Примечания по использованию {#usage-notes}

- В базе данных (Database) не должно быть таблицы (Table) или представления (View) с тем же именем.
- Имена таблиц, столбцов и rollup не должны совпадать с [зарезервированными ключевыми словами](../../../basic-element/reserved-keywords.md).
- CREATE TABLE ... LIKE:
  - Команда применима только к внутренним таблицам Doris.
  - Копируются только явно указанные rollup.
  - Синхронные материализованные представления не копируются.
- CREATE TABLE ... AS SELECT (CTAS):
  - Если псевдоним имени столбца в списке SELECT допустим в качестве имени столбца, определения столбцов в операторе CTAS необязательны. Если их опустить, имена и типы данных столбцов выводятся из базового запроса:

    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
  - Имена также можно явно задать следующим образом:

    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```

- Секционирование и распределение по бакетам
  - Для таблицы необходимо указать столбцы распределения по бакетам, а секции указывать необязательно. Подробнее см. документацию по [секционированию данных](../../../../table-design/data-partitioning/data-bucketing.md).
  - Таблицы Doris могут быть секционированными и несекционированными. Этот признак задаётся при создании таблицы и впоследствии не меняется. Для секционированной таблицы секции можно добавлять и удалять, а для несекционированной добавить секции позже нельзя.
  - После создания таблицы нельзя изменить столбцы секционирования и распределения по бакетам: нельзя изменить их типы, добавить или удалить такие столбцы.
- Динамическое секционирование
  - Динамическое секционирование помогает автоматически управлять секциями. По заданным правилам Doris периодически добавляет новые секции или удаляет старые. Подробнее см. документацию по [динамическому секционированию](../../../../table-design/data-partitioning/dynamic-partitioning.md).
- Автоматическое секционирование
  - Документация по этой функции приведена в разделе [Автоматическое секционирование](../../../../table-design/data-partitioning/auto-partitioning.md).
- Синхронные материализованные представления
  - При создании таблицы можно одновременно создать несколько синхронных материализованных представлений (ROLLUP). Их также можно добавить после создания таблицы. Указание в операторе создания таблицы позволяет создать все такие представления за один раз.
  - Если синхронные материализованные представления созданы вместе с таблицей, при каждой последующей загрузке данных данные для них формируются синхронно. Количество представлений может влиять на производительность загрузки данных.
  - Подробнее см. документацию по [синхронным материализованным представлениям](../../../../query-acceleration/materialized-view/sync-materialized-view.md).
- Индексы
  - При создании таблицы можно создать несколько индексов столбцов. Индексы также можно добавить позже.
  - Если индекс добавляется после создания таблицы и в ней уже есть данные, потребуется перезаписать все данные. Поэтому время создания индекса зависит от текущего объёма данных.


## Примеры {#examples}

### Основные примеры {#basic-examples}

**Модель детальных данных**

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

**Модель агрегации**

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

**Способ распределения по бакетам**

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

**Секционирование по диапазонам**

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

**Секционирование по списку значений**

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

**Носитель хранения и время его использования**

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

**Настройка стратегии перемещения данных таблицы между уровнями хранения с помощью свойства `storage_policy`**

1. Чтобы успешно связать таблицу со стратегией перемещения данных, сначала нужно создать ресурс s3 и политику хранения.

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

**Группа совместного размещения**

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

Эта таблица создаёт секции на 3 дня вперёд и удаляет секции старше 3 дней. Например, если сегодня `2020-01-08`, будут созданы секции `p20200108`, `p20200109`, `p20200110` и `p20200111`. Диапазоны секций:

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
