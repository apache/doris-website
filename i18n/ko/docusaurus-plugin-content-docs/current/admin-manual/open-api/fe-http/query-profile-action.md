---
{
    "title": "쿼리 Profile 작업 | Fe Http",
    "language": "ko",
    "description": "Doris FE 쿼리 Profile REST API 문서입니다. HTTP 인터페이스를 통해 쿼리 정보, 실행 Profile, 실시간 통계 데이터를 조회하고 실행 중인 쿼리를 모니터링하고 제어할 수 있습니다.",
    "sidebar_label": "쿼리 Profile 작업"
}
---

# 쿼리 Profile 작업 {#query-profile-action}

## 요청 {#request}

`GET /rest/v2/manager/query/query_info`

`GET /rest/v2/manager/query/trace_id/{trace_id}`

`GET /rest/v2/manager/query/sql/{query_id}`

`GET /rest/v2/manager/query/profile/text/{query_id}`

`GET /rest/v2/manager/query/profile/graph/{query_id}`

`GET /rest/v2/manager/query/profile/json/{query_id}`

`GET /rest/v2/manager/query/profile/fragments/{query_id}`

`GET /rest/v2/manager/query/current_queries`

`GET /rest/v2/manager/query/kill/{query_id}`

`GET /rest/v2/manager/query/statistics/{trace_id}` (4.0.0+)

## 쿼리 정보 가져오기 {#get-the-query-information}

`GET /rest/v2/manager/query/query_info`

### 설명 {#description}

클러스터의 모든 FE 노드에서 SELECT 쿼리 정보를 가져옵니다.

### 쿼리 매개변수 {#query-parameters}

* `query_id`

    선택 사항입니다. 정보를 반환할 쿼리의 쿼리 ID를 지정합니다. 기본적으로 모든 쿼리의 정보를 반환합니다.

* `search`

    선택 사항입니다. 지정한 문자열이 포함된 쿼리 정보를 반환합니다. 현재는 문자열 일치만 지원합니다.

* `is_all_node`

    선택 사항입니다. true이면 모든 FE 노드의 쿼리 정보를 반환하고, false이면 현재 FE 노드의 쿼리 정보를 반환합니다. 기본값은 true입니다.


### 응답 {#response}

```json
{
   "msg": "success",
    "code": 0,
    "data": {
        "column_names": [
            "Query ID",
            "FE Node",
            "Query User",
            "Execution Database",
            "Sql",
            "Query Type",
            "Start Time",
            "End Time",
            "Execution Duration",
            "Status"
        ],
        "rows": [
            [
                ...
            ]
        ]
    },
    "count": 0
}
```

:::info 참고

Doris 1.2 버전부터 Admin 및 Root 사용자는 모든 쿼리를 볼 수 있습니다. 일반 사용자는 자신이 제출한 쿼리만 볼 수 있습니다.

:::



### 예제 {#examples}

```json
GET /rest/v2/manager/query/query_info

{
    "msg": "success",
    "code": 0,
    "data": {
        "column_names": [
            "Query ID",
            "FE Node",
            "Query User",
            "Execution Database",
            "Sql",
            "Query Type",
            "Start Time",
            "End Time",
            "Execution Duration",
            "Status"
        ],
        "rows": [
            [
                "d7c93d9275334c35-9e6ac5f295a7134b",
                "127.0.0.1:8030",
                "root",
                "default_cluster:testdb",
                "select c.id, c.name, p.age, p.phone, c.date, c.cost from cost c join people p on c.id = p.id where p.age > 20 order by c.id",
                "Query",
                "2021-07-29 16:59:12",
                "2021-07-29 16:59:12",
                "109ms",
                "EOF"
            ]
        ]
    },
    "count": 0
}
```

## Trace ID로 쿼리 ID 가져오기 {#get-query-id-by-trace-id}

`GET /rest/v2/manager/query/trace_id/{trace_id}`

### 설명 {#description-1}

Trace ID로 쿼리 ID를 가져옵니다.

쿼리를 실행하기 전에 고유한 Trace ID를 설정합니다.

`set session_context="trace_id:your_trace_id";`

