---
{
    "title": "CSV",
    "language": "ko",
    "description": "CSV 파일을 Apache Doris로 가져오는 방법을 다룬 종합 가이드입니다. 사용자 지정 구분자, 감싸기 문자, 이스케이프 문자 및 압축 형식을 지원하며, Stream Load와 Broker Load 등 다양한 가져오기 방법에 적용할 수 있습니다.",
    "keywords": [
        "Doris CSV 가져오기",
        "CSV 형식 매개변수",
        "column_separator",
        "line_delimiter",
        "enclose",
        "Stream Load CSV",
        "Broker Load CSV",
        "Routine Load CSV",
        "csv_with_names",
        "compress_type"
    ]
}
---

<!-- Knowledge type: Operation guide + Parameter reference -->
<!-- Applicable scenario: Data import / File format adaptation -->

이 문서에서는 CSV 형식의 데이터 파일을 Apache Doris로 가져오는 방법을 설명합니다. Doris는 사용자 지정 행/열 구분자, 필드 감싸기 문자, 이스케이프 문자, 건너뛸 줄 수, 압축 형식 등 유연한 CSV 형식 설정을 지원합니다. 또한 일괄 데이터 적재, 실시간 스트리밍 수집, 페더레이션 쿼리 등 다양한 시나리오의 데이터 가져오기 요구 사항을 충족하는 여러 가져오기 방법을 제공합니다.

## 빠른 탐색 {#quick-navigation}

시작하기 전에 데이터 소스와 데이터 반영 주기 요구 사항에 따라 적절한 가져오기 방법을 선택한 다음, 해당 섹션의 매개변수와 예제를 참조하세요.

- 소규모 로컬 파일, HTTP 푸시: [Stream Load](../import-way/stream-load-manual) 사용
- 객체 스토리지 / HDFS에 있는 대량의 파일: [Broker Load](../import-way/broker-load-manual) 사용
- Kafka의 실시간 데이터 스트림: [Routine Load](../import-way/routine-load-manual) 사용
- MySQL 클라이언트를 통한 로컬 파일 가져오기: [MySQL Load](../import-way/mysql-load-manual) 사용
- SQL로 외부 스토리지 파일을 직접 쿼리하거나 데이터 적재: [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) 또는 [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) 사용

## 지원되는 가져오기 방법 {#supported-import-methods}

Doris는 CSV 형식의 데이터를 가져오는 다음 방법을 제공합니다.

| 가져오기 방법 | 적용 시나리오 | 관련 문서 |
|----------|----------|------|
| Stream Load | HTTP로 로컬 파일이나 프로그램 데이터 푸시 | [Stream Load](../import-way/stream-load-manual) |
| Broker Load | S3 / HDFS 등의 원격 스토리지에서 일괄 가져오기 | [Broker Load](../import-way/broker-load-manual) |
| Routine Load | Kafka를 지속적으로 구독하여 데이터 가져오기 | [Routine Load](../import-way/routine-load-manual) |
| MySQL Load | MySQL 프로토콜로 로컬 파일 가져오기 | [MySQL Load](../import-way/mysql-load-manual) |
| INSERT INTO FROM S3 TVF | S3 파일을 직접 읽어 테이블에 삽입 | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | HDFS 파일을 직접 읽어 테이블에 삽입 | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## CSV 형식 매개변수 {#csv-format-parameters}

<!-- Knowledge type: Configuration parameters -->

### 가져오기 방법별 매개변수 지원 표 {#parameter-support-matrix-across-import-methods}

다음 표는 각 가져오기 방법의 CSV 형식 매개변수 지원 여부와 해당 구문을 정리한 것입니다.

