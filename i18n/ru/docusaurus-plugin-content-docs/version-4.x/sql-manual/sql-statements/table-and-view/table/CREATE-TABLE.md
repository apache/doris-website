---
{
    "title": "CREATE TABLE",
    "language": "ru",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "Создает новую таблицу в текущей или указанной базе данных. Таблица может содержать несколько столбцов, а определение каждого столбца включает имя, тип данных,"
}
---

## Описание {#description}

Создает новую таблицу в текущей или указанной базе данных. Таблица может содержать несколько столбцов, а определение каждого столбца включает имя, тип данных и следующие необязательные атрибуты:

- Является ли столбец ключевым
- Имеет ли столбец семантику агрегации
- Является ли столбец вычисляемым
- Обязательно ли значение столбца (NOT NULL)
- Является ли столбец автоинкрементным
- Есть ли значение по умолчанию при вставке
- Есть ли значение по умолчанию при обновлении

Кроме того, команда поддерживает следующие варианты:

- CREATE TABLE … AS SELECT (создает таблицу и заполняет ее данными; также называется CTAS)
- CREATE TABLE … LIKE (создает пустую копию существующей таблицы)

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

Создает таблицу и заполняет ее данными, возвращаемыми запросом `query`:

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

Создает новую таблицу с такими же определениями столбцов, как у существующей таблицы, без копирования ее данных. Все свойства столбцов копируются в новую таблицу. Если указан список имен `rollup`, соответствующие `rollup` исходной таблицы также копируются:

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```

## Обязательные параметры {#required-parameters}

**<name>**

> Задает идентификатор (то есть имя) таблицы; он должен быть уникальным в базе данных, в которой создается таблица.
>
> Идентификатор должен начинаться с буквы (символа любого языка, если включена поддержка имен Unicode) и не может содержать пробелы или специальные символы, если вся строка идентификатора не заключена в обратные кавычки (например, ``My Object``).
>
> В качестве идентификаторов нельзя использовать зарезервированные ключевые слова.
>
> Подробнее см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<col_name>**

> Задает идентификатор (то есть имя) столбца. Он должен быть уникальным в создаваемой таблице.
>
> Идентификатор должен начинаться с буквы (символа любого языка, если включена поддержка имен Unicode), цифры или символа `@` и не может содержать пробелы или специальные символы, если вся строка идентификатора не заключена в обратные кавычки (например, ``My Object``).
>
> Подробнее см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<col_type>**

> Задает тип данных столбца.
>
> Подробнее о типах данных, которые можно задать для столбцов таблицы, см. в разделе [Типы данных](../../../basic-element/sql-data-types/data-type-overview.md).

**<query>**

> Обязательный параметр CTAS. Задает оператор SELECT, который используется для заполнения таблицы данными.

**<source_table>**

> Обязательный параметр CREATE TABLE ... LIKE. Задает исходную таблицу для копирования.

## Необязательные параметры {#optional-parameters}

### Параметры модели данных {#data-model-related-parameters}

**<key_type>**

> Модель данных таблицы. Допустимые значения: DUPLICATE (модель детальных данных), UNIQUE (модель первичного ключа), AGGREGATE (модель агрегации). Подробнее о моделях данных см. в разделе [Модель данных](../../../../table-design/data-model/intro.mdx).

**<key_cols>**

> Ключевые столбцы таблицы. В Doris ключевыми должны быть первые K столбцов таблицы. Данные в каждом tablet хранятся в порядке, заданном этими столбцами. Об ограничениях на ключи и выборе ключевых столбцов см. в подразделах раздела [Модель данных](../../../../table-design/data-model/intro.mdx).

**<cluster_cols>**

> Столбцы локальной сортировки данных; могут использоваться только с моделью данных UNIQUE (модель первичного ключа). Если указан параметр `<cluster_cols>`, данные сортируются по `<cluster_cols>` вместо `<key_cols>`.

**<col_aggregate_type>**

> Метод агрегации столбца. Может использоваться только для таблиц с моделью агрегации. Подробнее о методах агрегации см. в разделе [Модель агрегации](../../../../table-design/data-model/aggregate.md).

### Параметры бакетирования {#bucketing-related-parameters}

**<distribute_cols> и <bucket_count>**

> Столбцы бакетирования и количество бакетов. В модели детальных данных для бакетирования можно использовать любые столбцы; в модели агрегации и модели первичного ключа столбцы бакетирования должны соответствовать ключевым столбцам. Количество бакетов может быть любым положительным целым числом. Подробнее о бакетировании см. в разделах [Ручное бакетирование](../../../../table-design/data-partitioning/data-bucketing#1-manually-set-the-number-of-buckets) и [Автоматическое бакетирование](../../../../table-design/data-partitioning/data-bucketing#2-automatically-set-the-number-of-buckets).

### Параметры значений столбцов по умолчанию {#column-default-value-related-parameters}

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> Вычисляемый столбец. Использует столбцы, расположенные перед текущим, для вычисления данных текущего столбца с помощью выражения `<col_generate_expression>`. Вычисляемый столбец — это особый тип столбца таблицы базы данных, значение которого рассчитывается на основе значений других столбцов, а не вставляется или обновляется пользователем напрямую. Эта функция позволяет предварительно вычислять результаты выражений и сохранять их в базе данных, что подходит для сценариев с частыми запросами или сложными вычислениями.

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> При импорте данных Doris назначает уникальное в пределах таблицы значение автоинкрементному столбцу в тех строках, для которых оно не указано. Параметр `<col_auto_increment_start_value>` задает начальное значение автоинкрементного столбца. Подробнее об автоинкрементных столбцах см. в разделе [Автоинкрементные столбцы](../../../../table-design/auto-increment.md).

**DEFAULT <col_default_value>**

> Значение столбца по умолчанию. Используется при записи, если этот столбец не указан. Если значение по умолчанию не задано явно, используется NULL. Допустимые значения по умолчанию:
>
> - NULL: доступно для всех типов; в качестве значения по умолчанию используется NULL.
> - Числовые литералы: могут использоваться только для числовых типов.
> - Строковые литералы: могут использоваться только для строковых типов.
> - CURRENT_DATE: может использоваться только для типов даты. В качестве значения по умолчанию используется текущая дата.
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]: может использоваться только для типов даты и времени. В качестве значения по умолчанию используется текущая временная метка. Параметр `<defaultValuePrecision>` позволяет задать точность времени.
> - PI: может использоваться только для типов double. В качестве значения по умолчанию используется число пи.
> - E: может использоваться только для типов double. В качестве значения по умолчанию используется математическая константа e.
> - BITMAP_EMPTY: может использоваться только для столбца типа bitmap. Заполняет его пустым bitmap.

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> При обновлении данных, если значение этого столбца не указано, для обновления данных в нем используется текущая временная метка. Может использоваться только в таблицах UNIQUE (модель первичного ключа).

### Параметры индексов {#index-related-parameters}

**<index_name>**

> Задает идентификатор (то есть имя) индекса. Он должен быть уникальным в создаваемой таблице. Подробнее об идентификаторах см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<index_cols>**

> Список столбцов, для которых создается индекс. Эти столбцы должны существовать в таблице.

**<index_type>**

> Тип индекса. В настоящее время поддерживается только INVERTED.

**<index_property>**

> Свойства индекса. Подробное описание см. в разделе [Инвертированный индекс](../../../../table-design/index/inverted-index/overview.md).

### Параметры автоматического партиционирования {#auto-partition-related-parameters}

Подробное введение в партиционирование см. в разделе [Автоматическое партиционирование](../../../../table-design/data-partitioning/auto-partitioning.md).

### Параметры ручного партиционирования {#manual-partitioning-related-parameters}

Подробное введение в партиционирование см. в разделе «Ручное партиционирование».

**<partition_type>**

> Doris поддерживает партиционирование RANGE и LIST. Подробнее см. в разделе [Ручное партиционирование](../../../../table-design/data-partitioning/manual-partitioning.md).

**<partition_name>**

> Идентификатор (то есть имя) партиции. Он должен быть уникальным в создаваемой таблице. Подробнее об идентификаторах см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**VALUES LESS THAN <partition_value_list>**

> Партиционирование RANGE. Диапазон данных партиции — от нижней границы до `<partition_value_list>`.
>
> Если `<partition_value_list>` обозначает верхнюю границу, его можно заменить на `MAX_VALUE`.
>
> Формат `<partition_value_list>`: `((col_1_value, ...), (col_1_value, ...), ...)`

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> Партиционирование RANGE. Диапазон данных партиции — от `<partition_lower_bound>` до `<partition_upper_bound>`. Создается только одна партиция.
>
> Формат `<partition_lower_bound>` и `<partition_upper_bound>`: `(col_1_value, ...)`

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> Партиционирование RANGE. Диапазон данных партиции — от `<partition_lower_bound>` до `<partition_value_list>`. Партиции создаются с интервалом `<n>`.
>
> Формат `<partition_lower_bound>` и `<partition_upper_bound>`: `(col_1_value, ...)`

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> Партиционирование LIST. Строки, в которых значение столбца партиционирования равно `<partition_value>`, принадлежат этой партиции.
>
> Формат `<partition_value>`: `(col_1_value, ...)`


### Параметры синхронных материализованных представлений {#synchronized-materialized-view-related}

:::caution Примечание
Возможности создания синхронных материализованных представлений с помощью rollup ограничены, и этот способ больше не рекомендуется. Для создания синхронных материализованных представлений рекомендуется использовать отдельные операторы. Подробнее см. в описании оператора [CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) и в разделе [Синхронное материализованное представление](../../../../query-acceleration/materialized-view/sync-materialized-view.md).
:::

**<rollup_name>**

> Идентификатор (то есть имя) синхронного материализованного представления. Он должен быть уникальным в создаваемой таблице. Подробнее об идентификаторах см. в разделах [Требования к идентификаторам](../../../basic-element/object-identifiers.md) и [Зарезервированные ключевые слова](../../../basic-element/reserved-keywords.md).

**<rollup_cols>**

> Столбцы, включенные в синхронное материализованное представление.

### Параметры свойств таблицы {#table-property-related-parameters}

**<table_property>**

| Имя свойства | Назначение |
| :------------ | :-------- |
| replication_num | Количество реплик. По умолчанию количество реплик равно 3. Если узлов BE меньше 3, необходимо указать количество реплик, не превышающее количество узлов BE. Начиная с версии 0.15 это свойство автоматически преобразуется в свойство `replication_allocation`, например, `"replication_num" = "3"` автоматически преобразуется в `"replication_allocation" = "tag.location.default:3"`. |
| replication_allocation | Задает распределение реплик на основе тегов. Это свойство может полностью заменить функциональность свойства `replication_num`. |
| min_load_replica_num | Задает минимальное количество реплик, необходимых для успешного импорта данных; значение по умолчанию — -1. Если значение этого свойства меньше или равно 0, для успешного импорта данных по-прежнему требуется успешная запись в большинство реплик. |
| storage_medium | Задает начальный носитель хранения данных таблицы. |
| storage_cooldown_time | Задает срок использования начального носителя хранения данных таблицы. По истечении этого срока данные автоматически переносятся на носитель хранения первого уровня. |
| colocate_with | Если требуется функция Colocation Join, используйте этот параметр для задания Colocation Group. |
| bloom_filter_columns | Заданный пользователем список имен столбцов, для которых необходимо добавить индекс Bloom Filter. Индекс Bloom Filter каждого столбца независим и не является составным индексом. Например: `"bloom_filter_columns" = "k1, k2, k3"` |
| compression | Начиная с версии 4.0.3 метод сжатия таблиц Doris по умолчанию — ZSTD. До версии 4.0.3 методом сжатия по умолчанию был LZ4F. |
| function_column.sequence_col | При использовании модели Unique Key можно задать столбец Sequence. При совпадении ключевых столбцов операция REPLACE выполняется в соответствии со столбцом Sequence (большее значение заменяет меньшее; в противном случае замена невозможна). `function_column.sequence_col` используется для сопоставления столбца последовательности с конкретным столбцом таблицы, который может иметь целочисленный тип или тип даты/времени (DATE, DATETIME). После создания тип этого столбца изменить нельзя. Если задано свойство `function_column.sequence_col`, свойство `function_column.sequence_type` игнорируется. |
| function_column.sequence_type | При использовании модели Unique Key можно задать столбец Sequence. При совпадении ключевых столбцов операция REPLACE выполняется в соответствии со столбцом Sequence (большее значение заменяет меньшее; в противном случае замена невозможна). Здесь достаточно указать тип столбца последовательности; поддерживаются типы даты/времени и целочисленные типы. Doris создаст скрытый столбец последовательности. |
| enable_unique_key_merge_on_write | Определяет, использует ли таблица Unique реализацию Merge-on-Write. До версии 2.1 это свойство было отключено по умолчанию, а начиная с версии 2.1 включено по умолчанию. |
| light_schema_change | Определяет, используется ли оптимизация Light Schema Change. При значении `true` операции добавления и удаления столбцов значений выполняются быстрее и синхронно. Эта функция включена по умолчанию в версиях 2.0.0 и более поздних. |
| disable_auto_compaction | Определяет, отключена ли автоматическая компактация для этой таблицы. При значении `true` фоновый процесс автоматической компактации пропускает все tablet этой таблицы. |
| enable_duplicate_without_keys_by_default | При значении `true`, если при создании таблицы не указан тип Unique, Aggregate или Duplicate, по умолчанию создается таблица модели Duplicate без столбцов сортировки и префиксных индексов. |
| skip_write_index_on_load | Определяет, откладывается ли запись индексов при импорте данных в эту таблицу. При значении `true` индексы не записываются во время импорта данных (в настоящее время это действует только для инвертированных индексов); их запись откладывается до компактации. Это позволяет избежать повторных затрат ресурсов CPU и IO на запись индексов при первоначальной записи и компактации, повышая производительность импорта с высокой пропускной способностью. |
| compaction_policy | Настраивает политику слияния при компактации для этой таблицы; поддерживаются только time_series или size_basedtime_series: когда общий объем наборов строк на диске достигает определенного размера, выполняется слияние версий. Объединенный набор строк сразу переводится на этап базовой компактации. Это эффективно снижает усиление записи при компактации в сценариях с непрерывным импортом. Для настройки выполнения компактации эта политика использует параметры с префиксом time_series_compaction. |
| time_series_compaction_goal_size_mbytes | Если политика слияния при компактации — time_series, этот параметр используется для настройки размера входных файлов каждой компактации; размер выходного файла сопоставим с размером входных данных. |
| time_series_compaction_file_count_threshold | Если политика слияния при компактации — time_series, этот параметр используется для настройки минимального количества входных файлов каждой компактации. Если количество файлов в tablet превышает это значение, запускается компактация. |
| time_series_compaction_time_threshold_seconds | Если политика слияния при компактации — time_series, этот параметр используется для настройки максимального интервала между компактациями в секундах: если компактация долго не выполнялась, она запускается. |
| time_series_compaction_level_threshold | Если политика слияния при компактации — time_series, значение этого параметра по умолчанию равно 1. При значении 2 он управляет повторным слиянием уже объединенных сегментов, чтобы размер сегмента достигал time_series_compaction_goal_size_mbytes, сокращая количество сегментов. |
| group_commit_interval_ms | Задает интервал пакетной обработки Group Commit для этой таблицы. Единица измерения — ms, значение по умолчанию — 10000ms, то есть 10s. Момент выполнения Group Commit зависит от того, какой из параметров `group_commit_interval_ms` и `group_commit_data_bytes` первым достигнет заданного значения. |
| group_commit_data_bytes | Задает объем данных пакета Group Commit для этой таблицы. Единица измерения — байты, значение по умолчанию — 134217728, то есть 128MB. Момент выполнения Group Commit зависит от того, какой из параметров `group_commit_interval_ms` и `group_commit_data_bytes` первым достигнет заданного значения. |
| enable_mow_light_delete | Определяет, включена ли запись предиката Delete при выполнении операторов Delete в таблицах Unique с Mow. Включение повышает производительность операторов Delete, но частичные обновления столбцов после Delete могут приводить к ошибкам в данных. Отключение снижает производительность операторов Delete, обеспечивая корректность. Значение этого свойства по умолчанию — `false`. Это свойство можно включить только для таблиц Unique Merge-on-Write. |
| Свойства динамического партиционирования | О динамическом партиционировании см. в разделе [Партиционирование данных — динамическое партиционирование](../../../../table-design/data-partitioning/dynamic-partitioning) |
| enable_unique_key_skip_bitmap_column | Определяет, включена ли [функция гибкого обновления столбцов](../../../../data-operate/update/partial-column-update.md#flexible-column-update) для таблиц Unique Merge-on-Write. Это свойство можно включить только для таблиц Unique Merge-on-Write. |

## Требования к правам доступа {#access-control-requirements}

[Пользователь](../../../../admin-manual/auth/authentication-and-authorization.md), выполняющий эту команду SQL, должен иметь как минимум следующие [права](../../../../admin-manual/auth/authentication-and-authorization.md):

| Право | Объект | Описание |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | База данных | |
| SELECT_PRIV | Таблица, представление | При выполнении CTAS требуется право SELECT_PRIV на запрашиваемую таблицу, представление или материализованное представление |

## Примечания по использованию {#usage-notes}

- База данных (Database) не должна содержать таблицы (Table) или представления (View) с таким же именем.
- Имена таблиц, столбцов и rollup не должны быть [зарезервированными ключевыми словами](../../../basic-element/reserved-keywords.md).
- CREATE TABLE ... LIKE:
  - Эта команда может использоваться только для внутренних таблиц Doris.
  - Копируются только явно указанные rollup.
  - Все синхронные материализованные представления автоматически не копируются.
- CREATE TABLE ... AS SELECT (CTAS):
  - Если псевдоним столбца в списке SELECT является допустимым именем столбца, определения столбцов в операторе CTAS не обязательны; если они опущены, имена столбцов и типы данных выводятся из базового запроса:
      
    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
  - Также можно явно задать имена с помощью следующего синтаксиса:
    
    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```

