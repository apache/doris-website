---
{
    "title": "AutoMQ",
    "language": "ru",
    "description": "Используйте Routine Load в Apache Doris для чтения данных JSON из совместимых с Kafka Topic в AutoMQ и загрузки данных в реальном времени."
}
---

[AutoMQ](https://github.com/AutoMQ/automq) представляет собой облачную реализацию Kafka, переработанную специально для облачной среды. Благодаря переносу хранения данных в объектное хранилище AutoMQ сохраняет 100% совместимость с Apache Kafka, обеспечивая снижение затрат до 10 раз и повышение эластичности до 100 раз. Инновационная архитектура с общим хранилищем обеспечивает миграцию партиций за секунды, автоматическую балансировку трафика и автоматическое масштабирование за секунды, сохраняя высокую пропускную способность и низкую задержку.

В этом документе описано, как использовать Routine Load в Apache Doris для чтения данных JSON из совместимого с Kafka Topic в AutoMQ и их непрерывной загрузки в таблицу Doris.

![Архитектура хранения AutoMQ](/images/next/connection-integration/data-integration/automq-arch.jpg)

## Сценарии использования {#use-cases}

Если бизнес-данные уже записаны в AutoMQ и вы хотите непрерывно анализировать их в Apache Doris в реальном времени, используйте Routine Load для чтения данных из Topic в AutoMQ. Пример в этом документе использует Topic с данными JSON и тестовую таблицу Doris, чтобы продемонстрировать весь процесс: от подготовки данных до проверки результата загрузки.

Общий порядок действий:

1. Подготовьте тестовую базу данных и тестовую таблицу Apache Doris.
2. Подготовьте кластер AutoMQ, инструменты командной строки Kafka и тестовый Topic.
3. Запишите тестовые данные JSON в Topic в AutoMQ.
4. Создайте задание загрузки Routine Load в Doris.
5. Выполните запрос к таблице Doris, чтобы проверить успешную загрузку данных.

## Предварительные требования {#prerequisites}

Перед началом работы убедитесь, что следующая среда готова к использованию.

| Компонент | Описание |
| --- | --- |
| Кластер Apache Doris | Убедитесь, что кластер Apache Doris доступен. Для демонстрации в этом документе используется тестовая среда в Linux, развёрнутая по инструкции [Быстрый старт](../../getting-started/quick-start). |
| Кластер AutoMQ | Разверните доступный кластер по [официальной документации по развёртыванию](https://docs.automq.com/automq/deployment/deploy-multi-nodes-cluster-on-linux) AutoMQ и убедитесь, что между AutoMQ и Apache Doris есть сетевое соединение. |
| Инструменты командной строки Kafka | Скачайте последний пакет TGZ со страницы [релизов AutoMQ](https://github.com/AutoMQ/automq/releases) и распакуйте его. В этом документе предполагается, что каталог с распакованными файлами обозначен как `$AUTOMQ_HOME`, а для создания Topic и генерации тестовых данных используются команды инструментов из `$AUTOMQ_HOME/bin`. |

## Подготовка тестовой таблицы Doris {#prepare-the-doris-test-table}

Создайте базу данных и тестовую таблицу в Doris. Последующие примеры по умолчанию выполняются в `automq_db`.

```sql
CREATE DATABASE automq_db;
USE automq_db;

CREATE TABLE automq_db.users (
    id BIGINT NOT NULL,
    name STRING NOT NULL,
    timestamp STRING NULL,
    status STRING NULL
) DISTRIBUTED BY HASH(id) PROPERTIES ("replication_num" = "1");
```

## Подготовка Topic AutoMQ и тестовых данных {#prepare-the-automq-topic-and-test-data}

В этом документе используются следующие примеры значений параметров. При выполнении команд замените адрес из примера фактическим адресом AutoMQ Bootstrap Server.

| Параметр | Пример значения | Описание |
| --- | --- | --- |
| AutoMQ Bootstrap Server | `127.0.0.1:9092` | Адрес для доступа к кластеру AutoMQ. |
| Topic | `example_topic` | Topic для хранения тестовых данных JSON. |
| Каталог с распакованными файлами AutoMQ | `$AUTOMQ_HOME` | Каталог, в который распакован пакет TGZ AutoMQ. |

### Создание Topic {#create-the-topic}

Используйте инструмент командной строки Apache Kafka для создания `example_topic`.

```shell
$AUTOMQ_HOME/bin/kafka-topics.sh \
    --create \
    --topic example_topic \
    --bootstrap-server 127.0.0.1:9092 \
    --partitions 1 \
    --replication-factor 1
```

После создания выполните следующую команду, чтобы убедиться, что Topic успешно создан.

```shell
$AUTOMQ_HOME/bin/kafka-topics.sh \
    --describe \
    --topic example_topic \
    --bootstrap-server 127.0.0.1:9092
```

### Подготовка тестовых данных {#prepare-the-test-data}

Тестовые данные используют формат JSON. Поля должны соответствовать таблице Doris и `jsonpaths` в задании Routine Load, которое будет создано далее.

```json
{
    "id": 1,
    "name": "Test User",
    "timestamp": "2023-11-10T12:00:00",
    "status": "active"
}
```

### Запись тестовых данных {#write-the-test-data}

Запишите тестовые данные в `example_topic` с помощью инструмента командной строки Kafka или программным способом. В следующем примере для записи данных используется инструмент командной строки.

```shell
echo '{"id": 1, "name": "Test User", "timestamp": "2023-11-10T12:00:00", "status": "active"}' | $AUTOMQ_HOME/bin/kafka-console-producer.sh \
    --bootstrap-server 127.0.0.1:9092 \
    --topic example_topic
```

Выполните следующую команду, чтобы просмотреть данные, только что записанные в Topic.

```shell
$AUTOMQ_HOME/bin/kafka-console-consumer.sh \
    --bootstrap-server 127.0.0.1:9092 \
    --topic example_topic \
    --from-beginning
```

## Создание задания загрузки Routine Load {#create-the-routine-load-ingestion-job}

В командной строке Apache Doris создайте задание Routine Load для непрерывного чтения данных JSON из Topic в AutoMQ. Подробное описание параметров Routine Load приведено в разделе [Doris Routine Load](../../data-operate/import/import-way/routine-load-manual).

```sql
CREATE ROUTINE LOAD automq_example_load ON users
COLUMNS(id, name, timestamp, status)
PROPERTIES
(
    "format" = "json",
    "jsonpaths" = "[\"$.id\",\"$.name\",\"$.timestamp\",\"$.status\"]"
)
FROM KAFKA
(
    "kafka_broker_list" = "127.0.0.1:9092",
    "kafka_topic" = "example_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

Основные параметры описаны ниже.

| Параметр | Пример значения | Описание |
| --- | --- | --- |
| `format` | `json` | Указывает, что загружаемые данные имеют формат JSON. |
| `jsonpaths` | `["$.id","$.name","$.timestamp","$.status"]` | Задаёт соответствие между полями JSON и полями таблицы Doris. |
| `kafka_broker_list` | `127.0.0.1:9092` | Адрес AutoMQ Bootstrap Server. При выполнении замените его фактическим адресом. |
| `kafka_topic` | `example_topic` | Topic в AutoMQ, из которого Routine Load должен читать данные. |
| `property.kafka_default_offsets` | `OFFSET_BEGINNING` | Чтение данных с начала Topic. |

## Проверка загрузки данных {#verify-data-ingestion}

Сначала проверьте состояние задания загрузки Routine Load, чтобы убедиться, что оно выполняется.

```sql
SHOW ROUTINE LOAD\G;
```

Затем выполните запрос к таблице Doris, чтобы убедиться, что тестовые данные загружены.

```sql
SELECT * FROM users;
```

```text
+------+-----------+---------------------+--------+
| id   | name      | timestamp           | status |
+------+-----------+---------------------+--------+
|    1 | Test User | 2023-11-10T12:00:00 | active |
+------+-----------+---------------------+--------+
1 row in set (0.01 sec)
```

## Примечания {#notes}

- При выполнении команд из примеров замените `127.0.0.1:9092` фактическим адресом AutoMQ Bootstrap Server.
- Поля тестовых данных JSON должны соответствовать полям таблицы Doris и настройке `jsonpaths` в Routine Load.
- Перед созданием задания Routine Load убедитесь, что Doris имеет доступ к кластеру AutoMQ.
