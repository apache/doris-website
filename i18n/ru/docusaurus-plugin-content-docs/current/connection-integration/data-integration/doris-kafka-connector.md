---
{
    "title": "Doris Kafka Connector",
    "language": "ru",
    "description": "Используйте Doris Kafka Connector для записи данных из топиков Kafka в Apache Doris в реальном времени. Узнайте о режимах развёртывания, параметрах конфигурации, сопоставлении типов, синхронизации через Debezium и устранении неполадок.",
    "keywords": [
        "Doris Kafka Connector",
        "Kafka Connect",
        "Kafka в Doris",
        "Загрузка данных в Apache Doris в реальном времени",
        "Debezium в Doris"
    ]
}
---

<!-- Knowledge type: Operations guide / Configuration reference -->
<!-- Applicable scenarios: Real-time ingestion of Kafka data into Doris / Kafka Connect Sink Connector deployment and troubleshooting -->

[Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html) — масштабируемый и надёжный инструмент интеграции данных для их передачи между Apache Kafka и другими системами. Сообщество Doris предоставляет плагин [doris-kafka-connector](https://github.com/apache/doris-kafka-connector), который записывает данные из топиков Kafka в Doris.

## Сценарии использования {#applicable-scenarios}

Для непрерывной записи данных из Kafka в Doris выберите конфигурацию, соответствующую источнику данных и среде выполнения:

| Сценарий использования | Возможность | Раздел документации |
| --- | --- | --- |
| Локальная проверка или тестирование при разработке | Запустите Kafka Connect в режиме Standalone и создайте Doris Sink Connector с помощью локального файла конфигурации | [Развёртывание в режиме Standalone](#standalone-mode-deployment) |
| Развёртывание в рабочей среде или кластере | Запустите Kafka Connect в режиме Distributed и управляйте коннекторами через REST API | [Развёртывание в режиме Distributed](#distributed-mode-deployment) |
| Синхронизация обычных данных JSON | Используйте `JsonConverter` или `StringConverter` для чтения топика Kafka и записи в таблицу Doris | [Синхронизация обычных данных JSON](#synchronizing-plain-json-data) |
| Синхронизация данных CDC, полученных с помощью Debezium | Задайте `converter.mode=debezium_ingestion` и при необходимости включите синхронизацию удалений | [Синхронизация данных, полученных с помощью Debezium](#synchronizing-data-captured-by-debezium) |
| Синхронизация данных, сериализованных в Avro или Protobuf | Используйте Confluent Avro Converter или Protobuf Converter и настройте адрес Schema Registry | [Синхронизация данных, сериализованных в Avro](#synchronizing-avro-serialized-data), [Синхронизация данных, сериализованных в Protobuf](#synchronizing-protobuf-serialized-data) |
| Преобразование сообщений Kafka перед записью | Используйте Kafka Connect SMT для добавления полей или преобразования форматов времени в сообщениях | [Преобразование данных с помощью Kafka Connect SMT](#transforming-data-with-kafka-connect-smt) |
| Доступ к кластеру Kafka с аутентификацией SSL | Настройте параметры SSL в Kafka Connect Worker и во встроенном потребителе | [Доступ к кластеру Kafka с аутентификацией SSL](#accessing-an-ssl-authenticated-kafka-cluster) |
| Сохранение записей, которые не удалось преобразовать | Настройте очередь недоставленных сообщений Kafka Connect | [Настройка очереди недоставленных сообщений](#configuring-a-dead-letter-queue) |

## Сведения о версиях {#version-notes}

| Версия коннектора | Версия Kafka | Версия Doris | Версия Java |
| --- | --- | --- | --- |
| 1.0.0 | 2.4+ | 2.0+ | 8 |
| 1.1.0 | 2.4+ | 2.0+ | 8 |
| 24.0.0 | 2.4+ | 2.0+ | 8 |
| 25.0.0 | 2.4+ | 2.0+ | 8 |
| 26.0.0 | 2.4+ | 2.0+ | 8 |
| 26.1.0 | 2.4+ | 2.0+ | 8 |

## Подготовка Doris Kafka Connector {#preparing-the-doris-kafka-connector}

Для использования Doris Kafka Connector можно скачать JAR-пакет или добавить зависимость Maven.

### Скачивание JAR-пакета {#downloading-the-jar-package}

Скачайте JAR-пакет doris-kafka-connector со [страницы загрузки Doris](https://doris.apache.org/download). При развёртывании Kafka Connect поместите JAR-пакет в каталог `$KAFKA_HOME/plugins`.

### Использование зависимости Maven {#using-a-maven-dependency}

В проекте Maven добавьте следующую зависимость:

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>doris-kafka-connector</artifactId>
    <version>26.1.0</version>
</dependency>
```

## Развёртывание в режиме Standalone {#standalone-mode-deployment}

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

Создайте `doris-connector-sink.properties` в каталоге `$KAFKA_HOME/config`:

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

## Развёртывание в режиме Distributed {#distributed-mode-deployment}

Режим Distributed подходит для многоузловых кластеров Kafka Connect. В этом режиме сначала запускают Kafka Connect Worker, а затем создают коннекторы и управляют ими через REST API.

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
При первом запуске Kafka Connect создаёт в кластере Kafka три топика: `config.storage.topic`, `offset.storage.topic` и `status.storage.topic`. Они используются для хранения общих конфигураций коннекторов, данных о смещениях и обновлений состояния. Подробнее см. в разделе [Начало работы с Kafka Connect](https://docs.confluent.io/platform/current/connect/userguide.html).
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

Через REST API Kafka Connect можно просматривать состояние коннектора, приостанавливать, возобновлять, удалять или перезапускать его. Подробнее об API см. в разделе [REST-интерфейс Connect](https://docs.confluent.io/platform/current/connect/references/restapi.html#kconnect-rest-interface).

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

### Доступ к кластеру Kafka с аутентификацией SSL {#accessing-an-ssl-authenticated-kafka-cluster}

Для доступа к кластеру Kafka с аутентификацией SSL через Kafka Connect необходимо предоставить файл сертификата для проверки открытого ключа брокера Kafka, например `client.truststore.jks`. Добавьте следующую конфигурацию в `connect-distributed.properties`:

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

Подробнее о подключении к кластеру Kafka с аутентификацией SSL через Kafka Connect см. в разделе [Настройка Kafka Connect](https://docs.confluent.io/platform/current/security/security_tutorial.html#configure-kafka-connect).

### Настройка очереди недоставленных сообщений {#configuring-a-dead-letter-queue}

По умолчанию любая ошибка при преобразовании приводит к сбою коннектора. Следующая конфигурация позволяет продолжать работу при таких ошибках и записывать сведения о каждой ошибке и неудачной операции вместе с проблемной записью в очередь недоставленных сообщений:

```properties
errors.tolerance=all
errors.deadletterqueue.topic.name=test_error_topic
errors.deadletterqueue.context.headers.enable=true
errors.deadletterqueue.topic.replication.factor=1
```

## Параметры конфигурации {#configuration-options}

Следующие параметры используются для создания Doris Sink Connector. Другие общие параметры Kafka Connect Sink см. в разделе [connect_configuring](https://kafka.apache.org/documentation/#connect_configuring).

| Ключ | Допустимые значения | Значение по умолчанию | Обязательный | Описание |
| --- | --- | --- | --- | --- |
| `name` | - | - | Да | Имя приложения Connect. Должно быть уникальным в среде Kafka Connect. |
| `connector.class` | - | - | Да | `org.apache.doris.kafka.connector.DorisSinkConnector`. |
| `topics` | - | - | Да | Список топиков, на которые оформлена подписка. Разделяйте несколько топиков запятыми, например `topic1,topic2`. |
| `doris.urls` | - | - | Да | Адрес подключения к Doris FE. Разделяйте несколько адресов запятыми, например `10.20.30.1,10.20.30.2,10.20.30.3`. |
| `doris.http.port` | - | - | Да | Порт протокола HTTP в Doris. |
| `doris.query.port` | - | - | Да | Порт протокола MySQL в Doris. |
| `doris.user` | - | - | Да | Имя пользователя Doris. |
| `doris.password` | - | - | Да | Пароль Doris. |
| `doris.database` | - | - | Да | База данных для записи. При записи в несколько баз данных параметр можно оставить пустым; в этом случае имя базы данных необходимо указать в `topic2table.map`. |
| `doris.enable.tls` | `true`,<br />`false` | false | Нет | Включать ли TLS для подключений к Doris по HTTP и MySQL. |
| `doris.tls.ca-certificate-path` | - | Пустая строка | Нет | Локальный путь на Worker к цепочке сертификатов CA в формате PEM. Если значение пустое, коннектор не загружает пользовательский CA и использует стандартное хранилище доверенных сертификатов соответствующего клиента. |
| `doris.tls.skip-hostname-verification` | `true`,<br />`false` | false | Нет | Пропускать ли проверку имени хоста, сохраняя проверку CA. |
| `doris.tls.excluded-protocols` | `http`,<br />`mysql` | Пустая строка | Нет | Протоколы Doris, которые не используют TLS, через запятую. |
| `doris.topic2table.map` | - | - | Да | Сопоставление топиков с таблицами, например `topic1:tb1,topic2:tb2`. Если значение пустое, по умолчанию в качестве имени целевой таблицы используется имя топика. Формат для нескольких баз данных: `topic1:db1.tbl1,topic2:db2.tbl2`. |
| `load.model` | `stream_load`,<br />`tvf` | stream_load | Нет | Режим записи в Doris. Установите для этого параметра значение `tvf`, чтобы выполнять запись через S3 TVF. |
| `buffer.count.records` | - | 50000 | Нет | Количество записей, записываемых за одну операцию Stream Load. |
| `buffer.flush.time` | - | 120 | Нет | Интервал сброса буфера в секундах. Значение по умолчанию — 120 секунд. |
| `buffer.size.bytes` | - | 104857600(100MB) | Нет | Объём данных, записываемых за одну операцию Stream Load. |
| `enable.combine.flush` | `true`,<br />`false` | false | Нет | Объединять ли данные из всех разделов в одну операцию записи. Значение по умолчанию — `false`. При включении гарантируется только семантика `at_least_once`. |
| `jmx` | - | true | Нет | Получать ли внутренние метрики мониторинга коннектора через JMX. См. [Doris-Connector-JMX](https://github.com/apache/doris-kafka-connector/blob/master/docs/en/Doris-Connector-JMX.md). |
| `label.prefix` | - | `${name}` | Нет | Префикс метки Stream Load при загрузке данных. По умолчанию используется имя приложения коннектора. |
| `auto.redirect` | - | true | Нет | Перенаправлять ли запросы Stream Load. При включении Stream Load перенаправляется через FE на BE, которому необходимо записать данные, а сведения о BE больше не отображаются. |
| `sink.properties.*` | - | `'sink.properties.format':'json'`,<br />`'sink.properties.read_json_by_line':'true'` | Нет | Параметры загрузки Stream Load. Например, задайте разделитель столбцов с помощью `'sink.properties.column_separator':','`. Подробное описание параметров см. в [руководстве по Stream Load](../../data-operate/import/import-way/stream-load-manual.md).<br /><br />Для включения Group Commit, например в режиме `sync_mode`: `"sink.properties.group_commit":"sync_mode"`. Group Commit поддерживает три режима: `off_mode`, `sync_mode` и `async_mode`. Подробнее об использовании см. в разделе [Group Commit](https://doris.apache.org/docs/data-operate/import/group-commit-manual/).<br /><br />Для включения частичного обновления столбцов, например обновления столбца `col2`: `"sink.properties.partial_columns":"true"`, `"sink.properties.columns":"col2"`. |
| `sink.s3.endpoint` | - | - | Только в режиме записи TVF | Абсолютный адрес конечной точки HTTP или HTTPS объектного хранилища, совместимого с S3. |
| `sink.s3.region` | - | - | Только в режиме записи TVF | Регион объектного хранилища. |
| `sink.s3.bucket` | - | - | Только в режиме записи TVF | Бакет для промежуточного хранения данных. |
| `sink.s3.prefix` | - | - | Только в режиме записи TVF | Префикс ключей объектов для промежуточного хранения данных. |
| `sink.s3.access-key` | - | - | Только в режиме записи TVF | Ключ доступа к объектному хранилищу. |
| `sink.s3.secret-key` | - | - | Только в режиме записи TVF | Секретный ключ объектного хранилища. |
| `sink.s3.path-style-access` | `true`,<br />`false` | false | Нет | Использовать ли адресацию path-style для доступа к объектному хранилищу в режиме записи TVF. |
| `delivery.guarantee` | `at_least_once`,<br />`exactly_once` | at_least_once | Нет | Гарантия согласованности данных при чтении из Kafka и загрузке в Doris. Поддерживаются `at_least_once` и `exactly_once`. Значение по умолчанию — `at_least_once`. Для гарантии `exactly_once` необходимо обновить Doris до версии 2.1.0 или более поздней. |
| `converter.mode` | `normal`,<br />`debezium_ingestion` | normal | Нет | Режим преобразования типов входных данных при чтении коннектором данных из Kafka. `normal` означает обычное чтение данных Kafka без специального преобразования типов. `debezium_ingestion` означает, что требуется специальное преобразование типов, если входные данные Kafka получены с помощью инструментов CDC (Change Data Capture), таких как Debezium. |
| `debezium.schema.evolution` | `none`,<br />`basic` | none | Нет | При сборе данных из исходных систем баз данных (например, MySQL) через Debezium добавленные при изменении схемы поля можно синхронизировать с Doris. `none` означает, что изменения схемы исходной системы баз данных не синхронизируются с Doris. `basic` означает, что операции изменения данных в исходной базе данных синхронизируются. Поскольку изменения схемы столбцов — опасные операции, которые могут случайно удалить столбцы из схемы таблицы Doris, сейчас поддерживается только добавление столбцов из источника. При переименовании столбца старый столбец остаётся без изменений, а коннектор добавляет новый столбец в целевую таблицу и записывает в него новые данные из переименованного столбца. |
| `enable.delete` | - | false | Нет | Синхронизировать ли записи об удалении при синхронизации через Debezium. Значение по умолчанию — `false`. При синхронизации без Debezium необходимо добавить в сообщение маркер удаления. |
| `database.time_zone` | - | UTC | Нет | Когда для `converter.mode` задан режим, отличный от `normal`, этот параметр определяет преобразование часового пояса для типов данных даты и времени, таких как `datetime`, `date` и `timestamp`. Значение по умолчанию — UTC. |
| `avro.topic2schema.filepath` | - | - | Нет | Разбирает содержимое Avro в топике, читая локальный файл схемы Avro, что устраняет зависимость от Confluent Schema Registry. Этот параметр необходимо использовать вместе с префиксом `key.converter` или `value.converter`. Например, настройте локальные файлы схем Avro для топиков `avro-user` и `avro-product`: `"value.converter.avro.topic2schema.filepath":"avro-user:file:///opt/avro_user.avsc, avro-product:file:///opt/avro_product.avsc"`. Подробнее об использовании см. [#32](https://github.com/apache/doris-kafka-connector/pull/32). |
| `record.tablename.field` | - | - | Нет | Если этот параметр включён, данные из одного топика могут поступать в несколько таблиц Doris. Подробнее о настройке см. [#58](https://github.com/apache/doris-kafka-connector/pull/58). |
| `max.retries` | - | 10 | Нет | Максимальное количество повторных попыток после ошибки до завершения задачи со сбоем. |
| `retry.interval.ms` | - | 6000 | Нет | Время ожидания перед повторной попыткой после ошибки в миллисекундах. Значение по умолчанию — 6000 миллисекунд. |
| `behavior.on.null.values` | `ignore`,<br />`fail` | ignore | Нет | Способ обработки записей со значениями `null`. По умолчанию они пропускаются. |

## Сопоставление типов {#type-mapping}

Doris Kafka Connector использует примитивные или логические типы Kafka Connect для определения типа данных столбца. Примитивные типы — это простые типы данных, представленные с помощью Kafka Connect `Schema`. Логические типы обычно представлены с помощью `Struct` для описания сложных типов или типов даты и времени.

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

## Настройка коннектора для различных сценариев работы с данными {#configuring-the-connector-by-data-scenario}

### Синхронизация обычных данных JSON {#synchronizing-plain-json-data}

Этот сценарий предназначен для записи обычных сообщений JSON из топика Kafka в таблицу Doris.

1. Просмотрите пример данных в Kafka:

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

3. На машине, где развёрнут Kafka Connect, отправьте задачу загрузки с помощью `curl`:

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

### Синхронизация данных, полученных с помощью Debezium {#synchronizing-data-captured-by-debezium}

Этот сценарий предназначен для записи в Doris через Kafka данных MySQL CDC, полученных с помощью Debezium.

1. В базе данных MySQL есть следующая таблица с данными:

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

3. Разверните компонент Debezium connector for MySQL. Подробные инструкции см. в разделе [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html).

4. Создайте задачу загрузки doris-kafka-connector. Предположим, что данные таблицы MySQL, полученные с помощью Debezium, находятся в топике `mysql_debezium.test.test_user`:

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

Этот сценарий предназначен для чтения топика Kafka с данными, сериализованными в Avro, и их разбора с помощью Confluent Avro Converter.

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

Этот сценарий предназначен для чтения топика Kafka с данными, сериализованными в Protobuf, и их разбора с помощью Confluent Protobuf Converter.

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

Этот сценарий предназначен для добавления полей или преобразования форматов в отдельных сообщениях Kafka перед записью в Doris. В следующем примере `InsertField` добавляет статическое поле, а `TimestampConverter` преобразует временную метку типа Bigint в строку времени.

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

Здесь `repo` — статическое поле, добавленное с помощью `InsertField`, а `registertime` — строка времени, полученная с помощью `TimestampConverter`. Другие примеры преобразований отдельных сообщений Kafka Connect Single Message Transforms (SMT) см. в [документации SMT](https://docs.confluent.io/cloud/current/connectors/transforms/overview.html).

## Рекомендации {#best-practices}

### Доступ к среде Doris с включённым TLS из Kafka Connect {#access-a-tls-enabled-doris-environment-from-kafka-connect}

При записи в кластер Doris с включённым TLS добавьте следующие параметры в конфигурацию коннектора:

```json
{
"doris.urls":"doris-fe.example.com",
"doris.http.port":"8040",
"doris.query.port":"9030",
"doris.enable.tls":"true",
"doris.tls.ca-certificate-path":"/etc/kafka-connect/certs/doris-ca.pem"
}
```

Указывайте в `doris.urls` только имена хостов; не добавляйте схему или порт. Если путь к CA не настроен, коннектор не загружает пользовательский CA и использует стандартное хранилище доверенных сертификатов соответствующего клиента.

Разместите файл CA в соответствии с режимом развёртывания Kafka Connect:

- **Standalone**: поместите файл CA на хост Worker и укажите его локальный путь.
- **Distributed**: поместите файл CA по одинаковому локальному пути на каждом Worker, поскольку задача может быть назначена любому Worker.
- **Kubernetes**: смонтируйте один и тот же Secret или том в каждый Pod Kafka Connect Worker и укажите путь монтирования.

### Использование режима записи S3 TVF {#use-s3-tvf-write-mode}

Режим записи TVF сохраняет данные в формате JSON в объектном хранилище, совместимом с S3, а затем записывает их в Doris через S3 TVF. Убедитесь, что Kafka Connect и Doris имеют доступ к объектному хранилищу и что целевая таблица Doris уже существует. Добавьте следующие параметры в конфигурацию коннектора:

```json
{
"load.model":"tvf",
"enable.combine.flush":"true",
"delivery.guarantee":"at_least_once",
"sink.properties.columns":"id,name,age",
"sink.s3.endpoint":"$YOUR_S3_ENDPOINT",
"sink.s3.region":"$YOUR_S3_REGION",
"sink.s3.bucket":"$YOUR_S3_BUCKET",
"sink.s3.prefix":"$YOUR_S3_PREFIX",
"sink.s3.access-key":"$YOUR_S3_ACCESS_KEY",
"sink.s3.secret-key":"$YOUR_S3_SECRET_KEY"
}
```

`sink.properties.columns` должен содержать список столбцов целевой таблицы в порядке записи. Коннектор не удаляет промежуточные объекты автоматически; при необходимости настройте политику жизненного цикла объектного хранилища.

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

### Превышено время ожидания чтения, потребитель исключён из группы потребителей {#consumption-timeout-consumer-is-kicked-out-of-the-consumer-group}

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

- Режим Standalone: добавьте `max.poll.interval.ms` и `consumer.max.poll.interval.ms` в `config/connect-standalone.properties` и настройте их значения.
- Режим Distributed: добавьте `max.poll.interval.ms` и `consumer.max.poll.interval.ms` в `config/connect-distributed.properties` и настройте их значения.

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

### Ошибка изменения схемы в режиме преобразования `debezium_ingestion` {#schema-change-fails-under-debezium_ingestion-conversion-mode}

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

В режиме преобразования `debezium_ingestion` изменения схемы по умолчанию отключены. Задайте `debezium.schema.evolution=basic`, чтобы включить изменения схемы.

Учтите, что включение изменения схемы не даёт строгой гарантии того, что в таблице Doris останется только изменённый столбец. Конкретные ограничения см. в описании параметра `debezium.schema.evolution`. Чтобы на стороне источника и получателя оставался только один столбец, рекомендуется сначала вручную добавить изменённый столбец в таблицу Doris, а затем перезапустить задачу коннектора. Коннектор продолжит чтение с последнего необработанного `offset`, сохраняя согласованность данных.