| 매개변수 | 기본값 | Stream Load | Broker Load | Routine Load | MySQL Load | TVF |
|------|--------|-------------|-------------|--------------|------------|-----|
| 줄 구분자 | `\n` | line_delimiter | LINES TERMINATED BY | 지원하지 않음 | LINES TERMINATED BY | line_delimiter |
| 열 구분자 | `\t` | column_separator | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | COLUMNS TERMINATED BY | column_separator |
| 감싸기 문자 | 없음 | enclose | PROPERTIES.enclose | PROPERTIES.enclose | PROPERTIES.enclose | enclose |
| 이스케이프 문자 | `\` | escape | PROPERTIES.escape | PROPERTIES.escape | PROPERTIES.escape | escape |
| 건너뛸 줄 수 | 0 | skip_lines | PROPERTIES.skip_lines | 지원하지 않음 | IGNORE LINES | skip_lines |
| 큰따옴표 제거 | false | trim_double_quotes | 지원하지 않음 | PROPERTIES.trim_double_quotes | 지원하지 않음 | trim_double_quotes |
| 압축 형식 | plain | compress_type | PROPERTIES.compress_type | 지원하지 않음 | 지원하지 않음 | compress_type |

:::tip 가져오기 방법별 매개변수 구문
1. **Stream Load**: HTTP 헤더로 매개변수를 직접 지정합니다. 예: `-H "line_delimiter:\n"`
2. **Broker Load**: SQL 문으로 매개변수를 지정합니다.
    - 구분자는 `COLUMNS TERMINATED BY`와 `LINES TERMINATED BY`로 지정합니다.
    - 나머지 매개변수는 `PROPERTIES`로 지정합니다. 예: `PROPERTIES("compress_type"="gz")`
3. **Routine Load**: SQL 문으로 매개변수를 지정합니다.
    - 구분자는 `COLUMNS TERMINATED BY`로 지정합니다.
    - 나머지 매개변수는 `PROPERTIES`로 지정합니다. 예: `PROPERTIES("enclose"="\"")`
4. **MySQL Load**: SQL 문으로 매개변수를 지정합니다.
    - 구분자는 `LINES TERMINATED BY`와 `COLUMNS TERMINATED BY`로 지정합니다.
    - 나머지 매개변수는 `PROPERTIES`로 지정합니다. 예: `PROPERTIES("escape"="\\")`
5. **TVF**: TVF 문에서 매개변수를 지정합니다. 예: `S3("line_delimiter"="\n")`
:::

### 매개변수 상세 설명 {#parameter-details}

#### 줄 구분자 (line_delimiter) {#line-delimiter-line_delimiter}

- **용도**: 가져올 파일의 줄바꿈 문자를 지정합니다.
- **기본값**: `\n`
- **특징**: 여러 문자를 조합한 줄 구분자를 지원합니다.

**주요 사용 사례**:

- Linux/Unix 파일:

    ```text
    Data file:
    Zhang San, 25\n
    Li Si, 30\n

    Parameter setting:
    line_delimiter: \n (default value, can be omitted)
    ```

- Windows 파일:

    ```text
    Data file:
    Zhang San, 25\r\n
    Li Si, 30\r\n

    Parameter setting:
    line_delimiter: \r\n
    ```

- 특수 프로그램에서 생성한 파일:

    ```text
    Data file:
    Zhang San, 25\r
    Li Si, 30\r

    Parameter setting:
    line_delimiter: \r
    ```

- 여러 문자로 구성된 사용자 지정 구분자:

    ```text
    Data file:
    Zhang San, 25||
    Li Si, 30||

    Parameter setting:
    line_delimiter: ||
    ```

#### 열 구분자 (column_separator) {#column-separator-column_separator}

- **용도**: 가져올 파일의 열 구분자를 지정합니다.
- **기본값**: `\t` (탭)
- **특징**:
    - 표시 문자와 비표시 문자를 모두 지원합니다.
    - 여러 문자 조합을 지원합니다.
    - 비표시 문자는 `\x` 접두사를 붙인 십육진수로 표현해야 합니다.
- **MySQL 프로토콜의 특수 처리**:
    - 비표시 문자에는 백슬래시를 하나 더 붙여야 합니다.
    - 예를 들어 Hive의 `\x01`은 Broker Load에서 `\\x01`로 작성해야 합니다.

**주요 사용 사례**:

- 일반적인 표시 문자:

    ```text
    Data file:
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    column_separator: ,
    ```

- 탭 (기본값):

    ```text
    Data file:
    Zhang San    25    Beijing
    Li Si    30    Shanghai

    Parameter setting:
    column_separator: \t (default value, can be omitted)
    ```

- Hive 파일 (Stream Load):

    ```text
    Data file:
    Zhang San\x0125\x01 Beijing
    Li Si\x0130\x01 Shanghai

    Parameter setting:
    column_separator: \x01
    ```

- Hive 파일 (Broker Load):

    ```text
    Data file:
    Zhang San\x0125\x01 Beijing
    Li Si\x0130\x01 Shanghai

    Parameter setting:
    PROPERTIES("column_separator"="\\x01")
    ```

- 여러 문자로 구성된 구분자:

    ```text
    Data file:
    Zhang San||25||Beijing
    Li Si||30||Shanghai

    Parameter setting:
    column_separator: ||
    ```

#### 감싸기 문자 (enclose) {#enclose-enclose}

- **용도**: 특수 문자가 포함된 필드가 잘못 파싱되지 않도록 보호합니다.
- **제약 사항**: 단일 바이트 문자만 지원합니다.
- **주로 사용하는 문자**:
    - 작은따옴표: `'`
    - 큰따옴표: `"`

