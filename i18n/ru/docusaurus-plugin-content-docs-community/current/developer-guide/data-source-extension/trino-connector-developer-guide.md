---
title: Руководство разработчика по интеграции Trino Connector
language: ru
description: "Как интегрировать Trino Connector с Apache Doris: компиляция, настройка и примеры для Kafka / Hive / MySQL / BigQuery."
keywords:
    - Apache Doris Trino Connector
    - trino-connector Catalog
    - компиляция плагинов Trino
    - trino_connector_plugin_dir
    - Kafka Connector
    - Hive Connector
    - MySQL Connector
    - BigQuery Connector
    - расширение поддержки источников данных
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Extension development -->
<!-- Applicable scenario: Data source extension / Catalog integration -->

# Руководство разработчика по интеграции Trino Connector {#trino-connector-integration-developer-guide}

Этот документ предназначен для разработчиков, которым необходимо интегрировать плагины Trino Connector с Apache Doris. В нём описано, как скомпилировать плагин Connector, настроить FE / BE, а также создать и использовать Catalog типа `trino-connector`. Основным примером служит Kafka Connector; дополнительно приведены примеры настройки распространённых плагинов, таких как Hive, MySQL и BigQuery.

## Содержание {#contents}

- [Общие сведения](#background): когда использовать фреймворк Trino Connector
- [Шаг 1 - Компиляция плагина Connector](#step-1---compile-the-connector-plugin): на примере Kafka
- [Шаг 2 - Настройка FE / BE](#step-2---configure-fe--be): каталог плагинов и отложенная загрузка
- [Шаг 3 - Создание и использование Catalog](#step-3---create-and-use-the-catalog): `CREATE CATALOG` и сопоставление свойств
- [Примеры настройки распространённых плагинов Connector](#common-connector-configuration-examples): Hive / MySQL / Kafka / BigQuery
- [Частые вопросы и типичные ошибки](#faq-and-common-errors)

---

## Общие сведения {#background}

<!-- Knowledge type: Architecture decision -->

Начиная с версии 3.0, Doris поддерживает интеграцию с плагинами Trino Connector. Благодаря богатой экосистеме плагинов Trino Connector и поддержке Catalog типа `trino-connector` Doris может подключаться к большему числу источников данных.

| Сценарий | Рекомендуемый подход |
|------|----------|
| Популярные источники данных, такие как Hive, Iceberg, Hudi, Paimon, JDBC | В первую очередь используйте **встроенный Catalog** Doris: он обеспечивает более высокую производительность, стабильность и совместимость |
| Другие источники данных, с которыми Doris пока не интегрирован | Используйте **фреймворк совместимости с Trino Connector**, чтобы быстро подключаться к дополнительным источникам данных |

> Примечание: Trino — программное обеспечение с открытым исходным кодом под лицензией Apache License 2.0, предоставляемое [Trino Software Foundation](https://trino.io/foundation). Дополнительная информация доступна на [официальном сайте Trino](https://trino.io/docs/current/).

---

## Шаг 1 - Компиляция плагина Connector {#step-1---compile-the-connector-plugin}

<!-- Knowledge type: Procedure -->

Trino не предоставляет официальных скомпилированных плагинов Connector, поэтому необходимые плагины Connector нужно скомпилировать самостоятельно.

> Примечание: сейчас Doris использует версию 435 пакета `trino-main`, поэтому рекомендуется компилировать версию 435 плагина Connector. У плагинов Connector других версий могут возникнуть проблемы совместимости. Если вы столкнётесь с проблемами, сообщите о них сообществу Apache Doris.

Рассмотрим плагин Kafka:

```bash
# 1. Clone the Trino source code
git clone https://github.com/trinodb/trino.git

# 2. Check out version 435
git checkout 435

# 3. Enter the Kafka plugin source directory
cd trino/plugin/trino-kafka

# 4. Compile the Kafka plugin
mvn clean install -DskipTests
```

После компиляции в `target/trino-kafka-435` будут находиться файлы плагина; этот каталог создаётся внутри `trino/plugin/trino-kafka/`.

> Примечание: каждый плагин Connector представляет собой **подкаталог**, а не отдельный jar-файл.

---

## Шаг 2 - Настройка FE / BE {#step-2---configure-fe--be}

<!-- Knowledge type: Configuration parameters -->

После подготовки плагина Kafka Connector необходимо указать каталог плагинов в `fe.conf` и `be.conf`, чтобы Doris мог найти плагин.

Если подготовленный на предыдущем шаге каталог `trino-kafka-435` размещён в `/path/to/connectors`, настройте параметры следующим образом:

| Файл | Параметр конфигурации | Значение по умолчанию |
|------|--------|--------|
| `fe.conf` | `trino_connector_plugin_dir=/path/to/connectors` | `${Doris_HOME}/fe/connectors` |
| `be.conf` | `trino_connector_plugin_dir=/path/to/connectors` | `${Doris_HOME}/be/connectors` |

> **Отложенная загрузка**: Doris загружает плагины Trino Connector по мере необходимости. При первом использовании Catalog типа `trino-connector` перезапускать узлы FE / BE **не требуется**: Doris загрузит плагин автоматически. Однако плагины загружаются только один раз, поэтому **после изменения содержимого каталога плагинов необходимо перезапустить узлы FE / BE**, чтобы изменения вступили в силу.

---

## Шаг 3 - Создание и использование Catalog {#step-3---create-and-use-the-catalog}

<!-- Knowledge type: Procedure -->

### 3.1 Создание Catalog Trino-Connector {#31-create-a-trino-connector-catalog}

```sql
create catalog kafka_tpch properties (
    "type"="trino-connector",
    -- The following four properties come from Trino and match the properties in Trino's etc/catalog/kafka.properties, but each must be prefixed with "trino."
    "trino.connector.name"="kafka",
    "trino.kafka.table-names"="tpch.customer,tpch.orders,tpch.lineitem,tpch.part,tpch.partsupp,tpch.supplier,tpch.nation,tpch.region",
    "trino.kafka.nodes"="localhost:9092",
    "trino.kafka.table-description-dir" = "/mnt/datadisk1/fangtiewei"
);
```

Описание свойств:

| Свойство | Описание |
|------|------|
| `type` | Тип Catalog. Необходимо задать значение `trino-connector` |
| `trino.connector.name` | Имя Trino Connector, например `kafka` |
| `trino.kafka.table-names` и другие | Эти свойства взяты из Trino, ко всем добавлен префикс `trino.`. См. [Kafka Connector](https://trino.io/docs/current/connector/kafka.html#configuration) |

Для разных плагинов Connector требуются разные свойства. См. раздел [Connectors](https://trino.io/docs/current/connector.html#connector--page-root) в официальной документации Trino.

### 3.2 Использование Catalog {#32-use-the-catalog}

После создания Catalog Trino-Connector работа с ним ничем не отличается от работы с любым другим Catalog. Переключитесь на него командой `switch kafka_tpch` и выполните запрос к соответствующему источнику данных:

```sql
switch kafka_tpch;
show databases;
select * from tpch.customer limit 10;
```

---

## Примеры настройки распространённых плагинов Connector {#common-connector-configuration-examples}

### Hive {#hive}

```sql
create catalog emr_hive properties (
    "type"="trino-connector",
    "trino.connector.name"="hive",
    "trino.hive.metastore.uri"="thrift://ip:port",
    "trino.hive.config.resources"="/path/to/core-site.xml,/path/to/hdfs-site.xml"
);
```

> Примечания для плагина Hive:
> - Необходимо указать пользователя Hadoop в параметрах JVM: `-DHADOOP_USER_NAME=user`. Его можно добавить в конец параметра `JAVA_OPTS_FOR_JDK_17` в `fe.conf` / `be.conf`, например `JAVA_OPTS_FOR_JDK_17="...-DHADOOP_USER_NAME=user"`.

### MySQL {#mysql}

```sql
create catalog trino_mysql properties (
    "type"="trino-connector",
    "trino.connector.name"="mysql",
    "trino.connection-url" = "jdbc:mysql://ip:port",
    "trino.connection-user" = "user",
    "trino.connection-password" = "password"
);
```

> Примечания для плагина MySQL:
> - Если возникает ошибка `Unknown or incorrect time zone: 'Asia/Shanghai'`, добавьте `-Duser.timezone=Etc/GMT-8` к параметрам запуска JVM. Его можно добавить в конец параметра `JAVA_OPTS_FOR_JDK_17` в `fe.conf` / `be.conf`.

### Kafka {#kafka}

```sql
create catalog kafka properties (
    "type"="trino-connector",
    "trino.connector.name"="kafka",
    "trino.kafka.nodes"="localhost:9092",
    "trino.kafka.table-description-supplier"="CONFLUENT",
    "trino.kafka.confluent-schema-registry-url"="http://localhost:8081",
    "trino.kafka.hide-internal-columns" = "false"
);
```

### BigQuery {#bigquery}

```sql
create catalog bigquery_catalog properties (
    "type"="trino-connector",
    "trino.connector.name"="bigquery",
    "trino.bigquery.project-id"="steam-circlet-388406",
    "trino.bigquery.credentials-file"="/path/to/application_default_credentials.json"
);
```

---

## Частые вопросы и типичные ошибки {#faq-and-common-errors}

<!-- Knowledge type: Troubleshooting -->

**Вопрос: я изменил плагин в `/path/to/connectors`. Почему Doris не применяет изменения?**

Ответ: Doris использует отложенную загрузку, но плагины загружаются только один раз. После изменения плагина необходимо перезапустить узлы FE / BE.

**Вопрос: что делать, если при запуске появляется ошибка несовместимости версии плагина?**

Ответ: убедитесь, что перед компиляцией вы переключились на ветку Trino `435`. Сейчас Doris использует версию 435 пакета `trino-main`, и с другими версиями могут возникнуть проблемы совместимости.

**Вопрос: что делать, если запросы через плагин Hive вызывают ошибки прав доступа или не могут получить доступ к HDFS?**

Ответ: проверьте, указан ли в `JAVA_OPTS_FOR_JDK_17` параметр `-DHADOOP_USER_NAME=user` и доступны ли для чтения файлы `core-site.xml` / `hdfs-site.xml`, на которые ссылается `trino.hive.config.resources`.

**Вопрос: что делать, если плагин MySQL сообщает об ошибке `Unknown or incorrect time zone: 'Asia/Shanghai'`?**

Ответ: добавьте `-Duser.timezone=Etc/GMT-8` в конец `JAVA_OPTS_FOR_JDK_17`.

**Вопрос: стоит ли использовать Trino Connector для Hive, Iceberg, Hudi и подобных источников данных?**

Ответ: не рекомендуется. Для этих источников данных встроенный Catalog Doris обеспечивает более высокую производительность, стабильность и совместимость. Фреймворк Trino Connector предназначен для подключения источников данных, с которыми Doris пока не интегрирован.