같은 세션에서 쿼리를 실행한 후 Trace ID를 통해 쿼리 ID를 가져올 수 있습니다.

### 경로 매개변수 {#path-parameters}

* `{trace_id}`

    사용자가 지정한 Trace ID입니다.

### 쿼리 매개변수 {#query-parameters-1}

### 응답 {#response-1}

```json
{
    "msg": "success",
    "code": 0,
    "data": "fb1d9737de914af1-a498d5c5dec638d3",
    "count": 0
}
```

:::note 정보

Doris 1.2 버전부터 admin 및 root 사용자는 모든 쿼리를 볼 수 있습니다. 일반 사용자는 자신이 제출한 쿼리만 볼 수 있습니다. 지정한 Trace ID가 없거나 조회 권한이 없으면 Bad Request를 반환합니다.

```json
{
    "msg": "Bad Request",
    "code": 403,
    "data": "error messages",
    "count": 0
}
```
:::


## 지정한 쿼리의 SQL 및 텍스트 Profile 가져오기 {#get-the-sql-and-text-profile-for-the-specified-query}

`GET /rest/v2/manager/query/sql/{query_id}`

`GET /rest/v2/manager/query/profile/text/{query_id}`

### 설명 {#description-2}

지정한 쿼리 ID의 SQL 및 Profile 텍스트를 가져옵니다.

### 경로 매개변수 {#path-parameters-1}

* `query_id`

    쿼리 ID입니다.

### 쿼리 매개변수 {#query-parameters-2}

* `is_all_node`

    선택 사항입니다. true이면 모든 FE 노드에서 지정한 쿼리 ID를 조회하고, false이면 현재 연결된 FE 노드에서 지정한 쿼리 ID를 조회합니다. 기본값은 true입니다.

### 응답 {#response-2}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "sql": ""
    },
    "count": 0
}
```

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "profile": ""
    },
    "count": 0
}
```

:::note 정보

Doris 1.2 버전부터 admin 및 root 사용자는 모든 쿼리를 볼 수 있습니다. 일반 사용자는 자신이 제출한 쿼리만 볼 수 있습니다. 지정한 Trace ID가 없거나 조회 권한이 없으면 Bad Request를 반환합니다.

```json
{
    "msg": "Bad Request",
    "code": 403,
    "data": "error messages",
    "count": 0
}
```

:::

### 예제 {#examples-1}

1. SQL 가져오기.

    ```json
    GET /rest/v2/manager/query/sql/d7c93d9275334c35-9e6ac5f295a7134b

    Response:
    {
        "msg": "success",
        "code": 0,
        "data": {
            "sql": "select c.id, c.name, p.age, p.phone, c.date, c.cost from cost c join people p on c.id = p.id where p.age > 20 order by c.id"
        },
        "count": 0
    }
    ```

## 지정한 쿼리의 프래그먼트 및 인스턴스 정보 가져오기 {#get-the-specified-query-fragment-and-instance-information}

`GET /rest/v2/manager/query/profile/fragments/{query_id}`

:::caution

2.1.1부터 이 API는 사용 중단(deprecated) 상태입니다. http://<fe_ip>:<fe_http_port>/QueryProfile 에서 Profile을 계속 다운로드할 수 있습니다.

:::

### 설명 {#description-3}

지정한 쿼리 ID의 프래그먼트 이름, 인스턴스 ID, 호스트 IP/포트 및 실행 시간을 가져옵니다.

### 경로 매개변수 {#path-parameters-2}

* `query_id`

    쿼리 ID입니다.

### 쿼리 매개변수 {#query-parameters-3}

* `is_all_node`

    선택 사항입니다. true이면 모든 FE 노드에서 지정한 쿼리 ID를 조회하고, false이면 현재 연결된 FE 노드에서 지정한 쿼리 ID를 조회합니다. 기본값은 true입니다.

### 응답 {#response-3}

```json
{
    "msg": "success",
    "code": 0,
    "data": [
        {
            "fragment_id": "",
            "time": "",
            "instance_id": {
                "": {
                  "host": "",
                  "active_time": ""
                }
            }
        }
    ],
    "count": 0
}
```

:::note 정보

