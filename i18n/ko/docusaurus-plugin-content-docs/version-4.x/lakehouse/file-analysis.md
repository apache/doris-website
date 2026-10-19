---
{
    "title": "S3/HDFS의 파일 분석",
    "language": "ko",
    "description": "Apache Doris Table Value Function (TVF)을 사용하여 S3 및 HDFS와 같은 스토리지 시스템의 Parquet, ORC, CSV, JSON 파일을 직접 쿼리하고 분석하는 방법을 알아봅니다. 자동 스키마 추론, 여러 파일 매칭, 데이터 적재, 쿼리 결과를 파일로 내보내는 기능을 지원합니다."
}
---

Doris는 Table Value Function (TVF) 기능을 통해 데이터를 미리 적재하지 않고도 객체 스토리지나 HDFS에 있는 파일을 테이블처럼 직접 쿼리하고 분석할 수 있으며, 컬럼 타입 자동 추론을 지원합니다. 4.1.0 버전부터는 `INSERT INTO` TVF 구문을 통해 쿼리 결과를 파일 시스템으로 내보내는 기능도 지원합니다.

## 지원하는 스토리지 시스템 {#supported-storage-systems}

Doris는 다양한 스토리지 시스템에 접근할 수 있도록 다음 TVF를 제공합니다.

| TVF | 지원하는 스토리지 | 설명 |
|-----|-------------------|-------------|
| [S3](../sql-manual/sql-functions/table-valued-functions/s3.md) | S3 호환 객체 스토리지 | AWS S3, Alibaba Cloud OSS, Tencent Cloud COS 등을 지원합니다. |
| [HDFS](../sql-manual/sql-functions/table-valued-functions/hdfs.md) | HDFS | Hadoop Distributed File System을 지원합니다. |
| [HTTP](../sql-manual/sql-functions/table-valued-functions/http.md) | HTTP | HTTP 주소를 통한 파일 접근을 지원합니다(4.0.2 버전부터). |
| [FILE](../sql-manual/sql-functions/table-valued-functions/file.md) | S3/HDFS/HTTP/Local | 여러 스토리지 타입을 지원하는 통합 테이블 함수입니다(3.1.0 버전부터). |

## 지원하는 파일 형식 {#supported-file-formats}

TVF는 다음 파일 형식의 읽기와 분석을 지원합니다. 형식별 세부 사항과 매개변수는 각 링크에서 확인할 수 있습니다.

- [Parquet](./file-formats/parquet.md)
- [ORC](./file-formats/orc.md)
- [텍스트 / CSV / JSON](./file-formats/text.md)
- [Lance](./file-formats/lance.md) (4.2 버전부터 지원)

## 사용 사례 {#use-cases}

### 시나리오 1: 파일 직접 쿼리 및 분석 {#scenario-1-direct-query-and-analysis-of-files}

TVF는 데이터를 Doris에 먼저 적재하지 않고 스토리지 시스템의 파일을 직접 분석할 때 적합합니다.

다음 예제는 S3 TVF를 사용하여 객체 스토리지의 Parquet 파일을 쿼리합니다.

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
)
ORDER BY p_partkey LIMIT 5;
```

쿼리 결과 예시:

```
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
| p_partkey | p_name                                   | p_mfgr         | p_brand  | p_type                  | p_size | p_container | p_retailprice | p_comment           |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
|         1 | goldenrod lavender spring chocolate lace | Manufacturer#1 | Brand#13 | PROMO BURNISHED COPPER  |      7 | JUMBO PKG   |           901 | ly. slyly ironi     |
|         2 | blush thistle blue yellow saddle         | Manufacturer#1 | Brand#13 | LARGE BRUSHED BRASS     |      1 | LG CASE     |           902 | lar accounts amo    |
|         3 | spring green yellow purple cornsilk      | Manufacturer#4 | Brand#42 | STANDARD POLISHED BRASS |     21 | WRAP CASE   |           903 | egular deposits hag |
|         4 | cornflower chocolate smoke green pink    | Manufacturer#3 | Brand#34 | SMALL PLATED BRASS      |     14 | MED DRUM    |           904 | p furiously r       |
|         5 | forest brown coral puff cream            | Manufacturer#3 | Brand#32 | STANDARD POLISHED TIN   |     15 | SM PKG      |           905 |  wake carefully     |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
```

TVF는 본질적으로 테이블이므로 SQL 문에서 "테이블"을 사용할 수 있는 모든 위치에 사용할 수 있습니다. 예를 들면 다음과 같습니다.

- `FROM` 절
- CTE의 `WITH` 절
- `JOIN` 문

### 시나리오 2: 뷰를 생성하여 접근 간소화 {#scenario-2-creating-views-to-simplify-access}

`CREATE VIEW` 문으로 TVF에 대한 논리 뷰를 생성하면 연결 정보를 반복해서 작성할 필요가 없으며, 권한도 관리할 수 있습니다.

```sql
-- Create a view based on TVF
CREATE VIEW tvf_view AS 
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);

