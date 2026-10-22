---
{
    "title": "Delta Lake Catalog",
    "language": "ru",
    "description": "Руководство пользователя Delta Lake Catalog в Apache Doris: подключение к озеру данных Delta Lake через инфраструктуру Trino Connector для выполнения запросов к данным таблиц Delta Lake и их интеграции. Поддерживаются Hive Metastore, сопоставление различных типов данных и быстрая интеграция Delta Lake с Doris."
}
---

## Обзор {#overview}

Delta Lake Catalog использует инфраструктуру совместимости [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) с Trino Delta Lake Connector для доступа к таблицам Delta Lake.

:::note
- Это экспериментальная функция, поддерживаемая начиная с версии 3.0.1.
- Для этой функции не требуется кластер Trino: используется только плагин совместимости с Trino.
:::

### Сценарии использования {#use-cases}

| Сценарий | Поддержка |
| -------- | -------------- |
| Интеграция данных | Чтение данных Delta Lake и запись во внутренние таблицы Doris |
| Обратная запись данных | Не поддерживается |

### Совместимость версий {#version-compatibility}

- **Версия Doris**: 3.0.1 и выше
- **Версия Trino Connector**: 435
- **Версия Delta Lake**: сведения о поддерживаемых версиях см. в [документации Trino](https://trino.io/docs/435/connector/delta-lake.html)

## Быстрый старт {#quick-start}

### Шаг 1: Подготовка плагина коннектора {#step-1-prepare-connector-plugin}

Получить плагин Delta Lake Connector можно одним из следующих способов:

**Способ 1: Использование готового пакета (рекомендуется)**

Скачайте готовые пакеты [trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz) и [hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz) и распакуйте их.

**Способ 2: Сборка вручную**

Если необходимо собрать плагин самостоятельно, выполните следующие действия (требуется JDK 17):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-delta-lake
mvn clean install -DskipTests
cd ../../lib/trino-hdfs
mvn clean install -DskipTests
```

После сборки вы получите каталог `trino-delta-lake-435` в `trino/plugin/trino-delta-lake/target/`, а также каталог `hdfs` в `trino/lib/trino-hdfs/target/`.

### Шаг 2: Развёртывание плагина {#step-2-deploy-plugin}

1. Поместите каталог `trino-delta-lake-435/` в каталог `connectors/` в директориях развёртывания всех FE и BE (если каталог отсутствует, создайте его вручную):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-delta-lake-435
   │           ├── hdfs
   ...
   ```

   > Вы также можете задать собственный путь к плагинам, изменив параметр `trino_connector_plugin_dir` в `fe.conf`. Например: `trino_connector_plugin_dir=/path/to/connectors/`

2. Перезапустите все узлы FE и BE, чтобы обеспечить корректную загрузку коннектора.

### Шаг 3: Создание Catalog {#step-3-create-catalog}

**Базовая конфигурация**

```sql
CREATE CATALOG delta_lake_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'delta_lake',
    'trino.hive.metastore' = 'thrift',
    'trino.hive.metastore.uri' = 'thrift://ip:port',
    'trino.hive.config.resources' = '/path/to/core-site.xml,/path/to/hdfs-site.xml'
);
```

**Описание конфигурации**

- `trino.hive.metastore`: тип службы метаданных; поддерживаются `thrift` (Hive Metastore) и другие типы.
- `trino.hive.metastore.uri`: адрес службы Hive Metastore
- `trino.hive.config.resources`: путь к файлу конфигурации Hadoop; несколько файлов указываются через запятую

Дополнительные параметры конфигурации см. в разделе «Описание конфигурации» ниже или в [официальной документации Trino](https://trino.io/docs/435/connector/delta-lake.html).

### Шаг 4: Запрос данных {#step-4-query-data}

После создания Catalog можно выполнять запросы к данным таблиц Delta Lake одним из следующих трёх способов:

```sql
-- Method 1: Switch to Catalog then query
SWITCH delta_lake_catalog;
USE delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- Method 2: Use two-level path
USE delta_lake_catalog.delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM delta_lake_catalog.delta_lake_db.delta_lake_tbl LIMIT 10;
```

## Описание конфигурации {#configuration-description}

### Параметры настройки Catalog {#catalog-configuration-parameters}

Базовый синтаксис создания Delta Lake Catalog:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',            -- Required, fixed value
    'trino.connector.name' = 'delta_lake', -- Required, fixed value
    {TrinoProperties},                     -- Trino Connector related properties
    {CommonProperties}                     -- Common properties
);
```

#### Параметры TrinoProperties {#trinoproperties-parameters}

TrinoProperties используются для настройки свойств Trino Delta Lake Connector. Эти свойства имеют префикс `trino.`. Основные параметры:

| Имя параметра | Обязательный | Значение по умолчанию | Описание |
| -------------- | -------- | ------------- | ----------- |
| `trino.hive.metastore` | Да | - | Тип службы метаданных, например `thrift` |
| `trino.hive.metastore.uri` | Да | - | Адрес службы Hive Metastore |
| `trino.hive.config.resources` | Нет | - | Путь к файлу конфигурации Hadoop; несколько файлов указываются через запятую |
| `trino.delta.hide-non-delta-tables` | Нет | false | Скрывать ли таблицы, не относящиеся к Delta Lake |

Дополнительные параметры конфигурации Delta Lake Connector см. в [официальной документации Trino](https://trino.io/docs/435/connector/delta-lake.html).

#### Параметры CommonProperties {#commonproperties-parameters}

CommonProperties используются для настройки общих свойств Catalog, таких как политики обновления метаданных, управление доступом и т. д. Подробные сведения см. в разделе «Общие свойства» документа [Обзор Catalog](../catalog-overview.md).

## Сопоставление типов данных {#data-type-mapping}

При использовании Delta Lake Catalog типы данных сопоставляются по следующим правилам:

| Тип Delta Lake | Тип Trino | Тип Doris | Примечания |
| --------------- | ---------- | ---------- | ----- |
| boolean | boolean | boolean | |
| int | int | int | |
| byte | tinyint | tinyint | |
| short | smallint | smallint | |
| long | bigint | bigint | |
| float | real | float | |
| double | double | double | |
| decimal(P, S) | decimal(P, S) | decimal(P, S) | |
| string | varchar | string | |
| binary | varbinary | string | |
| date | date | date | |
| timestamp_ntz | timestamp(N) | datetime(N) | |
| timestamp | timestamp with time zone(N) | datetime(N) | |
| array | array | array | |
| map | map | map | |
| struct | row | struct | |
