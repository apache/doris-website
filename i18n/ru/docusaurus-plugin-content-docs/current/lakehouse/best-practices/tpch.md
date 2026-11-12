---
{
    "title": "Генерация TPC-H в Hive/Iceberg",
    "language": "ru",
    "description": "Doris поддерживает использование платформы, совместимой с Trino Connector, для быстрого создания тестовых наборов данных TPCH с помощью TPCH Connector."
}
---

Doris поддерживает использование платформы, совместимой с [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide), для быстрого создания тестовых наборов данных TPCH с помощью [TPCH Connector](https://trino.io/docs/current/connector/tpch.html).

Используя функцию обратной записи данных в таблицы Hive/Iceberg, можно быстро создавать через Doris тестовые наборы данных TPCH для таблиц Doris, Hive и Iceberg.

В этом документе описано, как развернуть и использовать TPCH Connector для создания тестовых наборов данных.

:::tip
Эта функция поддерживается начиная с версии Doris 3.0.0.
:::

## Компиляция TPCH Connector {#compile-tpch-connector}

> Требуется JDK версии 17.

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpch
mvn clean install -DskipTests
```

После компиляции в `trino-tpch-435/` будут находиться результаты сборки. Этот каталог расположен внутри `trino/plugin/trino-tpch/target/`.

Также можно напрямую скачать предварительно скомпилированный архив [trino-tpch-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpch-435.tar.gz) и распаковать его.

## Развёртывание TPCH Connector {#deploy-tpch-connector}

Поместите каталог `trino-tpch-435/` в каталог `connectors/` во всех каталогах установки FE и BE. (Если он отсутствует, его можно создать вручную.)

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpch-435
...
```

После развёртывания рекомендуется перезапустить узлы FE и BE, чтобы обеспечить корректную загрузку Connector.

## Создание TPCH Catalog {#create-tpch-catalog}

```sql
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpch",
    "trino.tpch.column-naming" = "STANDARD",
    "trino.tpch.splits-per-node" = "32"
);
```

Параметр `tpch.splits-per-node` задаёт число параллельных задач. Для оптимального параллелизма рекомендуется устанавливать значение, в 2 раза превышающее число ядер на каждом сервере BE. Это повышает эффективность генерации данных.

Если `"tpch.column-naming" = "STANDARD"`, имена столбцов в таблице TPCH будут начинаться с сокращённого имени таблицы, например `l_orderkey`; в противном случае имя будет иметь вид `orderkey`.

## Использование TPCH Catalog {#use-tpch-catalog}

TPCH Catalog содержит предварительно настроенные наборы данных TPCH с различными коэффициентами масштабирования (Scale Factors), которые можно просмотреть с помощью команд `SHOW DATABASES` и `SHOW TABLES`.

```sql
mysql> SWITCH tpch;
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
+---------------+
| Tables_in_sf1 |
+---------------+
| customer      |
| lineitem      |
| nation        |
| orders        |
| part          |
| partsupp      |
| region        |
| supplier      |
+---------------+
```

К этим таблицам можно напрямую выполнять запросы с помощью оператора SELECT.

:::tip
Данные в этих предварительно настроенных наборах фактически не хранятся, а генерируются в реальном времени при выполнении запросов. Поэтому такие наборы не подходят для непосредственного тестирования производительности. Их можно записать в другие целевые таблицы (например, во внутренние таблицы Doris, Hive, Iceberg и любые другие источники данных, в которые Doris поддерживает запись) с помощью `INSERT INTO SELECT`, а затем тестировать производительность на целевых таблицах.
:::

## Создание тестового набора данных TPCH {#build-tpch-test-dataset}

В следующем примере показано, как быстро создать тестовый набор данных TPCH в Hive с помощью оператора CTAS:

```sql
CREATE TABLE hive.tpch100.customer PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.customer  ;
CREATE TABLE hive.tpch100.lineitem PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.lineitem  ;
CREATE TABLE hive.tpch100.nation   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.nation    ;
CREATE TABLE hive.tpch100.orders   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.orders    ;
CREATE TABLE hive.tpch100.part     PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.part      ;
CREATE TABLE hive.tpch100.partsupp PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.partsupp  ;
CREATE TABLE hive.tpch100.region   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.region    ;
CREATE TABLE hive.tpch100.supplier PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.supplier  ;
```

:::tip
В кластере Doris с 3 узлами BE конфигурации 16C создание набора данных TPCH 1000 в Hive занимает около 25 минут, а создание TPCH 10000 занимает от 4 до 5 часов.
:::