-- View the structure of the view
DESC tvf_view;

-- Query the view
SELECT * FROM tvf_view;

-- Grant access to other users
GRANT SELECT_PRIV ON db.tvf_view TO other_user;
```

### 시나리오 3: Doris에 데이터 적재 {#scenario-3-importing-data-into-doris}

`INSERT INTO SELECT` 구문과 함께 사용하면 파일 데이터를 Doris 테이블에 적재할 수 있습니다.

```sql
-- 1. Create the target table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

-- 2. Import data via TVF
INSERT INTO test_table (id, name, age)
SELECT cast(id as INT) as id, name, cast(age as INT) as age
FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```

### 시나리오 4: 쿼리 결과를 파일로 내보내기(4.1.0 버전부터) {#export-query-results}

:::tip
이 기능은 Apache Doris 4.1.0 버전부터 지원하며, 현재 실험적 기능입니다.
:::

`INSERT INTO` TVF 구문을 사용하면 쿼리 결과를 로컬 파일 시스템, HDFS 또는 S3 호환 객체 스토리지에 파일로 직접 내보낼 수 있습니다. CSV, Parquet, ORC 형식을 지원합니다.

**구문:**

```sql
INSERT INTO tvf_name(
    "file_path" = "<file_path_prefix>",
    "format" = "<file_format>",
    ... -- other connection properties and format options
)
[WITH LABEL label_name]
SELECT ... ;
```

`tvf_name`에는 다음을 사용할 수 있습니다.

| TVF 이름 | 대상 스토리지 | 설명 |
|----------|---------------|-------------|
| `local` | 로컬 파일 시스템 | BE 노드의 로컬 디스크로 내보냅니다. `backend_id`를 지정해야 합니다. |
| `hdfs` | HDFS | Hadoop Distributed File System으로 내보냅니다. |
| `s3` | S3 호환 객체 스토리지 | AWS S3, Alibaba Cloud OSS, Tencent Cloud COS 등으로 내보냅니다. |

**공통 속성:**

| 속성 | 필수 여부 | 설명 |
|----------|----------|-------------|
| `file_path` | 예 | 출력 파일 경로 접두사입니다. 실제 생성되는 파일 이름 형식은 `{prefix}{query_id}_{idx}.{ext}`입니다. |
| `format` | 아니요 | 출력 파일 형식으로, `csv`(기본값), `parquet`, `orc`를 지원합니다. |
| `max_file_size` | 아니요 | 파일별 최대 크기(바이트)입니다. 이 크기를 초과하면 새 파일이 자동으로 생성됩니다. |
| `delete_existing_files` | 아니요 | 쓰기 전에 대상 디렉터리의 기존 파일을 삭제할지 여부입니다. 기본값은 `false`입니다. |

**CSV 형식의 추가 속성:**

| 속성 | 설명 |
|----------|-------------|
| `column_separator` | 컬럼 구분자로, 기본값은 `,`입니다. |
| `line_delimiter` | 행 구분자로, 기본값은 `\n`입니다. |
| `compress_type` | 압축 형식으로, `gz`, `zstd`, `lz4`, `snappy`를 지원합니다. |

**예제 1: HDFS로 CSV 내보내기**

```sql
INSERT INTO hdfs(
    "file_path" = "/tmp/export/csv_data_",
    "format" = "csv",
    "column_separator" = ",",
    "hadoop.username" = "doris",
    "fs.defaultFS" = "hdfs://namenode:8020",
    "delete_existing_files" = "true"
)
SELECT * FROM my_table ORDER BY id;
```

**예제 2: S3로 Parquet 내보내기**

```sql
INSERT INTO s3(
    "uri" = "s3://bucket/export/parquet_data_",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "format" = "parquet"
)
SELECT * FROM my_table WHERE dt = '2024-01-01';
```

**예제 3: S3로 ORC 내보내기**

```sql
INSERT INTO s3(
    "uri" = "s3://bucket/export/orc_data_",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "format" = "orc",
    "delete_existing_files" = "true"
)
SELECT c_int, c_varchar, c_string FROM my_table WHERE c_int IS NOT NULL ORDER BY c_int;
```

**예제 4: 로컬 BE 노드로 CSV 내보내기**

```sql
INSERT INTO local(
    "file_path" = "/tmp/export/local_csv_",
    "backend_id" = "10001",
    "format" = "csv"
)
SELECT * FROM my_table ORDER BY id;
```

:::note
- `file_path`는 파일 이름 접두사입니다. 실제 생성되는 파일 이름 형식은 `{prefix}{query_id}_{idx}.{ext}`이며, `idx`는 0부터 시작하여 증가합니다.
- `local` TVF를 사용할 때는 `backend_id`로 파일을 쓸 BE 노드를 지정해야 합니다.
- `delete_existing_files`를 사용하면 시스템은 쓰기 전에 `file_path`가 위치한 디렉터리의 모든 파일을 삭제합니다. 주의해서 사용하세요.
- `INSERT INTO TVF`를 실행하려면 ADMIN 또는 LOAD 권한이 필요합니다.
- S3 TVF의 `file_path` 속성은 `uri` 속성에 해당합니다.
:::

## 핵심 기능 {#core-features}

### 여러 파일 매칭 {#multi-file-matching}

파일 경로(URI)에서 와일드카드와 범위 패턴을 사용하여 여러 파일을 매칭할 수 있습니다.

| 패턴 | 예시 | 매칭 결과 |
|---------|---------|--------------|
| `*` | `file_*` | `file_`로 시작하는 모든 파일 |
| `{n..m}` | `file_{1..3}` | `file_1`, `file_2`, `file_3` |
| `{a,b,c}` | `file_{a,b}` | `file_a`, `file_b` |

### Resource로 구성 간소화 {#using-resource-to-simplify-configuration}

TVF는 `resource` 속성을 통해 미리 생성한 S3 또는 HDFS Resource를 참조할 수 있으므로, 쿼리마다 연결 정보를 반복해서 입력할 필요가 없습니다.

**1. Resource 생성**

```sql
CREATE RESOURCE "s3_resource"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.bucket" = "bucket"
);
```

**2. TVF에서 Resource 사용**

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    'resource' = 's3_resource'
);
```

