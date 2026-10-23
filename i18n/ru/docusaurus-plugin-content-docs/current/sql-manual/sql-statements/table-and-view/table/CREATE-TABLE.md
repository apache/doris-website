---
{
    "title": "CREATE TABLE",
    "language": "ru",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "Создание новой таблицы в текущей или указанной базе данных. Таблица может содержать несколько столбцов, а определение каждого столбца включает имя, тип данных,"
}
---

## Описание {#description}

Создаёт новую таблицу в текущей или указанной базе данных. Таблица может содержать несколько столбцов, а определение каждого столбца включает имя, тип данных и следующие необязательные атрибуты:

- Является ли столбец ключевым
- Предусмотрена ли для столбца агрегация
- Является ли столбец вычисляемым
- Обязательно ли значение (NOT NULL)
- Является ли столбец автоинкрементным
- Есть ли значение по умолчанию при вставке
- Есть ли значение по умолчанию при обновлении

Кроме того, эта команда поддерживает следующие варианты:

- CREATE TABLE … AS SELECT (создание таблицы с заполнением данными; также называется CTAS)
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

> Примечание: `ORDER BY` поддерживается начиная с версии 4.1.0

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

Создаёт таблицу и заполняет её данными, возвращаемыми запросом `query`:

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

> Примечание: `ORDER BY` поддерживается начиная с версии 4.1.0

### CREATE TABLE ... LIKE {#create-table--like}

