---
{
    "title": "Использование Doris и Paimon",
    "language": "ru",
    "description": "Data Lakehouse, новая открытая архитектура управления данными, сочетает высокую производительность и возможности хранилищ данных по обработке в реальном времени с "
}
---

Data Lakehouse, новая открытая архитектура управления данными, сочетает высокую производительность и возможности хранилищ данных по обработке в реальном времени с низкой стоимостью и гибкостью озёр данных. Это помогает пользователям удобнее решать разнообразные задачи обработки и анализа данных. Такая архитектура всё шире применяется в корпоративных системах больших данных.

В последних версиях Apache Doris расширил интеграцию с озёрами данных и сформировал зрелое решение Data Lakehouse.

- Начиная с версии 0.15, в Apache Doris появились внешние таблицы Hive и Iceberg, что позволило изучить возможности совместного использования с Apache Iceberg для работы с озёрами данных.
- Начиная с версии 1.2, Apache Doris официально представил функцию Multi-Catalog, обеспечивающую автоматическое сопоставление метаданных и доступ к данным из различных источников, а также множество оптимизаций производительности чтения внешних данных и выполнения запросов. Теперь Doris обладает всеми необходимыми возможностями для построения быстрой и удобной архитектуры Lakehouse.
- В версии 2.1 архитектура Data Lakehouse в Apache Doris была значительно усовершенствована: расширены возможности чтения и записи основных форматов озёр данных (Hudi, Iceberg, Paimon и др.), добавлены совместимость с несколькими диалектами SQL и возможность плавного перехода с существующих систем на Apache Doris. Для задач исследования данных и чтения больших объёмов данных в Doris интегрирован высокоскоростной интерфейс чтения Arrow Flight, что позволило повысить эффективность передачи данных в 100 раз.

![Построение Lakehouse с помощью Doris и Paimon](/images/lakehouse-architecture-for-doris-and-paimon.png)

## Apache Doris & Paimon {#apache-doris--paimon}

Apache Paimon представляет собой формат озера данных, который сочетает преимущества форматов озёр данных и структур LSM, обеспечивая эффективные потоковые обновления в реальном времени в архитектуре озера данных. Благодаря этому Paimon позволяет эффективно управлять данными и анализировать их в реальном времени, создавая прочную основу для построения архитектуры Data Lakehouse с обработкой в реальном времени.

Чтобы в полной мере использовать возможности Paimon и повысить эффективность запросов к его данным, Apache Doris обеспечивает нативную поддержку ряда новейших функций Paimon:

- Поддержка различных типов Catalog Paimon, таких как Hive Metastore и FileSystem.
- Нативная поддержка функции Primary Key Table Read Optimized из Paimon 0.6.
- Нативная поддержка функции Primary Key Table Deletion Vector из Paimon 0.8.

Высокопроизводительный механизм выполнения запросов Apache Doris в сочетании с эффективными потоковыми обновлениями Apache Paimon в реальном времени позволяет пользователям получить следующие возможности:

- Загрузка данных в озеро в реальном времени: благодаря модели LSM-Tree в Paimon задержку поступления данных в озеро можно сократить до минутного уровня. Кроме того, Paimon поддерживает различные способы обновления данных, включая агрегацию, дедупликацию и частичное обновление столбцов, делая поток данных более гибким и эффективным.
- Высокопроизводительная обработка и анализ данных: такие технологии Paimon, как Append Only Table, Read Optimized и Deletion Vector, могут легко интегрироваться с мощным механизмом выполнения запросов Doris, обеспечивая быстрые запросы и анализ данных озера.

В дальнейшем Apache Doris будет постепенно добавлять поддержку других расширенных возможностей Apache Paimon, включая Time Travel и инкрементальное чтение данных, чтобы совместно создать единую высокопроизводительную платформу Lakehouse с обработкой в реальном времени.

В этой статье описано, как быстро развернуть тестовую и демонстрационную среду Apache Doris + Apache Paimon в Docker и использовать различные функции.

Дополнительные сведения см. в разделе [Paimon Catalog](../catalogs/paimon-catalog.mdx)

## Руководство пользователя {#user-guide}

Все скрипты и код, упомянутые в этой статье, доступны по адресу: [https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon](https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon)

### 01 Подготовка окружения {#01-environment-preparation}

В этой статье для развёртывания используется Docker Compose со следующими компонентами и версиями:

| Компонент | Версия |
| --- | --- |
| Apache Doris | По умолчанию 2.1.5, можно изменить |
| Apache Paimon | 0.8 |
| Apache Flink | 1.18 |
| MinIO | RELEASE.2024-04-29T09-56-05Z |

### 02 Развёртывание окружения {#02-environment-deployment}

1. Запустите все компоненты

	`bash ./start_all.sh`

2. После запуска можно использовать следующие скрипты для входа в командную строку Flink или Doris:

	```
	-- login flink
	bash ./start_flink_client.sh
	
	-- login doris
	bash ./start_doris_client.sh
	```

### 03 Подготовка данных {#03-data-preparation}

После входа в командную строку Flink вы увидите заранее созданную таблицу. В таблице уже есть данные, которые можно просмотреть с помощью Flink SQL.

