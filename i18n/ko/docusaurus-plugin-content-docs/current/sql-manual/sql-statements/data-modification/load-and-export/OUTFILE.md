---
{
    "title": "OUTFILE",
    "language": "ko",
    "description": "SELECT INTO OUTFILE 명령은 쿼리 결과를 파일로 내보내는 데 사용됩니다. 현재 HDFS, S3, BOS 등의 원격 스토리지로 내보내기를 지원합니다."
}
---

## 설명 {#description}

`SELECT INTO OUTFILE` 명령은 쿼리 결과를 파일로 내보내는 데 사용됩니다. 현재 Broker 프로세스, S3 프로토콜 또는 HDFS 프로토콜을 통해 HDFS, S3, BOS, COS (Tencent Cloud) 등의 원격 스토리지로 내보내기를 지원합니다.

## 구문: {#syntax}

```sql
<query_stmt>
INTO OUTFILE "<file_path>"
[ FORMAT AS <format_as> ]
[ <properties> ]
```

## 필수 매개변수 {#required-parameters}

**1. `<query_stmt>`**   

쿼리 문으로, 유효한 SQL이어야 합니다. [쿼리 문 설명서](../../data-query/SELECT.md)를 참조하세요.

**2. `<file_path>`**

파일 저장 경로와 파일 접두사입니다. 파일이 저장될 경로와 파일 이름에 사용할 접두사를 지정합니다. 예: `hdfs://path/to/my_file_`.  
최종 파일 이름은 `my_file_`, 파일 일련번호, 파일 형식 확장자로 구성됩니다. 파일 일련번호는 0부터 시작하며, 일련번호의 개수는 분할된 파일 수와 같습니다. 예:  
- my_file_abcdefg_0.csv
- my_file_abcdefg_1.csv
- my_file_abcdegf_2.csv  

파일 접두사를 생략하고 `hdfs://path/to/`처럼 파일 디렉터리만 지정할 수도 있습니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<format_as>`**

   내보내기 형식을 지정합니다. 현재 다음 형식을 지원합니다:
   - `CSV` (기본값)
   - `PARQUET`
   - `CSV_WITH_NAMES`
   - `CSV_WITH_NAMES_AND_TYPES`
   - `ORC`

   >   참고: PARQUET, CSV_WITH_NAMES, CSV_WITH_NAMES_AND_TYPES, ORC는 버전 1.2부터 지원됩니다.

**2. `<properties>`**  

```sql
[ PROPERTIES ("<key>"="<value>" [, ... ]) ]
```  

현재 Broker 프로세스 또는 S3/HDFS 프로토콜을 통한 내보내기를 지원합니다.

**내보내기 파일 자체와 관련된 속성**
- `column_separator`: 열 구분자로, CSV 관련 형식에만 사용됩니다. 버전 1.2부터 "\\x01", "abc"와 같은 멀티바이트 구분자를 지원합니다.
- `line_delimiter`: 줄 구분자로, CSV 관련 형식에만 사용됩니다. 버전 1.2부터 "\\x01", "abc"와 같은 멀티바이트 구분자를 지원합니다.
- `max_file_size`: 단일 파일 크기 제한입니다. 결과가 이 값을 초과하면 여러 파일로 분할됩니다. `max_file_size`의 값 범위는 [5MB, 2GB]이며, 기본값은 `1GB`입니다. (내보내기 파일 형식으로 ORC를 지정하면 실제 분할 파일 크기는 64MB의 배수가 됩니다. 예를 들어 `max_file_size = 5MB`를 지정하면 실제로는 64 MB 단위로 분할되고, `max_file_size = 65MB`를 지정하면 실제로는 128 MB 단위로 분할됩니다.)
- `delete_existing_files`: 기본값은 `false`입니다. `true`로 지정하면 먼저 `file_path`로 지정한 디렉터리 아래의 모든 파일을 삭제한 다음 해당 디렉터리로 데이터를 내보냅니다. 예를 들어 "file_path" = "/user/tmp"이면 "/user/" 아래의 모든 파일과 디렉터리가 삭제되고, "file_path" = "/user/tmp/"이면 "/user/tmp/" 아래의 모든 파일과 디렉터리가 삭제됩니다.
- `file_suffix`: 내보낸 파일의 확장자를 지정합니다. 이 매개변수를 지정하지 않으면 파일 형식의 기본 확장자가 사용됩니다.
- `compress_type`: 내보낼 파일 형식을 Parquet / ORC 파일로 지정할 때 Parquet / ORC 파일에 사용할 압축 방식을 지정할 수 있습니다. Parquet 파일 형식에서는 SNAPPY, GZIP, BROTLI, ZSTD, LZ4, PLAIN 압축 방식을 지정할 수 있으며, 기본값은 SNAPPY입니다. ORC 파일 형식에서는 PLAIN, SNAPPY, ZLIB, ZSTD 압축 방식을 지정할 수 있으며, 기본값은 ZLIB입니다. 이 매개변수는 버전 2.1.5부터 지원됩니다. (PLAIN은 압축하지 않음을 의미합니다.) 버전 3.1.1부터 CSV 형식의 압축 알고리즘 지정을 지원하며, 현재 "plain", "gz", "bz2", "snappyblock", "lz4block", "zstd"를 지원합니다.

**Broker 관련 속성**  _(접두사 `broker.`를 추가해야 함)_  
- `broker.name: broker`: 이름
- `broker.hadoop.security.authentication`: 인증 방식을 kerberos로 지정합니다.
- `broker.kerberos_principal`: kerberos principal을 지정합니다.
- `broker.kerberos_keytab`: kerberos keytab 파일 경로를 지정합니다. Broker 프로세스가 실행 중인 서버에 있는 파일의 절대 경로여야 하며, Broker 프로세스가 해당 파일에 접근할 수 있어야 합니다.

**HDFS 관련 속성**
- `fs.defaultFS`: namenode 주소와 포트
- `hadoop.username`: hdfs 사용자 이름
- `dfs.nameservices`: name service 이름으로, hdfs-site.xml과 일치해야 합니다.
- `dfs.ha.namenodes.[nameservice ID]`: namenode id 목록으로, hdfs-site.xml과 일치해야 합니다.
- `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name node의 rpc 주소로, 개수는 namenode 수와 같으며 hdfs-site.xml과 일치해야 합니다.
- `dfs.client.failover.proxy.provider.[nameservice ID]`: HDFS 클라이언트가 활성 namenode에 연결할 때 사용하는 Java 클래스입니다. 일반적으로 "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"를 사용합니다.

