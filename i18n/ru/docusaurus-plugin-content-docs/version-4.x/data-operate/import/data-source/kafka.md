---
{
    "title": "Импорт данных из Kafka",
    "language": "ru",
    "description": "Описывает импорт данных из Kafka в Apache Doris: выбор способа, настройку и примеры использования Routine Load и Doris Kafka Connector.",
    "keywords": [
        "Kafka import",
        "Routine Load",
        "Doris Kafka Connector",
        "Kafka Connect",
        "Debezium",
        "Avro",
        "Protobuf",
        "CDC sync"
    ]
}
---

<!-- Knowledge type: Operational steps / Architecture selection decision -->
<!-- Applicable scenarios: Real-time data ingestion / Importing Kafka data into Doris -->

Apache Doris поддерживает чтение данных из Kafka в реальном времени. Эта возможность часто используется для загрузки журналов, заказов, событий IoT и синхронизации CDC. В документе приведены рекомендации по выбору способа импорта, ограничения и полные примеры работы для двух основных способов.

## Выбор способа {#approach-selection}

Doris предоставляет следующие два способа импорта данных из Kafka:

| Способ | Сценарий применения | Поддерживаемые форматы | Особенности |
| --- | --- | --- | --- |
| [Routine Load](../import-way/routine-load-manual.md) | Большинство типовых сценариев, в которых не требуется подключать внешние компоненты | CSV, JSON | Непрерывно читает топик Kafka, создаёт задачи импорта в реальном времени, обеспечивает семантику exactly-once и предотвращает потерю и дублирование данных |
| [Doris Kafka Connector](../../../connection-integration/data-integration/doris-kafka-connector.md) | Импорт данных в форматах сериализации, таких как Avro или Protobuf, либо чтение данных CDC, собранных Debezium из исходных баз данных | JSON, Avro, Protobuf, Debezium | Построен на механизме плагинов Kafka Connect, поддерживает горизонтальное масштабирование и отказоустойчивость |

Рекомендации по выбору:

- По умолчанию выбирайте **Routine Load**: Doris читает данные непосредственно из Kafka. Это самый простой вариант развёртывания.
- Если требуется читать данные в форматах **Avro / Protobuf** или интегрироваться с компонентами экосистемы Kafka Connect, такими как **Debezium**, выбирайте **Doris Kafka Connector**.

## Способ 1: чтение данных из Kafka с помощью Routine Load {#approach-1-use-routine-load-to-consume-kafka-data}

Routine Load создаёт в Doris длительно работающее задание, которое непрерывно читает сообщения из указанного топика Kafka и записывает их в таблицу Doris в реальном времени.

### Ограничения использования {#usage-limitations}

1. Поддерживаются только форматы сообщений **CSV** и **JSON**. В формате CSV каждое сообщение представляет собой одну строку без завершающего символа перевода строки.
2. По умолчанию поддерживается **Kafka 0.10.0.0 и выше**. Для использования более ранних версий (например, 0.9.0, 0.8.2, 0.8.1, 0.8.0) необходимо указать совместимую более раннюю версию в параметре конфигурации BE `kafka_broker_version_fallback` или задать `property.broker.version.fallback` при создании задания Routine Load. При использовании более ранних версий некоторые новые возможности могут быть недоступны, например задание смещений в разделах Kafka по времени.

### Пример работы {#operational-example}

Используйте команду `CREATE ROUTINE LOAD`, чтобы создать длительно работающую задачу импорта Routine Load. Доступны два сценария: импорт в одну таблицу и импорт в несколько таблиц. Подробное описание синтаксиса приведено в разделе [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD).

#### Сценарий 1: импорт в одну таблицу {#scenario-1-single-table-import}

Импорт данных из одного топика Kafka в одну таблицу Doris.

**Шаг 1: подготовьте данные в Kafka**

Пример данных в Kafka:

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
1,Emily,25
```

**Шаг 2: создайте целевую таблицу в Doris**

```SQL
CREATE TABLE testdb.test_routineload_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**Шаг 3: создайте задание Routine Load**

Используйте команду `CREATE ROUTINE LOAD`, чтобы создать задание импорта:

