---
{
    "title": "Генерация TPC-DS в Hive/Iceberg",
    "language": "ru",
    "description": "Doris поддерживает использование TPCDS Connector для быстрого создания тестовых наборов данных TPCDS с помощью фреймворка, совместимого с Trino Connector."
}
---

Doris поддерживает использование [TPCDS Connector](https://trino.io/docs/current/connector/tpcds.html) для быстрого создания тестовых наборов данных TPCDS с помощью фреймворка, совместимого с [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide).

В сочетании с функцией обратной записи данных в таблицы Hive/Iceberg это позволяет быстро создавать через Doris тестовые наборы данных TPCDS для таблиц Doris, Hive и Iceberg.

В этом документе описано, как развернуть и использовать TPCDS Connector для создания тестовых наборов данных.

:::tip
Эта функция поддерживается начиная с версии Doris 3.0.0.
:::

## Компиляция TPCDS Connector {#compile-tpcds-connector}

> Требуется JDK версии 17.

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpcds
mvn clean install -DskipTests
```

После компиляции в каталоге `trino-tpcds-435/` будут находиться необходимые файлы. Этот каталог будет расположен в `trino/plugin/trino-tpcds/target/`.

Также можно напрямую скачать предварительно скомпилированный архив [trino-tpcds-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpcds-435.tar.gz) и распаковать его.

## Развёртывание TPCDS Connector {#deploy-tpcds-connector}

Поместите каталог `trino-tpcds-435/` в каталог `connectors/` в каждом из каталогов развёртывания FE и BE. (Если он отсутствует, его можно создать вручную).

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpcds-435
...
```

После развёртывания рекомендуется перезапустить узлы FE и BE, чтобы обеспечить корректную загрузку коннектора.

## Создание Catalog TPCDS {#create-tpcds-catalog}

```sql
CREATE CATALOG `tpcds` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpcds",
    "trino.tpcds.split-count" = "32"
);
```

Параметр `tpcds.split-count` задаёт степень параллелизма. Для оптимального параллелизма рекомендуется задать значение, в 2 раза превышающее число ядер на сервере BE. Это повысит эффективность генерации данных.

## Использование Catalog TPCDS {#use-tpcds-catalog}

Catalog TPCDS содержит готовые наборы данных TPCDS с различными коэффициентами масштабирования (Scale Factors). Их можно просмотреть с помощью команд `SHOW DATABASES` и `SHOW TABLES`.

```sql
mysql> SWITCH tpcds;
Query OK, 0 rows affected (0.00 sec)

mysql> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| sf1                |
| sf100              |
| sf1000             |
| sf10000            |
| sf100000           |
| sf300              |
| sf3000             |
| sf30000            |
| tiny               |
+--------------------+

mysql> USE sf1;
mysql> SHOW TABLES;
+------------------------+
| Tables_in_sf1          |
+------------------------+
| call_center            |
| catalog_page           |
| catalog_returns        |
| catalog_sales          |
| customer               |
| customer_address       |
| customer_demographics  |
| date_dim               |
| dbgen_version          |
| household_demographics |
| income_band            |
| inventory              |
| item                   |
| promotion              |
| reason                 |
| ship_mode              |
| store                  |
| store_returns          |
| store_sales            |
| time_dim               |
| warehouse              |
| web_page               |
| web_returns            |
| web_sales              |
| web_site               |
+------------------------+
```

К этим таблицам можно напрямую выполнять запросы с помощью оператора SELECT.

:::tip
Данные этих готовых наборов фактически не хранятся, а генерируются в реальном времени при выполнении запросов. Поэтому эти наборы не подходят для непосредственного тестирования производительности. Они подходят для записи данных в другие целевые таблицы (например, внутренние таблицы Doris, таблицы Hive, Iceberg и других источников данных, в которые Doris поддерживает запись) с помощью `INSERT INTO SELECT` с последующим тестированием производительности целевых таблиц.
:::

## Создание тестового набора данных TPCDS {#build-tpcds-test-data-set}

В следующем примере показано, как быстро создать тестовый набор данных TPCDS в Hive с помощью оператора CTAS:

```sql
CREATE TABLE hive.tpcds100.call_center            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.call_center           ;
CREATE TABLE hive.tpcds100.catalog_page           PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.catalog_page          ;
CREATE TABLE hive.tpcds100.catalog_returns        PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.catalog_returns       ;
CREATE TABLE hive.tpcds100.catalog_sales          PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.catalog_sales         ;
CREATE TABLE hive.tpcds100.customer               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.customer              ;
CREATE TABLE hive.tpcds100.customer_address       PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.customer_address      ;
CREATE TABLE hive.tpcds100.customer_demographics  PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.customer_demographics ;
CREATE TABLE hive.tpcds100.date_dim               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.date_dim              ;
CREATE TABLE hive.tpcds100.dbgen_version          PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.dbgen_version         ;
CREATE TABLE hive.tpcds100.household_demographics PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.household_demographics;
CREATE TABLE hive.tpcds100.income_band            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.income_band           ;
CREATE TABLE hive.tpcds100.inventory              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.inventory             ;
CREATE TABLE hive.tpcds100.item                   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.item                  ;
CREATE TABLE hive.tpcds100.promotion              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.promotion             ;
CREATE TABLE hive.tpcds100.reason                 PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.reason                ;
CREATE TABLE hive.tpcds100.ship_mode              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.ship_mode             ;
CREATE TABLE hive.tpcds100.store                  PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.store                 ;
CREATE TABLE hive.tpcds100.store_returns          PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.store_returns         ;
CREATE TABLE hive.tpcds100.store_sales            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.store_sales           ;
CREATE TABLE hive.tpcds100.time_dim               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.time_dim              ;
CREATE TABLE hive.tpcds100.warehouse              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.warehouse             ;
CREATE TABLE hive.tpcds100.web_page               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_page              ;
CREATE TABLE hive.tpcds100.web_returns            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_returns           ;
CREATE TABLE hive.tpcds100.web_sales              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_sales             ;
CREATE TABLE hive.tpcds100.web_site               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_site              ;
```

:::tip
В кластере Doris с 3 узлами BE конфигурации 16C создание набора данных TPCDS 1000 в Hive занимает примерно от 3 до 4 часов.
:::
