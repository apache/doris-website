---
{
    "title": "Интеграция данных между Doris и MaxCompute",
    "language": "ru",
    "description": "Организуйте двунаправленную интеграцию данных между Apache Doris и Alibaba Cloud MaxCompute с помощью MaxCompute Catalog. Поддержка импорта данных, обратной записи и управления базами данных и таблицами помогает предприятиям построить эффективную архитектуру lakehouse."
}
---

В этом документе описано, как организовать интеграцию данных между Apache Doris и Alibaba Cloud MaxCompute с помощью [MaxCompute Catalog](../catalogs/maxcompute-catalog.md):

- **Импорт данных**: быстрый импорт данных из MaxCompute в Doris для анализа.
- **Обратная запись данных** (4.1.0+): запись результатов анализа или данных из других источников, находящихся в Doris, обратно в MaxCompute.
- **Управление базами данных и таблицами** (4.1.0+): создание баз данных и таблиц MaxCompute и управление ими непосредственно в Doris.

Этот документ основан на Apache Doris версии 2.1.9. Для некоторых функций требуется версия 4.1.0 или более поздняя.

## Подготовка среды {#environment-preparation}

### 01 Включение MaxCompute Open Storage API {#01-enable-maxcompute-open-storage-api}

В [консоли MaxCompute](https://maxcompute.console.aliyun.com/) откройте в левом меню `Tenant Management` -> `Tenant Properties` -> включите `Open Storage (Storage API) Switch`

### 02 Предоставление разрешений MaxCompute {#02-grant-maxcompute-permissions}

Doris использует AK/SK для доступа к сервисам MaxCompute. Убедитесь, что у пользователя IAM, которому принадлежат AK/SK, есть следующие роли или разрешения для сервиса MaxCompute:

```json
{
    "Statement": [
        {
            "Action": [
                "odps:List",
                "odps:Usage"
            ],
            "Effect": "Allow",
            "Resource": ["acs:odps:*:regions/*/quotas/pay-as-you-go"]
        }
    ],
    "Version": "1"
}
```

### 03 Проверка сетевой среды Doris и MaxCompute {#03-verify-doris-and-maxcompute-network-environment}

Настоятельно рекомендуется размещать кластер Doris и сервис MaxCompute в одной VPC с надлежащим образом настроенными группами безопасности.

Примеры в этом документе протестированы при размещении в одной сети VPC.

## Импорт данных MaxCompute {#importing-maxcompute-data}

### 01 Создание Catalog {#01-create-catalog}

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx"
);
```

Для поддержки иерархии Schema (3.1.3+):

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx",
    "mc.enable.namespace.schema" = "true"
);
```

Подробнее см. в документации [MaxCompute Catalog](../catalogs/maxcompute-catalog.md).

### 02 Импорт набора данных TPCH {#02-import-tpch-dataset}

В качестве примера используем набор данных TPCH 100 из общедоступных наборов данных MaxCompute (данные уже импортированы в MaxCompute). Для импорта данных MaxCompute в Doris используем оператор `CREATE TABLE AS SELECT`.

Этот набор данных содержит 7 таблиц. Самая большая таблица `lineitem` содержит 16 столбцов, 600,037,902 строк и занимает примерно 30GB дискового пространства.

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE tpch_100g;
-- ingest data
CREATE TABLE tpch_100g.lineitem AS SELECT * FROM mc.selectdb_test.lineitem;
CREATE TABLE tpch_100g.nation AS SELECT * FROM mc.selectdb_test.nation;
CREATE TABLE tpch_100g.orders AS SELECT * FROM mc.selectdb_test.orders;
CREATE TABLE tpch_100g.part AS SELECT * FROM mc.selectdb_test.part;
CREATE TABLE tpch_100g.partsupp AS SELECT * FROM mc.selectdb_test.partsupp;
CREATE TABLE tpch_100g.region AS SELECT * FROM mc.selectdb_test.region;
CREATE TABLE tpch_100g.supplier AS SELECT * FROM mc.selectdb_test.supplier;
```

В кластере Doris с одним BE (16C 64G) последовательное выполнение указанных выше операций занимает примерно 6-7 минут.

### 03 Импорт набора данных GitHub Event {#03-import-github-event-dataset}

В качестве примера используем набор данных GitHub Event из общедоступных наборов данных MaxCompute (данные уже импортированы в MaxCompute). Для импорта данных MaxCompute в Doris используем оператор `CREATE TABLE AS SELECT`.

Здесь выбираем данные из 365 партиций таблицы `dwd_github_events_odps` за период с `2015-01-01` по `2016-01-01`. Данные содержат 32 столбца, 212,786,803 строки и занимают примерно 10GB дискового пространства.

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE github_events;
-- ingest data
CREATE TABLE github_events.dwd_github_events_odps
AS SELECT * FROM mc.github_events.dwd_github_events_odps
WHERE ds BETWEEN '2015-01-01' AND '2016-01-01';
```