```
Flink SQL> use paimon.db_paimon;
[INFO] Execute statement succeed.

Flink SQL> show tables;
+------------+
| table name |
+------------+
|   customer |
+------------+
1 row in set

Flink SQL> show create table customer;
+------------------------------------------------------------------------+
|                                                                 result |
+------------------------------------------------------------------------+
| CREATE TABLE `paimon`.`db_paimon`.`customer` (
  `c_custkey` INT NOT NULL,
  `c_name` VARCHAR(25),
  `c_address` VARCHAR(40),
  `c_nationkey` INT NOT NULL,
  `c_phone` CHAR(15),
  `c_acctbal` DECIMAL(12, 2),
  `c_mktsegment` CHAR(10),
  `c_comment` VARCHAR(117),
  CONSTRAINT `PK_c_custkey_c_nationkey` PRIMARY KEY (`c_custkey`, `c_nationkey`) NOT ENFORCED
) PARTITIONED BY (`c_nationkey`)
WITH (
  'bucket' = '1',
  'path' = 's3://warehouse/wh/db_paimon.db/customer',
  'deletion-vectors.enabled' = 'true'
)
 |
+-------------------------------------------------------------------------+
1 row in set

Flink SQL> desc customer;
+--------------+----------------+-------+-----------------------------+--------+-----------+
|         name |           type |  null |                         key | extras | watermark |
+--------------+----------------+-------+-----------------------------+--------+-----------+
|    c_custkey |            INT | FALSE | PRI(c_custkey, c_nationkey) |        |           |
|       c_name |    VARCHAR(25) |  TRUE |                             |        |           |
|    c_address |    VARCHAR(40) |  TRUE |                             |        |           |
|  c_nationkey |            INT | FALSE | PRI(c_custkey, c_nationkey) |        |           |
|      c_phone |       CHAR(15) |  TRUE |                             |        |           |
|    c_acctbal | DECIMAL(12, 2) |  TRUE |                             |        |           |
| c_mktsegment |       CHAR(10) |  TRUE |                             |        |           |
|    c_comment |   VARCHAR(117) |  TRUE |                             |        |           |
+--------------+----------------+-------+-----------------------------+--------+-----------+
8 rows in set

Flink SQL> select * from customer order by c_custkey limit 4;
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
| c_custkey |             c_name |                      c_address | c_nationkey |         c_phone | c_acctbal | c_mktsegment |                      c_comment |
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
|         1 | Customer#000000001 |              IVhzIApeRb ot,c,E |          15 | 25-989-741-2988 |    711.56 |     BUILDING | to the even, regular platel... |
|         2 | Customer#000000002 | XSTf4,NCwDVaWNe6tEgvwfmRchLXak |          13 | 23-768-687-3665 |    121.65 |   AUTOMOBILE | l accounts. blithely ironic... |
|         3 | Customer#000000003 |                   MG9kdTD2WBHm |           1 | 11-719-748-3364 |   7498.12 |   AUTOMOBILE |  deposits eat slyly ironic,... |
|        32 | Customer#000000032 | jD2xZzi UmId,DCtNBLXKj9q0Tl... |          15 | 25-430-914-2194 |   3471.53 |     BUILDING | cial ideas. final, furious ... |
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
4 rows in set
```

### 04 Запросы к данным {#04-data-query}

Как показано ниже, в кластере Doris уже создан Catalog с именем `paimon` (его можно просмотреть с помощью SHOW CATALOGS). Ниже приведена инструкция для создания этого Catalog:

```
-- Already created, no need to run
CREATE CATALOG `paimon` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "s3://warehouse/wh/",
    "s3.endpoint"="http://minio:9000",
    "s3.access_key"="admin",
    "s3.secret_key"="password",
    "s3.region"="us-east-1"
);
```

В Doris можно выполнять запросы к данным Paimon:

```
mysql> use paimon.db_paimon;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+---------------------+
| Tables_in_db_paimon |
+---------------------+
| customer            |
+---------------------+
1 row in set (0.00 sec)

mysql> select * from customer order by c_custkey limit 4;
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
| c_custkey | c_name             | c_address                             | c_nationkey | c_phone         | c_acctbal | c_mktsegment | c_comment                                                                                              |
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
|         1 | Customer#000000001 | IVhzIApeRb ot,c,E                     |          15 | 25-989-741-2988 |    711.56 | BUILDING     | to the even, regular platelets. regular, ironic epitaphs nag e                                         |
|         2 | Customer#000000002 | XSTf4,NCwDVaWNe6tEgvwfmRchLXak        |          13 | 23-768-687-3665 |    121.65 | AUTOMOBILE   | l accounts. blithely ironic theodolites integrate boldly: caref                                        |
|         3 | Customer#000000003 | MG9kdTD2WBHm                          |           1 | 11-719-748-3364 |   7498.12 | AUTOMOBILE   |  deposits eat slyly ironic, even instructions. express foxes detect slyly. blithely even accounts abov |
|        32 | Customer#000000032 | jD2xZzi UmId,DCtNBLXKj9q0Tlp2iQ6ZcO3J |          15 | 25-430-914-2194 |   3471.53 | BUILDING     | cial ideas. final, furious requests across the e                                                       |
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
4 rows in set (1.89 sec)
```