**kerberos 인증이 활성화된 Hadoop 클러스터에서는 다음 PROPERTIES 속성을 추가로 설정해야 합니다:**
- `dfs.namenode.kerberos.principal`: HDFS namenode 서비스의 Principal 이름
- `hadoop.security.authentication`: 인증 방식을 kerberos로 설정합니다.
- `hadoop.kerberos.principal`: Doris가 HDFS에 연결할 때 사용할 Kerberos principal을 설정합니다.
- `hadoop.kerberos.keytab`: 로컬 keytab 파일 경로를 설정합니다.

S3 프로토콜을 사용하려면 S3 프로토콜 설정을 직접 구성합니다:
 - `s3.endpoint`
 - `s3.access_key`
 - `s3.secret_key`
 - `s3.region`
 - `use_path_style`: (선택 사항) 기본값은 `false`입니다. S3 SDK는 기본적으로 Virtual-hosted Style을 사용합니다. 일부 객체 스토리지 시스템은 Virtual-hosted Style 접근을 활성화하지 않았거나 지원하지 않을 수 있습니다. 이 경우 `use_path_style` 매개변수를 추가하여 Path Style 접근을 강제로 사용할 수 있습니다.

> 참고: `delete_existing_files` 매개변수를 사용하려면 `enable_delete_existing_files = true` 설정도 `fe.conf`에 추가하고 fe를 다시 시작해야 delete_existing_files가 적용됩니다. delete_existing_files = true는 위험한 작업이므로 테스트 환경에서만 사용하는 것이 좋습니다.

## 반환 값 {#return-value}

Outfile 문이 반환하는 결과에서 각 열의 의미는 다음과 같습니다:

| 열 이름 | 유형     | 설명                                     |
|-------------|----------|-------------------------------------------------|
| FileNumber  | int      | 최종 생성된 파일 수               |
| TotalRows   | int      | 결과 집합의 행 수                    |
| FileSize    | int      | 내보낸 파일의 총크기. 단위: 바이트.     |
| URL         | string   | 내보낸 파일 경로의 접두사입니다. 파일이 여러 개이면 `_0`,`_1` 등의 접미사로 순서대로 번호가 지정됩니다. |

## 권한 제어 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다:

| 권한  | 객체        | 설명                    |
|:------------|:-------------|:-------------------------------|
| SELECT_PRIV | 데이터베이스     | 데이터베이스와 테이블에 대한 읽기 권한이 필요합니다. |