Doris 1.2 버전부터 admin 및 root 사용자는 모든 쿼리를 볼 수 있습니다. 일반 사용자는 자신이 제출한 쿼리만 볼 수 있습니다. 지정한 Trace ID가 없거나 조회 권한이 없으면 Bad Request를 반환합니다.

```json
{
    "msg": "Bad Request",
    "code": 403,
    "data": "error messages",
    "count": 0
}
```
:::


### 예제 {#examples-2}

```json
GET /rest/v2/manager/query/profile/fragments/d7c93d9275334c35-9e6ac5f295a7134b

Response:
{
    "msg": "success",
    "code": 0,
    "data": [
        {
            "fragment_id": "0",
            "time": "36.169ms",
            "instance_id": {
                "d7c93d9275334c35-9e6ac5f295a7134e": {
                    "host": "172.19.0.4:9060",
                    "active_time": "36.169ms"
                }
            }
        },
        {
            "fragment_id": "1",
            "time": "20.710ms",
            "instance_id": {
                "d7c93d9275334c35-9e6ac5f295a7134c": {
                    "host": "172.19.0.5:9060",
                    "active_time": "20.710ms"
                }
            }
        },
        {
            "fragment_id": "2",
            "time": "7.83ms",
            "instance_id": {
                "d7c93d9275334c35-9e6ac5f295a7134d": {
                    "host": "172.19.0.6:9060",
                    "active_time": "7.83ms"
                },
                "d7c93d9275334c35-9e6ac5f295a7134f": {
                    "host": "172.19.0.7:9060",
                    "active_time": "10.873ms"
                }
            }
        }
    ],
    "count": 0
}
```

## 지정한 쿼리 ID의 트리 형태 Profile 정보 가져오기 {#get-the-specified-query-id-tree-profile-information}

`GET /rest/v2/manager/query/profile/graph/{query_id}`

### 설명 {#description-4}

지정한 쿼리 ID의 트리 형태 Profile 정보를 가져옵니다. `show query profile` 명령과 동일합니다.

### 경로 매개변수 {#path-parameters-3}

* `query_id`

    쿼리 ID입니다.

### 쿼리 매개변수 {#query-parameters-4}

* `fragment_id` 및 `instance_id`

    선택 사항입니다. 두 매개변수는 함께 지정하거나 모두 생략해야 합니다.
    둘 다 생략하면 간단한 Profile 트리를 반환하며, 이는 `show query profile '/query_id'`와 동일합니다.
    둘 다 지정하면 상세한 Profile 트리를 반환하며, 이는 `show query profile '/query_id/fragment_id/instance_id'`와 동일합니다.

* `is_all_node`

    선택 사항입니다. true이면 모든 FE 노드에서 지정한 쿼리 ID의 정보를 조회하고, false이면 현재 연결된 FE 노드에서 지정한 쿼리 ID의 정보를 조회합니다. 기본값은 true입니다.

