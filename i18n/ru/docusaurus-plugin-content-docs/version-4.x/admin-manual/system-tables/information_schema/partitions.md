---
{
    "title": "partitions",
    "language": "ru",
    "description": "Отображает состояние разделов всех таблиц в базе данных."
}
---

## Обзор {#overview}

Отображает состояние разделов всех таблиц в базе данных.

## База данных {#database}

`information_schema`

## Информация о таблице {#table-information}

| Имя столбца                   | Тип           | Описание                             |
| ----------------------------- | ------------- | ------------------------------------ |
| PARTITION_ID	                | bigint        | Идентификатор раздела                |
| TABLE_CATALOG                 | varchar(64)   | Имя Catalog                          |
| TABLE_SCHEMA                  | varchar(64)   | Имя базы данных                      |
| TABLE_NAME                    | varchar(64)   | Имя таблицы                          |
| PARTITION_NAME                | varchar(64)   | Имя раздела                          |
| SUBPARTITION_NAME             | varchar(64)   | Всегда пусто                         |
| PARTITION_ORDINAL_POSITION    | int           | Порядковый номер раздела             |
| SUBPARTITION_ORDINAL_POSITION | int           | Всегда пусто                         |
| PARTITION_METHOD              | varchar(13)   | Метод разбиения на разделы           |
| SUBPARTITION_METHOD           | varchar(13)   | Всегда пусто                         |
| PARTITION_EXPRESSION          | varchar(2048) | Выражение разбиения на разделы       |
| SUBPARTITION_EXPRESSION       | varchar(2048) | Всегда пусто                         |
| PARTITION_DESCRIPTION         | text          | Описание раздела                     |
| TABLE_ROWS                    | bigint        |                                      |
| AVG_ROW_LENGTH                | bigint        |                                      |
| DATA_LENGTH                   | bigint        |                                      |
| MAX_DATA_LENGTH               | bigint        |                                      |
| INDEX_LENGTH                  | bigint        |                                      |
| DATA_FREE                     | bigint        |                                      |
| CREATE_TIME                   | bigint        |                                      |
| UPDATE_TIME                   | datetime      |                                      |
| CHECK_TIME                    | datetime      |                                      |
| CHECKSUM                      | bigint        |                                      |
| PARTITION_COMMENT             | text          |                                      |
| NODEGROUP                     | varchar(256)  |                                      |
| TABLESPACE_NAME               | varchar(268)  |                                      |
| LOCAL_DATA_SIZE               | text	        | Размер локальных данных раздела. Обычно равен `0` в режиме с разделением вычислений и хранения, см. ниже |
| REMOTE_DATA_SIZE              | text          | Размер удалённых данных раздела (в облаке) |
| STATE                         | text	        | Состояние раздела                    |
| REPLICA_ALLOCATION  	        | text	        | Распределение реплик таблета. `NULL` в режиме с разделением вычислений и хранения |
| REPLICA_NUM                   | int 	        | Количество реплик                    |
| STORAGE_POLICY                | text          | Политика хранения                    |
| STORAGE_MEDIUM                | text          | Носитель хранения                    |
| COOLDOWN_TIME_MS              | text          | Время охлаждения                     |
| LAST_CONSISTENCY_CHECK_TIME   | text          | Время последней проверки согласованности |
| BUCKET_NUM                    | int           | Количество бакетов раздела           |
| COMMITTED_VERSION             | bigint        | Последняя зафиксированная версия     |
| VISIBLE_VERSION               | bigint        | Текущая видимая версия               |
| PARTITION_KEY                 | text          | Ключ разбиения на разделы            |
| RANGE                         | text          | Диапазон раздела (минимальное и максимальное значения) |
| DISTRIBUTION                  | text          | Тип распределения                    |

## Семантика размера данных в режиме с разделением вычислений и хранения {#data-size-semantics-in-compute-storage-decoupled-mode}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments / Partition data size statistics -->

:::caution Изменение поведения (4.0.8)

Начиная с версии 4.0.8, размер данных раздела в режиме с разделением вычислений и хранения всегда отражается как размер **удалённых** данных: объём данных, который в статистике реплик не отмечен как удалённый, учитывается в `REMOTE_DATA_SIZE`, а соответствующее значение `LOCAL_DATA_SIZE` отображается как `0`. Поэтому в кластере с разделением вычислений и хранения значение `LOCAL_DATA_SIZE` обычно равно `0`, а фактический размер данных раздела указан в `REMOTE_DATA_SIZE`.

До версии 4.0.8 этот объём данных учитывался в `LOCAL_DATA_SIZE`, из-за чего `information_schema.partitions`, [`SHOW TABLETS`](../../../sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET) и [`information_schema.backend_tablets`](./backend_tablets) противоречили друг другу в том, какие данные считать локальными, а какие удалёнными. Изменение касается только отображения размера; оно не меняет ни место хранения данных, ни их объём.

В рамках того же изменения `REPLICA_ALLOCATION` в `information_schema.partitions` отображается как `NULL` в режиме с разделением вычислений и хранения (ранее отображалось внутреннее значение-заполнитель `\N`). Размещением реплик управляет сама архитектура с разделением вычислений и хранения, и оно больше не подчиняется правилам распределения реплик, принятым в режиме с совмещением вычислений и хранения.

:::

При вычислении фактического объёма пространства, занимаемого разделом, в режиме с разделением вычислений и хранения используйте `REMOTE_DATA_SIZE`:

```sql
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    PARTITION_NAME,
    LOCAL_DATA_SIZE,
    REMOTE_DATA_SIZE
FROM information_schema.partitions
WHERE TABLE_SCHEMA = 'your_db';
```
