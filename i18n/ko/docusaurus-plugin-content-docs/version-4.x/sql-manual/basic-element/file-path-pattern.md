---
{
    "title": "파일 경로 패턴",
    "language": "ko",
    "description": "S3, HDFS 및 기타 객체 스토리지와 같은 원격 스토리지 시스템의 파일에 접근할 때 Doris가 지원하는 파일 경로 패턴과 와일드카드를 설명합니다."
}
---

## 설명 {#description}

Doris는 원격 스토리지 시스템(S3, HDFS 및 기타 S3 호환 객체 스토리지)의 파일에 접근할 때 와일드카드와 범위 표현식을 포함한 유연한 파일 경로 패턴을 지원합니다. 이 문서에서는 지원되는 경로 형식과 패턴 매칭 구문을 설명합니다.

다음 기능에서 이러한 경로 패턴을 사용할 수 있습니다.
- [S3 TVF](../sql-functions/table-valued-functions/s3)
- [HDFS TVF](../sql-functions/table-valued-functions/hdfs)
- [Broker Load](../../data-operate/import/import-way/broker-load-manual)
- TVF를 사용하는 INSERT INTO SELECT

## 지원되는 URI 형식 {#supported-uri-formats}

### S3 방식 URI {#s3-style-uris}

| 방식 | 형식 | 예제 |
|-------|--------|---------|
| AWS 클라이언트 방식(Hadoop S3) | `s3://bucket/path/to/file` | `s3://my-bucket/data/file.csv` |
| S3A 방식 | `s3a://bucket/path/to/file` | `s3a://my-bucket/data/file.csv` |
| S3N 방식 | `s3n://bucket/path/to/file` | `s3n://my-bucket/data/file.csv` |
| 가상 호스트 방식 | `https://bucket.endpoint/path/to/file` | `https://my-bucket.s3.us-west-1.amazonaws.com/data/file.csv` |
| 경로 방식 | `https://endpoint/bucket/path/to/file` | `https://s3.us-west-1.amazonaws.com/my-bucket/data/file.csv` |

### 기타 클라우드 스토리지 URI {#other-cloud-storage-uris}

| 제공업체 | 스킴 | 예제 |
|----------|--------|---------|
| Alibaba Cloud OSS | `oss://` | `oss://my-bucket/data/file.csv` |
| Tencent Cloud COS | `cos://`, `cosn://` | `cos://my-bucket/data/file.csv` |
| Baidu Cloud BOS | `bos://` | `bos://my-bucket/data/file.csv` |
| Huawei Cloud OBS | `obs://` | `obs://my-bucket/data/file.csv` |
| Google Cloud Storage | `gs://` | `gs://my-bucket/data/file.csv` |
| Azure Blob Storage | `azure://` | `azure://container/data/file.csv` |

### HDFS URI {#hdfs-uris}

| 방식 | 형식 | 예제 |
|-------|--------|---------|
| 표준 | `hdfs://namenode:port/path/to/file` | `hdfs://namenode:8020/user/data/file.csv` |
| HA 모드 | `hdfs://nameservice/path/to/file` | `hdfs://my-ha-cluster/user/data/file.csv` |

## 와일드카드 패턴 {#wildcard-patterns}

Doris는 파일 경로에 glob 방식의 패턴 매칭을 사용합니다. 다음 와일드카드를 지원합니다.

### 기본 와일드카드 {#basic-wildcards}

| 패턴 | 설명 | 예제 | 일치하는 항목 |
|---------|-------------|---------|---------|
| `*` | 경로 구간 내의 임의 개수의 문자와 일치하며, 문자가 없는 경우도 포함 | `*.csv` | `file.csv`, `data.csv`, `a.csv` |
| `?` | 정확히 한 문자와 일치 | `file?.csv` | `file1.csv`, `fileA.csv`와 일치하지만 `file10.csv`와는 일치하지 않음 |
| `[abc]` | 대괄호 안의 문자 중 하나와 일치 | `file[123].csv` | `file1.csv`, `file2.csv`, `file3.csv` |
| `[a-z]` | 지정된 범위 내의 문자 중 하나와 일치 | `file[a-c].csv` | `filea.csv`, `fileb.csv`, `filec.csv` |
| `[!abc]` | 대괄호 안에 없는 문자 하나와 일치 | `file[!0-9].csv` | `filea.csv`, `fileb.csv`와 일치하지만 `file1.csv`와는 일치하지 않음 |