Создаёт новую таблицу с такими же определениями столбцов, как у существующей таблицы, без копирования её данных. Все свойства столбцов копируются в новую таблицу. Если указан список имён `rollup`, соответствующие `rollup` из исходной таблицы также копируются:

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```

## Обязательные параметры {#required-parameters}

**<name>**

> Задаёт идентификатор (то есть имя) таблицы; он должен быть уникальным в базе данных, в которой создаётся таблица.
>
> Идентификатор должен начинаться с буквы (символа любого языка, если включена поддержка имён Unicode) и не может содержать пробелы или специальные символы, если вся строка идентификатора не заключена в обратные кавычки (например, ``My Object``).
>
> В качестве идентификаторов нельзя использовать зарезервированные ключевые слова.
>
> Подробнее см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<col_name>**

> Задаёт идентификатор (то есть имя) столбца. Он должен быть уникальным в создаваемой таблице.
>
> Идентификатор должен начинаться с буквы (символа любого языка, если включена поддержка имён Unicode), цифры или символа `@` и не может содержать пробелы или специальные символы, если вся строка идентификатора не заключена в обратные кавычки (например, ``My Object``).
>
> Подробнее см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<col_type>**

> Задаёт тип данных столбца.
>
> Подробную информацию о типах данных, которые можно указывать для столбцов таблицы, см. в разделе [Типы данных](../../../basic-element/sql-data-types/data-type-overview.md).

**<query>**

> Обязательный параметр CTAS. Задаёт оператор SELECT, который заполняет таблицу данными.

**<source_table>**

> Обязательный параметр CREATE TABLE ... LIKE. Задаёт исходную таблицу для копирования.

## Необязательные параметры {#optional-parameters}

### Параметры модели данных {#data-model-related-parameters}

**<key_type>**

> Модель данных таблицы. Допустимые значения: DUPLICATE (модель детальных данных), UNIQUE (модель первичного ключа), AGGREGATE (модель агрегации). Подробную информацию о моделях данных см. в разделе [Модель данных](../../../../table-design/data-model/intro.mdx).

**<key_cols>**

> Ключевые столбцы таблицы. В Doris ключевыми должны быть первые K столбцов таблицы. Данные внутри одного tablet хранятся в порядке, определяемом этими столбцами. Ограничения для ключей и рекомендации по выбору ключевых столбцов см. в подразделах раздела [Модель данных](../../../../table-design/data-model/intro.mdx).

**<cluster_cols>**

> Столбцы локальной сортировки данных; могут использоваться только с моделью данных UNIQUE (моделью первичного ключа). Если указан `<cluster_cols>`, данные сортируются по `<cluster_cols>`, а не по `<key_cols>`.

**<col_aggregate_type>**

> Способ агрегации столбца. Может использоваться только для таблиц с моделью агрегации. Подробную информацию о способах агрегации см. в разделе [Модель агрегации](../../../../table-design/data-model/aggregate.md).

### Параметры распределения по бакетам {#bucketing-related-parameters}

**<distribute_cols> и <bucket_count>**

> Столбцы распределения по бакетам и количество бакетов. В модели детальных данных для распределения по бакетам можно использовать любые столбцы; в моделях агрегации и первичного ключа столбцы распределения по бакетам должны входить в состав ключевых столбцов. Количество бакетов может быть любым положительным целым числом. Подробнее о распределении по бакетам см. в разделах [Ручная настройка бакетов](../../../../table-design/data-partitioning/data-bucketing#1-manually-set-the-number-of-buckets) и [Автоматическая настройка бакетов](../../../../table-design/data-partitioning/data-bucketing#2-automatically-set-the-number-of-buckets).

### Параметры значений столбцов по умолчанию {#column-default-value-related-parameters}

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> Вычисляемый столбец. Использует столбцы, расположенные перед текущим, для формирования данных текущего столбца с помощью выражения `<col_generate_expression>`. Вычисляемый столбец представляет собой особый тип столбца таблицы базы данных: его значение вычисляется на основе значений других столбцов, а не вставляется или обновляется непосредственно пользователем. Эта функция позволяет заранее вычислять результаты выражений и хранить их в базе данных, что удобно при частом выполнении запросов или сложных вычислений.

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> При загрузке данных Doris присваивает уникальное в пределах таблицы значение тем строкам, в которых не указано значение автоинкрементного столбца. `<col_auto_increment_start_value>` задаёт начальное значение автоинкрементного столбца. Подробнее см. в разделе [Автоинкрементные столбцы](../../../../table-design/auto-increment.md).

**DEFAULT <col_default_value>**

> Значение столбца по умолчанию. Оно используется, если при записи этот столбец не указан. Если значение по умолчанию явно не задано, используется NULL. Доступны следующие значения по умолчанию:
>
> - NULL: доступно для всех типов; в качестве значения по умолчанию используется NULL.
> - Числовые литералы: могут использоваться только для числовых типов.
> - Строковые литералы: используются для строковых столбцов; столбцы UUID также принимают корректные текстовые значения UUID по умолчанию.
> - UUID_V4() / UUID_V7(): динамические значения по умолчанию для столбцов UUID, включая их псевдонимы. Если столбец не указан, значение генерируется для каждой строки. См. раздел [Тип UUID](../../../basic-element/sql-data-types/uuid.md).
> - CURRENT_DATE: может использоваться только для типов даты. В качестве значения по умолчанию используется текущая дата.
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]: может использоваться только для типов `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`. В качестве значения по умолчанию используется текущая временная метка. `<defaultValuePrecision>` позволяет задать точность времени; `TIMESTAMP_NS` поддерживает до 9 знаков.
> - PI: может использоваться только для типов double. В качестве значения по умолчанию используется число пи.
> - E: может использоваться только для типов double. В качестве значения по умолчанию используется математическая константа e.
> - BITMAP_EMPTY: может использоваться только для столбца типа bitmap. Заполняет его пустым bitmap.

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> Если при обновлении данных значение этого столбца не указано, для обновления данных в нём используется текущая временная метка. Может использоваться только в таблицах с моделью UNIQUE (моделью первичного ключа).

### Параметры индексов {#index-related-parameters}

**<index_name>**

> Задаёт идентификатор (то есть имя) индекса. Он должен быть уникальным в создаваемой таблице. Подробнее об идентификаторах см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<index_cols>**

> Список столбцов, для которых нужно добавить индекс. Столбцы должны существовать в таблице.

**<index_type>**

> Тип индекса. В настоящее время поддерживается только INVERTED.

**<index_property>**

> Свойства индекса. Подробные пояснения см. в разделе [Инвертированный индекс](../../../../table-design/index/inverted-index/overview.md).

### Параметры автоматического секционирования {#auto-partition-related-parameters}

Подробное описание секционирования см. в разделе [Автоматическое секционирование](../../../../table-design/data-partitioning/auto-partitioning.md).

### Параметры ручного секционирования {#manual-partitioning-related-parameters}

Подробное описание секционирования см. в разделе «Ручное секционирование».

**<partition_type>**

> Doris поддерживает секционирование RANGE и LIST. Подробнее см. в разделе [Ручное секционирование](../../../../table-design/data-partitioning/manual-partitioning.md).

**<partition_name>**

> Идентификатор (то есть имя) секции. Он должен быть уникальным в создаваемой таблице. Подробнее об идентификаторах см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**VALUES LESS THAN <partition_value_list>**

> Секционирование RANGE. Диапазон данных секции простирается от нижней границы до `<partition_value_list>`.
>
> Если `<partition_value_list>` обозначает верхнюю границу, его можно упростить до `MAX_VALUE`.
>
> Формат `<partition_value_list>`: `((col_1_value, ...), (col_1_value, ...), ...)`

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> Секционирование RANGE. Диапазон данных секции простирается от `<partition_lower_bound>` до `<partition_upper_bound>`. Создаётся только одна секция.
>
> Формат `<partition_lower_bound>` и `<partition_upper_bound>`: `(col_1_value, ...)`

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> Секционирование RANGE. Диапазон данных секций простирается от `<partition_lower_bound>` до `<partition_value_list>`. Секция создаётся через каждые `<n>`.
>
> Формат `<partition_lower_bound>` и `<partition_upper_bound>`: `(col_1_value, ...)`

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> Секционирование LIST. Строки, в которых значение столбца секционирования равно `<partition_value>`, относятся к этой секции.
>
> Формат `<partition_value>`: `(col_1_value, ...)`


### Параметры синхронных материализованных представлений {#synchronized-materialized-view-related}

:::caution Примечание
Возможности создания синхронных материализованных представлений с помощью rollup ограничены, и этот способ больше не рекомендуется. Для создания синхронных материализованных представлений рекомендуется использовать отдельные операторы. Подробнее см. описание оператора [CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) и раздел [Синхронное материализованное представление](../../../../query-acceleration/materialized-view/sync-materialized-view.md).
:::

**<rollup_name>**

> Идентификатор (то есть имя) синхронного материализованного представления. Он должен быть уникальным в создаваемой таблице. Подробнее об идентификаторах см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<rollup_cols>**

> Столбцы, включённые в синхронное материализованное представление.

### Параметры свойств таблицы {#table-property-related-parameters}

**<table_property>**

| Имя свойства | Назначение |
| :------------ | :-------- |
| replication_num | Количество реплик. По умолчанию количество реплик равно 3. Если количество узлов BE меньше 3, необходимо указать количество реплик, не превышающее количество узлов BE. Начиная с версии, следующей за 0.15, это свойство автоматически преобразуется в свойство `replication_allocation`; например, `"replication_num" = "3"` автоматически преобразуется в `"replication_allocation" = "tag.location.default:3"`. |
| replication_allocation | Задаёт распределение реплик на основе Tags. Это свойство может полностью заменить функциональность свойства `replication_num`. |
| min_load_replica_num | Задаёт минимальное количество реплик, необходимое для успешной загрузки данных; значение по умолчанию равно -1. Если значение этого свойства меньше или равно 0, для успешной загрузки данных по-прежнему требуется успешная запись в большинство реплик. |
| storage_medium | Задаёт начальный носитель хранения данных таблицы. |
| storage_cooldown_time | Задаёт время окончания использования начального носителя хранения данных таблицы. После этого времени данные автоматически переносятся на носитель хранения первого уровня. |
| colocate_with | Если требуется функция Colocation Join, используйте этот параметр, чтобы задать Colocation Group. |
| bloom_filter_columns | Заданный пользователем список имён столбцов, для которых нужно добавить индекс Bloom Filter. Индекс Bloom Filter для каждого столбца независим и не является составным. Например: `"bloom_filter_columns" = "k1, k2, k3"` |
| compression | Начиная с версии 4.0.3, методом сжатия по умолчанию для таблиц Doris является ZSTD. До версии 4.0.3 методом сжатия по умолчанию был LZ4F. |
| function_column.sequence_col | При использовании модели Unique Key можно указать столбец Sequence. При совпадении ключевых столбцов операция REPLACE выполняется в соответствии со столбцом Sequence (большее значение заменяет меньшее; в противном случае замена невозможна). `function_column.sequence_col` используется для сопоставления столбца последовательности с конкретным столбцом таблицы, который может иметь целочисленный тип или тип даты и времени (`DATE`, `DATETIME`, `TIMESTAMP_NS`). Тип этого столбца нельзя изменить после создания. Если задано свойство `function_column.sequence_col`, свойство `function_column.sequence_type` игнорируется. |
| function_column.sequence_type | При использовании модели Unique Key можно указать столбец Sequence. При совпадении ключевых столбцов операция REPLACE выполняется в соответствии со столбцом Sequence (большее значение заменяет меньшее; в противном случае замена невозможна). Здесь нужно указать только тип столбца последовательности; поддерживаются типы даты и времени (`DATE`, `DATETIME`, `TIMESTAMP_NS`) или целые числа. Doris создаст скрытый столбец последовательности. |
| enable_unique_key_merge_on_write | Определяет, использует ли таблица Unique реализацию Merge-on-Write. До версии 2.1 это свойство было отключено по умолчанию, а начиная с версии 2.1 оно включено по умолчанию. |
| light_schema_change | Определяет, используется ли оптимизация Light Schema Change. Если задано значение `true`, операции добавления и удаления столбцов значений выполняются быстрее и синхронно. Эта функция включена по умолчанию в версиях 2.0.0 и более поздних. |
| disable_auto_compaction | Определяет, отключена ли автоматическая компактация для этой таблицы. Если это свойство имеет значение `true`, фоновый процесс автоматической компактации пропускает все tablet этой таблицы. |
| enable_duplicate_without_keys_by_default | Если задано значение `true` и при создании таблицы не указано Unique, Aggregate или Duplicate, по умолчанию создаётся таблица модели Duplicate без столбцов сортировки и префиксных индексов. |
| skip_write_index_on_load | Определяет, следует ли пропускать запись индексов при загрузке данных в эту таблицу. Если это свойство имеет значение `true`, индексы не записываются во время загрузки данных (в настоящее время действует только для инвертированных индексов), а их запись откладывается до компактации. Это позволяет избежать затрат ресурсов CPU и IO на повторную запись индексов при первоначальной записи и компактации, повышая производительность загрузки с высокой пропускной способностью. |
| compaction_policy | Настраивает политику слияния при компактации для этой таблицы; поддерживаются только time_series или size_basedtime_series: когда объём rowset на диске достигает определённого размера, выполняется слияние версий. Объединённый rowset сразу переводится на этап базовой компактации. Это эффективно снижает усиление записи при компактации в сценариях непрерывной загрузки. Для настройки выполнения компактации эта политика использует параметры с префиксом time_series_compaction. |
| time_series_compaction_goal_size_mbytes | Если политика слияния при компактации имеет значение time_series, этот параметр позволяет настроить размер входных файлов для каждой компактации; размер выходного файла сопоставим с размером входных данных. |
| time_series_compaction_file_count_threshold | Если политика слияния при компактации имеет значение time_series, этот параметр позволяет настроить минимальное количество входных файлов для каждой компактации. Если количество файлов в tablet превышает заданное значение, запускается компактация. |
| time_series_compaction_time_threshold_seconds | Если политика слияния при компактации имеет значение time_series, этот параметр позволяет настроить максимальный интервал между компактациями в секундах: если компактация долго не выполнялась, она будет запущена. |
| time_series_compaction_level_threshold | Если политика слияния при компактации имеет значение time_series, значение этого параметра по умолчанию равно 1. При значении 2 параметр управляет повторным слиянием уже объединённых сегментов, чтобы их размер достигал time_series_compaction_goal_size_mbytes, что позволяет сократить количество сегментов. |
| group_commit_interval_ms | Настраивает интервал пакетной записи Group Commit для этой таблицы. Единица измерения — мс; значение по умолчанию составляет 10000 мс, то есть 10 с. Момент выполнения Group Commit зависит от того, какой из параметров, `group_commit_interval_ms` или `group_commit_data_bytes`, первым достигнет заданного значения. |
| group_commit_data_bytes | Настраивает размер пакета данных Group Commit для этой таблицы. Единица измерения — байты; значение по умолчанию составляет 134217728, то есть 128 МБ. Момент выполнения Group Commit зависит от того, какой из параметров, `group_commit_interval_ms` или `group_commit_data_bytes`, первым достигнет заданного значения. |
| enable_mow_light_delete | Определяет, разрешена ли запись предиката Delete операторами Delete в таблицах Unique с Mow. Включение повышает производительность операторов Delete, однако частичные обновления столбцов после Delete могут приводить к ошибкам в данных. Отключение снижает производительность операторов Delete, обеспечивая корректность данных. Значение этого свойства по умолчанию — `false`. Свойство можно включить только для таблиц Unique Merge-on-Write. |
| Свойства динамического секционирования | Информацию о динамическом секционировании см. в разделе [Секционирование данных — Динамическое секционирование](../../../../table-design/data-partitioning/dynamic-partitioning) |
| enable_unique_key_skip_bitmap_column | Определяет, включена ли [функция гибкого обновления столбцов](../../../../data-operate/update/partial-column-update.md#flexible-column-update) в таблицах Unique Merge-on-Write. Это свойство можно включить только для таблиц Unique Merge-on-Write. |
| changelog.enable | Включает [changelog](../../../../data-operate/incremental/changelog) для таблицы, чтобы записывать изменения на уровне строк для чтения через Table Stream и выполнения инкрементальных запросов `@incr`. Поддерживаются только таблицы Duplicate Key и таблицы Unique Key Merge-on-Write (без ключей кластеризации). Можно включить только при создании таблицы; впоследствии отключить нельзя. Нельзя использовать совместно с `binlog.enable` (CCR). На FE требуется установить `enable_feature_changelog = true`. Доступно начиная с версии 5.0.0. |
| changelog.need_historical_value | Определяет, записывает ли changelog значения до изменения (образ до изменения); значение по умолчанию — `false`. Установить значение `true` можно только для таблиц Unique Key Merge-on-Write; от этого свойства зависят Table Stream в режимах `min_delta` / `detail`. Нельзя изменить после создания. |
| changelog.ttl_seconds | Срок хранения записей об изменениях в секундах; значение по умолчанию — `86400` (один день); должно быть больше `0`. Можно изменить с помощью `ALTER TABLE`. |

## Требования к управлению доступом {#access-control-requirements}

[Пользователь](../../../../admin-manual/auth/authentication-and-authorization.md), выполняющий эту команду SQL, должен иметь как минимум следующие [привилегии](../../../../admin-manual/auth/authentication-and-authorization.md):

| Привилегия | Объект | Описание |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | База данных | |
| SELECT_PRIV | Таблица, представление | При выполнении CTAS требуется привилегия SELECT_PRIV на таблицу, представление или материализованное представление, к которому выполняется запрос |

## Примечания по использованию {#usage-notes}

- База данных (Database) не должна содержать таблицы (Table) или представления (View) с таким же именем.
- В именах таблиц, столбцов и rollup нельзя использовать [зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).
- CREATE TABLE ... LIKE:
  - Эту команду можно использовать только для внутренних таблиц Doris.
  - Копируются только явно указанные rollup.
  - Синхронные материализованные представления не копируются.
- CREATE TABLE ... AS SELECT (CTAS):
  - Если псевдоним имени столбца в списке SELECT является допустимым именем столбца, определения столбцов в операторе CTAS не требуются; если они опущены, имена столбцов и типы данных определяются на основе исходного запроса:
      
    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
  - Также можно явно указать имена с помощью следующего синтаксиса:
    
    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```