В кластере Doris с одним BE (16C 64G) выполнение указанной выше операции занимает примерно 2 минуты.

## Обратная запись данных в MaxCompute (4.1.0+) {#writing-data-back-to-maxcompute-410}

Начиная с версии 4.1.0, Doris поддерживает обратную запись данных в MaxCompute. Эта функция подходит для следующих сценариев:

- **Обратная запись результатов анализа**: после завершения анализа данных в Doris результаты записываются обратно в MaxCompute для использования другими системами.
- **Обработка данных**: вычислительные возможности Doris используются для ETL-обработки данных, а обработанные данные сохраняются в MaxCompute.
- **Интеграция данных из разных источников**: данные из нескольких источников объединяются в Doris и записываются в MaxCompute для централизованного управления.

:::note
- Это экспериментальная функция, доступная начиная с версии 4.1.0.
- Поддерживается запись в партиционированные и непартиционированные таблицы.
- Запись в кластеризованные и транзакционные таблицы, Delta Tables и внешние таблицы не поддерживается.
:::

### 01 INSERT INTO: добавление данных {#01-insert-into-append-write}

Операция INSERT добавляет данные в целевую таблицу MaxCompute.

```sql
-- Switch to MaxCompute Catalog
SWITCH mc;

-- Insert a single row of data
INSERT INTO mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- Import data from Doris internal table to MaxCompute
INSERT INTO mc_db.mc_tbl SELECT col1, col2 FROM internal.db1.tbl1;

-- Write to specific columns
INSERT INTO mc_db.mc_tbl(col1, col2) VALUES (val1, val2);

-- Write to specific partition (you can specify only some partition columns, with the rest written dynamically)
INSERT INTO mc_db.mc_tbl PARTITION(ds='20250201') SELECT id, name FROM internal.db1.source_tbl;
```

### 02 INSERT OVERWRITE: перезапись данных {#02-insert-overwrite-overwrite-write}

INSERT OVERWRITE полностью заменяет существующие данные в таблице новыми.

```sql
-- Full table overwrite
INSERT OVERWRITE TABLE mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- Overwrite from another table
INSERT OVERWRITE TABLE mc_db.mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Overwrite specific partition
INSERT OVERWRITE TABLE mc_db.mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```

### 03 CTAS: создание таблицы и запись данных {#03-ctas-create-table-and-write}

С помощью оператора `CREATE TABLE AS SELECT` можно создать новую таблицу в MaxCompute и записать в неё данные.

```sql
-- Create table in MaxCompute and import data
CREATE TABLE mc_db.mc_new_tbl AS SELECT * FROM internal.db1.source_tbl;
```

## Управление базами данных и таблицами (4.1.0+) {#databasetable-management-410}

Начиная с версии 4.1.0, Doris поддерживает создание и удаление баз данных и таблиц непосредственно в MaxCompute. Эта функция подходит для следующих сценариев:

- **Централизованное управление данными**: метаданными из нескольких источников данных можно централизованно управлять в Doris без перехода в консоль MaxCompute.
- **Автоматизированные конвейеры обработки данных**: динамическое создание целевых таблиц в процессах ETL обеспечивает сквозную автоматизацию.

:::note
- Это экспериментальная функция, доступная начиная с версии 4.1.0.
- Эта функция доступна, только если свойству `mc.enable.namespace.schema` присвоено значение `true`.
- Поддерживается создание и удаление партиционированных и непартиционированных таблиц.
- Создание кластеризованных и транзакционных таблиц, Delta Tables и внешних таблиц не поддерживается.
:::

### 01 Создание и удаление базы данных {#01-create-and-drop-database}

```sql
-- Switch to MaxCompute Catalog
SWITCH mc;

-- Create Schema
CREATE DATABASE IF NOT EXISTS mc_schema;

-- Create using fully qualified name
CREATE DATABASE IF NOT EXISTS mc.mc_schema;

-- Drop Schema (will also delete all tables within it)
DROP DATABASE IF EXISTS mc.mc_schema;
```

:::caution
При удалении базы данных MaxCompute также удаляются все содержащиеся в ней таблицы. Будьте осторожны.
:::

### 02 Создание и удаление таблицы {#02-create-and-drop-table}

```sql
-- Create non-partitioned table
CREATE TABLE mc_schema.mc_tbl1 (
    id INT,
    name STRING,
    amount DECIMAL(18, 6),
    create_time DATETIME
);

-- Create partitioned table
CREATE TABLE mc_schema.mc_tbl2 (
    id INT,
    val STRING,
    ds STRING,
    region STRING
)
PARTITION BY (ds, region)();

-- Drop table (will also delete data, including partition data)
DROP TABLE IF EXISTS mc_schema.mc_tbl1;
```

Подробнее см. в документации [MaxCompute Catalog](../catalogs/maxcompute-catalog.md).
