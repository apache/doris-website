---
{
    "title": "SeaTunnel",
    "language": "ru",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "Узнайте, как использовать SeaTunnel Doris Sink для синхронизации данных с Apache Doris и настраивать параметры Connector-V2, Flink, Spark и Stream Load.",
    "keywords": [
        "SeaTunnel Doris Sink",
        "запись из SeaTunnel в Doris",
        "Doris Stream Load",
        "синхронизация данных с Doris",
        "Connector-V2"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data integration / SeaTunnel writes to Doris -->

SeaTunnel — простая в использовании распределённая платформа интеграции данных со сверхвысокой производительностью. Она поддерживает синхронизацию больших объёмов данных в реальном времени и позволяет стабильно и эффективно синхронизировать десятки миллиардов записей в день.

Этот документ предназначен для пользователей, которым нужно синхронизировать данные из SeaTunnel с Doris. В нём для разных сценариев описано, как выбрать Doris Sink, настроить его параметры и использовать его.

## Как выбрать коннектор {#how-to-choose-a-connector}

| Сценарий использования | Рекомендуемый подход | Поддерживаемая версия или движок | Описание |
| --- | --- | --- | --- |
| Нужна запись с семантикой exactly-once или синхронизация данных CDC | Connector-V2 Doris Sink | SeaTunnel 2.3.1 и выше | Поддерживает Doris Sink, запись с семантикой exactly-once и синхронизацию данных CDC. |
| Синхронизация данных с Doris через движок Flink | Connector-V1 Flink Doris Sink | SeaTunnel 2.1.0, движок Flink | Подходит для заданий SeaTunnel, которые уже выполняются на движке Flink. |
| Синхронизация данных с Doris через движок Spark | Connector-V1 Spark Sink Doris | SeaTunnel 2.1.0, движок Spark | Подходит для заданий, которые уже выполняются на движке Spark, например для переноса данных из Hive в Doris. |

## Сценарий 1: запись в Doris с помощью Connector-V2 {#scenario-1-use-connector-v2-to-write-to-doris}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Real-time synchronization / exactly-once writes / CDC data synchronization -->

[Apache SeaTunnel Connector-V2](https://seatunnel.apache.org/docs/2.3.1/category/sink-v2) в SeaTunnel 2.3.1 поддерживает Doris Sink, запись с семантикой exactly-once и синхронизацию данных CDC.

Исходный код плагина доступен по ссылке [код плагина SeaTunnel Doris Sink](https://github.com/apache/seatunnel/tree/dev/seatunnel-connectors-v2/connector-doris).

### Настройка параметров {#parameter-configuration}

| Параметр | Тип | Обязательный | По умолчанию | Описание |
| --- | --- | --- | --- | --- |
| `fenodes` | string | Да | - | Адреса узлов FE кластера Doris в формате `fe_ip:fe_http_port,...`. |
| `username` | string | Да | - | Имя пользователя Doris. |
| `password` | string | Да | - | Пароль пользователя Doris. |
| `table.identifier` | string | Да | - | Имя таблицы Doris в формате `DBName.TableName`. |
| `sink.label-prefix` | string | Да | - | Префикс метки, используемый Stream Load. В сценарии с 2PC этот префикс должен быть глобально уникальным, чтобы гарантировать семантику EOS в SeaTunnel. |
| `sink.enable-2pc` | bool | Нет | `true` | Включает двухфазную фиксацию (2PC). Значение по умолчанию — `true`, что гарантирует семантику exactly-once. Подробнее о двухфазной фиксации см. в [руководстве по Stream Load](../../data-operate/import/import-way/stream-load-manual.md). |
| `sink.enable-delete` | bool | Нет | `false` | Включает удаление. Для использования этого параметра в таблице Doris должно быть включено пакетное удаление. В Doris 0.15+ эта функция включена по умолчанию; поддерживается только модель таблиц Unique. Подробнее см. в разделе [Пакетное удаление](../../data-operate/delete/batch-delete-manual.md). |
| `doris.config` | map | Да | - | Параметры `data_desc` для Stream Load. Дополнительные параметры приведены в [руководстве по Stream Load](../../data-operate/import/import-way/stream-load-manual.md). |

### Импорт данных в формате JSON {#import-data-in-json-format}

```text
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_json"
        doris.config = {
            format = "json"
            read_json_by_line = "true"
        }
    }
}
```

### Импорт данных в формате CSV {#import-data-in-csv-format}

```text
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_csv"
        doris.config = {
            format = "csv"
            column_separator = ","
            line_delimiter = "\n"
        }
    }
}
```

## Сценарий 2: запись в Doris с помощью Connector-V1 {#scenario-2-use-connector-v1-to-write-to-doris}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: SeaTunnel 2.1.0 / Flink engine / Spark engine -->

Apache SeaTunnel 2.1.0 поддерживает коннектор Doris, который позволяет синхронизировать данные с Doris через движок Flink или Spark.

### Запись в Doris через движок Flink {#use-the-flink-engine-to-write-to-doris}

Исходный код плагина доступен по ссылке [код плагина SeaTunnel Flink Sink Doris](https://github.com/apache/seatunnel).

#### Настройка параметров {#parameter-configuration-1}

| Параметр | Тип | Обязательный | По умолчанию | Поддерживаемый движок | Описание |
| --- | --- | --- | --- | --- | --- |
| `fenodes` | string | Да | - | Flink | HTTP-адрес FE Doris, например `127.0.0.1:8030`. |
| `database` | string | Да | - | Flink | Имя базы данных Doris, в которую выполняется запись. |
| `table` | string | Да | - | Flink | Имя таблицы Doris, в которую выполняется запись. |
| `user` | string | Да | - | Flink | Пользователь для доступа к Doris. |
| `password` | string | Да | - | Flink | Пароль пользователя для доступа к Doris. |
| `batch_size` | int | Нет | `100` | Flink | Максимальное число строк, записываемых в Doris одним пакетом. |
| `interval` | int | Нет | `1000` | Flink | Интервал сброса буфера в миллисекундах. По истечении этого интервала асинхронный поток записывает данные из буфера в Doris. Установите значение `0`, чтобы отключить периодическую запись. |
| `max_retries` | int | Нет | `1` | Flink | Число повторных попыток при ошибке записи в Doris. |
| `doris.*` | string | Нет | - | Flink | Параметры импорта Stream Load, например `doris.column_separator = ','`. Дополнительные параметры приведены в [руководстве по Stream Load](../../data-operate/import/import-way/stream-load-manual.md). |

#### Пример: запись данных из сокета в Doris {#example-write-socket-data-to-doris}

```text
env {
    execution.parallelism = 1
}

source {
    SocketStream {
        host = 127.0.0.1
        port = 9999
        result_table_name = "socket"
        field_name = "info"
    }
}

transform {
}

sink {
    DorisSink {
        fenodes = "127.0.0.1:8030"
        user = root
        password = 123456
        database = test
        table = test_tbl
        batch_size = 5
        max_retries = 1
        interval = 5000
    }
}
```

Запустите задание:

```shell
sh bin/start-seatunnel-flink.sh --config config/flink.streaming.conf
```

### Запись в Doris через движок Spark {#use-the-spark-engine-to-write-to-doris}

Исходный код плагина доступен по ссылке [код плагина SeaTunnel Spark Sink Doris](https://github.com/apache/seatunnel).

#### Настройка параметров {#parameter-configuration-2}

| Параметр | Тип | Обязательный | По умолчанию | Поддерживаемый движок | Описание |
| --- | --- | --- | --- | --- | --- |
| `fenodes` | string | Да | - | Spark | Адрес узла FE Doris, например `127.0.0.1:8030`. |
| `database` | string | Да | - | Spark | Имя базы данных Doris, в которую выполняется запись. |
| `table` | string | Да | - | Spark | Имя таблицы Doris, в которую выполняется запись. |
| `user` | string | Да | - | Spark | Пользователь для доступа к Doris. |
| `password` | string | Да | - | Spark | Пароль пользователя для доступа к Doris. |
| `batch_size` | int | Да | `100` | Spark | Число строк, отправляемых в каждом пакете при записи из Spark в Doris через Stream Load. |
| `doris.*` | string | Нет | - | Spark | HTTP-параметры Stream Load. Чтобы использовать любой параметр Stream Load, добавьте к нему префикс `doris.`, например `doris.column_separator`. Дополнительные параметры приведены в [руководстве по Stream Load](../../data-operate/import/import-way/stream-load-manual.md). |

#### Пример: перенос данных из Hive в Doris {#example-migrate-data-from-hive-to-doris}

```text
env {
    spark.app.name = "hive2doris-template"
}

spark {
    spark.sql.catalogImplementation = "hive"
}

source {
    hive {
        preSql = "select * from tmp.test"
        result_table_name = "test"
    }
}

transform {
}

sink {
    Console {
    }

    Doris {
        fenodes = "xxxx:8030"
        database = "tmp"
        table = "test"
        user = "root"
        password = "root"
        batch_size = 1000
        doris.column_separator = "\t"
        doris.columns = "date_key,date_value,day_in_year,day_in_month"
    }
}
```

Запустите задание:

```shell
sh bin/start-waterdrop-spark.sh --master local[4] --deploy-mode client --config ./config/spark.conf
```
