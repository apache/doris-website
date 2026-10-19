---
{
    "title": "SELECT INTO OUTFILE",
    "language": "ko",
    "description": "Parquet/ORC/CSV 예제와 함께 SELECT INTO OUTFILE을 사용하여 Doris 쿼리 결과를 S3, HDFS 및 기타 스토리지로 동기적으로 내보내는 방법을 설명합니다.",
    "keywords": [
        "SELECT INTO OUTFILE",
        "Doris 내보내기",
        "쿼리 결과 내보내기",
        "S3로 내보내기",
        "HDFS로 내보내기",
        "Parquet 내보내기",
        "ORC 내보내기",
        "CSV 내보내기",
        "병렬 내보내기",
        "enable_parallel_outfile",
        "max_file_size",
        "success_file_name"
    ]
}
---

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Data export / Query result persistence / Offline analysis data delivery -->

이 문서는 `SELECT INTO OUTFILE` 명령을 사용하여 Doris 쿼리 결과를 지정된 파일 형식으로 객체 스토리지 또는 HDFS에 동기적으로 내보내는 방법을 설명합니다.

`SELECT INTO OUTFILE`은 Doris에서 제공하는 **동기식 내보내기 명령**입니다. `SELECT` 쿼리 결과를 객체 스토리지(S3/COS/OSS/OBS/GCS) 또는 HDFS에 Parquet, ORC, CSV 등의 형식으로 기록합니다. 명령이 반환되면 내보내기가 완료된 상태입니다.

- 성공 시: 내보낸 파일 수, 크기, 경로 등의 정보를 반환합니다.
- 실패 시: 오류 메시지를 반환합니다.

> `SELECT INTO OUTFILE`과 `EXPORT` 중 어떤 명령을 사용할지 결정하려면 [내보내기 개요](./export-overview.md)를 참조하세요.
> 전체 명령어 참조는 [SELECT INTO OUTFILE 구문](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE)을 참조하세요.

## 적용 시나리오 {#applicable-scenarios}

<!-- Knowledge type: Architecture selection decision -->

`SELECT INTO OUTFILE`은 다음과 같은 데이터 내보내기 시나리오에 적합합니다.

| 시나리오 유형     | 설명                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------- |
| 복잡한 연산 결과 내보내기 | 내보낼 데이터에 필터링, 집계, 조인(JOIN) 등의 복잡한 연산 로직을 적용해야 하는 경우입니다. |
| 동기식 작업  | 업무 흐름에서 내보내기가 완료될 때까지 기다린 후 다음 작업을 수행해야 하는 경우입니다. |

### 제한 사항 {#limitations}

- 압축된 텍스트 형식으로 내보내기는 지원하지 않습니다.
- 버전 2.1의 파이프라인 엔진은 병렬 내보내기를 지원하지 않습니다.

## 기능 개요 {#capability-overview}

<!-- Knowledge type: Configuration parameters -->

### 지원하는 저장 위치 {#supported-storage-locations}

| 스토리지 유형           | 지원 대상                                          |
| ---------------------- | --------------------------------------------------------- |
| 객체 스토리지         | Amazon S3, Tencent Cloud COS, Alibaba Cloud OSS, Huawei Cloud OBS, Google GCS |
| 분산 파일 시스템 | HDFS                                                     |
| 로컬 파일 시스템      | 디버깅 용도로만 사용하며, 수동으로 활성화해야 합니다(부록 참조). |

### 지원하는 파일 형식 {#supported-file-formats}

- Parquet
- ORC
- csv
- csv\_with\_names
- csv\_with\_names\_and\_types

## 빠른 시작 {#quick-start}

<!-- Knowledge type: Operation steps -->

### 단계 1: 테이블 생성 및 데이터 적재 {#step-1-create-a-table-and-load-data}

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");

insert into tbl values
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, null, null);
```

### 단계 2: HDFS로 내보내기 {#step-2-export-to-hdfs}

쿼리 결과를 `hdfs://path/to/` 디렉터리에 Parquet 형식으로 내보냅니다.

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://ip:port/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://ip:port",
    "hadoop.username" = "hadoop"
);
```

### 단계 3: 객체 스토리지로 내보내기 {#step-3-export-to-object-storage}

쿼리 결과를 `s3://bucket/export/` 디렉터리에 ORC 형식으로 내보냅니다. `ak`와 `sk` 등의 액세스 자격 증명을 제공해야 합니다.

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

## 고급 기능 {#advanced-capabilities}