4.1.5부터 Parquet 내보내기는 `enable_int96_timestamps`의 기본값을 `false`로 설정하여 논리적 `INT64` 타임스탬프를 사용합니다. 읽기 도구가 INT96을 요구하는 경우 이 속성을 명시적으로 `true`로 설정하세요. 이 속성에는 `true` 또는 `false`만 사용할 수 있습니다. 날짜와 시간대의 의미는 [Parquet](../../../../lakehouse/file-formats/parquet.md)을 참조하세요.

## 참고 사항 {#notes}

### 데이터 유형 매핑 {#data-type-mapping}

- 모든 파일 유형은 기본 데이터 유형 내보내기를 지원합니다. 복합 데이터 유형(ARRAY/MAP/STRUCT)의 경우 현재 `csv`, `orc`, `csv_with_names`, `csv_with_names_and_types`만 복합 유형 내보내기를 지원하며, 중첩된 복합 유형은 지원하지 않습니다.

- Parquet 및 ORC 파일 형식에는 자체 데이터 유형이 있습니다. Doris의 내보내기 기능은 Doris 데이터 유형을 Parquet/ORC 파일 형식의 해당 데이터 유형으로 자동 변환하여 내보낼 수 있습니다. 다음은 Apache Doris 데이터 유형과 Parquet/ORC 파일 형식 간의 데이터 유형 매핑 테이블입니다:

1. **Doris에서 ORC 파일 형식으로의 데이터 유형 매핑 테이블:**
   | Doris 유형              | Orc 유형  |
   |-------------------------|-----------|
   | boolean                 | boolean   |
   | tinyint                 | tinyint   |
   | smallint                | smallint  |
   | int                     | int       |
   | bigint                  | bigint    |
   | largeInt                | string    |
   | date                    | string    |
   | datev2                  | date      |
   | datetime                | string    |
   | datetimev2              | timestamp |
   | timestamptz | timestamp with local time zone (ORC TIMESTAMP_INSTANT; 4.1.5부터 절대 시점의 의미 보존) |
   | varbinary | binary |
   | float                   | float     |
   | double                  | double    |
   | char / varchar / string | string    |
   | uuid                    | binary    |
   | decimal                 | decimal   |
   | struct                  | struct    |
   | map                     | map       |
   | array                   | array     |

2. **Doris에서 Parquet 파일 형식으로의 데이터 유형 매핑 테이블:**

   Doris가 Parquet 파일 형식으로 내보낼 때는 먼저 Doris 메모리 데이터를 Arrow 메모리 데이터 형식으로 변환한 다음 Arrow가 Parquet 파일 형식으로 기록합니다. Doris 데이터 유형과 Arrow 데이터 유형 간의 매핑 관계는 다음과 같습니다:
   | Doris 유형              | Arrow 유형 |
   |-------------------------|------------|
   | boolean                 | boolean    |
   | tinyint                 | int8       |
   | smallint                | int16      |
   | int                     | int32      |
   | bigint                  | int64      |
   | largeInt                | utf8       |
   | date                    | utf8       |
   | datev2                  | utf8       |
   | datetime                | utf8       |
   | datetimev2              | utf8       |
   | float                   | float32    |
   | double                  | float64    |
   | char / varchar / string | utf8       |
   | uuid                    | fixed_size_binary(16) |
   | decimal                 | decimal128 |
   | struct                  | struct     |
   | map                     | map        |
   | array                   | list       |

CSV는 UUID 값을 소문자의 표준 형식 텍스트로 기록합니다. Parquet는 UUID 논리 주석이 있는 `FIXED_LEN_BYTE_ARRAY(16)`로 기록하고, ORC는 `BINARY`로 기록하며 Doris 전용 `doris.logical_type=uuid` 속성을 사용합니다. 이는 ARRAY, MAP 또는 STRUCT에 중첩된 UUID 요소에도 적용됩니다. ORC의 `schema` 속성을 명시적으로 지정하는 경우 UUID 열은 `binary`로 선언해야 하며, `string`과 같은 다른 유형은 거부됩니다.

### 내보내기 데이터 양과 내보내기 효율 {#export-data-volume-and-export-efficiency}

   이 기능은 기본적으로 SQL 쿼리 명령을 실행합니다. 최종 결과는 단일 스레드로 출력됩니다. 따라서 총 내보내기 시간에는 쿼리 실행 시간과 최종 결과 집합을 기록하는 시간이 포함됩니다. 쿼리 규모가 큰 경우 세션 변수 `query_timeout`을 설정하여 쿼리 제한 시간을 적절히 늘려야 합니다.