**주요 사용 사례**:

- 필드에 열 구분자가 포함된 경우:

    ```text
    Data: a,'b,c',d
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b,c] [d]
    ```

- 필드에 줄 구분자가 포함된 경우:

    ```text
    Data: a,'b\nc',d
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b\nc] [d]
    ```

- 필드에 열 구분자와 줄 구분자가 모두 포함된 경우:

    ```text
    Data: a,'b,c\nd,e',f
    Column separator: ,
    Enclose: '
    Parsing result: 3 fields [a] [b,c\nd,e] [f]
    ```

#### 이스케이프 문자 (escape) {#escape-escape}

- **용도**: 필드 내에서 감싸기 문자와 동일한 문자를 이스케이프합니다.
- **제약 사항**: 단일 바이트 문자만 지원합니다. 기본값은 `\`입니다.

**주요 사용 사례**:

- 필드에 감싸기 문자가 포함된 경우:

    ```text
    Data: a,'b,\'c',d
    Column separator: ,
    Enclose: '
    Escape: \
    Parsing result: 3 fields [a] [b,'c] [d]
    ```

- 필드에 감싸기 문자가 여러 개 포함된 경우:

    ```text
    Data: a,"b,\"c\"d",e
    Column separator: ,
    Enclose: "
    Escape: \
    Parsing result: 3 fields [a] [b,"c"d] [e]
    ```

- 필드에 이스케이프 문자 자체가 포함된 경우:

    ```text
    Data: a,'b\\c',d
    Column separator: ,
    Enclose: '
    Escape: \
    Parsing result: 3 fields [a] [b\c] [d]
    ```

#### 건너뛸 줄 수 (skip_lines) {#skip-lines-skip_lines}

- **용도**: CSV 파일의 처음 N줄을 건너뜁니다.
- **유형**: 정수
- **기본값**: 0
- **특이 사항**:
    - `format`이 `csv_with_names`이면 시스템이 첫 번째 줄(열 이름)을 자동으로 건너뛰고 `skip_lines` 매개변수를 무시합니다.
    - `format`이 `csv_with_names_and_types`이면 시스템이 처음 두 줄(열 이름과 유형)을 자동으로 건너뛰고 `skip_lines` 매개변수를 무시합니다.

**주요 사용 사례**:

- 헤더 줄 건너뛰기:

    ```text
    Data file:
    Name, Age, City
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    skip_lines: 1
    Result: skip the header line and import the subsequent data
    ```

- 주석 줄 건너뛰기:

    ```text
    Data file:
    # User information table
    # Created at: 2024-01-01
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    skip_lines: 2
    Result: skip the comment lines and import the subsequent data
    ```

- csv_with_names 형식 사용:

    ```text
    Data file:
    name,age,city
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    format: csv_with_names
    Result: the system automatically skips the first line of column names
    ```

- csv_with_names_and_types 형식 사용:

    ```text
    Data file:
    name,age,city
    string,int,string
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai

    Parameter setting:
    format: csv_with_names_and_types
    Result: the system automatically skips the first two lines of column names and types
    ```

#### 큰따옴표 제거 (trim_double_quotes) {#trim-double-quotes-trim_double_quotes}

- **용도**: CSV 파일의 각 필드에서 가장 바깥쪽 큰따옴표를 제거합니다.
- **유형**: 불리언
- **기본값**: false

**주요 사용 사례**:

- 큰따옴표 제거:

    ```text
    Data file:
    "Zhang San","25","Beijing"
    "Li Si","30","Shanghai"

    Parameter setting:
    trim_double_quotes: true
    Result:
    Zhang San, 25, Beijing
    Li Si, 30, Shanghai
    ```

#### 압축 형식 (compress_type) {#compression-format-compress_type}

- **용도**: 가져올 파일의 압축 형식을 지정합니다.
- **유형**: 문자열, 대소문자를 구분하지 않음
- **기본값**: plain
- **지원되는 압축 형식**:

    | 값 | 설명 |
    |------|------|
    | plain | 압축 없음 (기본값) |
    | bz2 | BZIP2 압축 |
    | deflate | DEFLATE 압축 |
    | gz | GZIP 압축 |
    | lz4 | LZ4 Frame 형식 압축 |
    | lz4_block | LZ4 Block 형식 압축 |
    | lzo | LZO 압축 |
    | lzop | LZOP 압축 |
    | snappy_block | SNAPPY Block 형식 압축 |

- **참고 사항**:
    - tar는 압축 형식이 아닌 파일 패키징 형식이므로 `.tar` 파일은 지원하지 않습니다.
    - tar로 패키징된 파일을 사용하려면 먼저 패키지를 푼 다음 가져오세요.

## 예제 {#examples}

<!-- Knowledge type: Operation steps -->

이 섹션에서는 각 가져오기 방법에서 가장 일반적으로 사용하는 세 가지 작업인 구분자 지정, 따옴표로 감싼 데이터 처리, 압축 파일 가져오기를 보여 줍니다.

### Stream Load {#stream-load}

```shell
# Specify delimiters
curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "line_delimiter:\n" \
    -T example.csv \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load

# Handle quoted data
curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "enclose:\"" \
    -H "escape:\\" \
    -T example.csv \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load

# Import a compressed file
curl --location-trusted -u root: \
    -H "compress_type:gz" \
    -T example.csv.gz \
    http://<fe_host>:<fe_http_port>/api/test_db/test_table/_stream_load
```

### Broker Load {#broker-load}

```sql
-- Specify delimiters
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv")
    INTO TABLE test_table
    COLUMNS TERMINATED BY ","
    LINES TERMINATED BY "\n"
)
WITH S3
(
    ...
);

