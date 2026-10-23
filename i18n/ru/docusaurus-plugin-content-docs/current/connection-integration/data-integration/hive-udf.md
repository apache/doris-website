---
{
    "title": "UDF для Bitmap/HLL в Hive",
    "language": "ru",
    "description": "UDF для создания Bitmap и HLL и выполнения операций с ними в Hive. Результаты можно загружать непосредственно в Doris без построения словаря и предварительной агрегации, что сокращает время загрузки и затраты на хранение."
}
---

Doris предоставляет набор UDF для Hive, которые создают Bitmap и HLL и выполняют операции с ними непосредственно в таблицах Hive. Созданные в Hive Bitmap и HLL полностью совместимы с ядром Doris и могут загружаться непосредственно в Doris через Hive Catalog или Spark Load.

Подробнее о HLL см. в разделе [Приблизительная дедупликация с HLL](../../query-acceleration/distinct-counts/hll-approximate-deduplication).

## Сценарии использования {#use-cases}

| Сценарий                                | Преимущество                                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Сокращение времени загрузки данных в Doris | Построение словаря и предварительная агрегация выполняются на стороне Hive, поэтому при загрузке в Doris их не нужно выполнять повторно |
| Снижение затрат на хранение в Hive и Doris | Bitmap и HLL сжимают исходные данные; объём, необходимый для хранения HLL, обычно значительно меньше, чем для Bitmap |
| Гибкие вычисления в Hive                 | Поддерживаются пересечение / объединение / разность для Bitmap, а также объединение / оценка количества уникальных элементов для HLL. Результаты можно загружать непосредственно в Doris |

:::tip
HLL — приближённый алгоритм, и погрешность результата обычно составляет от 1% до 2% относительно точного значения. В сценариях со строгими требованиями к точности используйте Bitmap.
:::

## Список функций {#function-list}

<!-- Knowledge type: Function reference -->

### UDF для Bitmap {#bitmap-udf}

| Функция          | Тип   | Описание                             |
| ---------------- | ----- | ------------------------------------ |
| `to_bitmap`      | UDAF  | Агрегирует данные и создаёт столбец Bitmap для Doris |
| `bitmap_union`   | UDAF  | Вычисляет объединение Bitmap в пределах группы |
| `bitmap_count`   | UDF   | Возвращает количество элементов в Bitmap |
| `bitmap_and`     | UDF   | Вычисляет пересечение двух Bitmap     |
| `bitmap_or`      | UDF   | Вычисляет объединение двух Bitmap     |
| `bitmap_xor`     | UDF   | Вычисляет симметрическую разность двух Bitmap |

### UDF для HLL {#hll-udf}

| Функция           | Тип   | Описание                                                     |
| ----------------- | ----- | ------------------------------------------------------------ |
| `to_hll`          | UDAF  | Агрегирует данные и создаёт столбец HLL для Doris, аналогично `to_bitmap` |
| `hll_union`       | UDAF  | Вычисляет объединение HLL в пределах группы, аналогично `bitmap_union` |
| `hll_cardinality` | UDF   | Возвращает приблизительное количество уникальных элементов в HLL, аналогично `bitmap_count` |

## Порядок использования {#usage-workflow}

<!-- Knowledge type: Operation steps -->

Процесс состоит из четырёх шагов:

1. Скомпилируйте `hive-udf.jar` и загрузите его в HDFS.
2. Загрузите JAR и зарегистрируйте UDF в Hive.
3. Используйте UDF в Hive для создания Bitmap или HLL и выполнения операций с ними.
4. Загрузите результаты в Doris через Hive Catalog или Spark Load.

### Шаг 1: Компиляция JAR с UDF {#step-1-compile-the-udf-jar}

UDF для Bitmap и HLL в Hive используются в Hive / Spark, поэтому сначала необходимо скомпилировать модуль FE Doris, чтобы получить `hive-udf.jar`.

```bash
# 1. Clone the Doris source code
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive

# 2. Enter the fe directory
cd fe

# 3. Run maven package (all submodules of fe will be packaged)
mvn package -Dmaven.test.skip=true

# You can also package only the hive-udf module
mvn package -pl hive-udf -am -Dmaven.test.skip=true

# 4. After packaging, hive-udf.jar will be generated under hive-udf/target
#    Upload it to HDFS (here uploading to the root directory as an example)
hdfs dfs -put hive-udf/target/hive-udf.jar /
```

### Шаг 2: Загрузка JAR и регистрация UDF в Hive {#step-2-load-the-jar-and-register-the-udfs-in-hive}