:::tip
- Resource의 속성은 기본값으로 사용됩니다. TVF에 지정한 속성은 Resource에서 이름이 같은 속성을 재정의합니다.
- Resource를 사용하면 연결 정보를 중앙에서 관리할 수 있어 유지보수와 권한 제어가 쉬워집니다.
:::

### 자동 스키마 추론 {#automatic-schema-inference}

`DESC FUNCTION` 구문을 사용하면 TVF의 자동 추론된 스키마를 확인할 수 있습니다.

```sql
DESC FUNCTION s3 (
    "URI" = "s3://bucket/path/to/tvf_test/test.parquet",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true"
);
```

```
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```

**스키마 추론 규칙:**

| 파일 형식 | 추론 방법 |
|-------------|------------------|
| Parquet, ORC | 파일 메타데이터에서 스키마를 자동으로 가져옵니다. |
| CSV, JSON | 첫 번째 데이터 행을 파싱하여 스키마를 가져옵니다. 기본 컬럼 타입은 `string`입니다. |
| 여러 파일 매칭 | 첫 번째 파일의 스키마를 사용합니다. |

### 컬럼 타입 직접 지정(CSV/JSON) {#manually-specifying-column-types-csvjson}

CSV 및 JSON 형식에서는 `csv_schema` 속성을 사용하여 `name1:type1;name2:type2;...` 형식으로 컬럼 이름과 타입을 직접 지정할 수 있습니다.

```sql
S3 (
    'uri' = 's3://bucket/path/to/tvf_test/test.csv',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk',
    'format' = 'csv',
    'column_separator' = '|',
    'csv_schema' = 'k1:int;k2:int;k3:int;k4:decimal(38,10)'
)
```

**지원하는 컬럼 타입:**

| 정수 타입 | 부동 소수점 타입 | 기타 타입 |
|---------------|----------------------|-------------|
| tinyint | float | decimal(p,s) |
| smallint | double | date |
| int | | datetime |
| bigint | | char |
| largeint | | varchar |
| | | string |
| | | boolean |

:::note
- 컬럼 타입이 일치하지 않으면(예: 파일에 문자열이 있지만 `int`로 지정한 경우) 해당 컬럼은 `null`을 반환합니다.
- 컬럼 수가 일치하지 않으면(예: 파일에는 컬럼이 4개 있지만 5개를 지정한 경우) 누락된 컬럼은 `null`을 반환합니다.
:::

## 참고 사항 {#notes}

| 상황 | 동작 |
|----------|----------|
| `uri`에 매칭되는 파일이 없거나 모든 파일이 비어 있는 경우 | TVF는 빈 결과 집합을 반환합니다. `DESC FUNCTION`으로 스키마를 확인하면 자리 표시자 컬럼인 `__dummy_col`이 표시됩니다. |
| CSV 파일의 첫 번째 행이 비어 있는 경우(파일은 비어 있지 않음) | 오류 메시지: `The first line is empty, can not parse column numbers` |
