---
{
    "title": "EXPORT | 데이터 적재 및 내보내기",
    "language": "ko",
    "description": "EXPORT 명령은 지정된 테이블의 데이터를 지정된 위치의 파일로 내보내는 데 사용됩니다.",
    "sidebar_label": "EXPORT"
}
---

# EXPORT {#export}

## 설명 {#description}

`EXPORT` 명령은 지정된 테이블의 데이터를 지정된 위치의 파일로 내보내는 데 사용됩니다. 현재 Broker 프로세스, S3 프로토콜 또는 HDFS 프로토콜을 통해 HDFS, S3, BOS, COS (Tencent Cloud) 등의 원격 스토리지로 내보낼 수 있습니다.

`EXPORT`는 비동기 작업입니다. 이 명령은 Doris에 `EXPORT JOB`을 제출하고, 제출에 성공하면 즉시 반환됩니다. 실행 후 [SHOW EXPORT](./SHOW-EXPORT) 명령으로 진행 상황을 확인할 수 있습니다.

## 구문: {#syntax}

  ```sql
  EXPORT TABLE <table_name>
  [ PARTITION ( <partation_name> [ , ... ] ) ]
  [ <where_clause> ]
  TO <export_path>
  [ <properties> ]
  WITH <target_storage>
  [ <broker_properties> ];
  ```

## 필수 매개변수 {#required-parameters}

**1. `<table_name>`**

  내보낼 테이블의 이름입니다. Doris 로컬 테이블, 뷰 및 Catalog 외부 테이블의 데이터를 내보낼 수 있습니다.

**2. `<export_path>`**

  내보낼 파일의 경로입니다. 디렉터리 또는 파일 접두사가 포함된 디렉터리 경로를 지정할 수 있습니다. 예: `hdfs://path/to/my_file_`

## 선택적 매개변수 {#optional-parameters}

**1. `<where_clause>`**

  내보낼 데이터의 필터 조건을 지정할 수 있습니다.

**2. `<partation_name>`**

  지정된 테이블에서 특정 파티션만 내보낼 수 있습니다. Doris 로컬 테이블에만 적용됩니다.

