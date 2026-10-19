---
{
    "title": "실행 중인 쿼리의 진행률과 리소스 사용량 실시간 모니터링",
    "language": "ko",
    "description": "SQL 명령이나 REST API를 사용하여 Apache Doris에서 실행 중인 쿼리의 실행 진행률과 리소스 지표(CPU, 메모리, 셔플, 스필 등)를 실시간으로 확인하는 방법을 알아봅니다.",
    "keywords": ["쿼리 모니터링", "실행 중인 쿼리", "쿼리 진행률", "쿼리 리소스", "SHOW PROC", "current_queries", "Trace ID", "워크로드 관리"],
    "sidebar_label": "쿼리 진행률 모니터링"
}
---

<!-- Knowledge type: Concept introduction + Operational steps -->

Apache Doris는 실행 중인 쿼리와 해당 쿼리의 리소스 사용량을 실시간으로 확인할 수 있는 두 가지 방법을 제공합니다. **SQL 명령**(`SHOW PROC`)과 **REST API**입니다. 두 방법 모두 태스크 단위의 실행 진행률과 함께 스캔량, CPU, 메모리, 셔플, 스필, 캐시 등의 주요 지표를 반환합니다.

## SQL 명령으로 실행 중인 쿼리 확인 {#view-running-queries-via-sql-commands}

<!-- Knowledge type: Operational steps -->

`SHOW PROC` 명령을 사용하면 현재 실행 중인 모든 쿼리와 실시간 통계를 함께 조회할 수 있습니다.

```sql
SHOW PROC "/current_queries";
```

`SHOW PROC "/current_query_stmts"`도 동일한 통계 뷰를 반환합니다. Doris 4.1.1부터 두 명령은 개선된 단일 통계 형식을 공통으로 사용합니다.

### 출력 예시 {#example-output}

```
*************************** 1. row ***************************
                       QueryId: e00b00b1155d4042-98862b60016a768a
                  ConnectionId: 394
                       Catalog: internal
                      Database: wzhtest
                          User: root
                      ExecTime: 20717
                       SqlHash: cf263b08302d8be436c97dd5e6f0d283
                     Statement: INSERT INTO test_query_progress_tb
                                  SELECT DISTINCT k, CONCAT(v, CAST(k AS STRING))
                                  FROM test_query_progress_tb
                                  WHERE k % 2 = 0
                      ScanRows: 45400000 Rows
                     ScanBytes: 2.70 GB
                   ProcessRows: 75598123 Rows
                         CpuMs: 178336
            MaxPeakMemoryBytes: 13.03 GB
        CurrentUsedMemoryBytes: 8.69 GB
               WorkloadGroupId: 1777125330381
              ShuffleSendBytes: 0.00
               ShuffleSendRows: 0 Rows
     ScanBytesFromLocalStorage: 31.48 MB
    ScanBytesFromRemoteStorage: 0.00
 SpillWriteBytesToLocalStorage: 0.00
SpillReadBytesFromLocalStorage: 0.00
           BytesWriteIntoCache: 0.00
                    TotalTasks: 74
                 FinishedTasks: 51
                      Progress: 68%
*************************** 2. row ***************************
                       QueryId: e2b8c99658a94743-9ebbf0d036d83295
                  ConnectionId: 9
                       Catalog: hive_test
                      Database: tpch100_parquet
                          User: root
                      ExecTime: 10807
                       SqlHash: f8a30e4182d72cce3eff6cb385005b1f
                     Statement: select ... from supplier, lineitem l1, orders, nation ... limit 100
                      ScanRows: 1102562592 Rows
                     ScanBytes: 9.20 GB
                   ProcessRows: 112176670 Rows
                         CpuMs: 53808
            MaxPeakMemoryBytes: 3.13 GB
        CurrentUsedMemoryBytes: 2.50 GB
               WorkloadGroupId: 1777253545394
              ShuffleSendBytes: 0.00
               ShuffleSendRows: 0 Rows
     ScanBytesFromLocalStorage: 0.00
    ScanBytesFromRemoteStorage: 9.20 GB
 SpillWriteBytesToLocalStorage: 0.00
SpillReadBytesFromLocalStorage: 0.00
           BytesWriteIntoCache: 0.00
                    TotalTasks: 138
                 FinishedTasks: 65
                      Progress: 47%
```

### 필드 설명 {#field-descriptions}

<!-- Knowledge type: Reference table -->

