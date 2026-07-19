---
{
    "title": "Hive Bitmap/HLL UDF",
    "language": "en",
    "description": "UDFs for generating and operating on Bitmap and HLL in Hive. Results can be loaded directly into Doris, skipping dictionary construction and pre-aggregation, reducing load time and storage cost."
}
---

Doris provides a set of Hive UDFs that generate and operate on Bitmap and HLL directly in Hive tables. The Bitmap and HLL produced in Hive are fully compatible with the Doris kernel and can be loaded into Doris directly through Hive Catalog or Spark Load.

For more information about HLL, see [Approximate Deduplication with HLL](../../query-acceleration/distinct-counts/hll-approximate-deduplication).

## Use Cases

| Scenario                                | Benefit                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Shorten the time to load data into Doris | Dictionary construction and pre-aggregation are completed on the Hive side, no need to rebuild when loading into Doris |
| Reduce storage cost in Hive and Doris   | Bitmap and HLL compress raw data; the storage overhead of HLL is usually significantly lower than Bitmap |
| Flexible computation in Hive            | Supports intersection / union / difference for Bitmap, and union / cardinality estimation for HLL. Results can be loaded directly into Doris |

:::tip
HLL is an approximate algorithm, and the result usually has an error of 1% to 2% compared with the exact value. For scenarios with strict precision requirements, use Bitmap.
:::

## Function List

<!-- Knowledge type: Function reference -->

### Bitmap UDF

| Function         | Type  | Description                          |
| ---------------- | ----- | ------------------------------------ |
| `to_bitmap`      | UDAF  | Aggregates and generates a column of Doris Bitmap |
| `bitmap_union`   | UDAF  | Computes the union of Bitmaps within a group |
| `bitmap_count`   | UDF   | Returns the number of elements in a Bitmap |
| `bitmap_and`     | UDF   | Computes the intersection of two Bitmaps |
| `bitmap_or`      | UDF   | Computes the union of two Bitmaps    |
| `bitmap_xor`     | UDF   | Computes the symmetric difference of two Bitmaps |

### HLL UDF

| Function          | Type  | Description                                                  |
| ----------------- | ----- | ------------------------------------------------------------ |
| `to_hll`          | UDAF  | Aggregates and generates a column of Doris HLL, similar to `to_bitmap` |
| `hll_union`       | UDAF  | Computes the union of HLLs within a group, similar to `bitmap_union` |
| `hll_cardinality` | UDF   | Returns the approximate number of distinct elements in an HLL, similar to `bitmap_count` |

## Usage Workflow

<!-- Knowledge type: Operation steps -->

The overall workflow consists of four steps:

1. Compile `hive-udf.jar` and upload it to HDFS.
2. Load the JAR and register the UDFs in Hive.
3. Use the UDFs in Hive to generate and operate on Bitmap or HLL.
4. Load the results into Doris through Hive Catalog or Spark Load.

### Step 1: Compile the UDF JAR

The Hive Bitmap and HLL UDFs need to be used in Hive / Spark, so you must first compile the Doris FE module to obtain `hive-udf.jar`.

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

### Step 2: Load the JAR and Register the UDFs in Hive

Enter Hive and modify the HDFS `hostname` and `port` according to your actual setup:

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

### Step 3: Generate and Compute in Hive

#### Prepare Test Data

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

#### Bitmap Example

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

#### HLL Example

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

### Step 4: Load Hive Bitmap / HLL into Doris

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Hive already has Bitmap / HLL data and needs to be written into a Doris internal table -->

**Recommended approach: Hive Catalog**

When a Hive table is stored in `TEXT` format, the `binary` type is saved as a Base64-encoded string. With Hive Catalog, you can write the data into a Doris internal table directly through the [`bitmap_from_base64`](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-base64) or [`hll_from_base64`](../../sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64) function.

The complete workflow is as follows:

1. Create the table in `TEXTFILE` format in Hive
2. Create a [Hive Catalog](../../lakehouse/catalogs/hive-catalog) in Doris
3. Create the corresponding Bitmap / HLL internal table in Doris
4. Write data from Hive into Doris using `INSERT INTO ... SELECT`

#### Complete Bitmap Example

**1. Create the TEXT format table in Hive**

```sql
CREATE TABLE IF NOT EXISTS `test`.`hive_bitmap_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'bitmap'
) STORED AS TEXTFILE;
```

**2. Create the Hive Catalog in Doris**

```sql
CREATE CATALOG hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

**3. Create the Bitmap internal table in Doris**

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

**4. Write data from Hive into Doris through the Catalog**

```sql
insert into test.doris_bitmap_table
select k1, k2, k3, bitmap_from_base64(uuid)
from hive.test.hive_bitmap_table;
```

#### Complete HLL Example

**1. Create the TEXT format table in Hive**

```sql
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'hll'
) STORED AS TEXTFILE;

-- You can reuse the previous steps and write data from a regular table using the to_hll function
```

**2. Create the Hive Catalog in Doris**

```sql
CREATE CATALOG hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

**3. Create the HLL internal table in Doris**

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

**4. Write data from Hive into Doris through the Catalog**

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

## Notes

- **HLL precision**: HLL is an approximate algorithm, and the result usually has an error of 1% to 2% compared with the exact value. For scenarios with strict precision requirements, use Bitmap instead.
- **Storage format**: When loading through Hive Catalog, the Hive table must use the `TEXTFILE` format so that the `binary` column is saved as a Base64 string.
- **JAR path**: The `hdfs://hostname:port/hive-udf.jar` in the examples must be replaced with the actual HDFS address, and it is recommended that all UDFs reference the same JAR.
- **Function correspondence**: `to_hll` corresponds to `to_bitmap`, `hll_union` corresponds to `bitmap_union`, and `hll_cardinality` corresponds to `bitmap_count`, making it easy to switch between the Bitmap and HLL solutions.