**3. `<properties>`**

  내보내기 매개변수를 지정하는 데 사용됩니다.

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```

  다음 매개변수를 지정할 수 있습니다.
  - `label`: 이 Export 작업의 Label을 지정하는 선택적 매개변수입니다. 지정하지 않으면 시스템에서 Label을 임의로 생성합니다.

  - `column_separator`: 내보내기에 사용할 컬럼 구분자를 지정합니다. 기본값은 `\t`이며, 멀티바이트 문자를 지원합니다. 이 매개변수는 CSV 파일 형식에만 사용됩니다.

  - `line_delimiter`: 내보내기에 사용할 줄 구분자를 지정합니다. 기본값은 `\n`이며, 멀티바이트 문자를 지원합니다. 이 매개변수는 CSV 파일 형식에만 사용됩니다.

  - `columns`: 내보낼 테이블의 특정 컬럼을 지정합니다.

  - `format`: 내보내기 작업의 파일 형식을 지정합니다. parquet, orc, csv, csv_with_names, csv_with_names_and_types를 지원합니다. 기본값은 CSV 형식입니다.

  - `enable_int96_timestamps`: Parquet 내보내기에 INT96 타임스탬프를 사용할지 여부입니다. 4.1.5부터 EXPORT에서 이 값을 명시적으로 설정할 수 있습니다. 기본값은 `false`이며, 논리적 INT64 타임스탬프를 사용합니다. INT96이 필요한 리더에서는 `true`로 설정하세요. `true`와 `false`만 허용됩니다.

  - `max_file_size`: 내보내기 작업의 개별 파일 크기 제한입니다. 결과가 이 값을 초과하면 여러 파일로 분할됩니다. `max_file_size`의 값 범위는 [5MB, 2GB]이며, 기본값은 1GB입니다. (내보내기 파일 형식을 orc로 지정하면 실제 분할 파일 크기는 64MB의 배수가 됩니다. 예를 들어 max_file_size = 5MB로 지정하면 실제로는 64MB 단위로 분할되고, max_file_size = 65MB로 지정하면 실제로는 128MB 단위로 분할됩니다.)

  - `parallelism`: 내보내기 작업의 동시 실행 수이며, 기본값은 `1`입니다. 내보내기 작업은 `parallelism` 수만큼 스레드를 시작하여 `select into outfile` 문을 실행합니다. (Parallelism이 테이블의 Tablet 수보다 크면 시스템에서 Parallelism을 Tablet 수로 자동 설정합니다. 즉, 각 `select into outfile` 문이 하나의 Tablet을 담당합니다.)

  - `delete_existing_files`: 기본값은 `false`입니다. `true`로 지정하면 먼저 `export_path`로 지정한 디렉터리의 모든 파일을 삭제한 다음, 해당 디렉터리로 데이터를 내보냅니다. 예를 들어 "export_path" = "/user/tmp"이면 "/user/" 아래의 모든 파일과 디렉터리를 삭제하고, "file_path" = "/user/tmp/"이면 "/user/tmp/" 아래의 모든 파일과 디렉터리를 삭제합니다.

  - `with_bom`: 기본값은 `false`입니다. `true`로 지정하면 내보낸 파일에 BOM이 포함된 UTF8 인코딩을 사용합니다(csv 관련 파일 형식에만 적용됩니다).

  - `data_consistency`: `none` / `partition`으로 설정할 수 있으며, 기본값은 `partition`입니다. 내보낼 테이블을 분할하는 단위를 나타냅니다. `none`은 Tablet 단위, `partition`은 파티션 단위를 의미합니다.

  - `timeout`: 내보내기 작업의 제한 시간입니다. 기본값은 2시간이며, 단위는 초입니다.

  - `compress_type`: (2.1.5부터 지원) 내보내기 파일 형식을 Parquet / ORC로 지정할 때 Parquet / ORC 파일에 사용할 압축 방식을 지정할 수 있습니다. Parquet 파일 형식에서는 SNAPPY, GZIP, BROTLI, ZSTD, LZ4, PLAIN을 지정할 수 있으며, 기본값은 SNAPPY입니다. ORC 파일 형식에서는 PLAIN, SNAPPY, ZLIB, ZSTD를 지정할 수 있으며, 기본값은 ZLIB입니다. 이 매개변수는 버전 2.1.5부터 지원됩니다. (PLAIN은 압축하지 않음을 의미합니다.) 버전 3.1.1부터 CSV 형식의 압축 알고리즘 지정을 지원하며, 현재 "plain", "gz", "bz2", "snappyblock", "lz4block", "zstd"를 지원합니다.

  :::caution 참고  
  delete_existing_files 매개변수를 사용하려면 fe.conf에 `enable_delete_existing_files = true` 설정을 추가하고 fe를 다시 시작해야 합니다. 그러면 delete_existing_files가 적용됩니다. delete_existing_files = true는 위험한 작업이므로 테스트 환경에서만 사용하는 것이 좋습니다.  
  :::  

**4. `<target_storage>`**  
    스토리지 유형으로 BROKER, S3, HDFS 중에서 선택할 수 있습니다.  

**5. `<broker_properties>`**  
    `<target_storage>`의 스토리지 유형에 따라 서로 다른 속성을 지정해야 합니다.  

- **BROKER**  
  Broker 프로세스를 통해 원격 스토리지에 데이터를 쓸 수 있습니다. 여기서는 Broker가 사용할 연결 정보를 정의해야 합니다.  

  ```sql
  WITH BROKER "broker_name"
  ("<key>"="<value>" [,...])
  ```  

  **Broker 관련 속성:**  
  - `username`: 사용자 이름
  - `password`: 비밀번호
  - `hadoop.security.authentication`: 인증 방식을 kerberos로 지정
  - `kerberos_principal`: kerberos principal 지정
  - `kerberos_keytab`: kerberos keytab 파일의 경로를 지정합니다. Broker 프로세스가 실행되는 서버에 있는 파일의 절대 경로여야 하며, Broker 프로세스에서 해당 파일에 접근할 수 있어야 합니다.  

- **HDFS**  

  원격 HDFS에 직접 데이터를 쓸 수 있습니다.

  ```sql
  WITH HDFS ("<key>"="<value>" [,...])
  ```  

  **HDFS 관련 속성:**  
  - `fs.defaultFS`: namenode 주소 및 포트
  - `hadoop.username`: HDFS 사용자 이름
  - `dfs.nameservices`: 이름 서비스 이름으로, hdfs-site.xml과 일치해야 함
  - `dfs.ha.namenodes.[nameservice ID]`: namenode ID 목록으로, hdfs-site.xml과 일치해야 함
  - `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name node의 rpc 주소로, 항목 수가 namenode 수와 같아야 하며 hdfs-site.xml과 일치해야 함   

  **kerberos 인증이 활성화된 Hadoop 클러스터에서는 다음 PROPERTIES 속성을 추가로 설정해야 합니다:**
  - `dfs.namenode.kerberos.principal`: HDFS namenode 서비스의 Principal 이름
  - `hadoop.security.authentication`: 인증 방식을 kerberos로 설정
  - `hadoop.kerberos.principal`: Doris가 HDFS에 연결할 때 사용할 Kerberos principal 설정
  - `hadoop.kerberos.keytab`: keytab의 로컬 파일 경로 설정  

