---
{
    "title": "Hive Bitmap/HLL UDF",
    "language": "ko",
    "description": "Hive에서 Bitmap과 HLL을 생성하고 연산하는 UDF입니다. 결과를 Doris에 직접 적재할 수 있어 사전 구축과 사전 집계를 생략하고 데이터 적재 시간과 스토리지 비용을 줄일 수 있습니다."
}
---

Doris는 Hive 테이블에서 Bitmap과 HLL을 직접 생성하고 연산할 수 있는 Hive UDF 모음을 제공합니다. Hive에서 생성한 Bitmap과 HLL은 Doris 커널과 완벽하게 호환되며, Hive Catalog 또는 Spark Load를 통해 Doris에 직접 적재할 수 있습니다.

HLL에 대한 자세한 내용은 [HLL을 사용한 근사 중복 제거](../../query-acceleration/distinct-counts/hll-approximate-deduplication)를 참조하세요.

## 사용 사례 {#use-cases}

| 시나리오                                | 장점                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Doris 데이터 적재 시간 단축 | Hive 측에서 사전 구축과 사전 집계를 완료하므로 Doris에 데이터를 적재할 때 다시 수행할 필요가 없습니다. |
| Hive와 Doris의 스토리지 비용 절감   | Bitmap과 HLL은 원시 데이터를 압축하며, HLL의 스토리지 오버헤드는 일반적으로 Bitmap보다 훨씬 낮습니다. |
| Hive에서 유연한 연산 수행            | Bitmap의 교집합 / 합집합 / 차집합 연산과 HLL의 합집합 / 카디널리티 추정을 지원합니다. 결과를 Doris에 직접 적재할 수 있습니다. |

:::tip
HLL은 근사 알고리즘이며, 결과는 일반적으로 정확한 값에 비해 1%에서 2%의 오차가 있습니다. 엄격한 정밀도가 필요한 시나리오에서는 Bitmap을 사용하세요.
:::

## 함수 목록 {#function-list}

<!-- Knowledge type: Function reference -->

### Bitmap UDF {#bitmap-udf}

| 함수         | 유형  | 설명                          |
| ---------------- | ----- | ------------------------------------ |
| `to_bitmap`      | UDAF  | 집계하여 Doris Bitmap 컬럼을 생성합니다. |
| `bitmap_union`   | UDAF  | 그룹 내 Bitmap의 합집합을 계산합니다. |
| `bitmap_count`   | UDF   | Bitmap의 원소 수를 반환합니다. |
| `bitmap_and`     | UDF   | 두 Bitmap의 교집합을 계산합니다. |
| `bitmap_or`      | UDF   | 두 Bitmap의 합집합을 계산합니다.    |
| `bitmap_xor`     | UDF   | 두 Bitmap의 대칭 차집합을 계산합니다. |

### HLL UDF {#hll-udf}

| 함수          | 유형  | 설명                                                  |
| ----------------- | ----- | ------------------------------------------------------------ |
| `to_hll`          | UDAF  | 집계하여 Doris HLL 컬럼을 생성하며, `to_bitmap`과 유사합니다. |
| `hll_union`       | UDAF  | 그룹 내 HLL의 합집합을 계산하며, `bitmap_union`과 유사합니다. |
| `hll_cardinality` | UDF   | HLL의 고유 원소 수를 근사하여 반환하며, `bitmap_count`와 유사합니다. |

## 사용 절차 {#usage-workflow}

<!-- Knowledge type: Operation steps -->

전체 절차는 네 단계로 구성됩니다.

1. `hive-udf.jar`를 컴파일하고 HDFS에 업로드합니다.
2. Hive에서 JAR을 로드하고 UDF를 등록합니다.
3. Hive에서 UDF를 사용하여 Bitmap 또는 HLL을 생성하고 연산합니다.
4. Hive Catalog 또는 Spark Load를 통해 결과를 Doris에 적재합니다.

### 1단계: UDF JAR 컴파일 {#step-1-compile-the-udf-jar}