### 05 Чтение инкрементальных данных {#05-read-incremental-data}

Данные в таблице Paimon можно обновить с помощью Flink SQL:

```
Flink SQL> update customer set c_address='c_address_update' where c_nationkey = 1;
[INFO] Submitting SQL update statement to the cluster...
[INFO] SQL update statement has been successfully submitted to the cluster:
Job ID: ff838b7b778a94396b332b0d93c8f7ac
```

После завершения выполнения Flink SQL актуальные данные можно сразу просмотреть в Doris:

```
mysql> select * from customer where c_nationkey=1 limit 2;
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
| c_custkey | c_name             | c_address       | c_nationkey | c_phone         | c_acctbal | c_mktsegment | c_comment                                                                                              |
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
|         3 | Customer#000000003 | c_address_update |           1 | 11-719-748-3364 |   7498.12 | AUTOMOBILE   |  deposits eat slyly ironic, even instructions. express foxes detect slyly. blithely even accounts abov |
|       513 | Customer#000000513 | c_address_update |           1 | 11-861-303-6887 |    955.37 | HOUSEHOLD    | press along the quickly regular instructions. regular requests against the carefully ironic s          |
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
2 rows in set (0.19 sec)
```

### Тестирование производительности {#benchmark}

Мы провели простой тест на наборе данных TPCDS 1000 в Paimon версии (0.8), используя Apache Doris версии 2.1.5 и Trino версии 422. В обоих случаях была включена функция Primary Key Table Read Optimized.

![](/images/quick-start/lakehouse-paimon-benchmark.PNG)

Результаты теста показывают, что средняя производительность запросов Doris на стандартном статическом тестовом наборе в 3-5 раз выше, чем у Trino. В дальнейшем мы оптимизируем Deletion Vector, чтобы ещё больше повысить эффективность запросов в реальных бизнес-сценариях.

## Оптимизация запросов {#query-optimization}

После появления функции Primary Key Table Read Optimized в Apache Paimon версии 0.6 механизм выполнения запросов может напрямую обращаться к файлам Parquet/ORC, что значительно повышает эффективность чтения базовых данных. Необъединённые инкрементальные данные (изменения, создаваемые операциями INSERT, UPDATE или DELETE) можно читать с помощью Merge-on-Read. Кроме того, в версии 0.8 Paimon появилась функция Deletion Vector, которая дополнительно повышает эффективность чтения инкрементальных данных механизмом выполнения запросов.
Apache Doris поддерживает чтение Deletion Vector через нативный Reader и выполнение Merge on Read. С помощью инструкции EXPLAIN в Doris покажем, как в рамках запроса читаются базовые и инкрементальные данные.

```
mysql> explain verbose select * from customer where c_nationkey < 3;
+------------------------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                                |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| ...............                                                                                                                                |
|                                                                                                                                                |
|   0:VPAIMON_SCAN_NODE(68)                                                                                                                      |
|      table: customer                                                                                                                           |
|      predicates: (c_nationkey[#3] < 3)                                                                                                         |
|      inputSplitNum=4, totalFileSize=238324, scanRanges=4                                                                                       |
|      partition=3/0                                                                                                                             |
|      backends:                                                                                                                                 |
|        10002                                                                                                                                   |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=1/bucket-0/data-15cee5b7-1bd7-42ca-9314-56d92c62c03b-0.orc start: 0 length: 66600 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=1/bucket-0/data-5d50255a-2215-4010-b976-d5dc656f3444-0.orc start: 0 length: 44501 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=2/bucket-0/data-e98fb7ef-ec2b-4ad5-a496-713cb9481d56-0.orc start: 0 length: 64059 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=0/bucket-0/data-431be05d-50fa-401f-9680-d646757d0f95-0.orc start: 0 length: 63164 |
|      cardinality=18751, numNodes=1                                                                                                             |
|      pushdown agg=NONE                                                                                                                         |
|      paimonNativeReadSplits=4/4                                                                                                                |
|      PaimonSplitStats:                                                                                                                         |
|        SplitStat [type=NATIVE, rowCount=1542, rawFileConvertable=true, hasDeletionVector=true]                                                 |
|        SplitStat [type=NATIVE, rowCount=750, rawFileConvertable=true, hasDeletionVector=false]                                                 |
|        SplitStat [type=NATIVE, rowCount=750, rawFileConvertable=true, hasDeletionVector=false]                                                 |
|      tuple ids: 0
| ...............                                                                                                           |                                                                                                  |
+------------------------------------------------------------------------------------------------------------------------------------------------+
67 rows in set (0.23 sec)
```

Видно, что таблица, только что обновлённая с помощью Flink SQL, содержит 4 шарда и все они доступны через Native Reader (paimonNativeReadSplits=4/4). Кроме того, свойство hasDeletionVector первого шарда имеет значение true. Это означает, что у шарда есть соответствующий Deletion Vector и при чтении данные будут фильтроваться в соответствии с ним.