```SQL
CREATE ROUTINE LOAD testdb.example_routine_load_csv ON test_routineload_tbl
COLUMNS TERMINATED BY ",",
COLUMNS(user_id, name, age)
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-routine-load-csv",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**Шаг 4: проверьте результат импорта**

```SQL
select * from test_routineload_tbl;
+-----------+----------------+------+
| user_id   | name           | age  |
+-----------+----------------+------+
|  1        | Emily          | 25   |
+-----------+----------------+------+
```

#### Сценарий 2: импорт в несколько таблиц {#scenario-2-multi-table-import}

Используйте этот сценарий, если необходимо одновременно импортировать данные из одного топика Kafka в несколько таблиц Doris.

Требования и ограничения:

- Данные в Kafka должны содержать имя таблицы в формате `table_name|data`. Например, для CSV используется формат `table_name|val1,val2,val3`.
- **Имя таблицы должно точно совпадать с именем таблицы в Doris**, иначе импорт завершится ошибкой.
- Импорт в несколько таблиц **не поддерживает** настройку `column_mapping`, описанную далее.

**Шаг 1: подготовьте данные в Kafka**

Пример данных в Kafka (префикс указывает имя целевой таблицы):

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-multi-table-load --from-beginning
test_multi_table_load1|1,Emily,25
test_multi_table_load2|2,Benjamin,35
```

**Шаг 2: создайте целевые таблицы в Doris**

Таблица 1:

```SQL
CREATE TABLE test_multi_table_load1(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "user name",
    age                INT                   COMMENT "user age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

Таблица 2:

```SQL
CREATE TABLE test_multi_table_load2(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "user name",
    age                INT                   COMMENT "user age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**Шаг 3: создайте задание Routine Load для импорта в несколько таблиц**

```SQL
CREATE ROUTINE LOAD example_multi_table_load
COLUMNS TERMINATED BY ","
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-multi-table-load",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**Шаг 4: проверьте результат импорта**

```SQL
mysql> select * from test_multi_table_load1;
+---------+----------------+------+
| user_id | name           | age  |
+---------+----------------+------+
|  1      | Emily          | 25   |
+---------+----------------+------+

mysql> select * from test_multi_table_load2;
+---------+----------------+------+
| user_id | name           | age  |
+---------+----------------+------+
|  2      | Benjamin       | 35   |
+---------+----------------+------+
```

### Настройка аутентификации {#configuring-security-authentication}

Если в кластере Kafka включена аутентификация с использованием SSL, SASL или других механизмов безопасности, настройте соответствующие параметры по инструкции в разделе [Аутентификация Kafka](../import-way/routine-load-manual.md#kafka-security-authentication).

## Способ 2: чтение данных из Kafka с помощью Doris Kafka Connector {#approach-2-use-doris-kafka-connector-to-consume-kafka-data}

Doris Kafka Connector построен на платформе Kafka Connect и записывает потоки данных из Kafka в Doris. Благодаря механизму плагинов он позволяет легко импортировать данные в различных форматах сериализации (например, JSON, Avro и Protobuf), а также поддерживает разбор данных CDC, собранных Debezium.

### Запуск в распределённом режиме {#starting-in-distributed-mode}

[Распределённый](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers) режим обеспечивает масштабируемость Kafka Connect и автоматическое восстановление после сбоев. В этом режиме можно запустить несколько рабочих процессов с одинаковым значением `group.id`, которые совместно распределяют выполнение коннекторов и задач.

**Шаг 1: разместите JAR-файл плагина**

Создайте каталог `plugins` в `$KAFKA_HOME` и поместите в него скачанный JAR-файл `doris-kafka-connector`.

**Шаг 2: настройте `config/connect-distributed.properties`**

```Bash
# Modify the broker address
bootstrap.servers=127.0.0.1:9092

# Modify the group.id; it must be the same within the same cluster
group.id=connect-cluster

# Change to the plugins directory you created
# Note: enter the direct path under Kafka here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms to more than 30 minutes (default is 5 minutes)
# This avoids consumers being kicked out of the consumer group due to Stream Load import timeouts
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

**Шаг 3: запустите Kafka Connect**

```Bash
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

**Шаг 4: отправьте задачу импорта (чтение данных из Kafka)**

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-doris-sink-cluster",
  "config":{
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
    "topics":"topic_test",
    "doris.topic2table.map": "topic_test:test_kafka_tbl",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "doris.urls":"10.10.10.1",
    "doris.user":"root",
    "doris.password":"",
    "doris.http.port":"8030",
    "doris.query.port":"9030",
    "doris.database":"test_db",
    "key.converter":"org.apache.kafka.connect.storage.StringConverter",
    "value.converter":"org.apache.kafka.connect.storage.StringConverter"
  }
}'
```

**Основные команды управления Kafka Connect**

| Операция | Команда |
| --- | --- |
| Проверить состояние коннектора | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET` |
| Удалить текущий коннектор | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE` |
| Приостановить текущий коннектор | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT` |
| Возобновить работу текущего коннектора | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT` |
| Перезапустить задачу коннектора | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST` |

Подробнее о распределённом режиме см. в разделе [Рабочие процессы в распределённом режиме](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers).

### Чтение обычных данных JSON {#consuming-plain-json-data}

Этот вариант подходит для сценария, в котором Kafka хранит обычные сообщения JSON.

**Шаг 1: подготовьте данные в Kafka**

Пример данных в Kafka:

```Bash
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-data-topic --from-beginning
{"user_id":1,"name":"Emily","age":25}
{"user_id":2,"name":"Benjamin","age":35}
{"user_id":3,"name":"Olivia","age":28}
{"user_id":4,"name":"Alexander","age":60}
{"user_id":5,"name":"Ava","age":17}
{"user_id":6,"name":"William","age":69}
{"user_id":7,"name":"Sophia","age":32}
{"user_id":8,"name":"James","age":64}
{"user_id":9,"name":"Emma","age":37}
{"user_id":10,"name":"Liam","age":64}
```

**Шаг 2: создайте целевую таблицу в Doris**

```SQL
CREATE TABLE test_db.test_kafka_connector_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

**Шаг 3: отправьте задачу импорта**

На машине, где развёрнут Kafka Connect, отправьте следующую задачу импорта с помощью `curl`:

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-doris-sink-cluster",
  "config":{
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
    "tasks.max":"10",
    "topics":"test-data-topic",
    "doris.topic2table.map": "test-data-topic:test_kafka_connector_tbl",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "doris.urls":"10.10.10.1",
    "doris.user":"root",
    "doris.password":"",
    "doris.http.port":"8030",
    "doris.query.port":"9030",
    "doris.database":"test_db",
    "key.converter":"org.apache.kafka.connect.storage.StringConverter",
    "value.converter":"org.apache.kafka.connect.storage.StringConverter"
  }
}'
```

### Чтение данных, собранных Debezium {#consuming-data-collected-by-debezium}

Этот вариант подходит для сценария, в котором Debezium в реальном времени собирает данные об изменениях (CDC) из исходных баз данных, таких как MySQL или PostgreSQL, для записи в Doris.

**Шаг 1: подготовьте исходную таблицу и данные в MySQL**

```SQL
CREATE TABLE test.test_user (
  user_id int NOT NULL ,
  name varchar(20),
  age int,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

insert into test.test_user values(1,'zhangsan',20);
insert into test.test_user values(2,'lisi',21);
insert into test.test_user values(3,'wangwu',22);
```

**Шаг 2: создайте целевую таблицу в Doris**

Для сценариев CDC требуется модель таблицы `UNIQUE KEY`, обеспечивающая дедупликацию по первичному ключу и поддержку удаления:

```SQL
CREATE TABLE test_db.test_user(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

**Шаг 3: разверните Debezium MySQL Connector**

Разверните компонент Debezium connector for MySQL. См. документацию [Коннектор Debezium для MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html).

**Шаг 4: создайте задачу импорта doris-kafka-connector**

Предположим, что данные таблицы MySQL, собранные Debezium, хранятся в топике `mysql_debezium.test.test_user`:

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-debezium-doris-sink",
  "config":{
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
    "tasks.max":"10",
    "topics":"mysql_debezium.test.test_user",
    "doris.topic2table.map": "mysql_debezium.test.test_user:test_user",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "doris.urls":"10.10.10.1",
    "doris.user":"root",
    "doris.password":"",
    "doris.http.port":"8030",
    "doris.query.port":"9030",
    "doris.database":"test_db",
    "converter.mode":"debezium_ingestion",
    "enable.delete":"true",
    "key.converter":"org.apache.kafka.connect.json.JsonConverter",
    "value.converter":"org.apache.kafka.connect.json.JsonConverter"
  }
}'
```

Основные параметры:

- `converter.mode=debezium_ingestion`: включает разбор формата данных Debezium.
- `enable.delete=true`: синхронизирует операции удаления в Doris.

### Чтение данных в формате сериализации Avro {#consuming-data-in-avro-serialization-format}

Этот вариант подходит для сценария, в котором Kafka хранит данные в формате Avro и используется Schema Registry.

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{ 
  "name":"doris-avro-test", 
  "config":{ 
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector", 
    "topics":"avro_topic", 
    "tasks.max":"10",
    "doris.topic2table.map": "avro_topic:avro_tab", 
    "buffer.count.records":"100000", 
    "buffer.flush.time":"120", 
    "buffer.size.bytes":"10000000", 
    "doris.urls":"10.10.10.1", 
    "doris.user":"root", 
    "doris.password":"", 
    "doris.http.port":"8030", 
    "doris.query.port":"9030", 
    "doris.database":"test", 
    "load.model":"stream_load",
    "key.converter":"io.confluent.connect.avro.AvroConverter",
    "key.converter.schema.registry.url":"http://127.0.0.1:8081",
    "value.converter":"io.confluent.connect.avro.AvroConverter",
    "value.converter.schema.registry.url":"http://127.0.0.1:8081"
  } 
}'
```

### Чтение данных в формате сериализации Protobuf {#consuming-data-in-protobuf-serialization-format}

Этот вариант подходит для сценария, в котором Kafka хранит данные в формате Protobuf и используется Schema Registry.

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{ 
  "name":"doris-protobuf-test", 
  "config":{ 
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector", 
    "topics":"proto_topic", 
    "tasks.max":"10",
    "doris.topic2table.map": "proto_topic:proto_tab", 
    "buffer.count.records":"100000", 
    "buffer.flush.time":"120", 
    "buffer.size.bytes":"10000000", 
    "doris.urls":"10.10.10.1", 
    "doris.user":"root", 
    "doris.password":"", 
    "doris.http.port":"8030", 
    "doris.query.port":"9030", 
    "doris.database":"test", 
    "load.model":"stream_load",
    "key.converter":"io.confluent.connect.protobuf.ProtobufConverter",
    "key.converter.schema.registry.url":"http://127.0.0.1:8081",
    "value.converter":"io.confluent.connect.protobuf.ProtobufConverter",
    "value.converter.schema.registry.url":"http://127.0.0.1:8081"
  } 
}'
```

## Часто задаваемые вопросы {#faq}

**Вопрос 1: как выбрать между Routine Load и Doris Kafka Connector?**

- В большинстве сценариев достаточно Routine Load: он не требует дополнительных компонентов и поддерживает CSV и JSON.
- Если требуется читать данные в форматах Avro / Protobuf или интегрироваться с компонентами экосистемы Kafka Connect, такими как Debezium, используйте Doris Kafka Connector.

**Вопрос 2: какие версии Kafka поддерживает Routine Load?**

По умолчанию поддерживается Kafka 0.10.0.0 и выше. Для чтения данных из более ранних версий (0.9.0, 0.8.x) необходимо изменить параметр конфигурации BE `kafka_broker_version_fallback` или задать `property.broker.version.fallback` при создании задания. Учтите, что при использовании более ранних версий некоторые новые возможности недоступны, например задание смещений в разделах Kafka по времени.

**Вопрос 3: в каком формате должны быть данные Kafka для импорта в несколько таблиц?**

Данные должны иметь формат `table_name|data`. Например, для импорта CSV в несколько таблиц используется формат `table_name|val1,val2,val3`, а значение `table_name` должно точно совпадать с именем таблицы в Doris, иначе импорт завершится ошибкой. Импорт в несколько таблиц не поддерживает настройку `column_mapping`.

**Вопрос 4: почему при чтении данных через Kafka Connect следует увеличить `max.poll.interval.ms`?**

Запись в Doris через Stream Load может занимать много времени. Если значение `max.poll.interval.ms` (по умолчанию 5 минут) слишком мало, потребитель будет исключён из группы потребителей. Рекомендуется увеличить его до **более чем 30 минут** и соответствующим образом задать `consumer.max.poll.interval.ms`.

**Вопрос 5: как синхронизировать с Doris операции DELETE, собранные Debezium?**

В конфигурации Doris Kafka Connector задайте `converter.mode=debezium_ingestion` и `enable.delete=true`, а для хранения данных CDC в Doris используйте модель таблицы `UNIQUE KEY`.

## Связанные ссылки {#related-links}

- [Справочник по синтаксису CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)
- [Руководство по работе с Routine Load](../import-way/routine-load-manual.md)
- [Документация Doris Kafka Connector](../../../connection-integration/data-integration/doris-kafka-connector.md)
- [Настройка аутентификации Kafka](../import-way/routine-load-manual.md#kafka-security-authentication)
- [Рабочие процессы Kafka Connect в распределённом режиме](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers)
- [Коннектор Debezium для MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