### 범위 확장(중괄호 패턴) {#range-expansion-brace-patterns}

Doris는 중괄호 패턴 `{start..end}`를 사용한 숫자 범위 확장을 지원합니다.

| 패턴 | 확장 결과 | 일치하는 항목 |
|---------|-----------|---------|
| `{1..3}` | `{1,2,3}` | `1`, `2`, `3` |
| `{01..05}` | `{1,2,3,4,5}` | `1`, `2`, `3`, `4`, `5`(앞에 붙은 영은 유지되지 않음) |
| `{3..1}` | `{1,2,3}` | `1`, `2`, `3`(역방향 범위도 지원) |
| `{a,b,c}` | `{a,b,c}` | `a`, `b`, `c`(나열) |
| `{1..3,5,7..9}` | `{1,2,3,5,7,8,9}` | 범위와 값을 혼합 |

:::caution 참고
- Doris는 가능한 한 많은 파일을 매칭하려고 시도합니다. 중괄호 표현식에서 유효하지 않은 부분은 별도의 알림 없이 건너뛰며, 유효한 부분은 계속 확장합니다. 예를 들어, `file_{a..b,-1..3,4..5}`는 `file_4`와 `file_5`에 일치합니다(유효하지 않은 `a..b`와 음수 범위 `-1..3`은 건너뛰지만 `4..5`는 정상적으로 확장됩니다).
- 전체 범위가 음수이면(예: `{-1..2}`) 해당 범위를 건너뜁니다. 유효한 범위와 혼합되어 있으면(예: `{-1..2,1..3}`) 유효한 범위인 `1..3`만 확장합니다.
- 범위와 함께 쉼표로 구분된 값을 사용할 때는 숫자만 허용됩니다. 예를 들어, `{1..4,a}`에서 숫자가 아닌 `a`는 무시되므로 결과는 `{1,2,3,4}`가 됩니다.
- `{a,b,c}`와 같은 단순 나열 패턴(`..` 범위가 없는 패턴)은 glob 매칭에 직접 전달되며 예상대로 작동합니다.
:::

### 패턴 조합 {#combining-patterns}

하나의 경로에서 여러 패턴을 조합할 수 있습니다.

```
s3://bucket/data_{1..3}/file_*.csv
```

다음 경로가 일치합니다.
- `s3://bucket/data_1/file_a.csv`
- `s3://bucket/data_1/file_b.csv`
- `s3://bucket/data_2/file_a.csv`
- ... 등

## 예제 {#examples}

### S3 TVF 예제 {#s3-tvf-examples}