- **S3**  

  원격 S3 객체 스토리지에 직접 데이터를 쓸 수 있습니다.

  ```sql
  WITH S3 ("<key>"="<value>" [,...])
  ```  

  **S3 관련 속성:**
  - `s3.endpoint`
  - `s3.region`
  - `s3.secret_key`
  - `s3.access_key`
  - `use_path_style`: (선택 사항) 기본값은 `false`입니다. S3 SDK는 기본적으로 Virtual-hosted Style을 사용합니다. 하지만 일부 객체 스토리지 시스템에서는 Virtual-hosted Style 접근을 활성화하지 않았거나 지원하지 않을 수 있습니다. 이 경우 `use_path_style` 매개변수를 추가하여 Path Style 접근을 강제로 사용할 수 있습니다.

## 반환 값 {#return-values}

| 컬럼 이름           | 유형   | 설명                                                                 |
|---------------------|--------|----------------------------------------------------------------------|
| jobId               | long   | 내보내기 작업의 고유 식별자입니다.                                    |
| label               | string | 내보내기 작업의 Label입니다.                                         |
| dbId                | long   | 데이터베이스의 식별자입니다.                                         |
| tableId             | long   | 테이블의 식별자입니다.                                               |
| state               | string | 작업의 현재 상태입니다.                                             |
| path                | string | 내보낸 파일의 경로입니다.                                           |
| partitions          | string | 내보낸 파티션 이름 목록이며, 여러 파티션 이름은 쉼표로 구분됩니다.     |
| progress            | int    | 내보내기 작업의 현재 진행률(백분율)입니다.                            |
| createTimeMs        | string | 작업 생성 시각의 밀리초 값으로, 날짜 및 시간 형식으로 표시됩니다.     |
| exportStartTimeMs   | string | 내보내기 작업 시작 시각의 밀리초 값으로, 날짜 및 시간 형식으로 표시됩니다. |
| exportFinishTimeMs  | string | 내보내기 작업 종료 시각의 밀리초 값으로, 날짜 및 시간 형식으로 표시됩니다. |
| failMsg             | string | 내보내기 작업 실패 시 오류 메시지입니다.                             |


## 접근 제어 {#access-control}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 있어야 합니다.

| 권한        | 객체         | 설명                                  |
|:------------|:-------------|:--------------------------------------|
| SELECT_PRIV | 데이터베이스 | 데이터베이스와 테이블에 대한 읽기 권한이 필요합니다. |


## 참고 사항 {#notes}

### 동시 실행 {#concurrent-execution}

Export 작업에서 `parallelism` 매개변수를 설정하면 데이터를 동시에 내보낼 수 있습니다. `parallelism` 매개변수는 실제로 EXPORT 작업을 실행할 스레드 수를 지정합니다. `"data_consistency" = "none"`으로 설정하면 각 스레드는 테이블의 Tablet 중 일부를 내보내는 역할을 담당합니다.

Export 작업의 내부 실행 로직은 실제로 `SELECT INTO OUTFILE` 문입니다. `parallelism` 매개변수로 설정한 각 스레드는 독립적인 `SELECT INTO OUTFILE` 문을 실행합니다.

Export 작업을 여러 `SELECT INTO OUTFILE` 문으로 분할할 때는 테이블의 모든 Tablet을 모든 병렬 스레드에 균등하게 분배합니다. 예를 들면 다음과 같습니다.
- num(tablets) = 40, parallelism = 3이면 이 3개의 스레드는 각각 14, 13, 13개의 Tablet을 담당합니다.
- num(tablets) = 2, parallelism = 3이면 Doris는 parallelism을 2로 자동 설정하고, 각 스레드가 하나의 Tablet을 담당합니다.

