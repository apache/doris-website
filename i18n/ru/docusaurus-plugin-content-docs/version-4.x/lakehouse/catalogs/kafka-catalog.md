---
{
    "title": "Kafka Catalog",
    "language": "ru",
    "description": "Руководство по Kafka Catalog в Apache Doris: подключение к потокам данных Kafka через платформу Trino Connector для выполнения запросов к данным Topic Kafka и их интеграции. Поддержка Schema Registry и различных форматов данных для быстрой интеграции данных Kafka и Doris."
}
---

## Обзор {#overview}

Kafka Catalog использует Trino Kafka Connector через платформу совместимости [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) для доступа к данным Topic Kafka.

:::note
- Это экспериментальная функция, доступная начиная с версии 3.0.1.
- Эта функция не зависит от наличия кластера Trino и использует только совместимые с Trino плагины.
:::

### Сценарии использования {#use-cases}

| Сценарий | Поддержка |
| -------- | -------------- |
| Интеграция данных | Чтение данных Topic Kafka и запись во внутренние таблицы Doris |
| Обратная запись данных | Не поддерживается |

### Совместимость версий {#version-compatibility}

- **Версия Doris**: 3.0.1 и выше
- **Версия Trino Connector**: 435
- **Версия Kafka**: сведения о поддерживаемых версиях см. в [документации Trino](https://trino.io/docs/435/connector/kafka.html)

## Быстрый старт {#quick-start}

### Шаг 1: Подготовка плагина коннектора {#step-1-prepare-connector-plugin}

Получить плагин Kafka Connector можно одним из следующих способов:

**Способ 1: Использование готового пакета (рекомендуется)**

Скачайте и распакуйте готовый пакет плагина по [этой ссылке](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724).

**Способ 2: Сборка вручную**

Если требуется самостоятельная сборка, выполните следующие действия (необходим JDK 17):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kafka
mvn clean package -Dmaven.test.skip=true
```

После сборки каталог `trino-kafka-435/` будет находиться в каталоге `trino/plugin/trino-kafka/target/`.

### Шаг 2: Развёртывание плагина {#step-2-deploy-plugin}

1. Поместите каталог `trino-kafka-435/` в каталог `connectors/` в каждом каталоге установки FE и BE (если каталог отсутствует, создайте его вручную):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kafka-435
   ...
   ```

   > Путь к плагинам также можно настроить с помощью параметра `trino_connector_plugin_dir` в файле `fe.conf`. Например: `trino_connector_plugin_dir=/path/to/connectors/`

2. Перезапустите все узлы FE и BE, чтобы коннектор корректно загрузился.

### Шаг 3: Создание Catalog {#step-3-create-catalog}

**Базовая конфигурация**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.table-names' = 'test_db.topic_name',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**Использование файла конфигурации**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**Настройка схемы по умолчанию**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.default-schema' = 'default_db',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

### Шаг 4: Выполнение запросов к данным {#step-4-query-data}

После создания Catalog можно выполнять запросы к данным Topic Kafka одним из трёх способов:

```sql
-- Method 1: Switch to catalog and query
SWITCH kafka;
USE kafka_schema;
SELECT * FROM topic_name LIMIT 10;

-- Method 2: Use two-level path
USE kafka.kafka_schema;
SELECT * FROM topic_name LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM kafka.kafka_schema.topic_name LIMIT 10;
```

## Интеграция с Schema Registry {#schema-registry-integration}

Kafka Catalog поддерживает автоматическое получение схем через Confluent Schema Registry, что избавляет от необходимости вручную определять структуру таблиц.

### Настройка Schema Registry {#configure-schema-registry}

**Базовая аутентификация**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
    'trino.kafka.table-description-supplier' = 'CONFLUENT',
    'trino.kafka.confluent-schema-registry-url' = 'http://<schema-registry-host>:<schema-registry-port>',
    'trino.kafka.confluent-schema-registry-auth-type' = 'BASIC_AUTH',
    'trino.kafka.confluent-schema-registry.basic-auth.username' = 'admin',
    'trino.kafka.confluent-schema-registry.basic-auth.password' = 'admin123',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**Полный пример конфигурации**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
    'trino.kafka.default-schema' = 'nrdp',
    'trino.kafka.table-description-supplier' = 'CONFLUENT',
    'trino.kafka.confluent-schema-registry-url' = 'http://<schema-registry-host>:<schema-registry-port>',
    'trino.kafka.confluent-schema-registry-auth-type' = 'BASIC_AUTH',
    'trino.kafka.confluent-schema-registry.basic-auth.username' = 'admin',
    'trino.kafka.confluent-schema-registry.basic-auth.password' = 'admin123',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties',
    'trino.kafka.confluent-schema-registry-subject-mapping' = 'nrdp.topic1:NRDP.topic1',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

### Параметры Schema Registry {#schema-registry-parameters}

| Имя параметра | Обязательный | Значение по умолчанию | Описание |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.table-description-supplier` | Нет | - | Установите значение `CONFLUENT`, чтобы включить поддержку Schema Registry |
| `trino.kafka.confluent-schema-registry-url` | Да* | - | Адрес сервиса Schema Registry |
| `trino.kafka.confluent-schema-registry-auth-type` | Нет | NONE | Тип аутентификации: NONE, BASIC_AUTH, BEARER |
| `trino.kafka.confluent-schema-registry.basic-auth.username` | Нет | - | Имя пользователя для Basic Auth |
| `trino.kafka.confluent-schema-registry.basic-auth.password` | Нет | - | Пароль для Basic Auth |
| `trino.kafka.confluent-schema-registry-subject-mapping` | Нет | - | Сопоставление имён Subject; формат: `<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>` |

:::tip
При использовании Schema Registry Doris автоматически получает из Schema Registry информацию о схеме Topic, поэтому создавать структуру таблиц вручную не требуется.
:::

### Сопоставление Subject {#subject-mapping}

В некоторых случаях имя Subject, зарегистрированное в Schema Registry, может не совпадать с именем Topic в Kafka, из-за чего запросы к данным невозможны. В таких случаях необходимо вручную указать соответствие с помощью `confluent-schema-registry-subject-mapping`.

```sql
-- Map schema.topic to SCHEMA.topic Subject in Schema Registry
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>'
```

Здесь `db1` и `tbl1` обозначают фактические имена базы данных и таблицы, отображаемые в Doris, а `topic_name1` обозначает фактическое имя Topic в Kafka (с учётом регистра).

Несколько сопоставлений можно разделить запятыми:

```sql
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>'
```

## Конфигурация {#configuration}

### Параметры конфигурации Catalog {#catalog-configuration-parameters}

Базовый синтаксис создания Kafka Catalog:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kafka',    -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```

#### Параметры TrinoProperties {#trinoproperties-parameters}

TrinoProperties задают параметры Trino Kafka Connector с префиксом `trino.`. Часто используемые параметры:

| Имя параметра | Обязательный | Значение по умолчанию | Описание |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.nodes` | Да | - | Список адресов узлов Kafka Broker; формат: `host1:port1,host2:port2` |
| `trino.kafka.table-names` | Нет | - | Список Topic для сопоставления; формат: `schema.topic1,schema.topic2` |
| `trino.kafka.default-schema` | Нет | default | Имя схемы по умолчанию |
| `trino.kafka.hide-internal-columns` | Нет | true | Следует ли скрывать внутренние столбцы Kafka (например, `_partition_id`, `_partition_offset` и т. д.) |
| `trino.kafka.config.resources` | Нет | - | Путь к файлу конфигурации клиента Kafka |
| `trino.kafka.table-description-supplier` | Нет | - | Поставщик структуры таблиц; установите значение `CONFLUENT`, чтобы использовать Schema Registry |
| `trino.kafka.confluent-schema-registry-url` | Нет | - | Адрес сервиса Schema Registry |

Другие параметры конфигурации Kafka Connector см. в [официальной документации Trino](https://trino.io/docs/435/connector/kafka.html).

#### Параметры CommonProperties {#commonproperties-parameters}

CommonProperties задают общие свойства Catalog, например политики обновления метаданных и управление правами доступа. Подробности см. в разделе «Общие свойства» документа [Обзор Catalog](../catalog-overview.md).

### Настройка клиента Kafka {#kafka-client-configuration}

Если необходимо настроить расширенные параметры клиента Kafka (например, аутентификацию, SSL и т. д.), их можно указать в файле конфигурации. Создайте файл конфигурации (например, `kafka-client.properties`):

```properties
# ============================================
# Kerberos/SASL Authentication Configuration
# ============================================
sasl.mechanism=GSSAPI
sasl.kerberos.service.name=kafka

# JAAS Configuration - Using keytab method
sasl.jaas.config=com.sun.security.auth.module.Krb5LoginModule required \
    useKeyTab=true \
    storeKey=true \
    useTicketCache=false \
    serviceName="kafka" \
    keyTab="/opt/trino/security/keytabs/kafka.keytab" \
    principal="kafka@EXAMPLE.COM";

# ============================================
# Avro Deserializer Configuration
# ============================================
key.deserializer=io.confluent.kafka.serializers.KafkaAvroDeserializer
value.deserializer=io.confluent.kafka.serializers.KafkaAvroDeserializer
```

Затем укажите файл конфигурации при создании Catalog:

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties'
);
```

## Сопоставление типов данных {#data-type-mapping}

При использовании Kafka Catalog типы данных сопоставляются по следующим правилам:

| Тип Kafka/Avro | Тип Trino | Тип Doris | Примечания |
| --------------- | ---------- | ---------- | ----- |
| boolean | boolean | boolean | |
| int | integer | int | |
| long | bigint | bigint | |
| float | real | float | |
| double | double | double | |
| bytes | varbinary | string | Используйте функцию `HEX(col)` для запросов |
| string | varchar | string | |
| array | array | array | |
| map | map | map | |
| record | row | struct | Сложная вложенная структура |
| enum | varchar | string | |
| fixed | varbinary | string | |
| null | - | - | |

:::tip
- Для типа `bytes` используйте функцию `HEX()` для отображения в шестнадцатеричном формате.
- Типы данных, поддерживаемые Kafka Catalog, зависят от используемого формата сериализации (JSON, Avro, Protobuf и т. д.) и конфигурации Schema Registry.
:::

## Внутренние столбцы Kafka {#kafka-internal-columns}

Kafka Connector предоставляет внутренние столбцы для доступа к метаданным сообщений Kafka:

| Имя столбца | Тип | Описание |
| ----------- | ---- | ----------- |
| `_partition_id` | bigint | ID раздела, в котором находится сообщение |
| `_partition_offset` | bigint | Смещение сообщения в разделе |
| `_message_timestamp` | timestamp | Временная метка сообщения |
| `_key` | varchar | Ключ сообщения |
| `_key_corrupt` | boolean | Повреждён ли ключ |
| `_key_length` | bigint | Длина ключа в байтах |
| `_message` | varchar | Исходное содержимое сообщения |
| `_message_corrupt` | boolean | Повреждено ли сообщение |
| `_message_length` | bigint | Длина сообщения в байтах |
| `_headers` | map | Информация о заголовках сообщения |

По умолчанию эти внутренние столбцы скрыты. Чтобы выполнять запросы к ним, при создании Catalog укажите:

```sql
'trino.kafka.hide-internal-columns' = 'false'
```

Пример запроса:

```sql
SELECT 
    _partition_id,
    _partition_offset,
    _message_timestamp,
    *
FROM kafka.schema.topic_name
LIMIT 10;
```

## Ограничения {#limitations}

1. **Доступ только для чтения**: Kafka Catalog поддерживает только чтение данных; операции записи (INSERT, UPDATE, DELETE) не поддерживаются.

2. **Настройка имён таблиц**: если Schema Registry не используется, необходимо явно указать список Topic, к которым нужно обращаться, с помощью параметра `trino.kafka.table-names`.

3. **Определение схемы**:
   - При использовании Schema Registry информация о схеме автоматически получается из Schema Registry.
   - Если Schema Registry не используется, необходимо вручную создать определения таблиц или использовать файлы описания Topic для Trino.

4. **Формат данных**: поддерживаемые форматы данных зависят от способа сериализации, используемого в Topic (JSON, Avro, Protobuf и т. д.). Подробности см. в [официальной документации Trino](https://trino.io/docs/435/connector/kafka.html).

5. **Влияние на производительность**:
   - Kafka Catalog читает данные Kafka в реальном времени; запросы к большим объёмам данных могут снижать производительность.
   - Рекомендуется использовать предложение `LIMIT` или условия фильтрации по времени, чтобы ограничить объём сканируемых данных.

## Отладка функциональности {#feature-debugging}

С помощью [этого примера](https://github.com/morningman/demo-env/tree/main/kafka) можно быстро развернуть среду Kafka для проверки функциональности.

## Ссылки {#references}

- [Официальная документация Trino Kafka Connector](https://trino.io/docs/435/connector/kafka.html)
- [Руководство по разработке Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/)
- [Документация Confluent Schema Registry](https://docs.confluent.io/platform/current/schema-registry/index.html)