| 필드 | 설명 |
|---|---|
| QueryId | 쿼리의 고유 식별자 |
| ConnectionId | MySQL 연결 ID |
| Catalog | 쿼리가 속한 Catalog의 이름. 예: `internal` 또는 `hive_test` |
| Database | 데이터베이스 또는 스키마 이름 |
| User | 쿼리를 제출한 사용자 |
| ExecTime | 실행 시작 후 경과 시간(밀리초) |
| SqlHash | SQL 문의 MD5 해시. 동일한 쿼리를 식별하는 데 유용함 |
| Statement | SQL 문의 텍스트(너무 길면 잘림) |
| ScanRows | 스토리지 계층에서 스캔한 총 행 수 |
| ScanBytes | 스토리지 계층에서 스캔한 총 바이트 수 |
| ProcessRows | 실행 파이프라인에서 처리한 행 수로, 실제 연산자 처리량을 나타냄 |
| CpuMs | 사용한 CPU 시간(밀리초) |
| MaxPeakMemoryBytes | 쿼리 실행 중 최대 메모리 사용량 |
| CurrentUsedMemoryBytes | 쿼리가 현재 점유하고 있는 메모리 |
| WorkloadGroupId | 쿼리가 속한 워크로드 그룹의 ID |
| ShuffleSendBytes | 노드 간 데이터 셔플 중 전송한 총 바이트 수 |
| ShuffleSendRows | 노드 간 데이터 셔플 중 전송한 총 행 수 |
| ScanBytesFromLocalStorage | 로컬 디스크에서 스캔한 바이트 수 |
| ScanBytesFromRemoteStorage | 원격 스토리지(예: HDFS 또는 S3)에서 스캔한 바이트 수 |
| SpillWriteBytesToLocalStorage | 메모리 부족으로 로컬 디스크에 스필한 바이트 수 |
| SpillReadBytesFromLocalStorage | 로컬 디스크에 스필된 데이터에서 다시 읽은 바이트 수 |
| BytesWriteIntoCache | 데이터 캐시에 기록한 바이트 수 |
| TotalTasks | 쿼리의 전체 파이프라인 태스크 수 |
| FinishedTasks | 완료된 파이프라인 태스크 수 |
| Progress | `FinishedTasks / TotalTasks`로 계산한 쿼리 실행 진행률(백분율) |

## REST API로 실행 중인 쿼리 확인 {#view-running-queries-via-the-rest-api}

<!-- Knowledge type: Operational steps -->

**목적**: 실행 중인 쿼리의 실시간 통계를 프로그래밍 방식으로 조회합니다.

**명령**:

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/current_queries
```

**설명**: 이 엔드포인트는 `SHOW PROC`와 동일한 열 데이터를 JSON 형식으로 반환하며, 각 필드의 의미도 동일합니다.

### 쿼리 매개변수 {#query-parameters}

| 매개변수 | 유형 | 설명 |
|---|---|---|
| is_all_node | Boolean (선택 사항) | `true`로 설정하면 모든 FE 노드에서 실행 중인 쿼리를 반환합니다. 기본값은 `true`입니다. |

### 응답 예시 {#example-response}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "columnNames": [
            "Frontend", "QueryId", "ConnectionId", "Catalog", "Database",
            "User", "ExecTime", "SqlHash", "Statement",
            "ScanRows", "ScanBytes", "ProcessRows", "CpuMs",
            "MaxPeakMemoryBytes", "CurrentUsedMemoryBytes", "WorkloadGroupId",
            "ShuffleSendBytes", "ShuffleSendRows",
            "ScanBytesFromLocalStorage", "ScanBytesFromRemoteStorage",
            "SpillWriteBytesToLocalStorage", "SpillReadBytesFromLocalStorage",
            "BytesWriteIntoCache",
            "TotalTasks", "FinishedTasks", "Progress"
        ],
        "rows": [
            [
                "172.19.0.3", "108e47ab438a4560-ab1651d16c036491", "2", "internal",
                "testdb", "root", "6074",
                "1a35f62f4b14b9d7961b057b77c3102f", "select sleep(60)",
                "0", "0.00", "0", "0",
                "0.00", "0.00", "0",
                "0.00", "0",
                "0.00", "0.00",
                "0.00", "0.00",
                "0.00",
                "1", "1", "100%"
            ]
        ]
    },
    "count": 0
}
```

## Trace ID로 단일 쿼리의 진행률을 실시간으로 추적 {#track-real-time-progress-of-a-single-query-via-trace-id}

<!-- Knowledge type: Operational steps -->

특정 쿼리의 실행 진행률을 지속적으로 추적하려면 쿼리에 Trace ID를 지정한 다음, 별도의 세션에서 통계 엔드포인트를 폴링하여 실시간 상태를 확인합니다.

**1단계: 쿼리를 실행하기 전에 Trace ID 설정**

```sql
SET session_context="trace_id:my_trace_id";
SELECT ...;
```

**2단계: 다른 세션에서 통계 폴링**

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/statistics/my_trace_id
```

**설명**: 쿼리가 완료될 때까지 이 엔드포인트를 주기적으로 호출하여 최신 쿼리 진행률을 확인합니다.

### 응답 예시 {#example-response-1}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "scanRows": 1102562592,
        "scanBytes": 9878424780,
        "returnedRows": 12345,
        "processRows": 112176670,
        "cpuMs": 53808,
        "maxPeakMemoryBytes": 3355443200,
        "currentUsedMemoryBytes": 2684354560,
        "shuffleSendBytes": 0,
        "shuffleSendRows": 0,
        "scanBytesFromLocalStorage": 0,
        "scanBytesFromRemoteStorage": 9878424780,
        "spillWriteBytesToLocalStorage": 0,
        "spillReadBytesFromLocalStorage": 0,
        "bytesWriteIntoCache": 0,
        "totalTasksNum": 138,
        "finishedTasksNum": 65,
        "progress": "47%"
    },
    "count": 0
}
```
