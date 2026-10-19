---
{
    "title": "Export 비동기 내보내기",
    "language": "ko",
    "description": "EXPORT 명령으로 Doris 테이블 또는 파티션의 데이터를 HDFS, S3 또는 오브젝트 스토리지로 비동기로 내보낼 수 있으며, Parquet/ORC/CSV 형식을 지원합니다.",
    "keywords": [
        "Doris EXPORT",
        "비동기 내보내기",
        "S3로 내보내기",
        "HDFS로 내보내기",
        "Parquet 내보내기",
        "ORC 내보내기",
        "CSV 내보내기",
        "SHOW EXPORT",
        "CANCEL EXPORT",
        "SELECT INTO OUTFILE"
    ]
}
---

<!-- Knowledge type: Operating procedure / Configuration parameters / Architectural selection decision -->
<!-- Applicable scenarios: Data export / Data archiving / Cross-system data movement -->

이 문서는 `EXPORT` 명령을 사용하여 Doris에 저장된 데이터를 외부 스토리지 시스템으로 비동기로 내보내는 방법을 설명합니다.

`EXPORT`는 Doris가 제공하는 **비동기 데이터 내보내기** 기능입니다. 지정한 테이블 또는 파티션의 데이터를 오브젝트 스토리지, HDFS 또는 로컬 파일 시스템으로 지정한 파일 형식에 맞춰 내보냅니다.

명령은 제출 후 즉시 반환됩니다. `SHOW EXPORT`로 작업 상태를 조회할 수 있습니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 유형                       | EXPORT 권장 여부       | 설명                                                       |
| ----------------------------------- | ---------------------- | ---------------------------------------------------------- |
| 단일 대용량 테이블 내보내기          | 권장                   | 간단한 필터 조건만 필요한 경우                              |
| 비동기 작업 제출                     | 권장                   | 명령이 즉시 반환되어 클라이언트를 차단하지 않음              |
| SELECT 결과 집합 내보내기            | 지원하지 않음          | [OUTFILE 내보내기](../../data-operate/export/outfile.md) 사용 |
| 압축 텍스트 파일 내보내기            | 지원하지 않음          | 현재 버전은 압축 텍스트 형식을 지원하지 않음                 |

`SELECT INTO OUTFILE`과 `EXPORT` 중에서 선택하는 방법은 [내보내기 개요](../../data-operate/export/export-overview.md)를 참고하세요.

`EXPORT` 명령의 전체 구문은 [EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT)를 참고하세요.

## 기능 개요 {#capability-overview}

### 지원하는 데이터 소스 {#supported-data-sources}

`EXPORT`는 다음 유형의 테이블과 뷰 내보내기를 지원합니다.

- Doris 내부 테이블
- Doris 논리 뷰
- External Catalog의 테이블(예: Hive 외부 테이블)

### 지원하는 저장 위치 {#supported-storage-locations}

| 스토리지 유형            | 지원 대상                                           |
| ------------------------ | --------------------------------------------------- |
| 오브젝트 스토리지        | Amazon S3, Tencent Cloud COS, Alibaba Cloud OSS, Huawei Cloud OBS, Google GCS |
| 분산 파일 시스템         | HDFS                                                |
| 로컬 파일 시스템         | 로컬 디버깅 및 개발 전용이며, 수동으로 활성화해야 함  |

### 지원하는 파일 형식 {#supported-file-formats}

- Parquet
- ORC
- CSV
- csv\_with\_names
- csv\_with\_names\_and\_types

## 빠른 시작 {#quick-start}

<!-- Knowledge type: Operating procedure -->

### 1단계: 테이블 생성 및 데이터 적재 {#step-1-create-a-table-and-load-data}

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");