Hive Bitmap 및 HLL UDF는 Hive / Spark에서 사용해야 하므로 먼저 Doris FE 모듈을 컴파일하여 `hive-udf.jar`를 생성해야 합니다.

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

### 2단계: Hive에서 JAR 로드 및 UDF 등록 {#step-2-load-the-jar-and-register-the-udfs-in-hive}

Hive에 접속하고 실제 환경에 맞게 HDFS의 `hostname`과 `port`를 수정합니다.

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

### 3단계: Hive에서 생성 및 연산 {#step-3-generate-and-compute-in-hive}

#### 테스트 데이터 준비 {#prepare-test-data}

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

#### Bitmap 예제 {#bitmap-example}

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

#### HLL 예제 {#hll-example}

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

### 4단계: Hive Bitmap / HLL을 Doris에 데이터 적재 {#step-4-load-hive-bitmap--hll-into-doris}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Hive already has Bitmap / HLL data and needs to be written into a Doris internal table -->

**권장 방법: Hive Catalog**

Hive 테이블이 `TEXT` 형식으로 저장되면 `binary` 타입은 Base64로 인코딩된 문자열로 저장됩니다. Hive Catalog를 사용하면 [`bitmap_from_base64`](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-base64) 또는 [`hll_from_base64`](../../sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64) 함수를 통해 데이터를 Doris 내부 테이블에 직접 쓸 수 있습니다.

전체 절차는 다음과 같습니다.

1. Hive에서 `TEXTFILE` 형식의 테이블을 생성합니다.
2. Doris에서 [Hive Catalog](../../lakehouse/catalogs/hive-catalog)를 생성합니다.
3. Doris에서 해당 Bitmap / HLL 내부 테이블을 생성합니다.
4. `INSERT INTO ... SELECT`를 사용하여 Hive의 데이터를 Doris에 씁니다.

#### 전체 Bitmap 예제 {#complete-bitmap-example}

**1. Hive에서 TEXT 형식의 테이블 생성**

```sql
CREATE TABLE IF NOT EXISTS `test`.`hive_bitmap_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'bitmap'
) STORED AS TEXTFILE;
```

**2. Doris에서 Hive Catalog 생성**

```sql
CREATE CATALOG hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

**3. Doris에서 Bitmap 내부 테이블 생성**

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

**4. Catalog를 통해 Hive의 데이터를 Doris에 쓰기**

```sql
insert into test.doris_bitmap_table
select k1, k2, k3, bitmap_from_base64(uuid)
from hive.test.hive_bitmap_table;
```

#### 전체 HLL 예제 {#complete-hll-example}

**1. Hive에서 TEXT 형식의 테이블 생성**

```sql
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'hll'
) STORED AS TEXTFILE;

-- You can reuse the previous steps and write data from a regular table using the to_hll function
```

**2. Doris에서 Hive Catalog 생성**

```sql
CREATE CATALOG hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

**3. Doris에서 HLL 내부 테이블 생성**

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

**4. Catalog를 통해 Hive의 데이터를 Doris에 쓰기**

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

## 참고 사항 {#notes}

- **HLL 정밀도**: HLL은 근사 알고리즘이며, 결과는 일반적으로 정확한 값에 비해 1%에서 2%의 오차가 있습니다. 엄격한 정밀도가 필요한 시나리오에서는 Bitmap을 사용하세요.
- **저장 형식**: Hive Catalog를 통해 데이터를 적재할 때는 Hive 테이블이 `TEXTFILE` 형식을 사용해야 `binary` 컬럼이 Base64 문자열로 저장됩니다.
- **JAR 경로**: 예제의 `hdfs://hostname:port/hive-udf.jar`를 실제 HDFS 주소로 바꿔야 하며, 모든 UDF가 동일한 JAR을 참조하도록 하는 것을 권장합니다.
- **함수 대응 관계**: `to_hll`은 `to_bitmap`에, `hll_union`은 `bitmap_union`에, `hll_cardinality`는 `bitmap_count`에 대응하므로 Bitmap과 HLL 방식 간에 쉽게 전환할 수 있습니다.
