---
{
    "title": "Запись данных в Doris",
    "language": "ru",
    "description": "Запись в Doris через Stream Load с помощью Flink Doris Connector: потоковый и пакетный режимы записи, запись через S3 TVF, частичное обновление столбцов, импорт Bitmap, удаление по указанному столбцу, параметры Sink и метрики мониторинга."
}
---

# Запись данных в Doris {#writing-data-to-doris}

Flink Doris Connector объединяет данные в пакеты во Flink и записывает их в Doris через Stream Load. На этой странице описаны режимы записи, запись с помощью FlinkSQL, распространённые сценарии записи и параметры Sink. О записи с помощью DataStream API см. в разделе [DataStream API](./datastream-api.md#sink).

## Режимы записи {#write-modes}

При записи Flink Doris Connector объединяет данные в пакеты в памяти Flink, а затем массово загружает их в Doris через Stream Load. Коннектор поддерживает два режима формирования пакетов. По умолчанию используется потоковая запись на основе Flink Checkpoint:

| Критерий сравнения | Потоковая запись | Пакетная запись |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Условие запуска | Зависит от Flink Checkpoint: запись в Doris выполняется в каждом цикле Checkpoint | Периодическая фиксация по достижении порогов времени и объёма данных, заданных в коннекторе |
| Согласованность | Exactly-Once | At-Least-Once; модель с первичным ключом позволяет гарантировать Exactly-Once |
| Задержка | Ограничена интервалом Checkpoint, обычно выше | Независимый механизм пакетной обработки с гибкой настройкой |
| Отказоустойчивость и восстановление | Полностью согласуется с восстановлением состояния Flink | Зависит от внешней логики дедупликации, например дедупликации по первичному ключу в Doris |

- **Потоковая запись** (по умолчанию): необходимо включить Checkpoint. Данные из вышестоящего источника непрерывно записываются в Doris в течение периода Checkpoint, а не хранятся в памяти. Двухфазная фиксация гарантирует Exactly-Once. После перезапуска задание должно восстановиться из последнего Checkpoint/Savepoint; иначе запись завершится ошибкой из-за повторяющейся метки (см. [часто задаваемые вопросы](./faq.md)).
- **Пакетная запись**: поддерживается начиная с версии коннектора 1.5.0. Не зависит от Checkpoint: данные накапливаются в памяти и сбрасываются в соответствии с параметрами `sink.buffer-flush.max-rows`, `sink.buffer-flush.max-bytes` и `sink.buffer-flush.interval`. Для включения задайте `'sink.enable.batch-mode' = 'true'`. Exactly-Once не гарантируется; идемпотентной записи можно добиться с помощью модели Unique.

Помимо Stream Load, можно задать `'sink.write-mode' = 'TVF'`, чтобы сначала временно разместить данные в объектном хранилище, совместимом с S3, а затем загрузить их в Doris через табличную функцию S3. См. раздел [Запись с помощью S3 TVF](#tvf).

## Запись с помощью FlinkSQL {#flink-sql}

Используйте [Datagen](https://nightlies.apache.org/flink/flink-docs-master/docs/connectors/table/datagen/) из Flink для имитации непрерывного поступления данных из вышестоящего источника:

```sql
-- Enable checkpoint
SET 'execution.checkpointing.interval' = '30s';

CREATE TABLE student_source (
    id INT,
    name STRING,
    age INT
) WITH (
    'connector' = 'datagen',
    'rows-per-second' = '1',
    'fields.name.length' = '20',
    'fields.id.min' = '1',
    'fields.id.max' = '100000',
    'fields.age.min' = '3',
    'fields.age.max' = '30'
);

-- doris sink
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '10.16.10.6:28737',
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = 'password',
    'sink.label-prefix' = 'doris_label'
    -- 'sink.enable.batch-mode' = 'true'  Add this configuration to use batch write
);

INSERT INTO student_sink SELECT * FROM student_source;
```

## Запись с помощью S3 TVF {#tvf}

В режиме записи TVF данные сначала временно размещаются в формате JSON в объектном хранилище S3, а затем загружаются в Doris через табличную функцию S3. Используйте этот режим, если предпочтительна передача данных через объектное хранилище или сетевой путь для Stream Load недоступен.

Перед использованием убедитесь, что и Flink, и Doris имеют доступ к S3, а целевая таблица уже существует в Doris.

```sql
SET 'execution.checkpointing.interval' = '30s';

CREATE TABLE student_tvf_sink (
    id INT,
    name STRING,
    age INT
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
    'table.identifier' = 'test.student_tvf',
    'username' = 'root',
    'password' = '',
    'sink.write-mode' = 'TVF',
    'sink.label-prefix' = 'student_tvf',
    'sink.s3.endpoint' = 'https://s3.example.com',
    'sink.s3.region' = 'us-east-1',
    'sink.s3.bucket' = 'staging-bucket',
    'sink.s3.prefix' = 'doris/student',
    'sink.s3.access-key' = 'access-key',
    'sink.s3.secret-key' = 'secret-key'
);

INSERT INTO student_tvf_sink VALUES (1, 'Alice', 18);
```

Коннектор не удаляет временно размещённые объекты из S3 автоматически. При необходимости настройте политику жизненного цикла объектов в хранилище.

## Распространённые сценарии записи {#common-write-scenarios}

### Частичное обновление столбцов {#partial-column-update}

Задайте параметр Stream Load `partial_columns`, чтобы включить частичное обновление столбцов, и перечислите обновляемые столбцы в `columns`. Требования к таблице приведены в разделе [Частичное обновление столбцов](../../../data-operate/update/partial-column-update.md).

```sql
CREATE TABLE doris_sink (
    id INT,
    name STRING,
    bank STRING,
    age int
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'database.table',
    'username' = 'root',
    'password' = '',
    'sink.properties.format' = 'json',
    'sink.properties.read_json_by_line' = 'true',
    'sink.properties.columns' = 'id,name,bank,age', -- Columns to update
    'sink.properties.partial_columns' = 'true' -- Enable partial column update
);
```

### Импорт данных Bitmap {#bitmap}

Преобразуйте целочисленный столбец в Bitmap с помощью функции `to_bitmap` в `sink.properties.columns`:

```sql
CREATE TABLE bitmap_sink (
    dt int,
    page string,
    user_id int
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.bitmap_test',
    'username' = 'root',
    'password' = '',
    'sink.label-prefix' = 'doris_label',
    'sink.properties.columns' = 'dt,page,user_id,user_id=to_bitmap(user_id)'
)
```

### Удаление данных по указанному столбцу {#delete-by-column}

В сообщениях Kafka для обозначения типа операции часто используется отдельное поле, например `{"op_type":"delete",data:{...}}`. При обработке таких данных может потребоваться удалять записи, у которых `op_type=delete`.

По умолчанию DorisSink определяет типы событий по RowKind. В случае CDC тип события можно получить напрямую, а для удаления скрытому столбцу `__DORIS_DELETE_SIGN__` присваивается соответствующее значение. В случае Kafka значение должна определить логика приложения, после чего его необходимо явно передать в скрытый столбец.

```sql
-- For example, upstream data: {"op_type":"delete",data:{"id":1,"name":"zhangsan"}}
CREATE TABLE KAFKA_SOURCE(
    data STRING,
    op_type STRING
) WITH (
    'connector' = 'kafka',
    ...
);

CREATE TABLE DORIS_SINK(
    id INT,
    name STRING,
    __DORIS_DELETE_SIGN__ INT
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'db.table',
    'username' = 'root',
    'password' = '',
    'sink.enable-delete' = 'false',        -- false means do not get the event type from RowKind
    'sink.properties.columns' = 'id, name, __DORIS_DELETE_SIGN__'  -- Explicitly specify the import columns of Stream Load
);

INSERT INTO DORIS_SINK
SELECT json_value(data, '$.id') as id,
    json_value(data, '$.name') as name,
    if(op_type = 'delete', 1, 0) as __DORIS_DELETE_SIGN__
from KAFKA_SOURCE;
```

### Запись данных журнала изменений CDC {#cdc-changelog}

Если источником служит Flink CDC или данные об изменениях в формате Debezium, DorisSink различает события вставки, обновления и удаления по RowKind. События удаления синхронизируются с Doris с помощью `sink.enable-delete` (требуется модель Unique). Полный пример приведён в разделе [Синхронизация всей базы данных (Flink CDC)](./cdc-sync.md#single-table-sync); при работе с DataStream API используйте `JsonDebeziumSchemaSerializer`, как описано в разделе [Формат Debezium](./datastream-api.md#debezium).

## Параметры {#options}

Ниже приведены параметры Sink. Общие параметры подключения перечислены в разделе [Параметры подключения и TLS](./connection.md#common-options).

| Ключ | Значение по умолчанию | Обязательный | Комментарий |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| sink.label-prefix | -- | Да | Префикс метки, используемой при импорте. В сценариях 2PC он должен быть глобально уникальным, чтобы гарантировать семантику Flink EOS. |
| sink.properties.* | -- | Нет | Параметры импорта Stream Load. Например, `'sink.properties.column_separator' = ', '` задаёт разделитель столбцов; `'sink.properties.escape_delimiters' = 'true'` указывает, что в качестве разделителей используются специальные символы, при этом `\x01` преобразуется в двоичное значение `0x01`; для импорта в формате JSON: `'sink.properties.format' = 'json'`, `'sink.properties.read_json_by_line' = 'true'`. Подробное описание параметров см. в разделе [Stream Load](../../../data-operate/import/import-way/stream-load-manual.md#import-configuration-parameters). Режим Group Commit: `'sink.properties.group_commit' = 'sync_mode'` задаёт синхронный режим групповой фиксации. Flink Connector поддерживает настройку групповой фиксации для импорта начиная с версии 1.6.2. Подробности использования и ограничения см. в разделе [Group Commit](../../../data-operate/import/load-best-practices/group-commit-manual.md). Начиная с версии 26.1.0 сжатие gz для Stream Load включено по умолчанию; его можно отключить, задав `'sink.properties.compress_type' = ''`. |
| sink.enable-delete | TRUE | Нет | Включает удаление. Для этого параметра в таблице Doris должно быть включено пакетное удаление (в Doris 0.15+ включено по умолчанию). Поддерживается только модель Unique. |
| sink.enable-2pc | TRUE | Нет | Включает двухфазную фиксацию (2pc). Значение по умолчанию — true, что гарантирует семантику Exactly-Once. Сведения о двухфазной фиксации см. в разделе [Stream Load 2PC](../../../data-operate/transaction.md#streamload-2pc). |
| sink.write-mode | STREAM_LOAD | Нет | Режим записи. Поддерживаемые значения: `STREAM_LOAD`, `STREAM_LOAD_BATCH` и `TVF`. |
| sink.s3.endpoint | -- | Только для режима записи TVF | Адрес конечной точки объектного хранилища, совместимого с S3. |
| sink.s3.region | -- | Только для режима записи TVF | Регион объектного хранилища. |
| sink.s3.bucket | -- | Только для режима записи TVF | Бакет для временного размещения файлов. |
| sink.s3.prefix | -- | Только для режима записи TVF | Префикс ключей объектов для временно размещённых файлов. Префикс не должен содержать символы шаблонов glob. |
| sink.s3.access-key | -- | Только для режима записи TVF | Ключ доступа к объектному хранилищу. |
| sink.s3.secret-key | -- | Только для режима записи TVF | Секретный ключ объектного хранилища. |
| sink.s3.path-style-access | FALSE | Нет | Определяет, используется ли в режиме TVF доступ к объектному хранилищу в стиле path-style. |
| sink.buffer-size | 1MB | Нет | Размер буфера для накопления записываемых данных в байтах. Изменять его не рекомендуется: настройки по умолчанию достаточно. |
| sink.buffer-count | 3 | Нет | Количество буферов для накопления записываемых данных. Изменять его не рекомендуется: настройки по умолчанию достаточно. |
| sink.max-retries | 3 | Нет | Максимальное количество повторных попыток после сбоя Commit. Значение по умолчанию — 3. |
| sink.enable.batch-mode | FALSE | Нет | Включает пакетный режим записи в Doris. При включении момент записи не зависит от Checkpoint и определяется параметрами `sink.buffer-flush.max-rows`, `sink.buffer-flush.max-bytes` и `sink.buffer-flush.interval`. После включения семантика Exactly-Once больше не гарантируется. Для обеспечения идемпотентности можно использовать модель Unique. |
| sink.flush.queue-size | 2 | Нет | Размер очереди накопленных данных в пакетном режиме. |
| sink.buffer-flush.max-rows | 500000 | Нет | Максимальное количество строк, записываемых в одном пакете, в пакетном режиме. |
| sink.buffer-flush.max-bytes | 100MB | Нет | Максимальное количество байтов, записываемых в одном пакете, в пакетном режиме. |
| sink.buffer-flush.interval | 10s | Нет | Интервал асинхронного сброса накопленных данных в пакетном режиме. |
| sink.ignore.update-before | TRUE | Нет | Определяет, следует ли игнорировать события update-before. По умолчанию они игнорируются. |

## Метрики мониторинга {#metrics}

Flink предоставляет различные [метрики](https://nightlies.apache.org/flink/flink-docs-master/docs/ops/metrics/#metrics) для мониторинга кластера Flink. Ниже перечислены дополнительные метрики мониторинга, предоставляемые Flink Doris Connector:

| Название | Тип метрики | Описание |
| ------------------------- | ----------- | ---------------------------------------------------- |
| totalFlushLoadBytes | Counter | Общее количество байтов, сброшенных из буфера и импортированных. |
| flushTotalNumberRows | Counter | Общее количество импортированных и обработанных строк. |
| totalFlushLoadedRows | Counter | Общее количество успешно импортированных строк. |
| totalFlushTimeMs | Counter | Общее время, затраченное на успешное выполнение операций импорта. |
| totalFlushSucceededNumber | Counter | Количество успешных операций импорта. |
| totalFlushFailedNumber | Counter | Количество неудачных операций импорта. |
| totalFlushFilteredRows | Counter | Общее количество строк, не соответствующих требованиям к качеству данных. |
| totalFlushUnselectedRows | Counter | Общее количество строк, отфильтрованных условием where. |
| beginTxnTimeMs | Histogram | Время, затраченное на запрос к FE для начала транзакции, в миллисекундах. |
| putDataTimeMs | Histogram | Время, затраченное на запрос к FE для получения плана выполнения импорта данных. |
| readDataTimeMs | Histogram | Время, затраченное на чтение данных. |
| writeDataTimeMs | Histogram | Время, затраченное на выполнение операции записи данных. |
| commitAndPublishTimeMs | Histogram | Время, затраченное на запрос к FE для фиксации и публикации транзакции. |
| loadTimeMs | Histogram | Время, затраченное на выполнение импорта. |
