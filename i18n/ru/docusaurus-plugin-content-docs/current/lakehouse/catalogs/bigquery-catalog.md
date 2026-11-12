---
{
    "title": "BigQuery Catalog",
    "language": "ru",
    "description": "Узнайте, как настроить и использовать BigQuery Catalog в Apache Doris для подключения к хранилищу данных Google BigQuery. Выполняйте запросы к данным таблиц BigQuery, интегрируйте данные и проводите аналитику в реальном времени с помощью инфраструктуры Trino Connector. Поддерживаются аутентификация Google Cloud ADC и различные сопоставления типов данных (включая сложные типы ARRAY, MAP, STRUCT). Приведены полные инструкции по установке и развёртыванию, параметры конфигурации и примеры использования, которые помогут быстро организовать обмен данными между BigQuery и Doris."
}
---

## Обзор {#overview}

BigQuery Catalog использует Trino BigQuery Connector для доступа к таблицам BigQuery через инфраструктуру совместимости [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/).

:::note
- Эта функция является экспериментальной и поддерживается начиная с версии 3.0.1.
- Для работы этой функции не требуется кластер Trino: используется только плагин совместимости с Trino.
:::

### Сценарии использования {#use-cases}

| Сценарий         | Поддержка                                    |
| ---------------- | ------------------------------------------------- |
| Интеграция данных | Чтение данных BigQuery и запись во внутренние таблицы Doris |
| Обратная запись данных | Не поддерживается                                     |

### Совместимость версий {#version-compatibility}

- **Версия Doris**: 3.0.1 и выше
- **Версия Trino Connector**: 435
- **Версия BigQuery**: сведения о поддерживаемых версиях см. в [документации Trino](https://trino.io/docs/435/connector/bigquery.html)

## Быстрый старт {#quick-start}

### Шаг 1: Подготовка плагина коннектора {#step-1-prepare-connector-plugin}

Получить плагин BigQuery Connector можно одним из следующих способов:

**Способ 1: Использование готового пакета (рекомендуется)**

Скачайте и распакуйте готовый пакет плагина [по этой ссылке](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724).

**Способ 2: Самостоятельная сборка**

Если вам нужна собственная сборка, выполните следующие действия (требуется JDK 17):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-bigquery
mvn clean install -DskipTests
```

После сборки каталог `trino-bigquery-435/` появится в `trino/plugin/trino-bigquery/target/`.

### Шаг 2: Развёртывание плагина {#step-2-deploy-plugin}

1. Поместите каталог `trino-bigquery-435/` в каталог `connectors/` в директории развёртывания каждого узла FE и BE (если каталог не существует, создайте его вручную):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-bigquery-435
   ...
   ```

   > Вы также можете задать собственный путь к плагинам, изменив параметр `trino_connector_plugin_dir` в `fe.conf`. Например: `trino_connector_plugin_dir=/path/to/connectors/`

2. Перезапустите все узлы FE и BE, чтобы коннектор загрузился корректно.

### Шаг 3: Подготовка аутентификации Google Cloud {#step-3-prepare-google-cloud-authentication}

Перед созданием Catalog необходимо настроить аутентификацию Google Cloud. Рекомендуется использовать Application Default Credentials (ADC):

1. Установите gcloud CLI: <https://cloud.google.com/sdk/docs/install>

2. Выполните следующие команды для инициализации и аутентификации:

    ```shell
    gcloud init --console-only --skip-diagnostics
    gcloud auth login
    gcloud auth application-default login
    ```

3. После успешной аутентификации файл учётных данных ADC будет создан по пути `~/.config/gcloud/application_default_credentials.json`.

### Шаг 4: Создание Catalog {#step-4-create-catalog}

**Пример базовой конфигурации**

```sql
CREATE CATALOG bigquery_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'bigquery',
    'trino.bigquery.project-id' = 'your-bigquery-project-id',
    'trino.bigquery.credentials-file' = '/path/to/application_default_credentials.json'
);
```

### Шаг 5: Запрос данных {#step-5-query-data}

После создания Catalog вы можете выполнять запросы к данным таблиц BigQuery тремя способами:

```sql
-- Method 1: Query after switching to Catalog
SWITCH bigquery_catalog;
USE bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- Method 2: Use two-level path
USE bigquery_catalog.bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM bigquery_catalog.bigquery_db.bigquery_tbl LIMIT 10;
```

## Настройка {#configuration}

### Параметры конфигурации Catalog {#catalog-configuration-parameters}

Базовый синтаксис создания BigQuery Catalog:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',             -- Required, fixed value
    'trino.connector.name' = 'bigquery',    -- Required, fixed value
    {TrinoProperties},                      -- Trino Connector related properties
    {CommonProperties}                      -- Common properties
);
```

#### Параметры TrinoProperties {#trinoproperties-parameters}

TrinoProperties используются для настройки свойств Trino BigQuery Connector и имеют префикс `trino.`. Часто используемые параметры:

| Имя параметра                        | Обязательный | Значение по умолчанию | Описание                                    |
| ------------------------------------- | -------- | ------- | ---------------------------------------------- |
| `trino.bigquery.project-id`           | Да      | -       | Идентификатор проекта BigQuery                            |
| `trino.bigquery.credentials-file`     | Да      | -       | Путь к файлу учётных данных Google Cloud             |
| `trino.bigquery.views-enabled`        | Нет       | false   | Включает поддержку представлений                 |
| `trino.bigquery.arrow-serialization.enabled` | Нет       | true    | Включает сериализацию Arrow для повышения производительности |

Дополнительные параметры конфигурации BigQuery Connector описаны в [официальной документации Trino](https://trino.io/docs/435/connector/bigquery.html).

#### Параметры CommonProperties {#commonproperties-parameters}

CommonProperties используются для настройки общих свойств Catalog, таких как политики обновления метаданных и контроль доступа. Подробную информацию см. в разделе «Общие свойства» документа [Обзор Catalog](../catalog-overview.md).

## Сопоставление типов данных {#data-type-mapping}

При использовании BigQuery Catalog типы данных сопоставляются по следующим правилам:

| Тип BigQuery | Тип Trino                      | Тип Doris    |
| ------------- | ------------------------------- | ------------- |
| boolean       | boolean                         | boolean       |
| int64         | bigint                          | bigint        |
| float64       | double                          | double        |
| numeric       | decimal(P, S)                   | decimal(P, S) |
| bignumeric    | decimal(P, S)                   | decimal(P, S) |
| string        | varchar                         | string        |
| bytes         | varbinary                       | string        |
| date          | date                            | date          |
| datetime      | timestamp(6)                    | datetime(6)   |
| time          | time(6)                         | string        |
| timestamp     | timestamp with time zone(6)     | datetime(6)   |
| geography     | varchar                         | string        |
| array         | array                           | array         |
| map           | map                             | map           |
| struct        | row                             | struct        |