### 내보낸 파일 관리 {#exported-file-management}

   Doris는 내보낸 파일을 관리하지 않습니다. 성공적으로 내보낸 파일과 내보내기 실패 후 남은 파일을 포함하여 모두 사용자가 직접 처리해야 합니다.

### 로컬 파일로 내보내기 {#export-to-local-files}
   로컬 파일로 내보내려면 먼저 `enable_outfile_to_local=true`를 `fe.conf`에 설정해야 합니다.  
   ```sql
   select * from tbl1 limit 10 
   INTO OUTFILE "file:///home/work/path/result_";
   ```

   로컬 파일로 내보내는 기능은 퍼블릭 클라우드 사용자에게는 적합하지 않으며, 프라이빗 배포 환경의 사용자만을 대상으로 합니다. 사용자가 클러스터 노드를 완전히 제어할 수 있다고 가정합니다. Doris는 사용자가 입력한 내보내기 경로의 유효성을 검사하지 않습니다. Doris 프로세스를 실행하는 사용자에게 해당 경로의 쓰기 권한이 없거나 경로가 존재하지 않으면 오류가 보고됩니다. 보안상의 이유로 해당 경로에 이름이 같은 파일이 이미 있으면 내보내기도 실패합니다.

   Doris는 로컬로 내보낸 파일을 관리하지 않으며 디스크 공간 등도 확인하지 않습니다. 파일 정리 등의 관리는 사용자가 직접 해야 합니다.

### 결과 무결성 보장 {#result-integrity-guarantee}

   이 명령은 동기 명령이므로 실행 중 작업 연결이 끊기면 데이터 내보내기가 정상적으로 종료되었는지 또는 데이터가 완전한지 알 수 없게 될 수 있습니다. 이 경우 `success_file_name` 매개변수를 사용하여 작업이 성공적으로 완료된 후 디렉터리에 성공을 나타내는 식별 파일을 생성하도록 할 수 있습니다. 사용자는 이 파일을 통해 내보내기가 정상적으로 종료되었는지 확인할 수 있습니다.

### 동시 내보내기 {#concurrent-export}

   세션 변수 `set enable_parallel_outfile = true;`를 설정하여 Outfile 동시 내보내기를 활성화합니다.

## 예제 {#examples}

- Broker 방식을 사용하여 단순 쿼리 결과를 파일 `hdfs://path/to/result.txt`로 내보냅니다. 내보내기 형식은 CSV로 지정합니다. `my_broker`를 사용하고 kerberos 인증 정보를 설정합니다. 열 구분자는 `,`, 줄 구분자는 `\n`으로 지정합니다.

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.hadoop.security.authentication" = "kerberos",
        "broker.kerberos_principal" = "doris@YOUR.COM",
        "broker.kerberos_keytab" = "/home/doris/my.keytab",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "100MB"
    );
    ```

   100MB 이하이면 최종 생성 파일은 `result_0.csv`입니다.
   100MB를 초과하면 `result_0.csv, result_1.csv, ...`와 같이 생성될 수 있습니다.

- 단순 쿼리 결과를 파일 `hdfs://path/to/result.parquet`로 내보냅니다. 내보내기 형식은 PARQUET로 지정합니다. `my_broker`를 사용하고 kerberos 인증 정보를 설정합니다.

    ```sql
    SELECT c1, c2, c3 FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.hadoop.security.authentication" = "kerberos",
        "broker.kerberos_principal" = "doris@YOUR.COM",
        "broker.kerberos_keytab" = "/home/doris/my.keytab"
    );
    ```

- CTE 문의 쿼리 결과를 파일 `hdfs://path/to/result.txt`로 내보냅니다. 기본 내보내기 형식은 CSV입니다. `my_broker`를 사용하고 HDFS 고가용성 정보를 설정합니다. 기본 행 구분자와 열 구분자를 사용합니다.

    ```sql
    WITH
    x1 AS
    (SELECT k1, k2 FROM tbl1),
    x2 AS
    (SELECT k3 FROM tbl2)
    SELEC k1 FROM x1 UNION SELECT k3 FROM x2
    INTO OUTFILE "hdfs://path/to/result_"
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.username"="user",
        "broker.password"="passwd",
        "broker.dfs.nameservices" = "my_ha",
        "broker.dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "broker.dfs.client.failover.proxy.provider" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
    ```

   1GB 이하이면 최종 생성 파일은 `result_0.csv`입니다.
   1GB를 초과하면 `result_0.csv, result_1.csv, ...`와 같이 생성될 수 있습니다.