- Партиционирование и бакетирование
  - Для таблицы необходимо указать столбцы бакетирования, но партиции можно не задавать. Подробнее о партиционировании и бакетировании см. в документации [Партиционирование данных](../../../../table-design/data-partitioning/data-bucketing.md).
  - Таблицы в Doris могут быть партиционированными или непартиционированными. Это свойство определяется при создании таблицы и впоследствии не может быть изменено. То есть в партиционированных таблицах при дальнейшем использовании можно добавлять и удалять партиции, а в непартиционированные таблицы добавить партиции позднее нельзя.
  - Столбцы партиционирования и бакетирования нельзя изменять после создания таблицы: нельзя ни менять их типы, ни добавлять или удалять такие столбцы.
- Динамическое партиционирование
  - Функция динамического партиционирования прежде всего помогает пользователям автоматически управлять партициями. На основе заданных правил система Doris периодически добавляет новые партиции или удаляет старые. Подробнее см. в документации [Динамическое партиционирование](../../../../table-design/data-partitioning/dynamic-partitioning.md).
- Автоматическое партиционирование
  - Документация по автоматическому партиционированию доступна в разделе [Автоматическое партиционирование](../../../../table-design/data-partitioning/auto-partitioning.md).
- Синхронные материализованные представления
  - При создании таблицы пользователи могут создать несколько синхронных материализованных представлений (ROLLUP). Синхронные материализованные представления также можно добавлять после создания таблицы. Их включение в оператор создания таблицы позволяет создать все синхронные материализованные представления за один раз.
  - Если синхронные материализованные представления создаются одновременно с таблицей, все последующие операции импорта данных синхронно формируют данные для материализованных представлений. Количество материализованных представлений может влиять на эффективность импорта данных.
  - Введение в материализованные представления см. в документации [Синхронные материализованные представления](../../../../query-acceleration/materialized-view/sync-materialized-view.md).
- Индексы
  - При создании таблицы пользователи могут создать несколько индексов столбцов. Индексы также можно добавлять после создания таблицы.
  - Если индексы добавляются позднее и в таблице уже есть данные, все данные потребуется перезаписать; поэтому время создания индекса зависит от текущего объема данных.


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

**Способ бакетирования**

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

**Автоматическое партиционирование**

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

**Партиционирование по диапазонам**

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

**Партиционирование по спискам**

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

**Динамическое партиционирование**

Эта таблица создает партиции на 3 дня вперед и удаляет партиции за период старше 3 дней. Например, если сегодня `2020-01-08`, будут созданы партиции с именами `p20200108`, `p20200109`, `p20200110`, `p20200111`. Диапазоны партиций:

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

**Настройка свойств репликации динамических партиций**

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