### 병렬 내보내기 활성화(내보내기 효율 향상) {#enable-parallel-export-improve-export-efficiency}

<!-- Applicable scenarios: Large data volume export / Performance tuning -->

세션 변수 `enable_parallel_outfile`을 통해 병렬 내보내기를 활성화합니다.

```sql
SET enable_parallel_outfile=true;
```

| 항목          | 설명                                                                  |
| ------------------ | ---------------------------------------------------------------------------- |
| 동작 방식  | 여러 BE 노드와 여러 스레드를 사용하여 결과 데이터를 동시에 내보냅니다. |
| 장점          | 전체 내보내기 효율을 크게 높입니다.                            |
| 부수 효과        | 생성되는 파일 수가 늘어날 수 있습니다.                                                      |
| 적용되지 않는 경우 | 전역 정렬이 포함된 쿼리에서는 이 매개변수를 활성화해도 병렬 내보내기가 적용되지 않습니다. |
| 적용 여부 확인 방법 | 내보내기 명령이 여러 행을 반환하면 병렬 내보내기가 적용된 것입니다. |

## 일반적인 시나리오 예제 {#typical-scenario-examples}

### 시나리오 1: 고가용성이 활성화된 HDFS 클러스터로 내보내기 {#scenario-1-export-to-an-hdfs-cluster-with-high-availability-enabled}

<!-- Applicable scenarios: HA HDFS environment -->

HDFS에서 HA가 활성화되어 있다면 nameservices 및 NameNodes 관련 설정을 추가로 제공해야 합니다.

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://HDFS8000871/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

### 시나리오 2: HA와 Kerberos 인증이 활성화된 HDFS 클러스터로 내보내기 {#scenario-2-export-to-an-hdfs-cluster-with-ha-and-kerberos-authentication-enabled}

<!-- Applicable scenarios: Kerberos secure authentication environment -->

HDFS 클러스터에서 고가용성과 Kerberos 인증이 모두 활성화되어 있다면 다음 SQL을 참조하세요.

```sql
SELECT * FROM tbl
INTO OUTFILE "hdfs://path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
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

### 시나리오 3: 내보내기 성공 마커 파일 생성 {#scenario-3-generate-an-export-success-marker-file}

<!-- Applicable scenarios: Synchronous task integrity verification / Avoiding unknown status caused by network disconnection -->

**배경**: `SELECT INTO OUTFILE`은 동기식 명령입니다. SQL 실행 중 연결이 끊기면 내보내기가 완료되었는지 알 수 없습니다.

**해결 방법**: `success_file_name` 매개변수를 사용합니다. 내보내기에 성공하면 디렉터리에 마커 파일(Hive의 `_SUCCESS`와 유사)이 생성됩니다. 이 파일의 존재 여부를 확인하여 내보내기가 온전히 완료되었는지 확인할 수 있습니다.

다음 예제는 쿼리 결과를 S3에 CSV 형식으로 내보내고, 완료 후 `SUCCESS`라는 마커 파일을 생성합니다.

```sql
SELECT k1,k2,v1 FROM tbl1 LIMIT 100000
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "success_file_name" = "SUCCESS"
);
```

### 시나리오 4: 내보내기 전 대상 디렉터리 비우기 {#scenario-4-clear-the-target-directory-before-export}

<!-- Applicable scenarios: Overwrite-style export / Periodic full replacement -->

`delete_existing_files` 매개변수를 사용하여 내보내기 전에 대상 디렉터리의 기존 파일을 삭제합니다.

```sql
SELECT * FROM tbl1
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "delete_existing_files" = "true"
);
```

**조건 및 위험**:

| 항목               | 설명                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| 동작           | 먼저 `s3://bucket/export/` 아래의 모든 파일과 하위 디렉터리를 삭제한 다음 데이터를 내보냅니다.       |
| 활성화 조건  | `enable_delete_existing_files = true` 설정을 `fe.conf`에 추가하고 FE를 재시작해야 합니다. |
| 위험 경고       | 외부 시스템의 데이터를 삭제하는 고위험 작업입니다. 외부 시스템의 권한과 데이터 보안은 사용자가 직접 보장해야 합니다. |

### 시나리오 5: 개별 내보내기 파일의 크기 제어 {#scenario-5-control-the-size-of-a-single-exported-file}