-- Handle quoted data
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv")
    INTO TABLE test_table
    PROPERTIES
    (
        "enclose" = "\"",
        "escape" = "\\"
    )
)
WITH S3
(
    ...
);

-- Import a compressed file
LOAD LABEL test_db.test_label
(
    DATA INFILE("s3://bucket/example.csv.gz")
    INTO TABLE test_table
    PROPERTIES
    (
        "compress_type" = "gz"
    )
)
WITH S3
(
    ...
);
```

### Routine Load {#routine-load}

```sql
-- Specify delimiters
CREATE ROUTINE LOAD test_db.test_job ON test_table
COLUMNS TERMINATED BY ","
FROM KAFKA
(
     ...
);

-- Handle quoted data
CREATE ROUTINE LOAD test_db.test_job ON test_table
COLUMNS TERMINATED BY ","
PROPERTIES
(
    "enclose" = "\"",
    "escape" = "\\"
)
FROM KAFKA
(
    ...
);
```

### MySQL Load {#mysql-load}

```sql
-- Specify delimiters
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';

-- Handle quoted data
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n'
PROPERTIES
(
    "enclose" = "\"",
    "escape" = "\\"
);

-- Skip the header
LOAD DATA LOCAL INFILE 'example.csv'
INTO TABLE test_table
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 LINES;
```

### TVF {#tvf}

```sql
-- Specify delimiters
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv",
    "format" = "csv",
    "column_separator" = ",",
    "line_delimiter" = "\n"
    ...
);