스레드가 담당하는 Tablet 수가 `maximum_tablets_of_outfile_in_export` 값(기본값은 10이며, fe.conf에 `maximum_tablets_of_outfile_in_export` 매개변수를 추가하여 변경 가능)을 초과하면 해당 스레드의 작업은 여러 `SELECT INTO OUTFILE` 문으로 분할됩니다. 예를 들면 다음과 같습니다.
- 스레드가 14개의 Tablet을 담당하고 `maximum_tablets_of_outfile_in_export = 10`이면 이 스레드는 두 개의 `SELECT INTO OUTFILE` 문을 담당합니다. 첫 번째 `SELECT INTO OUTFILE` 문은 10개의 Tablet을 내보내고, 두 번째 `SELECT INTO OUTFILE` 문은 4개의 Tablet을 내보냅니다. 이 두 개의 `SELECT INTO OUTFILE` 문은 해당 스레드에서 순차적으로 실행됩니다.

내보낼 데이터가 매우 많으면 `parallelism` 매개변수를 적절히 늘려 동시 내보내기 수를 늘릴 수 있습니다. 머신의 코어 여유가 부족하여 `parallelism`을 늘릴 수 없고 내보낼 테이블에 Tablet이 많다면, `maximum_tablets_of_outfile_in_export`를 늘려 하나의 `SELECT INTO OUTFILE` 문이 담당하는 Tablet 수를 늘리는 방법을 고려할 수 있습니다. 이 방법으로도 내보내기 속도를 높일 수 있습니다.

테이블을 파티션 단위로 내보내려면 Export 속성을 `"data_consistency" = "partition"`으로 설정할 수 있습니다. 이 경우 Export 작업의 동시 실행 스레드는 파티션 단위로 여러 Outfile 문을 실행하도록 나뉩니다. 서로 다른 Outfile 문은 서로 다른 파티션을 내보내며, 동일한 Outfile 문으로 내보낸 데이터는 반드시 같은 파티션에 속해야 합니다. 예를 들어 `"data_consistency" = "partition"`으로 설정하면 다음과 같이 처리됩니다.

- num(partition) = 40, parallelism = 3이면 이 3개의 스레드는 각각 14, 13, 13개의 파티션을 담당합니다.
- num(partition) = 2, parallelism = 3이면 Doris는 Parallelism을 2로 자동 설정하고, 각 스레드가 하나의 파티션을 담당합니다.


### 메모리 제한 {#memory-limits}

일반적으로 Export 작업의 쿼리 계획은 `scan-export`의 두 부분으로만 구성되며, 메모리를 많이 사용하는 연산 로직은 포함하지 않습니다. 따라서 보통 기본 메모리 제한인 2GB로 요구 사항을 충족할 수 있습니다.

하지만 쿼리 계획이 동일한 BE에서 너무 많은 Tablet을 스캔해야 하거나 Tablet의 데이터 버전이 너무 많은 경우 등 일부 상황에서는 메모리가 부족해질 수 있습니다. 세션 변수 `exec_mem_limit`를 조정하여 메모리 사용 한도를 늘릴 수 있습니다.

### 기타 사항 {#other-matters}

- 한 번에 대량의 데이터를 내보내는 것은 권장하지 않습니다. 하나의 Export 작업에서 내보내는 권장 최대 데이터양은 수십 GB입니다. 내보내기 규모가 너무 크면 불필요한 파일이 더 많이 생기고 재시도 비용도 증가합니다. 테이블의 데이터양이 너무 많으면 파티션별로 내보내는 것이 좋습니다.

- Export 작업이 실패해도 이미 생성된 파일은 삭제되지 않으므로 사용자가 직접 삭제해야 합니다.

- Export 작업은 데이터를 스캔하고 IO 리소스를 사용하므로 시스템의 쿼리 지연 시간에 영향을 줄 수 있습니다.

- 현재 Export 중에는 Tablet 버전의 일관성을 간단하게 확인하는 검사만 수행합니다. Export가 실행되는 동안에는 해당 테이블에 데이터를 적재하지 않는 것이 좋습니다.

- 하나의 Export 작업에서는 최대 2000개의 파티션을 내보낼 수 있습니다. `maximum_number_of_export_partitions` 매개변수를 `fe.conf`에 추가하고 FE를 다시 시작하여 이 설정을 변경할 수 있습니다.


## 예제 {#examples}

### 로컬로 데이터 내보내기 {#export-data-to-local}
> 로컬 파일 시스템으로 데이터를 내보내려면 `enable_outfile_to_local=true`를 `fe.conf`에 추가하고 FE를 다시 시작해야 합니다.

- Test 테이블의 모든 데이터를 로컬 스토리지로 내보냅니다. 기본적으로 CSV 형식의 파일을 내보냅니다.
```sql
EXPORT TABLE test TO "file:///home/user/tmp/";
```

