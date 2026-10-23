---
{
    "title": "Kudu Catalog",
    "language": "ru",
    "description": "Руководство по Kudu Catalog в Apache Doris: подключение к базе данных Kudu через платформу Trino Connector для выполнения запросов к данным таблиц Kudu и их интеграции. Поддерживаются аутентификация Kerberos и сопоставление различных типов данных, а также быстрая интеграция данных между Kudu и Doris."
}
---

## Обзор {#overview}

Kudu Catalog обеспечивает доступ к таблицам Kudu через механизм совместимости [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) с помощью Trino Kudu Connector.

:::note
- Это экспериментальная возможность, поддерживаемая начиная с версии 3.0.1.
- Эта возможность не зависит от наличия кластера Trino и использует только плагин совместимости с Trino.
:::

### Сценарии использования {#use-cases}

| Сценарий          | Статус поддержки                                    |
| ----------------- | ------------------------------------------------- |
| Интеграция данных  | Чтение данных Kudu и запись во внутренние таблицы Doris |
| Обратная запись данных   | Не поддерживается                                     |

### Совместимость версий {#version-compatibility}

- **Версия Doris**: 3.0.1 и выше
- **Версия Trino Connector**: 435
- **Версия Kudu**: сведения о поддерживаемых версиях см. в [документации Trino](https://trino.io/docs/435/connector/kudu.html)

## Быстрый старт {#quick-start}

### Шаг 1: Подготовка плагина коннектора {#step-1-prepare-connector-plugin}

Получить плагин Kudu Connector можно одним из следующих способов:

**Способ 1: Использование готового пакета (рекомендуется)**

Загрузите и распакуйте предварительно собранный пакет плагина по [этой ссылке](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724).

**Способ 2: Сборка вручную**

Если требуется самостоятельная сборка, выполните следующие действия (необходим JDK 17):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kudu
mvn clean package -Dmaven.test.skip=true
```

После сборки вы получите каталог `trino-kudu-435/` в `trino/plugin/trino-kudu/target/`.

### Шаг 2: Развёртывание плагина {#step-2-deploy-plugin}

1. Поместите каталог `trino-kudu-435/` в каталог `connectors/` в директориях установки всех FE и BE (если каталог не существует, создайте его вручную):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kudu-435
   ...
   ```

   > Путь к плагинам также можно настроить с помощью параметра `trino_connector_plugin_dir` в `fe.conf`. Например: `trino_connector_plugin_dir=/path/to/connectors/`

2. Перезапустите все узлы FE и BE, чтобы коннектор загрузился корректно.

### Шаг 3: Создание Catalog {#step-3-create-catalog}

**Базовая конфигурация (без аутентификации)**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'NONE'
);
```

**Конфигурация аутентификации Kerberos**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'KERBEROS',
    'trino.kudu.authentication.client.principal' = 'user@DOMAIN.COM',
    'trino.kudu.authentication.client.keytab' = '/path/to/kudu.keytab',
    'trino.kudu.authentication.config' = '/etc/krb5.conf',
    'trino.kudu.authentication.server.principal.primary' = 'kudu'
);
```

### Шаг 4: Запрос данных {#step-4-query-data}

После создания Catalog можно выполнять запросы к данным таблиц Kudu одним из следующих трёх способов:

```sql
-- Method 1: Query after switching to Catalog
SWITCH kudu_catalog;
USE kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- Method 2: Use two-level path
USE kudu_catalog.kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM kudu_catalog.kudu_db.kudu_tbl LIMIT 10;
```

## Настройка {#configuration}

### Параметры настройки Catalog {#catalog-configuration-parameters}

Базовый синтаксис создания Kudu Catalog:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kudu',     -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```

#### Параметры TrinoProperties {#trinoproperties-parameters}

TrinoProperties используются для настройки свойств Trino Kudu Connector и имеют префикс `trino.`. Основные параметры:

| Имя параметра                                        | Обязательный | Значение по умолчанию | Описание                            |
| ----------------------------------------------------- | -------- | ------- | -------------------------------------- |
| `trino.kudu.client.master-addresses`                  | Да      | -       | Список адресов узлов Kudu Master     |
| `trino.kudu.authentication.type`                      | Нет       | NONE    | Тип аутентификации: NONE или KERBEROS  |
| `trino.kudu.authentication.client.principal`          | Нет       | -       | principal клиента Kerberos              |
| `trino.kudu.authentication.client.keytab`             | Нет       | -       | Путь к файлу keytab Kerberos              |
| `trino.kudu.authentication.config`                    | Нет       | -       | Путь к файлу конфигурации Kerberos       |
| `trino.kudu.authentication.server.principal.primary`  | Нет       | -       | Префикс principal сервера Kudu           |

Дополнительные параметры настройки Kudu Connector см. в [официальной документации Trino](https://trino.io/docs/435/connector/kudu.html).

#### Параметры CommonProperties {#commonproperties-parameters}

CommonProperties используются для настройки общих свойств Catalog, таких как политики обновления метаданных, управление доступом и т. д. Подробную информацию см. в разделе «Общие свойства» документа [Обзор Catalog](../catalog-overview.md).

## Сопоставление типов данных {#data-type-mapping}

При использовании Kudu Catalog типы данных сопоставляются по следующим правилам:

| Тип Kudu        | Тип Trino    | Тип Doris    | Примечания                                                                                |
| ---------------- | ------------- | ------------- | ------------------------------------------------------------------------------------ |
| boolean          | boolean       | boolean       |                                                                                      |
| int8             | tinyint       | tinyint       |                                                                                      |
| int16            | smallint      | smallint      |                                                                                      |
| int32            | integer       | int           |                                                                                      |
| int64            | bigint        | bigint        |                                                                                      |
| float            | real          | float         |                                                                                      |
| double           | double        | double        |                                                                                      |
| decimal(P, S)    | decimal(P, S) | decimal(P, S) |                                                                                      |
| binary           | varbinary     | string        | Используйте функцию `HEX(col)` в запросе, чтобы отображаемые результаты совпадали с результатами Trino          |
| string           | varchar       | string        |                                                                                      |
| date             | date          | date          |                                                                                      |
| unixtime_micros  | timestamp(3)  | datetime(3)   |                                                                                      |
| other            | UNSUPPORTED   | -             | Неподдерживаемый тип                                                                     |

:::tip
Чтобы отобразить значения типа `binary` в шестнадцатеричном формате, примените функцию `HEX()` к имени столбца, например: `SELECT HEX(binary_col) FROM table`.
:::