### 응답 {#response-4}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "graph":""
    },
    "count": 0
}
```

:::note 정보

Doris 1.2 버전부터 admin 및 root 사용자는 모든 쿼리를 볼 수 있습니다. 일반 사용자는 자신이 제출한 쿼리만 볼 수 있습니다. 지정한 Trace ID가 없거나 조회 권한이 없으면 Bad Request를 반환합니다.

```json
{
    "msg": "Bad Request",
    "code": 403,
    "data": "error messages",
    "count": 0
}
```
:::



## 현재 실행 중인 쿼리 {#current-running-queries}

`GET /rest/v2/manager/query/current_queries`

### 설명 {#description-5}

현재 실행 중인 쿼리와 런타임 통계를 반환합니다. 이 엔드포인트는 `SHOW PROC "/current_queries"` 및 `SHOW PROC "/current_query_stmts"`와 동일한 통계 뷰를 사용하며, 태스크 수준의 진행률과 리소스 지표(scan/cpu/memory/shuffle/spill/cache)를 제공합니다. 4.1.1+ 버전에서 지원됩니다.

### 경로 매개변수 {#path-parameters-4}

### 쿼리 매개변수 {#query-parameters-5}

* `is_all_node`

    선택 사항입니다. true로 설정하면 모든 FE에서 현재 실행 중인 쿼리를 반환합니다. 기본값은 true입니다.

### 응답 {#response-5}

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

| 열 | 설명 |
| ------ | ----------- |
| Frontend | 쿼리를 처리하는 FE 노드 |
| QueryId | 쿼리의 고유 식별자 |
| ConnectionId | MySQL 연결 ID |
| Catalog | Catalog 이름 |
| Database | 스키마/데이터베이스 이름 |
| User | 쿼리를 제출한 사용자 |
| ExecTime | 실행 시간(밀리초) |
| SqlHash | SQL 문의 MD5 해시 |
| Statement | SQL 문 텍스트 |
| ScanRows | 스토리지에서 스캔한 총 행 수 |
| ScanBytes | 스토리지에서 스캔한 총 바이트 수 |
| ProcessRows | 실행 파이프라인에서 처리한 행 수 |
| CpuMs | 사용한 CPU 시간(밀리초) |
| MaxPeakMemoryBytes | 실행 중 최대 메모리 사용량 |
| CurrentUsedMemoryBytes | 쿼리가 현재 사용하는 메모리 |
| WorkloadGroupId | 워크로드 그룹 ID |
| ShuffleSendBytes | 셔플을 통해 전송한 총 바이트 수 |
| ShuffleSendRows | 셔플을 통해 전송한 총 행 수 |
| ScanBytesFromLocalStorage | 로컬 스토리지에서 스캔한 바이트 수 |
| ScanBytesFromRemoteStorage | 원격 스토리지(예: HDFS, S3)에서 스캔한 바이트 수 |
| SpillWriteBytesToLocalStorage | 로컬 디스크에 스필한 바이트 수 |
| SpillReadBytesFromLocalStorage | 로컬 스필 디스크에서 다시 읽은 바이트 수 |
| BytesWriteIntoCache | 캐시에 쓴 바이트 수 |
| TotalTasks | 이 쿼리의 전체 파이프라인 태스크 수 |
| FinishedTasks | 완료된 파이프라인 태스크 수 |
| Progress | 계산된 쿼리 진행률(FinishedTasks / TotalTasks) |

## 쿼리 취소 {#cancel-query}

`POST /rest/v2/manager/query/kill/{query_id}`

### 설명 {#description-6}

지정한 연결의 쿼리를 취소합니다.

### 경로 매개변수 {#path-parameters-5}

* `{query_id}`

    쿼리 ID입니다. `trance_id` API로 쿼리 ID를 가져올 수 있습니다.

### 쿼리 매개변수 {#query-parameters-6}

### 응답 {#response-6}

```json
{
    "msg": "success",
    "code": 0,
    "data": null,
    "count": 0
}
```

## Trace ID로 쿼리 진행률 가져오기 {#get-query-progress-by-trace-id}

`GET /rest/v2/manager/query/statistics/{trace_id}` (4.0.0+)

### 설명 {#description-7}

Trace ID로 현재 실행 중인 쿼리의 통계를 가져옵니다. 이 API를 주기적으로 호출하여 쿼리 진행률을 확인할 수 있습니다.

### 경로 매개변수 {#path-parameters-6}

* `{trace_id}`

    Trace ID입니다. `SET session_context="trace_id:xxxx"`로 설정한 사용자 정의 Trace ID입니다.

### 응답 {#response-7}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "scanRows": 1234567,
        "scanBytes": 987654321,
        "returnedRows": 12345,
        "processRows": 2345678,
        "cpuMs": 15600,
        "maxPeakMemoryBytes": 536870912,
        "currentUsedMemoryBytes": 268435456,
        "shuffleSendBytes": 104857600,
        "shuffleSendRows": 50000,
        "scanBytesFromLocalStorage": 734003200,
        "scanBytesFromRemoteStorage": 253651121,
        "spillWriteBytesToLocalStorage": 0,
        "spillReadBytesFromLocalStorage": 0,
        "bytesWriteIntoCache": 0,
        "totalTasksNum": 74,
        "finishedTasksNum": 51,
        "progress": "68%"
    },
    "count": 0
}
```