Откройте Hive и укажите значения `hostname` и `port` для HDFS в соответствии с вашей конфигурацией:

```sql
-- Load the UDF JAR
add jar hdfs://hostname:port/hive-udf.jar;

-- Register Bitmap UDAFs
create temporary function to_bitmap     as 'org.apache.doris.udf.ToBitmapUDAF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_union  as 'org.apache.doris.udf.BitmapUnionUDAF' USING JAR 'hdfs://hostname:port/hive-udf.jar';

-- Register Bitmap UDFs
create temporary function bitmap_count  as 'org.apache.doris.udf.BitmapCountUDF'  USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_and    as 'org.apache.doris.udf.BitmapAndUDF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_or     as 'org.apache.doris.udf.BitmapOrUDF'     USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_xor    as 'org.apache.doris.udf.BitmapXorUDF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';

-- Register HLL UDAFs
create temporary function to_hll        as 'org.apache.doris.udf.ToHllUDAF'       USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function hll_union     as 'org.apache.doris.udf.HllUnionUDAF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';

-- Register HLL UDF
create temporary function hll_cardinality as 'org.apache.doris.udf.HllCardinalityUDF' USING JAR 'hdfs://hostname:port/hive-udf.jar';
```

### Шаг 3: Создание Bitmap и HLL и вычисления в Hive {#step-3-generate-and-compute-in-hive}

#### Подготовка тестовых данных {#prepare-test-data}

```sql
use hive_test;

-- Regular Hive table that stores raw data
CREATE TABLE IF NOT EXISTS `hive_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` int       COMMENT ''
) COMMENT 'source table';

insert into hive_table select 1, 'a', 'b', 12345;
insert into hive_table select 1, 'a', 'c', 12345;
insert into hive_table select 2, 'b', 'c', 23456;
insert into hive_table select 3, 'c', 'd', 34567;
```

#### Пример с Bitmap {#bitmap-example}

```sql
-- Create a Hive Bitmap table; the binary column stores the Bitmap
CREATE TABLE IF NOT EXISTS `hive_bitmap_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'bitmap'
) COMMENT 'bitmap table';

-- Aggregate and generate Bitmap with to_bitmap, then write into the Hive Bitmap table
insert into hive_bitmap_table
select
    k1,
    k2,
    k3,
    to_bitmap(uuid) as uuid
from hive_table
group by k1, k2, k3;

-- Count the number of elements in the Bitmap
select k1, k2, k3, bitmap_count(uuid) from hive_bitmap_table;

-- Compute the Bitmap union after grouping
select k1, bitmap_union(uuid) from hive_bitmap_table group by k1;
```

#### Пример с HLL {#hll-example}

```sql
-- Create a Hive HLL table; the binary column stores the HLL
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'hll'
) COMMENT 'hll table';

-- Aggregate and generate HLL with to_hll, then write into the Hive HLL table
insert into hive_hll_table
select
    k1,
    k2,
    k3,
    to_hll(uuid) as uuid
from hive_table
group by k1, k2, k3;

-- Count the number of elements in the HLL
select k1, k2, k3, hll_cardinality(uuid) from hive_hll_table;
+-----+-----+-----+------+
| k1  | k2  | k3  | _c3  |
+-----+-----+-----+------+
| 1   | a   | b   | 1    |
| 1   | a   | c   | 1    |
| 2   | b   | c   | 1    |
| 3   | c   | d   | 1    |
+-----+-----+-----+------+

-- Compute the HLL union after grouping (returns 3 rows)
select k1, hll_union(uuid) from hive_hll_table group by k1;

-- You can also merge first and then count
select k3, hll_cardinality(hll_union(uuid)) from hive_hll_table group by k3;
+-----+------+
| k3  | _c1  |
+-----+------+
| b   | 1    |
| c   | 2    |
| d   | 1    |
+-----+------+
```

### Шаг 4: Загрузка Bitmap / HLL из Hive в Doris {#step-4-load-hive-bitmap--hll-into-doris}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Hive already has Bitmap / HLL data and needs to be written into a Doris internal table -->

**Рекомендуемый способ: Hive Catalog**

Если таблица Hive хранится в формате `TEXT`, значения типа `binary` сохраняются в виде строк в кодировке Base64. С помощью Hive Catalog можно записать данные непосредственно во внутреннюю таблицу Doris, используя функцию [`bitmap_from_base64`](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-base64) или [`hll_from_base64`](../../sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64).

Полный порядок действий:

1. Создайте в Hive таблицу в формате `TEXTFILE`
2. Создайте [Hive Catalog](../../lakehouse/catalogs/hive-catalog) в Doris
3. Создайте в Doris соответствующую внутреннюю таблицу Bitmap / HLL
4. Запишите данные из Hive в Doris с помощью `INSERT INTO ... SELECT`

#### Полный пример с Bitmap {#complete-bitmap-example}

**1. Создайте в Hive таблицу в формате TEXT**

```sql
CREATE TABLE IF NOT EXISTS `test`.`hive_bitmap_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'bitmap'
) STORED AS TEXTFILE;
```

