---
{
    "title": "Интеграция с Databricks Unity Catalog",
    "language": "ru",
    "description": "По мере того как предприятия всё активнее управляют растущими массивами данных в рамках архитектуры Lakehouse, растёт потребность в межплатформенном высокопроизводительном доступе,"
}
---

По мере того как предприятия всё активнее управляют растущими массивами данных в рамках архитектуры Lakehouse, всё острее становится потребность в межплатформенном, высокопроизводительном и контролируемом доступе к данным. Apache Doris, база данных нового поколения для аналитики в реальном времени, теперь тесно интегрирована с [Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog). Благодаря этому предприятия могут напрямую обращаться к озёрам данных под управлением Databricks и эффективно выполнять запросы к ним в рамках единой системы управления данными, обеспечивая беспрепятственное взаимодействие платформ.

**В этой документации подробно рассматриваются:**

- Настройка среды Databricks: создание External Locations, объектов Catalog и таблиц Iceberg в Databricks, а также настройка соответствующих разрешений

- Подключение Doris к Unity Catalog: подключение Doris к Databricks Unity Catalog и доступ к таблицам Iceberg

> Примечание: для использования этой функции требуется Doris версии 3.1.3 или выше.

## Настройка среды Databricks {#databricks-environment-setup}

### Создание External Location {#creating-an-external-location}

В Unity Catalog [External Location](https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-external-locations) представляет собой защищённый объект, который связывает пути в облачном объектном хранилище с учётными данными Storage Credentials. External Locations поддерживают внешний доступ, а Unity Catalog может выдавать внешним системам краткосрочные учётные данные с помощью функции Credential Vending, предоставляя им доступ к этим путям.

![unity1](/images/integrations/lakehouse/unity/unity-1.png)

В этом документе для создания External Location в AWS S3 используется AWS Quickstart.

![unity2](/images/integrations/lakehouse/unity/unity-2.png)

После создания вы увидите внешний Catalog и соответствующие учётные данные:

![unity3](/images/integrations/lakehouse/unity/unity-3.png)

### Создание Catalog {#creating-a-catalog}

Выберите в интерфейсе пункт создания Catalog.

![unity4](/images/integrations/lakehouse/unity/unity-4.png)

Введите имя Catalog. Снимите флажок `Use default storage` и выберите созданный ранее External Location.

![unity5](/images/integrations/lakehouse/unity/unity-5.png)

### Предоставление разрешения на внешнее использование схемы {#enabling-external-use-schema-permissions}

Откройте только что созданный `Catalog` → `Permissions` → `Grant`:

![unity6](/images/integrations/lakehouse/unity/unity-6.png)

Выберите `All account users` и установите флажок `EXTERNAL USE SCHEMA`.

![unity7](/images/integrations/lakehouse/unity/unity-7.png)

### Создание таблиц Iceberg и вставка данных {#creating-iceberg-tables-and-inserting-data}

Выполните следующий SQL в Databricks SQL Editor, чтобы создать таблицу Iceberg и вставить данные:

```sql
CREATE TABLE `my-unity-catalog`.default.iceberg_table (
  id int,
  name string
) USING iceberg;

INSERT INTO `my-unity-catalog`.default.iceberg_table VALUES(1, "jack");
```

### Получение токена доступа {#obtaining-access-token}

Нажмите на аватар пользователя в правом верхнем углу, перейдите на страницу `Settings` и выберите `Access tokens` в разделе `User` → `Developer`. Создайте новый токен для последующего подключения Doris к Unity Catalog. Токен представляет собой строку в формате: `dapi4f...`

## Подключение Doris к Unity Catalog {#doris-connection-to-unity-catalog}

### Создание Catalog {#creating-a-catalog-1}

```sql
-- Use oauth2 credential and vended credentials
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://dbc-xx.cloud.databricks.com:443/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.credential" = "clientid:clientsecret",
  "iceberg.rest.oauth2.server-uri" = "https://dbc-xx.cloud.databricks.com:443/oidc/v1/token",
  "iceberg.rest.oauth2.scope" = "all-apis",
  "iceberg.rest.vended-credentials-enabled" = "true"
);

-- Use PAT and vended credentials
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://<dbc-account>.cloud.databricks.com/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.token" = "<token>",
  "iceberg.rest.vended-credentials-enabled" = "true"
);

-- Use oauth2 credential and static ak/sk for accessing aws s3
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://dbc-xx.cloud.databricks.com:443/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.credential" = "clientid:clientsecret",
  "iceberg.rest.oauth2.server-uri" = "https://dbc-xx.cloud.databricks.com:443/oidc/v1/token",
  "iceberg.rest.oauth2.scope" = "all-apis",
  "s3.endpoint" = "https://s3.<region>.amazonaws.com",
  "s3.access_key" = "<ak>",
  "s3.secret_key" = "<sk>",
  "s3.region" = "<region>"
);
```

### Доступ к Catalog {#accessing-the-catalog}

После создания можно начать работу с таблицами Iceberg, хранящимися в Unity Catalog:

```sql
mysql> USE dbx_unity_catalog.`default`;
Database changed

mysql> SELECT * FROM iceberg_table;
+------+------+
| id   | name |
+------+------+
|    1 | jack |
+------+------+
1 row in set (3.32 sec)
```

### Управление таблицами Iceberg {#managing-iceberg-tables}

Через Doris также можно напрямую создавать таблицы Iceberg в Unity Catalog, управлять ими и записывать в них данные:

```sql
-- Write to existing table in Unity Catalog
INSERT INTO iceberg_table VALUES(2, "mary");

-- Create a partitioned table
CREATE TABLE partition_table (
  `ts` DATETIME COMMENT 'ts',
  `col1` BOOLEAN COMMENT 'col1',
  `pt1` STRING COMMENT 'pt1',
  `pt2` STRING COMMENT 'pt2'
)
PARTITION BY LIST (day(ts), pt1, pt2) ();

-- Insert data
INSERT INTO partition_table VALUES("2025-11-12", true, "foo", "bar");

-- View table partition information
SELECT * FROM partition_table$partitions\G
*************************** 1. row ***************************
                    partition: {"ts_day":"2025-11-12", "pt1":"foo", "pt2":"bar"}
                      spec_id: 0
                 record_count: 1
                   file_count: 1
total_data_file_size_in_bytes: 2552
 position_delete_record_count: 0
   position_delete_file_count: 0
 equality_delete_record_count: 0
   equality_delete_file_count: 0
              last_updated_at: 2025-11-18 15:20:45.964000
     last_updated_snapshot_id: 9024874735105617773
```

## Итоги {#summary}

Благодаря тесной интеграции с Databricks Unity Catalog Apache Doris позволяет предприятиям получать доступ к ключевым информационным активам в озёрах данных и анализировать их с более высокой производительностью и меньшими затратами в рамках единой системы управления данными. Эта возможность повышает согласованность архитектуры Lakehouse в целом и открывает новые возможности для аналитики в реальном времени, интерактивных запросов и сценариев применения AI. Команды по работе с данными, инженеры-аналитики и архитекторы платформ могут использовать Doris для создания более гибких и интеллектуальных приложений на основе существующих озёр данных.