**디렉터리의 모든 CSV 파일 찾기:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/*.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

**숫자 범위에 해당하는 파일 찾기:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/data_{1..10}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

**날짜별로 파티션을 나눈 디렉터리의 파일 찾기:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/year=2024/month=*/day=*/data.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```

:::caution 앞에 영을 채운 디렉터리
`month=01`, `month=02`처럼 앞에 영을 채운 디렉터리 이름에는 범위 패턴 대신 와일드카드(`*`)를 사용하세요. `{01..12}` 패턴은 `{1,2,...,12}`로 확장되므로 `month=01`과 일치하지 않습니다.
:::

**번호가 매겨진 분할 파일 찾기(예: Spark 출력):**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/output/part-{00000..00099}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

### Broker Load 예제 {#broker-load-examples}

**패턴과 일치하는 모든 CSV 파일의 데이터 적재:**

```sql
LOAD LABEL db.label_wildcard
(
    DATA INFILE("s3://my-bucket/data/file_*.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH S3 (
    "provider" = "S3",
    "AWS_ENDPOINT" = "https://s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```

**숫자 범위 확장을 사용한 파일 데이터 적재:**

```sql
LOAD LABEL db.label_range
(
    DATA INFILE("s3://my-bucket/exports/data_{1..5}.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH S3 (
    "provider" = "S3",
    "AWS_ENDPOINT" = "https://s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```

**와일드카드를 사용한 HDFS 데이터 적재:**

```sql
LOAD LABEL db.label_hdfs_wildcard
(
    DATA INFILE("hdfs://namenode:8020/user/data/2024-*/*.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://namenode:8020",
    "hadoop.username" = "user"
);
```

**숫자 범위를 사용한 HDFS 데이터 적재:**

```sql
LOAD LABEL db.label_hdfs_range
(
    DATA INFILE("hdfs://namenode:8020/data/file_{1..3,5,7..9}.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://namenode:8020",
    "hadoop.username" = "user"
);
```

### INSERT INTO SELECT 예제 {#insert-into-select-examples}

**와일드카드를 사용하여 S3에서 데이터 삽입:**

```sql
INSERT INTO my_table (col1, col2, col3)
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/part-*.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```

## 성능 고려 사항 {#performance-considerations}

### 구체적인 접두사 사용 {#use-specific-prefixes}

Doris는 S3/HDFS의 파일 목록 조회 작업을 최적화하기 위해 경로 패턴에서 와일드카드가 없는 가장 긴 접두사를 추출합니다. 접두사가 구체적일수록 파일을 더 빠르게 찾을 수 있습니다.

```sql
-- Good: specific prefix reduces listing scope
"uri" = "s3://bucket/data/2024/01/15/*.csv"

-- Less optimal: broad wildcard at early path segment
"uri" = "s3://bucket/data/**/file.csv"
```

### 번호 순서를 알 때는 범위 패턴 사용 {#prefer-range-patterns-for-known-sequences}

정확한 파일 번호를 알고 있다면 와일드카드 대신 범위 패턴을 사용하세요.

```sql
-- Better: explicit range
"uri" = "s3://bucket/data/part-{0001..0100}.csv"

-- Less optimal: wildcard matches unknown files
"uri" = "s3://bucket/data/part-*.csv"
```

### 깊은 경로를 탐색하는 재귀 와일드카드 피하기 {#avoid-deep-recursive-wildcards}

`**`처럼 깊은 경로를 재귀적으로 탐색하는 패턴은 대규모 버킷에서 파일 목록 조회 속도를 저하시킬 수 있습니다.

```sql
-- Avoid when possible
"uri" = "s3://bucket/**/*.csv"

-- Prefer explicit path structure
"uri" = "s3://bucket/data/year=*/month=*/day=*/*.csv"
```

## 문제 해결 {#troubleshooting}

| 문제 | 원인 | 해결 방법 |
|-------|-------|----------|
| 파일을 찾을 수 없음 | 패턴과 일치하는 파일이 없음 | 경로와 패턴 구문을 확인하고 먼저 단일 파일로 테스트 |
| 파일 목록 조회가 느림 | 와일드카드의 범위가 너무 넓거나 파일이 너무 많음 | 더 구체적인 접두사를 사용하고 와일드카드 범위를 제한 |
| 유효하지 않은 URI 오류 | 잘못된 경로 구문 | URI 스킴과 버킷 이름 형식 확인 |
| 접근 거부 | 자격 증명 또는 권한 문제 | S3/HDFS 자격 증명과 버킷 정책 확인 |

### 경로 패턴 테스트 {#testing-path-patterns}

대규모 데이터 적재 작업을 실행하기 전에 결과 수를 제한한 쿼리로 패턴을 테스트하세요.

```sql
-- Test if files exist and match pattern
SELECT * FROM S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
) LIMIT 1;
```

`DESC FUNCTION`을 사용하여 패턴과 일치하는 파일의 스키마를 확인하세요.

```sql
DESC FUNCTION S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
);
```