**2. Создайте Hive Catalog в Doris**

```sql
CREATE CATALOG hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

**3. Создайте внутреннюю таблицу Bitmap в Doris**

```sql
CREATE TABLE IF NOT EXISTS `test`.`doris_bitmap_table`(
    `k1`   int                    COMMENT '',
    `k2`   String                 COMMENT '',
    `k3`   String                 COMMENT '',
    `uuid` BITMAP   BITMAP_UNION  COMMENT 'bitmap'
)
AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

**4. Запишите данные из Hive в Doris через Catalog**

```sql
insert into test.doris_bitmap_table
select k1, k2, k3, bitmap_from_base64(uuid)
from hive.test.hive_bitmap_table;
```

#### Полный пример с HLL {#complete-hll-example}

**1. Создайте в Hive таблицу в формате TEXT**

```sql
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'hll'
) STORED AS TEXTFILE;

-- You can reuse the previous steps and write data from a regular table using the to_hll function
```

**2. Создайте Hive Catalog в Doris**

```sql
CREATE CATALOG hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

**3. Создайте внутреннюю таблицу HLL в Doris**

```sql
CREATE TABLE IF NOT EXISTS `doris_test`.`doris_hll_table`(
    `k1`   int                  COMMENT '',
    `k2`   varchar(10)          COMMENT '',
    `k3`   varchar(10)          COMMENT '',
    `uuid` HLL   HLL_UNION      COMMENT 'hll'
)
AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

**4. Запишите данные из Hive в Doris через Catalog**

```sql
insert into doris_test.doris_hll_table
select k1, k2, k3, hll_from_base64(uuid)
from hive.hive_test.hive_hll_table;

-- View the loaded results, can be combined with hll_to_base64 for decoding
select *, hll_to_base64(uuid) from doris_test.doris_hll_table;
+------+------+------+------+---------------------+
| k1   | k2   | k3   | uuid | hll_to_base64(uuid) |
+------+------+------+------+---------------------+
|    1 | a    | b    | NULL | AQFw+a9MhpKhoQ==    |
|    1 | a    | c    | NULL | AQFw+a9MhpKhoQ==    |
|    2 | b    | c    | NULL | AQGyB7kbWBxh+A==    |
|    3 | c    | d    | NULL | AQFYbJB5VpNBhg==    |
+------+------+------+------+---------------------+

-- Use native HLL functions on the Doris internal table; the result is consistent with Hive
select k3, hll_cardinality(hll_union(uuid)) from doris_test.doris_hll_table group by k3;
+------+----------------------------------+
| k3   | hll_cardinality(hll_union(uuid)) |
+------+----------------------------------+
| b    |                                1 |
| d    |                                1 |
| c    |                                2 |
+------+----------------------------------+

-- Query the Hive external table directly (data before loading) for cross-validation to confirm consistency
select k3, hll_cardinality(hll_union(hll_from_base64(uuid)))
from hive.hive_test.hive_hll_table
group by k3;
+------+---------------------------------------------------+
| k3   | hll_cardinality(hll_union(hll_from_base64(uuid))) |
+------+---------------------------------------------------+
| d    |                                                 1 |
| b    |                                                 1 |
| c    |                                                 2 |
+------+---------------------------------------------------+
```

## Примечания {#notes}

- **Точность HLL**: HLL — приближённый алгоритм, и погрешность результата обычно составляет от 1% до 2% относительно точного значения. В сценариях со строгими требованиями к точности используйте Bitmap.
- **Формат хранения**: При загрузке через Hive Catalog таблица Hive должна использовать формат `TEXTFILE`, чтобы столбец `binary` сохранялся в виде строки Base64.
- **Путь к JAR**: Путь `hdfs://hostname:port/hive-udf.jar` в примерах необходимо заменить фактическим адресом в HDFS. Рекомендуется, чтобы все UDF ссылались на один и тот же JAR.
- **Соответствие функций**: `to_hll` соответствует `to_bitmap`, `hll_union` соответствует `bitmap_union`, а `hll_cardinality` соответствует `bitmap_count`, что упрощает переход между решениями на основе Bitmap и HLL.