- UNION 문의 쿼리 결과를 파일 `bos://bucket/result.txt`로 내보냅니다. 내보내기 형식은 PARQUET로 지정합니다. `my_broker`를 사용하고 HDFS 고가용성 정보를 설정합니다. PARQUET 형식은 열 구분자를 지정할 필요가 없습니다.
   내보내기가 완료되면 식별 파일을 생성합니다.

    ```sql
    SELECT k1 FROM tbl1 UNION SELECT k2 FROM tbl1
    INTO OUTFILE "bos://bucket/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.bos_endpoint" = "http://bj.bcebos.com",
        "broker.bos_accesskey" = "xxxxxxxxxxxxxxxxxxxxxxxxxx",
        "broker.bos_secret_accesskey" = "yyyyyyyyyyyyyyyyyyyyyyyyyy"
    );
    ```

- Select 문의 쿼리 결과를 파일 `s3a://${bucket_name}/path/result.txt`로 내보냅니다. 내보내기 형식은 CSV로 지정합니다.
   내보내기가 완료되면 식별 파일을 생성합니다.

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "s3a://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "hdfs_broker",
        "broker.fs.s3a.access.key" = "xxx",
        "broker.fs.s3a.secret.key" = "xxxx",
        "broker.fs.s3a.endpoint" = "https://cos.xxxxxx.myqcloud.com/",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```

   1GB 이하이면 최종 생성 파일은 `my_file_0.csv`입니다.
   1GB를 초과하면 `my_file_0.csv, result_1.csv, ...`와 같이 생성될 수 있습니다.
   cos에서 확인한 사항:

        1. Non-existing paths will be automatically created
        2. access.key/secret.key/endpoint need to be confirmed with cos colleagues. Especially the endpoint value, no need to fill in bucket_name.

- S3 프로토콜을 사용하여 bos로 내보내며, 동시 내보내기를 활성화합니다.

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```

   최종 생성 파일의 접두사는 `my_file_{fragment_instance_id}_`입니다.

- S3 프로토콜을 사용하여 bos로 내보내며, 동시 내보내기 세션 변수를 활성화합니다.
   참고: 쿼리 문에 최상위 정렬 노드가 있으므로 동시 내보내기 세션 변수를 활성화하더라도 이 쿼리는 동시 내보내기를 사용할 수 없습니다.

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 order by k1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```

- HDFS 방식을 사용하여 단순 쿼리 결과를 파일 `hdfs://${host}:${fileSystem_port}/path/to/result.txt`로 내보냅니다. 내보내기 형식은 CSV, 사용자 이름은 work로 지정합니다. 열 구분자는 `,`, 줄 구분자는 `\n`으로 지정합니다.

    ```sql
    -- fileSystem_port default value is 9000
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://${host}:${fileSystem_port}/path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "fs.defaultFS" = "hdfs://ip:port",
        "hadoop.username" = "work"
    );
    ```

   Hadoop 클러스터에서 고가용성을 활성화하고 Kerberos 인증을 사용하는 경우 다음 SQL 문을 참조하세요:

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
    'fs.defaultFS'='hdfs://hacluster/',
    'dfs.nameservices'='hacluster',
    'dfs.ha.namenodes.hacluster'='n1,n2',
    'dfs.namenode.rpc-address.hacluster.n1'='192.168.0.1:8020',
    'dfs.namenode.rpc-address.hacluster.n2'='192.168.0.2:8020',
    'dfs.client.failover.proxy.provider.hacluster'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'dfs.namenode.kerberos.principal'='hadoop/_HOST@REALM.COM'
    'hadoop.security.authentication'='kerberos',
    'hadoop.kerberos.principal'='doris_test@REALM.COM',
    'hadoop.kerberos.keytab'='/path/to/doris_test.keytab'
    );
    ```

   100 MB 이하이면 최종 생성 파일은 `result_0.csv`입니다.
   100 MB를 초과하면 `result_0.csv, result_1.csv, ...`와 같이 생성될 수 있습니다.

- Select 문의 쿼리 결과를 Tencent Cloud cos 파일 `cosn://${bucket_name}/path/result.txt`로 내보냅니다. 내보내기 형식은 CSV로 지정합니다.
   내보내기가 완료되면 식별 파일을 생성합니다.

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "cosn://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "broker_name",
        "broker.fs.cosn.userinfo.secretId" = "xxx",
        "broker.fs.cosn.userinfo.secretKey" = "xxxx",
        "broker.fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxx.myqcloud.com",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```