`max_file_size` 매개변수를 사용하여 내보내는 각 파일의 최대 크기를 제어합니다.

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://path/to/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "max_file_size" = "2048MB"
);
```

**참고 사항**:

- 최종 생성되는 데이터가 2 GB 이하이면 파일 하나만 생성됩니다.
- 2 GB를 초과하면 데이터가 여러 파일로 분할됩니다.
- 파일을 분할할 때 데이터 한 행이 하나의 파일에 온전히 저장되도록 보장하므로 실제 파일 크기가 `max_file_size`와 정확히 같지는 않습니다.

## 참고 사항 {#notes}

<!-- Knowledge type: Configuration parameters / Troubleshooting -->

### 성능 및 시간 제한 {#performance-and-timeout}

| 주제                | 설명                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 내보내기 소요 시간의 구성 | `SELECT INTO OUTFILE`은 기본적으로 SQL 쿼리이므로 총 소요 시간 = 쿼리 시간 + 결과 집합 기록 시간입니다.        |
| 단일 스레드 병목 | 병렬 내보내기를 활성화하지 않으면 단일 BE 노드의 단일 스레드가 쿼리 결과를 기록합니다.           |
| 성능 최적화 | `enable_parallel_outfile`을 활성화하여 병렬 내보내기를 사용하면 소요 시간을 크게 줄일 수 있습니다.             |
| 내보내기 시간 제한       | 내보내기 명령의 시간 제한은 쿼리 시간 제한과 같습니다. 데이터양이 많으면 `query_timeout`을 설정하여 시간 제한을 적절히 늘릴 수 있습니다. |

### 파일 관리 {#file-management}

- **Doris는 내보낸 파일을 관리하지 않습니다**: 내보내기에 성공한 파일이든 실패 후 남은 파일이든 사용자가 직접 정리해야 합니다.
- **경로나 파일을 확인하지 않습니다**: `SELECT INTO OUTFILE`은 파일이나 경로가 존재하는지 확인하지 않습니다. 경로가 자동으로 생성되는지, 기존 파일을 덮어쓰는지는 전적으로 원격 스토리지 시스템의 동작 규칙에 따라 결정됩니다.

### 데이터 및 형식 {#data-and-format}

- **빈 결과 집합**: 쿼리 결과 집합이 비어 있어도 빈 파일이 생성됩니다.
- **파일 분할 규칙**: 데이터 한 행이 하나의 파일에 온전히 저장되도록 보장하므로 파일 크기가 `max_file_size`와 정확히 같지는 않습니다.
- **인쇄할 수 없는 문자를 생성하는 함수**: `BITMAP` 및 `HLL`처럼 인쇄할 수 없는 문자를 출력하는 함수의 결과는 CSV로 내보낼 때 `\N`으로 기록됩니다.

## 부록 {#appendix}

### 로컬 파일 시스템으로 내보내기(디버깅 전용) {#export-to-the-local-file-system-debugging-only}

<!-- Applicable scenarios: Local debugging / Development verification -->
<!-- Knowledge type: Configuration parameters -->

:::caution
이 기능은 로컬 디버깅 및 개발 용도로만 사용합니다. **운영 환경에서는 사용하지 마세요**. 내보내기 디렉터리의 권한과 데이터 보안은 사용자가 직접 보장해야 합니다.
:::

**활성화 방법**: `enable_outfile_to_local=true`를 `fe.conf`에 추가하고 FE를 재시작합니다.

**예제**: `tbl` 테이블의 모든 데이터를 로컬 파일 시스템에 기본 형식인 CSV로 내보내며, 열 구분자로 `,`를 사용합니다.

```sql
SELECT c1, c2 FROM db.tbl
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```

**동작 참고 사항**:

- 데이터는 BE 노드의 로컬 디스크에 기록됩니다.
- 여러 BE 노드로 구성된 환경에서는 내보내기 작업의 동시 실행 수준에 따라 데이터가 서로 다른 BE 노드에 분산됩니다.
- `result_c6df5f01bd664dde-a2168b019b6c2b3f_0.csv`와 같은 파일이 BE 노드의 `/path/to/` 디렉터리 아래에 생성됩니다.
- 구체적인 BE 노드 IP는 반환 결과에 표시됩니다.

**반환 결과 예제**:

```text
+------------+-----------+----------+--------------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                      |
+------------+-----------+----------+--------------------------------------------------------------------------+
|          1 |   1195072 |  4780288 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b3f_* |
|          1 |   1202944 |  4811776 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b40_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b43_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b45_* |
+------------+-----------+----------+--------------------------------------------------------------------------+
```