-- Handle quoted data
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv",
    "format" = "csv",
    "column_separator" = ",",
    "enclose" = "\"",
    "escape" = "\\"
    ...
);

-- Import a compressed file
INSERT INTO test_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.csv.gz",
    "format" = "csv",
    "compress_type" = "gz"
    ...
);
```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

**Q1: Hive의 기본 열 구분자인 `\x01`이 Broker Load에서 작동하지 않습니다. 이유가 무엇인가요?**

MySQL 프로토콜에서는 비표시 문자에 백슬래시를 하나 더 붙여 `\\x01`로 작성해야 합니다. 예: `PROPERTIES("column_separator"="\\x01")`. Stream Load에서 HTTP 헤더로 지정할 때는 `\x01`만 사용하면 됩니다.

**Q2: Routine Load는 사용자 지정 줄 구분자를 지원하나요?**

아니요. Routine Load가 Kafka에서 소비하는 각 메시지는 그 자체로 한 줄에 해당하므로 `line_delimiter` 매개변수는 필요하지 않으며 지원하지도 않습니다.

**Q3: CSV 파일의 첫 번째 줄이 헤더입니다. 가져올 때 어떻게 건너뛰나요?**

- Stream Load / Broker Load / TVF: `skip_lines=1` 사용
- MySQL Load: `IGNORE 1 LINES` 사용
- 파일이 `name1,name2,...` 헤더 규칙도 따르는 경우 `format`을 `csv_with_names`로 설정하면 시스템이 첫 번째 줄을 자동으로 건너뜁니다. `csv_with_names_and_types`로 설정하면 처음 두 줄(열 이름 + 유형)을 자동으로 건너뜁니다.

**Q4: `.tar` 또는 `.tar.gz` 파일을 직접 가져올 수 있나요?**

아니요. tar는 압축 형식이 아닌 패키징 형식입니다. Doris는 `compress_type`에 나열된 압축 형식만 지원합니다. `.tar` 또는 `.tar.gz` 파일은 먼저 패키지를 푼 다음 가져오세요.

**Q5: 필드에 열 구분자와 줄바꿈이 모두 포함되어 있습니다. 어떻게 처리해야 하나요?**

해당 필드에 `enclose`를 설정하세요. 예를 들어 감싸기 문자로 작은따옴표를 사용하면 `a,'b,c\nd,e',f`는 3개의 필드 `[a]`, `[b,c\nd,e]`, `[f]`로 올바르게 파싱됩니다. 이때 열 구분자는 `,`이고 감싸기 문자는 `'`입니다. 필드에 감싸기 문자 자체도 포함되어 있으면 `escape`와 함께 사용하세요.

**Q6: 큰따옴표로 감싼 필드를 가져올 때 가장 바깥쪽 큰따옴표를 어떻게 제거하나요?**

`trim_double_quotes`를 `true`로 설정하면 Doris가 파싱 후 각 필드에서 가장 바깥쪽 큰따옴표를 자동으로 제거합니다. 이 매개변수는 Stream Load, Routine Load, TVF에서 지원하며, Broker Load와 MySQL Load에서는 지원하지 않습니다.