INSERT INTO tbl VALUES
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, NULL, NULL);
```

### 2단계: 내보내기 작업 생성 {#step-2-create-an-export-job}

#### HDFS로 내보내기 {#export-to-hdfs}

`tbl` 테이블의 모든 데이터를 HDFS로 내보냅니다. 기본 형식인 CSV를 사용하고 열 구분자는 `,`로 지정합니다.

```sql
EXPORT TABLE tbl
TO "hdfs://host/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS"="hdfs://hdfs_host:port",
    "hadoop.username" = "hadoop"
);
```

#### 오브젝트 스토리지(S3)로 내보내기 {#export-to-object-storage-s3}

`tbl` 테이블의 모든 데이터를 S3 오브젝트 스토리지로 내보냅니다. 기본 형식인 CSV를 사용하고 열 구분자는 `,`로 지정합니다.

```sql
EXPORT TABLE tbl TO "s3://bucket/export/export_" 
PROPERTIES (
    "line_delimiter" = ","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### 3단계: 내보내기 작업 상태 확인 {#step-3-check-the-export-job-status}

[SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT) 명령으로 내보내기 작업의 진행 상황과 결과를 조회합니다.

```sql
mysql> SHOW EXPORT\G
*************************** 1. row ***************************
      JobId: 143265
      Label: export_0aa6c944-5a09-4d0b-80e1-cb09ea223f65
      State: FINISHED
   Progress: 100%
   TaskInfo: {"partitions":[],"parallelism":5,"data_consistency":"partition","format":"csv","broker":"S3","column_separator":"\t","line_delimiter":"\n","max_file_size":"2048MB","delete_existing_files":"","with_bom":"false","db":"tpch1","tbl":"lineitem"}
       Path: s3://bucket/export/export_
 CreateTime: 2024-06-11 18:01:18
  StartTime: 2024-06-11 18:01:18
 FinishTime: 2024-06-11 18:01:31
    Timeout: 7200
   ErrorMsg: NULL
OutfileInfo: [
  [
    {
      "fileNumber": "1",
      "totalRows": "6001215",
      "fileSize": "747503989",
      "url": "s3://bucket/export/export_6555cd33e7447c1-baa9568b5c4eb0ac_*"
    }
  ]
]
1 row in set (0.00 sec)
```

결과의 각 열이 의미하는 바는 [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT)를 참고하세요.

### 4단계: 내보내기 작업 취소(선택 사항) {#step-4-cancel-an-export-job-optional}

Export 작업이 성공하거나 실패하기 전에는 [CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT) 명령으로 취소할 수 있습니다.

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```

## 고급 사용 예제 {#advanced-usage-examples}

<!-- Knowledge type: Operating procedure -->

### 고가용성 HDFS 클러스터로 내보내기 {#export-to-a-high-availability-hdfs-cluster}

HDFS에 고가용성(HA)이 활성화되어 있다면 HA 관련 매개변수를 추가로 지정해야 합니다.

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

### HA와 Kerberos 인증을 사용하는 HDFS 클러스터로 내보내기 {#export-to-an-hdfs-cluster-with-ha-and-kerberos-authentication}

Hadoop 클러스터에 고가용성과 Kerberos 인증이 모두 활성화되어 있다면 다음 SQL을 참고하세요.

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS"="hdfs://hacluster/",
    "hadoop.username" = "hadoop",
    "dfs.nameservices"="hacluster",
    "dfs.ha.namenodes.hacluster"="n1,n2",
    "dfs.namenode.rpc-address.hacluster.n1"="192.168.0.1:8020",
    "dfs.namenode.rpc-address.hacluster.n2"="192.168.0.2:8020",
    "dfs.client.failover.proxy.provider.hacluster"="org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "dfs.namenode.kerberos.principal"="hadoop/_HOST@REALM.COM",
    "hadoop.security.authentication"="kerberos",
    "hadoop.kerberos.principal"="doris_test@REALM.COM",
    "hadoop.kerberos.keytab"="/path/to/doris_test.keytab"
);
```

### 지정한 파티션만 내보내기 {#export-only-specified-partitions}

Doris 내부 테이블의 일부 파티션만 내보낼 수 있습니다. 예를 들어 `p1`과 `p2` 파티션만 내보내려는 경우, `test` 테이블에 다음과 같이 지정합니다.

```sql
EXPORT TABLE test
PARTITION (p1,p2)
TO "s3://bucket/export/export_" 
PROPERTIES (
    "columns" = "k1,k2"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### 조건 필터링을 적용하여 내보내기 {#export-with-predicate-filtering}

`WHERE` 절로 데이터를 필터링하여 조건에 맞는 행만 내보낼 수 있습니다. 예를 들어 `k1 < 50`인 행만 내보내려면 다음과 같이 지정합니다.

```sql
EXPORT TABLE test
WHERE k1 < 50
TO "s3://bucket/export/export_"
PROPERTIES (
    "columns" = "k1,k2",
    "column_separator"=","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### External Catalog 외부 테이블의 데이터 내보내기 {#export-data-from-external-catalog-external-tables}

`EXPORT`는 External Catalog 외부 테이블(예: Hive 외부 테이블)의 데이터 내보내기를 지원합니다.

```sql
-- Create a Hive Catalog
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083'
);

-- Export the Hive table
EXPORT TABLE hive_catalog.sf1.lineitem TO "s3://bucket/export/export_"
PROPERTIES(
    "format" = "csv",
    "max_file_size" = "1024MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### 내보내기 전에 대상 디렉터리 비우기 {#clear-the-target-directory-before-export}

`delete_existing_files` 매개변수를 사용하면 내보내기 전에 대상 디렉터리를 비울 수 있습니다.

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "true"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

활성화 조건과 동작은 다음과 같습니다.

- `"delete_existing_files" = "true"`로 설정하면 내보내기 작업은 `s3://bucket/export/` 디렉터리 아래의 모든 파일과 하위 디렉터리를 **먼저 삭제한 후** 데이터를 내보냅니다.
- 이 매개변수를 적용하려면 `enable_delete_existing_files = true`를 `fe.conf`에 추가하고 FE를 재시작해야 합니다.

:::caution
이 작업은 외부 시스템의 데이터를 삭제하는 **고위험 작업**입니다. 외부 시스템의 권한 관리와 데이터 보안을 직접 보장하세요.
:::

### 개별 내보내기 파일의 크기 제어 {#control-the-size-of-a-single-export-file}

`max_file_size`로 개별 내보내기 파일의 크기를 제어할 수 있습니다. 설정한 값을 초과하는 파일은 자동으로 분할됩니다.

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

`max_file_size`의 유효 범위는 다음과 같습니다.

| 버전 범위                              | 최솟값  | 최댓값    |
| -------------------------------------- | ------- | --------- |
| 2.1.11 이전 / 3.0.7 이전               | 5MB     | 2GB       |
| 2.1.11 이상 / 3.0.7 이상               | 5MB     | 제한 없음 |

## 참고 사항 및 권장 사항 {#notes-and-best-practices}

<!-- Knowledge type: Best practices / Troubleshooting -->
<!-- Applicable scenarios: Production usage / Fault diagnosis -->

| 고려 사항                | 권장 사항 및 참고 사항                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 작업별 데이터 크기       | 단일 Export 작업의 데이터 크기는 수십 GB를 넘지 않도록 하는 것이 좋습니다. 대용량 테이블은 파티션별로 나누어 내보내면 불필요한 파일 생성과 재시도 비용 증가를 줄일 수 있습니다 |
| 시스템 리소스 영향       | Export 작업은 데이터를 스캔하고 IO 리소스를 사용하므로 쿼리 지연 시간에 영향을 줄 수 있습니다                             |
| 실패 시 파일 관리        | 작업이 실패해도 이미 생성된 파일은 자동으로 삭제되지 않으므로 수동으로 정리해야 합니다                                     |
| 내보내기 시간 초과       | 데이터가 매우 많으면 시간 초과가 발생할 수 있습니다. Export 명령의 `timeout` 매개변수로 제한 시간을 늘린 후 재시도할 수 있습니다 |
| FE 재시작 또는 master 전환 | 실행 중 FE가 재시작되거나 master가 전환되면 작업이 실패합니다. `SHOW EXPORT`로 상태를 확인하고 다시 제출하세요             |
| 파티션 수 제한           | 단일 Export 작업은 최대 2000개의 파티션을 내보낼 수 있습니다. `maximum_number_of_export_partitions`를 `fe.conf`에서 조정한 후 FE를 재시작하면 변경할 수 있습니다 |
| 데이터 무결성 확인       | 내보내기가 완료되면 행 수와 데이터의 정확성을 검증하여 데이터 품질을 확인하세요                                           |

## 부록 {#appendix}

### 기본 원리 {#basic-principles}

<!-- Knowledge type: Architectural principles -->

`EXPORT` 작업은 내부적으로 `SELECT INTO OUTFILE` SQL 문을 기반으로 실행됩니다. 전체 흐름은 다음과 같습니다.

1. 사용자가 `EXPORT` 작업을 제출합니다.
2. Doris는 내보낼 테이블을 기반으로 하나 이상의 `SELECT INTO OUTFILE` 실행 계획을 생성합니다.
3. 이러한 실행 계획을 Doris Job Schedule 작업 스케줄러에 제출합니다.
4. Job Schedule이 작업을 자동으로 예약하고 실행하여 최종적으로 내보내기 파일을 생성합니다.

### 로컬 파일 시스템으로 내보내기 {#export-to-the-local-file-system}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Local debugging / Development environment -->

:::caution
로컬 파일 시스템으로 내보내는 기능은 **로컬 디버깅 및 개발 전용입니다. 프로덕션 환경에서는 사용하지 마세요.** 내보내기 디렉터리의 권한 관리와 데이터 보안은 직접 보장해야 합니다.
:::

#### 활성화 방법 {#how-to-enable}

이 기능은 기본적으로 비활성화되어 있습니다. 활성화하려면 다음과 같이 설정합니다.

1. `enable_outfile_to_local=true`를 `fe.conf`에 추가합니다.
2. FE를 재시작하여 설정을 적용합니다.

#### 사용 예제 {#usage-example}

`tbl` 테이블의 모든 데이터를 로컬 파일 시스템으로 내보냅니다. 기본 형식인 CSV를 사용하고 열 구분자는 `,`로 지정합니다.

```sql
EXPORT TABLE db.tbl TO "file:///path/to/result_"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```

#### 데이터 분산 {#data-distribution}

- 데이터는 BE 노드의 로컬 디스크에 기록됩니다.
- 여러 BE가 있는 환경에서는 내보내기 작업의 병렬 처리 수준에 따라 데이터가 여러 BE 노드에 분산되며, 각 노드는 데이터의 일부를 저장합니다.
- 위 예에서는 `result_7052bac522d840f5-972079771289e392_0.csv`와 같은 파일이 BE 노드의 `/path/to/` 디렉터리에 생성됩니다.

#### 데이터를 저장한 BE 노드 확인 {#find-the-specific-be-nodes}

데이터를 저장한 BE 노드의 IP는 `OutfileInfo` 열에 표시되며, `SHOW EXPORT` 결과에서 확인할 수 있습니다.

```text
[
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.136/path/to/result_7052bac522d840f5-972079771289e392_*"
        }
    ], 
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.137/path/to/result_22aba7ec933b4922-ba81e5eca12bf0c2_*"
        }
    ]
]
```
