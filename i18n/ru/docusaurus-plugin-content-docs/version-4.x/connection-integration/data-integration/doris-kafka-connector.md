---
{
    "title": "Doris Kafka Connector",
    "language": "ru",
    "description": "Используйте Doris Kafka Connector для записи данных из топиков Kafka в Apache Doris в реальном времени. Узнайте о режимах развертывания, параметрах настройки, сопоставлении типов, синхронизации через Debezium и устранении неполадок.",
    "keywords": [
        "Doris Kafka Connector",
        "Kafka Connect",
        "Из Kafka в Doris",
        "Загрузка данных в Apache Doris в реальном времени",
        "Из Debezium в Doris"
    ]
}
---

<!-- Knowledge type: Operations guide / Configuration reference -->
<!-- Applicable scenarios: Real-time ingestion of Kafka data into Doris / Kafka Connect Sink Connector deployment and troubleshooting -->

[Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html) — масштабируемый и надежный инструмент интеграции данных для передачи данных между Apache Kafka и другими системами. Сообщество Doris предоставляет плагин [doris-kafka-connector](https://github.com/apache/doris-kafka-connector), который записывает данные из топиков Kafka в Doris.

## Сценарии использования {#applicable-scenarios}

Для непрерывной записи данных из Kafka в Doris выберите конфигурацию, соответствующую вашему источнику данных и среде выполнения:

| Пользовательский сценарий | Используемая возможность | Раздел документации |
| --- | --- | --- |
| Локальная проверка или тестирование при разработке | Запустите Kafka Connect в режиме Standalone и создайте Doris Sink Connector с помощью локального файла конфигурации | [Развертывание в режиме Standalone](#standalone-mode-deployment) |
| Развертывание в рабочей среде или кластере | Запустите Kafka Connect в режиме Distributed и управляйте коннекторами через REST API | [Развертывание в режиме Distributed](#distributed-mode-deployment) |
| Синхронизация обычных данных JSON | Используйте `JsonConverter` или `StringConverter` для чтения топика Kafka и записи в таблицу Doris | [Синхронизация обычных данных JSON](#synchronizing-plain-json-data) |
| Синхронизация данных CDC, полученных через Debezium | Задайте `converter.mode=debezium_ingestion` и при необходимости включите синхронизацию удалений | [Синхронизация данных, полученных через Debezium](#synchronizing-data-captured-by-debezium) |
| Синхронизация данных, сериализованных в Avro или Protobuf | Используйте Confluent Avro Converter или Protobuf Converter и настройте адрес Schema Registry | [Синхронизация данных, сериализованных в Avro](#synchronizing-avro-serialized-data), [Синхронизация данных, сериализованных в Protobuf](#synchronizing-protobuf-serialized-data) |
| Преобразование сообщений Kafka перед записью | Используйте Kafka Connect SMT для добавления полей или преобразования форматов времени в сообщениях | [Преобразование данных с помощью Kafka Connect SMT](#transforming-data-with-kafka-connect-smt) |
| Доступ к кластеру Kafka с аутентификацией по SSL | Настройте параметры SSL в Kafka Connect Worker и встроенном потребителе | [Доступ к кластеру Kafka с аутентификацией по SSL](#accessing-an-ssl-authenticated-kafka-cluster) |
| Сохранение записей, которые не удалось преобразовать | Настройте очередь недоставленных сообщений Kafka Connect | [Настройка очереди недоставленных сообщений](#configuring-a-dead-letter-queue) |

## Сведения о версиях {#version-notes}

| Версия коннектора | Версия Kafka | Версия Doris | Версия Java |
| --- | --- | --- | --- |
| 1.0.0 | 2.4+ | 2.0+ | 8 |
| 1.1.0 | 2.4+ | 2.0+ | 8 |
| 24.0.0 | 2.4+ | 2.0+ | 8 |
| 25.0.0 | 2.4+ | 2.0+ | 8 |
| 26.0.0 | 2.4+ | 2.0+ | 8 |

## Подготовка Doris Kafka Connector {#preparing-the-doris-kafka-connector}

Чтобы использовать Doris Kafka Connector, скачайте JAR-пакет или добавьте зависимость Maven.

### Скачивание JAR-пакета {#downloading-the-jar-package}

Скачайте JAR-пакет doris-kafka-connector со [страницы загрузки Doris](https://doris.apache.org/download). При развертывании Kafka Connect поместите JAR-пакет в каталог `$KAFKA_HOME/plugins`.

### Использование зависимости Maven {#using-a-maven-dependency}

В проекте Maven добавьте следующую зависимость:

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>doris-kafka-connector</artifactId>
    <version>25.0.0</version>
</dependency>
```

## Развертывание в режиме Standalone {#standalone-mode-deployment}

Режим Standalone подходит для локальной проверки или тестирования при разработке. Как правило, его не рекомендуется использовать в рабочих средах.

### 1. Подготовьте каталог плагинов {#1-prepare-the-plugin-directory}

Создайте каталог `plugins` в `$KAFKA_HOME` и поместите в него скачанный JAR-пакет doris-kafka-connector.

### 2. Настройте Kafka Connect Worker {#2-configure-the-kafka-connect-worker}

Отредактируйте `$KAFKA_HOME/config/connect-standalone.properties`:

```properties
# Modify the broker address
bootstrap.servers=127.0.0.1:9092

# Set this to the plugins directory you created
# Note: use Kafka's direct path here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms to more than 30 minutes (default is 5 minutes)
# This avoids consumers being kicked out of the consumer group due to Stream Load consumption timeouts
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

### 3. Настройте Doris Sink Connector {#3-configure-the-doris-sink-connector}

Создайте файл `doris-connector-sink.properties` в каталоге `$KAFKA_HOME/config`:

```properties
name=test-doris-sink
connector.class=org.apache.doris.kafka.connector.DorisSinkConnector
topics=topic_test
doris.topic2table.map=topic_test:test_kafka_tbl
doris.urls=10.10.10.1
doris.http.port=8030
doris.query.port=9030
doris.user=root
doris.password=
doris.database=test_db
buffer.count.records=10000
buffer.flush.time=120
buffer.size.bytes=5000000
enable.combine.flush=true
key.converter=org.apache.kafka.connect.storage.StringConverter
value.converter=org.apache.kafka.connect.json.JsonConverter
value.converter.schemas.enable=false
```

### 4. Запустите режим Standalone {#4-start-standalone-mode}

```shell
$KAFKA_HOME/bin/connect-standalone.sh -daemon $KAFKA_HOME/config/connect-standalone.properties $KAFKA_HOME/config/doris-connector-sink.properties
```

## Развертывание в режиме Distributed {#distributed-mode-deployment}

Режим Distributed подходит для кластеров Kafka Connect с несколькими узлами. В этом режиме сначала запускают Kafka Connect Worker, а затем создают коннекторы и управляют ими через REST API.

### 1. Подготовьте каталог плагинов {#1-prepare-the-plugin-directory-1}

Создайте каталог `plugins` в `$KAFKA_HOME` и поместите в него скачанный JAR-пакет doris-kafka-connector.

### 2. Настройте Kafka Connect Worker {#2-configure-the-kafka-connect-worker-1}

Отредактируйте `$KAFKA_HOME/config/connect-distributed.properties`:

```properties
# Modify the broker address
bootstrap.servers=127.0.0.1:9092

# Modify group.id; it must be the same across the same cluster
group.id=connect-cluster

# Set this to the plugins directory you created
# Note: use Kafka's direct path here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms to more than 30 minutes (default is 5 minutes)
# This avoids consumers being kicked out of the consumer group due to Stream Load consumption timeouts
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

### 3. Запустите режим Distributed {#3-start-distributed-mode}

```shell
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

:::note
При первом запуске Kafka Connect создает в кластере Kafka три топика: `config.storage.topic`, `offset.storage.topic` и `status.storage.topic`. Они используются для хранения общих конфигураций коннекторов, данных о смещениях и обновлений состояния. Подробнее см. в разделе [Начало работы с Kafka Connect](https://docs.confluent.io/platform/current/connect/userguide.html).
:::

### 4. Создайте коннектор {#4-create-a-connector}

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"test-doris-sink-cluster",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "topics":"topic_test",
        "doris.topic2table.map":"topic_test:test_kafka_tbl",
        "doris.urls":"10.10.10.1",
        "doris.user":"root",
        "doris.password":"",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"test_db",
        "enable.combine.flush":"true",
        "buffer.count.records":"10000",
        "buffer.flush.time":"120",
        "buffer.size.bytes":"5000000",
        "key.converter":"org.apache.kafka.connect.storage.StringConverter",
        "value.converter":"org.apache.kafka.connect.json.JsonConverter",
        "value.converter.schemas.enable":"false"
    }
}'
```

### 5. Управляйте коннектором {#5-manage-the-connector}

Через REST API Kafka Connect можно просматривать состояние коннектора, приостанавливать, возобновлять, удалять или перезапускать его. Подробнее об API см. в разделе [Интерфейс REST для Connect](https://docs.confluent.io/platform/current/connect/references/restapi.html#kconnect-rest-interface).

```shell
# View Connector status
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET

# Delete the current Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE

# Pause the current Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT

# Resume the current Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT

# Restart a task within the Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST
```

## Дополнительные настройки для рабочей среды {#production-environment-enhancements}

### Доступ к кластеру Kafka с аутентификацией по SSL {#accessing-an-ssl-authenticated-kafka-cluster}

При доступе к кластеру Kafka с аутентификацией по SSL через Kafka Connect необходимо предоставить файл сертификата, используемый для проверки открытого ключа брокера Kafka, например `client.truststore.jks`. Добавьте следующую конфигурацию в `connect-distributed.properties`:

```properties
# Connect worker
security.protocol=SSL
ssl.truststore.location=/var/ssl/private/client.truststore.jks
ssl.truststore.password=test1234

# Embedded consumer for sink connectors
consumer.security.protocol=SSL
consumer.ssl.truststore.location=/var/ssl/private/client.truststore.jks
consumer.ssl.truststore.password=test1234
```

Подробнее о подключении к кластеру Kafka с аутентификацией по SSL через Kafka Connect см. в разделе [Настройка Kafka Connect](https://docs.confluent.io/platform/current/security/security_tutorial.html#configure-kafka-connect).

### Настройка очереди недоставленных сообщений {#configuring-a-dead-letter-queue}

По умолчанию любая ошибка при преобразовании приводит к сбою коннектора. Следующая конфигурация позволяет продолжать работу при таких ошибках и записывать сведения о каждой ошибке и неудачной операции вместе с проблемной записью в очередь недоставленных сообщений:

```properties
errors.tolerance=all
errors.deadletterqueue.topic.name=test_error_topic
errors.deadletterqueue.context.headers.enable=true
errors.deadletterqueue.topic.replication.factor=1
```

## Параметры настройки {#configuration-options}

Следующие параметры используются для создания Doris Sink Connector. Другие общие параметры настройки Kafka Connect Sink см. в разделе [Настройка Connect](https://kafka.apache.org/documentation/#connect_configuring).

| Параметр | Допустимые значения | Значение по умолчанию | Обязательный | Описание |
| --- | --- | --- | --- | --- |
| `name` | - | - | Да | Имя приложения Connect. Должно быть уникальным в среде Kafka Connect. |
| `connector.class` | - | - | Да | `org.apache.doris.kafka.connector.DorisSinkConnector`. |
| `topics` | - | - | Да | Список топиков, на которые оформлена подписка. Несколько топиков разделяются запятыми, например `topic1,topic2`. |
| `doris.urls` | - | - | Да | Адрес подключения к FE Doris. Несколько адресов разделяются запятыми, например `10.20.30.1,10.20.30.2,10.20.30.3`. |
| `doris.http.port` | - | - | Да | Порт протокола HTTP в Doris. |
| `doris.query.port` | - | - | Да | Порт протокола MySQL в Doris. |
| `doris.user` | - | - | Да | Имя пользователя Doris. |
| `doris.password` | - | - | Да | Пароль Doris. |
| `doris.database` | - | - | Да | База данных для записи. При записи в несколько баз данных можно оставить пустым; в этом случае имя базы данных необходимо указать в `topic2table.map`. |
| `doris.topic2table.map` | - | - | Да | Сопоставление топиков и таблиц, например `topic1:tb1,topic2:tb2`. Если значение не задано, по умолчанию в качестве имени целевой таблицы используется имя топика. Формат для нескольких баз данных: `topic1:db1.tbl1,topic2:db2.tbl2`. |
| `buffer.count.records` | - | 50000 | Нет | Количество записей, записываемых за одну операцию Stream Load. |
| `buffer.flush.time` | - | 120 | Нет | Интервал сброса буфера в секундах. Значение по умолчанию — 120 секунд. |
| `buffer.size.bytes` | - | 104857600(100MB) | Нет | Объем данных, записываемых за одну операцию Stream Load. |
| `enable.combine.flush` | `true`,<br />`false` | false | Нет | Объединять ли данные из всех разделов в одну операцию записи. Значение по умолчанию — `false`. При включении гарантируется только семантика `at_least_once`. |
| `jmx` | - | true | Нет | Получать ли внутренние метрики мониторинга коннектора через JMX. См. [Doris-Connector-JMX](https://github.com/apache/doris-kafka-connector/blob/master/docs/en/Doris-Connector-JMX.md). |
| `label.prefix` | - | `${name}` | Нет | Префикс метки Stream Load при импорте данных. По умолчанию используется имя приложения коннектора. |
| `auto.redirect` | - | true | Нет | Перенаправлять ли запросы Stream Load. При включении запросы Stream Load перенаправляются через FE на BE, который должен записать данные, а информация о BE больше не отображается. |
| `sink.properties.*` | - | `'sink.properties.format':'json'`,<br />`'sink.properties.read_json_by_line':'true'` | Нет | Параметры импорта Stream Load. Например, разделитель столбцов задается с помощью `'sink.properties.column_separator':','`. Подробное описание параметров см. в [руководстве по Stream Load](../../data-operate/import/import-way/stream-load-manual.md).<br /><br />Чтобы включить Group Commit, например в режиме `sync_mode`, задайте: `"sink.properties.group_commit":"sync_mode"`. Group Commit поддерживает три режима: `off_mode`, `sync_mode` и `async_mode`. Подробнее об использовании см. в разделе [Group Commit](https://doris.apache.org/docs/data-operate/import/group-commit-manual/).<br /><br />Чтобы включить частичное обновление столбцов, например обновление отдельного столбца `col2`, задайте: `"sink.properties.partial_columns":"true"`, `"sink.properties.columns":"col2"`. |
| `delivery.guarantee` | `at_least_once`,<br />`exactly_once` | at_least_once | Нет | Гарантия согласованности данных при чтении данных из Kafka и их импорте в Doris. Поддерживаются `at_least_once` и `exactly_once`. Значение по умолчанию — `at_least_once`. Для гарантии `exactly_once` необходимо обновить Doris до версии 2.1.0 или новее. |
| `converter.mode` | `normal`,<br />`debezium_ingestion` | normal | Нет | Режим преобразования типов данных источника при чтении данных Kafka коннектором. `normal` означает обычное чтение данных Kafka без специального преобразования типов. `debezium_ingestion` означает, что требуется специальное преобразование типов, когда исходные данные Kafka получены с помощью инструментов CDC (Change Data Capture), таких как Debezium. |
| `debezium.schema.evolution` | `none`,<br />`basic` | none | Нет | При получении данных из исходных систем баз данных (например, MySQL) через Debezium добавленные при изменении схемы поля могут синхронизироваться с Doris. `none` означает, что изменения схемы в исходной системе баз данных не синхронизируются с Doris. `basic` означает, что операции изменения данных в исходной базе данных синхронизируются. Поскольку изменение схемы столбцов — опасная операция, которая может привести к случайному удалению столбцов из схемы таблицы Doris, в настоящее время поддерживается только добавление столбцов из источника. При переименовании столбца старый столбец остается без изменений, а коннектор добавляет новый столбец в целевую таблицу и записывает в него новые данные переименованного столбца. |
| `enable.delete` | - | false | Нет | Синхронизировать ли записи об удалении при синхронизации через Debezium. Значение по умолчанию — `false`. При синхронизации без Debezium необходимо добавить в сообщение маркер удаления. |
| `database.time_zone` | - | UTC | Нет | Если для `converter.mode` выбран режим, отличный от `normal`, этот параметр задает преобразование часового пояса для типов данных даты и времени, таких как `datetime`, `date` и `timestamp`. Значение по умолчанию — UTC. |
| `avro.topic2schema.filepath` | - | - | Нет | Позволяет разбирать содержимое Avro в топике с помощью локального файла схемы Avro, устраняя зависимость от Confluent Schema Registry. Этот параметр необходимо использовать с префиксом `key.converter` или `value.converter`. Например, настройка локальных файлов схемы Avro для топиков `avro-user` и `avro-product`: `"value.converter.avro.topic2schema.filepath":"avro-user:file:///opt/avro_user.avsc, avro-product:file:///opt/avro_product.avsc"`. Подробнее об использовании см. в [#32](https://github.com/apache/doris-kafka-connector/pull/32). |
| `record.tablename.field` | - | - | Нет | При включении этого параметра данные из одного топика могут поступать в несколько таблиц Doris. Подробнее о настройке см. в [#58](https://github.com/apache/doris-kafka-connector/pull/58). |
| `max.retries` | - | 10 | Нет | Максимальное количество повторных попыток после ошибки, по достижении которого задача завершается сбоем. |
| `retry.interval.ms` | - | 6000 | Нет | Время ожидания перед повторной попыткой после ошибки в миллисекундах. Значение по умолчанию — 6000 миллисекунд. |
| `behavior.on.null.values` | `ignore`,<br />`fail` | ignore | Нет | Способ обработки записей со значениями `null`. По умолчанию они пропускаются. |

## Сопоставление типов {#type-mapping}

Doris Kafka Connector использует примитивные или логические типы Kafka Connect для определения типа данных столбца. Примитивные типы — это простые типы данных, представленные с помощью `Schema` Kafka Connect. Логические типы обычно представлены с помощью `Struct` для описания сложных типов или типов даты и времени.

### Примитивные типы Kafka {#kafka-primitive-types}

| Примитивный тип Kafka | Тип Doris |
| --- | --- |
| INT8 | TINYINT |
| INT16 | SMALLINT |
| INT32 | INT |
| INT64 | BIGINT |
| FLOAT32 | FLOAT |
| FLOAT64 | DOUBLE |
| BOOLEAN | BOOLEAN |
| STRING | STRING |
| BYTES | STRING |

### Логические типы Kafka {#kafka-logical-types}

| Логический тип Kafka | Тип Doris |
| --- | --- |
| `org.apache.kafka.connect.data.Decimal` | DECIMAL |
| `org.apache.kafka.connect.data.Date` | DATE |
| `org.apache.kafka.connect.data.Time` | STRING |
| `org.apache.kafka.connect.data.Timestamp` | DATETIME |

### Логические типы Debezium {#debezium-logical-types}

| Логический тип Debezium | Тип Doris |
| --- | --- |
| `io.debezium.time.Date` | DATE |
| `io.debezium.time.Time` | String |
| `io.debezium.time.MicroTime` | DATETIME |
| `io.debezium.time.NanoTime` | DATETIME |
| `io.debezium.time.ZonedTime` | DATETIME |
| `io.debezium.time.Timestamp` | DATETIME |
| `io.debezium.time.MicroTimestamp` | DATETIME |
| `io.debezium.time.NanoTimestamp` | DATETIME |
| `io.debezium.time.ZonedTimestamp` | DATETIME |
| `io.debezium.data.VariableScaleDecimal` | DOUBLE |

## Настройка коннектора для разных сценариев работы с данными {#configuring-the-connector-by-data-scenario}

### Синхронизация обычных данных JSON {#synchronizing-plain-json-data}

Этот сценарий предназначен для записи обычных сообщений JSON из топика Kafka в таблицу Doris.

1. Просмотрите примеры данных в Kafka:

    ```bash
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

2. Создайте целевую таблицу в Doris:

    ```sql
    CREATE TABLE test_db.test_kafka_connector_tbl (
        user_id BIGINT NOT NULL COMMENT "user id",
        name VARCHAR(20) COMMENT "name",
        age INT COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 12;
    ```

3. На машине, где развернут Kafka Connect, отправьте задачу импорта с помощью `curl`:

    ```shell
    curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
        "name":"test-doris-sink-cluster",
        "config":{
            "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
            "tasks.max":"10",
            "topics":"test-data-topic",
            "doris.topic2table.map":"test-data-topic:test_kafka_connector_tbl",
            "doris.urls":"10.10.10.1",
            "doris.user":"root",
            "doris.password":"",
            "doris.http.port":"8030",
            "doris.query.port":"9030",
            "doris.database":"test_db",
            "buffer.count.records":"10000",
            "buffer.flush.time":"120",
            "buffer.size.bytes":"5000000",
            "enable.combine.flush":"true",
            "key.converter":"org.apache.kafka.connect.storage.StringConverter",
            "value.converter":"org.apache.kafka.connect.json.JsonConverter",
            "value.converter.schemas.enable":"false"
        }
    }'
    ```

### Синхронизация данных, полученных через Debezium {#synchronizing-data-captured-by-debezium}

Этот сценарий предназначен для записи в Doris через Kafka данных CDC из MySQL, полученных с помощью Debezium.

1. В базе данных MySQL есть следующая таблица и данные:

    ```sql
    CREATE TABLE test.test_user (
        user_id int NOT NULL,
        name varchar(20),
        age int,
        PRIMARY KEY (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

    INSERT INTO test.test_user VALUES (1, 'zhangsan', 20);
    INSERT INTO test.test_user VALUES (2, 'lisi', 21);
    INSERT INTO test.test_user VALUES (3, 'wangwu', 22);
    ```

2. Создайте целевую таблицу в Doris:

    ```sql
    CREATE TABLE test_db.test_user (
        user_id BIGINT NOT NULL COMMENT "user id",
        name VARCHAR(20) COMMENT "name",
        age INT COMMENT "age"
    )
    UNIQUE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 12;
    ```

3. Разверните компонент Debezium connector for MySQL. Подробные инструкции см. в разделе [Коннектор Debezium для MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html).

4. Создайте задачу импорта doris-kafka-connector. Предположим, что данные таблицы MySQL, полученные через Debezium, находятся в топике `mysql_debezium.test.test_user`:

    ```shell
    curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
        "name":"test-debezium-doris-sink",
        "config":{
            "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
            "tasks.max":"10",
            "topics":"mysql_debezium.test.test_user",
            "doris.topic2table.map":"mysql_debezium.test.test_user:test_user",
            "doris.urls":"10.10.10.1",
            "doris.user":"root",
            "doris.password":"",
            "doris.http.port":"8030",
            "doris.query.port":"9030",
            "doris.database":"test_db",
            "buffer.count.records":"10000",
            "buffer.flush.time":"30",
            "buffer.size.bytes":"5000000",
            "enable.combine.flush":"true",
            "converter.mode":"debezium_ingestion",
            "enable.delete":"true",
            "key.converter":"org.apache.kafka.connect.json.JsonConverter",
            "value.converter":"org.apache.kafka.connect.json.JsonConverter"
        }
    }'
    ```

### Синхронизация данных, сериализованных в Avro {#synchronizing-avro-serialized-data}

Этот сценарий предназначен для чтения топика Kafka с данными, сериализованными в Avro, и разбора данных с помощью Confluent Avro Converter.

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"doris-avro-test",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "topics":"avro_topic",
        "tasks.max":"10",
        "doris.topic2table.map":"avro_topic:avro_tab",
        "doris.urls":"127.0.0.1",
        "doris.user":"root",
        "doris.password":"",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"test",
        "buffer.count.records":"100000",
        "buffer.flush.time":"120",
        "buffer.size.bytes":"10000000",
        "enable.combine.flush":"true",
        "key.converter":"io.confluent.connect.avro.AvroConverter",
        "key.converter.schema.registry.url":"http://127.0.0.1:8081",
        "value.converter":"io.confluent.connect.avro.AvroConverter",
        "value.converter.schema.registry.url":"http://127.0.0.1:8081"
    }
}'
```

### Синхронизация данных, сериализованных в Protobuf {#synchronizing-protobuf-serialized-data}

Этот сценарий предназначен для чтения топика Kafka с данными, сериализованными в Protobuf, и разбора данных с помощью Confluent Protobuf Converter.

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"doris-protobuf-test",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "topics":"proto_topic",
        "tasks.max":"10",
        "doris.topic2table.map":"proto_topic:proto_tab",
        "doris.urls":"127.0.0.1",
        "doris.user":"root",
        "doris.password":"",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"test",
        "buffer.count.records":"100000",
        "buffer.flush.time":"120",
        "buffer.size.bytes":"10000000",
        "enable.combine.flush":"true",
        "key.converter":"io.confluent.connect.protobuf.ProtobufConverter",
        "key.converter.schema.registry.url":"http://127.0.0.1:8081",
        "value.converter":"io.confluent.connect.protobuf.ProtobufConverter",
        "value.converter.schema.registry.url":"http://127.0.0.1:8081"
    }
}'
```

### Преобразование данных с помощью Kafka Connect SMT {#transforming-data-with-kafka-connect-smt}

Этот сценарий предназначен для добавления полей или преобразования форматов в отдельных сообщениях Kafka перед записью в Doris. В следующем примере `InsertField` используется для добавления статического поля, а `TimestampConverter` — для преобразования временной метки Bigint в строку времени.

Пример исходных данных:

```json
{
    "registertime": 1513885135404,
    "userid": "User_9",
    "regionid": "Region_3",
    "gender": "MALE"
}
```

Создайте коннектор:

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"insert_field_tranform",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "tasks.max":"1",
        "topics":"users",
        "doris.topic2table.map":"users:kf_users",
        "buffer.count.records":"10000",
        "buffer.flush.time":"10",
        "buffer.size.bytes":"5000000",
        "doris.urls":"127.0.0.1:8030",
        "doris.user":"root",
        "doris.password":"123456",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"testdb",
        "key.converter":"org.apache.kafka.connect.storage.StringConverter",
        "value.converter":"org.apache.kafka.connect.json.JsonConverter",
        "value.converter.schemas.enable":"false",
        "transforms":"InsertField,TimestampConverter",
        "transforms.InsertField.type":"org.apache.kafka.connect.transforms.InsertField$Value",
        "transforms.InsertField.static.field":"repo",
        "transforms.InsertField.static.value":"Apache Doris",
        "transforms.TimestampConverter.type":"org.apache.kafka.connect.transforms.TimestampConverter$Value",
        "transforms.TimestampConverter.field":"registertime",
        "transforms.TimestampConverter.format":"yyyy-MM-dd HH:mm:ss.SSS",
        "transforms.TimestampConverter.target.type":"string"
    }
}'
```

После обработки SMT данные из примера принимают следующий вид:

```json
{
    "userid": "User_9",
    "regionid": "Region_3",
    "gender": "MALE",
    "repo": "Apache Doris",
    "registertime": "2017-12-21 03:38:55.404"
}
```

Здесь `repo` — статическое поле, добавленное с помощью `InsertField`, а `registertime` — строка времени, полученная с помощью `TimestampConverter`. Дополнительные примеры преобразования отдельных сообщений Kafka Connect (Single Message Transforms, SMT) см. в [документации SMT](https://docs.confluent.io/cloud/current/connectors/transforms/overview.html).

## Часто задаваемые вопросы {#faq}

### При чтении данных JSON возникает ошибка `JsonConverter with schemas.enable requires "schema" and "payload" fields` {#reading-json-data-reports-jsonconverter-with-schemasenable-requires-schema-and-payload-fields}

**Сообщение об ошибке:**

```shell
Caused by: org.apache.kafka.connect.errors.DataException: JsonConverter with schemas.enable requires "schema" and "payload" fields and may not contain additional fields. If you are trying to deserialize plain JSON data, set schemas.enable=false in your converter configuration.
    at org.apache.kafka.connect.json.JsonConverter.toConnectData(JsonConverter.java:337)
    at org.apache.kafka.connect.storage.Converter.toConnectData(Converter.java:91)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.lambda$convertAndTransformRecord$4(WorkerSinkTask.java:536)
    at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndRetry(RetryWithToleranceOperator.java:180)
    at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndHandleError(RetryWithToleranceOperator.java:214)
```

**Причина:**

При использовании `org.apache.kafka.connect.json.JsonConverter` данные должны соответствовать полям `schema` и `payload`.

**Решение:**

Используйте один из следующих способов:

1. Замените `org.apache.kafka.connect.json.JsonConverter` на `org.apache.kafka.connect.storage.StringConverter`.
2. Установите для `value.converter.schemas.enable` или `key.converter.schemas.enable` значение `false` в соответствующем файле конфигурации.
    - Режим Standalone: измените `config/connect-standalone.properties`.
    - Режим Distributed: измените `config/connect-distributed.properties`.

### Превышено время ожидания обработки данных, потребитель исключен из группы потребителей {#consumption-timeout-consumer-is-kicked-out-of-the-consumer-group}

**Сообщение об ошибке:**

```shell
org.apache.kafka.clients.consumer.CommitFailedException: Offset commit cannot be completed since the consumer is not part of an active group for auto partition assignment; it is likely that the consumer was kicked out of the group.
        at org.apache.kafka.clients.consumer.internals.ConsumerCoordinator.sendOffsetCommitRequest(ConsumerCoordinator.java:1318)
        at org.apache.kafka.clients.consumer.internals.ConsumerCoordinator.doCommitOffsetsAsync(ConsumerCoordinator.java:1127)
        at org.apache.kafka.clients.consumer.internals.ConsumerCoordinator.commitOffsetsAsync(ConsumerCoordinator.java:1093)
        at org.apache.kafka.clients.consumer.KafkaConsumer.commitAsync(KafkaConsumer.java:1590)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.doCommitAsync(WorkerSinkTask.java:361)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.doCommit(WorkerSinkTask.java:376)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.commitOffsets(WorkerSinkTask.java:467)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.commitOffsets(WorkerSinkTask.java:381)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.iteration(WorkerSinkTask.java:221)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.execute(WorkerSinkTask.java:206)
        at org.apache.kafka.connect.runtime.WorkerTask.doRun(WorkerTask.java:204)
        at org.apache.kafka.connect.runtime.WorkerTask.run(WorkerTask.java:259)
        at org.apache.kafka.connect.runtime.isolation.Plugins.lambda$withClassLoader$1(Plugins.java:181)
        at java.base/java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:539)
        at java.base/java.util.concurrent.FutureTask.run(FutureTask.java:264)
        at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)
        at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)
        at java.base/java.lang.Thread.run(Thread.java:833)
```

**Решение:**

Увеличьте значение параметра Kafka `max.poll.interval.ms` в соответствии с вашим сценарием. Значение по умолчанию — `300000`.

- Режим Standalone: добавьте `max.poll.interval.ms` и `consumer.max.poll.interval.ms` в `config/connect-standalone.properties` и задайте их значения.
- Режим Distributed: добавьте `max.poll.interval.ms` и `consumer.max.poll.interval.ms` в `config/connect-distributed.properties` и задайте их значения.

После изменения параметров перезапустите Kafka Connect.

### При обновлении Doris Kafka Connector с 1.0.0 или 1.1.0 до 24.0.0 возникают ошибки `cleanup.policy=compact` {#upgrading-the-doris-kafka-connector-from-100-or-110-to-2400-reports-cleanuppolicycompact-errors}

**Сообщение об ошибке:**

```shell
org.apache.kafka.common.config.ConfigException: Topic 'connect-status' supplied via the 'status.storage.topic' property is required to have 'cleanup.policy=compact' to guarantee consistency and durability of connector and task statuses, but found the topic currently has 'cleanup.policy=delete'. Continuing would likely result in eventually losing connector and task statuses and problems restarting this Connect cluster in the future. Change the 'status.storage.topic' property in the Connect worker configurations to use a topic with 'cleanup.policy=compact'.
    at org.apache.kafka.connect.util.TopicAdmin.verifyTopicCleanupPolicyOnlyCompact(TopicAdmin.java:581)
    at org.apache.kafka.connect.storage.KafkaTopicBasedBackingStore.lambda$topicInitializer$0(KafkaTopicBasedBackingStore.java:47)
    at org.apache.kafka.connect.util.KafkaBasedLog.start(KafkaBasedLog.java:247)
    at org.apache.kafka.connect.util.KafkaBasedLog.start(KafkaBasedLog.java:231)
    at org.apache.kafka.connect.storage.KafkaStatusBackingStore.start(KafkaStatusBackingStore.java:228)
    at org.apache.kafka.connect.runtime.AbstractHerder.startServices(AbstractHerder.java:164)
    at org.apache.kafka.connect.runtime.distributed.DistributedHerder.run
```

**Решение:**

Измените политику очистки топиков `connect-configs` и `connect-status` на `compact`:

```shell
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-configs --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-status --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
```

### Не удается изменить схему в режиме преобразования `debezium_ingestion` {#schema-change-fails-under-debezium_ingestion-conversion-mode}

**Сообщение об ошибке:**

```shell
[2025-01-07 14:26:20,474] WARN [doris-normal_test_sink-connector|task-0] Table 'test_sink' cannot be altered because schema evolution is disabled. (org.apache.doris.kafka.connector.converter.RecordService:183)
[2025-01-07 14:26:20,475] ERROR [doris-normal_test_sink-connector|task-0] WorkerSinkTask{id=doris-normal_test_sink-connector-0} Task threw an uncaught and unrecoverable exception. Task is being killed and will not recover until manually restarted. Error: Cannot alter table org.apache.doris.kafka.connector.model.TableDescriptor@67cd8027 because schema evolution is disabled (org.apache.kafka.connect.runtime.WorkerSinkTask:612)
org.apache.doris.kafka.connector.exception.SchemaChangeException: Cannot alter table org.apache.doris.kafka.connector.model.TableDescriptor@67cd8027 because schema evolution is disabled
    at org.apache.doris.kafka.connector.converter.RecordService.alterTableIfNeeded(RecordService.java:186)
    at org.apache.doris.kafka.connector.converter.RecordService.checkAndApplyTableChangesIfNeeded(RecordService.java:150)
    at org.apache.doris.kafka.connector.converter.RecordService.processStructRecord(RecordService.java:100)
    at org.apache.doris.kafka.connector.converter.RecordService.getProcessedRecord(RecordService.java:305)
    at org.apache.doris.kafka.connector.writer.DorisWriter.putBuffer(DorisWriter.java:155)
    at org.apache.doris.kafka.connector.writer.DorisWriter.insertRecord(DorisWriter.java:124)
    at org.apache.doris.kafka.connector.writer.StreamLoadWriter.insert(StreamLoadWriter.java:151)
    at org.apache.doris.kafka.connector.service.DorisDefaultSinkService.insert(DorisDefaultSinkService.java:154)
    at org.apache.doris.kafka.connector.service.DorisDefaultSinkService.insert(DorisDefaultSinkService.java:135)
    at org.apache.doris.kafka.connector.DorisSinkTask.put(DorisSinkTask.java:97)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.deliverMessages(WorkerSinkTask.java:583)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.poll(WorkerSinkTask.java:336)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.iteration(WorkerSinkTask.java:237)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.execute(WorkerSinkTask.java:206)
    at org.apache.kafka.connect.runtime.WorkerTask.doRun(WorkerTask.java:202)
    at org.apache.kafka.connect.runtime.WorkerTask.run(WorkerTask.java:257)
    at org.apache.kafka.connect.runtime.isolation.Plugins.lambda$withClassLoader$1(Plugins.java:177)
    at java.base/java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:515)
    at java.base/java.util.concurrent.FutureTask.run(FutureTask.java:264)
    at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)
    at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)
    at java.base/java.lang.Thread.run(Thread.java:829)
```

**Решение:**

По умолчанию изменения схемы отключены в режиме преобразования `debezium_ingestion`. Чтобы включить их, задайте `debezium.schema.evolution=basic`.

Обратите внимание: включение изменений схемы не дает строгой гарантии, что измененный столбец будет единственным столбцом в таблице Doris. Конкретные ограничения см. в описании параметра `debezium.schema.evolution`. Чтобы и в источнике, и в приемнике остался только один столбец, рекомендуется сначала вручную добавить измененный столбец в таблицу Doris, а затем перезапустить задачу коннектора. Для обеспечения согласованности данных коннектор продолжит чтение с последнего необработанного `offset`.