- Секционирование и распределение по бакетам
  - Для таблицы необходимо указать столбцы распределения по бакетам, а секции можно не задавать. Подробную информацию о секционировании и распределении по бакетам см. в документации [Секционирование данных](../../../../table-design/data-partitioning/data-bucketing.md).
  - Таблицы в Doris могут быть секционированными или несекционированными. Это свойство определяется при создании таблицы и впоследствии не может быть изменено. То есть у секционированных таблиц можно добавлять или удалять секции при дальнейшем использовании, а в несекционированные таблицы добавить секции позже нельзя.
  - Столбцы секционирования и распределения по бакетам нельзя изменять после создания таблицы: нельзя менять их типы, а также добавлять или удалять эти столбцы.
- Динамическое секционирование
  - Функция динамического секционирования предназначена прежде всего для автоматического управления секциями. На основе заданных правил система Doris периодически добавляет новые секции или удаляет старые. Дополнительную информацию см. в документации [Динамическое секционирование](../../../../table-design/data-partitioning/dynamic-partitioning.md).
- Автоматическое секционирование
  - Документация по автоматическому секционированию приведена в разделе [Автоматическое секционирование](../../../../table-design/data-partitioning/auto-partitioning.md).
- Синхронные материализованные представления
  - При создании таблицы можно создать несколько синхронных материализованных представлений (ROLLUP). Их также можно добавить после создания таблицы. Включение представлений в оператор создания таблицы позволяет создать все синхронные материализованные представления за один раз.
  - Если синхронные материализованные представления создаются одновременно с таблицей, все последующие операции загрузки данных будут синхронно формировать данные для этих представлений. Количество материализованных представлений может влиять на эффективность загрузки данных.
  - Введение в материализованные представления см. в документации [Синхронные материализованные представления](../../../../query-acceleration/materialized-view/sync-materialized-view.md).
- Индексы
  - При создании таблицы можно создать несколько индексов по столбцам. Индексы также можно добавить после создания таблицы.
  - Если индексы добавляются при дальнейшем использовании таблицы, в которой уже есть данные, все данные потребуется перезаписать; поэтому время создания индекса зависит от текущего объёма данных.


## Примеры {#examples}

### Базовые примеры {#basic-examples}

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

**Модель первичного ключа**

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

**Секционирование по спискам**

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

**Носитель хранения и время переноса данных**

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

**Настройка стратегии миграции данных таблицы между горячим и холодным уровнями хранения с помощью свойства `storage_policy`**

1. Чтобы связать таблицу со стратегией миграции, сначала необходимо создать ресурс s3 и политику хранения.

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

В этой таблице секции создаются на 3 дня вперёд, а секции за 3 дня до текущей даты удаляются. Например, если сегодня `2020-01-08`, будут созданы секции с именами `p20200108`, `p20200109`, `p20200110`, `p20200111`. Диапазоны секций будут следующими:

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