- Test 테이블의 k1,k2 컬럼을 로컬 스토리지로 내보냅니다. 기본적으로 CSV 파일 형식을 사용하며, Label을 설정합니다.
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "label" = "label1",
  "columns" = "k1,k2"
);
```

- Test 테이블에서 `k1 < 50`인 행을 로컬 스토리지로 내보냅니다. 기본적으로 CSV 형식의 파일을 내보내며, `,`를 컬럼 구분자로 사용합니다.
```sql
EXPORT TABLE test WHERE k1 < 50 TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "column_separator"=","
);
```

- Test 테이블의 p1,p2 파티션을 로컬 스토리지로 내보냅니다. 기본적으로 csv 형식의 파일을 내보냅니다.
```sql
EXPORT TABLE test PARTITION (p1,p2) TO "file:///home/user/tmp/" 
PROPERTIES ("columns" = "k1,k2");
```

- Test 테이블의 모든 데이터를 로컬 스토리지로 내보내며, 다른 형식의 파일을 내보냅니다.
```sql
-- parquet
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "parquet"
);

-- orc
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "orc"
);

-- csv(csv_with_names) , Use 'AA' as the column separator and 'zz' as the row separator
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names",
  "column_separator"="AA",
  "line_delimiter" = "zz"
);

-- csv(csv_with_names_and_types) 
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names_and_types"
);
```

- `max_file_sizes` 속성 설정  
   내보낸 파일이 5MB보다 크면 데이터를 여러 파일로 분할하며, 각 파일의 최대 크기는 5MB입니다.

```sql
-- When the exported file is larger than 5MB, the data will be split into multiple files, with each file having a maximum size of 5MB.
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB"
);
```

- `parallelism` 속성 설정
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "parallelism" = "5"
);
```

- `delete_existing_files` 속성 설정  
    Export가 데이터를 내보낼 때 먼저 `/home/user/` 디렉터리 아래의 모든 파일과 디렉터리를 삭제한 다음, 해당 디렉터리로 데이터를 내보냅니다.

```sql
-- When exporting data, all files and directories under the `/home/user/` directory will be deleted first, and then the data will be exported to this directory.
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "delete_existing_files" = "true"
);
```

### S3로 내보내기 {#export-to-s3}

- s3_test 테이블의 모든 데이터를 S3로 내보내며, 눈에 보이지 않는 문자 `\x07`을 컬럼 또는 행 구분자로 사용합니다. minio로 데이터를 내보내려면 `use_path_style`=`true`도 지정해야 합니다.

```sql
EXPORT TABLE s3_test TO "s3://bucket/a/b/c" 
PROPERTIES (
  "column_separator"="\\x07", 
  "line_delimiter" = "\\x07"
) WITH S3 (
  "s3.endpoint" = "xxxxx",
  "s3.region" = "xxxxx",
  "s3.access_key" = "xxxxx",
  "s3.secret_key"="xxxx"
  
)
```

### HDFS로 내보내기 {#export-to-hdfs}

- Test 테이블의 모든 데이터를 HDFS로 내보냅니다. 내보내기 파일 형식은 Parquet이며, 내보내기 작업의 개별 파일 크기 제한은 512MB입니다. 지정된 디렉터리의 모든 파일을 유지합니다.

```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c/" 
PROPERTIES(
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "false"
)
with HDFS (
"fs.defaultFS"="hdfs://hdfs_host:port",
"hadoop.username" = "hadoop"
);
```

### Broker 노드를 통해 내보내기 {#export-through-broker-node}
먼저 Broker 프로세스를 시작하고 이 Broker를 FE에 추가해야 합니다.
- Test 테이블의 모든 데이터를 HDFS로 내보냅니다.
```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c" 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

- testTbl 테이블의 p1,p2 파티션을 HDFS로 내보내며, ","를 컬럼 구분자로 사용하고 Label을 지정합니다.

```sql
EXPORT TABLE testTbl PARTITION (p1,p2) TO "hdfs://hdfs_host:port/a/b/c" 
PROPERTIES (
  "label" = "mylabel",
  "column_separator"=","
) 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

- testTbl 테이블의 모든 데이터를 HDFS로 내보내며, 눈에 보이지 않는 문자 `\x07`을 컬럼 또는 행 구분자로 사용합니다.

```sql
EXPORT TABLE testTbl TO "hdfs://hdfs_host:port/a/b/c" 
PROPERTIES (
  "column_separator"="\\x07", 
  "line_delimiter" = "\\x07"
) 
WITH BROKER "broker_name" 
(
  "username"="xxx", 
  "password"="yyy"
)
```
