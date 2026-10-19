---
{
    "title": "audit_log",
    "language": "ko",
    "description": "감사 로그 저장"
}
---

## 개요 {#overview}

감사 로그를 저장합니다.

## 데이터베이스 {#database}


`__internal_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름       | 타입         | 설명                                                  |
| ----------------- | ------------ | ------------------------------------------------------------ |
| query_id          | varchar(48)  | 쿼리 ID                                              |
| time              | datetime(3)  | 쿼리 실행 시각(밀리초 단위)                           |
| client_ip         | varchar(128) | 쿼리를 전송한 클라이언트의 IP 주소                   |
| user              | varchar(128) | 사용자                                                         |
| catalog           | varchar(128) | 문 실행 시 현재 Catalog                   |
| db                | varchar(128) | 문 실행 시 현재 데이터베이스                  |
| state             | varchar(128) | 문 실행 상태                            |
| error_code        | int          | 오류 코드                                                   |
| error_message     | text         | 오류 메시지                                                |
| query_time        | bigint       | 문 실행 시간                              |
| queue_time_ms     | bigint       | 문이 워크로드 큐에서 대기한 시간(밀리초 단위). 4.1.4 버전부터 지원됩니다. 테이블 스키마에서 이 컬럼은 `query_time`과 `cpu_time_ms` 사이에 위치합니다. |
| scan_bytes        | bigint       | 스캔한 데이터의 양                                       |
| scan_rows         | bigint       | 스캔한 행 수                                       |
| return_rows       | bigint       | 반환된 행 수                                      |
| shuffle_send_rows             | bigint  | 문 실행 중 노드 간에 전송된 행 수. 3.0 버전부터 지원됩니다. |
| shuffle_send_bytes            | bigint    | 문 실행 중 노드 간에 전송된 데이터의 양. 3.0 버전부터 지원됩니다. | 
| scan_bytes_from_local_storage   | bigint    | 로컬 디스크에서 읽은 데이터의 양. 3.0 버전부터 지원됩니다. |
| scan_bytes_from_remote_storage  | bigint    | 원격 스토리지에서 읽은 데이터의 양. 3.0 버전부터 지원됩니다. |
| stmt_id           | bigint       | 문 ID                                                 |
| stmt_type                   | string    | 문 유형. 3.0 버전부터 지원됩니다. |
| is_query          | tinyint      | 쿼리 여부                                        |
| is_nereids                  | boolean    | Nereids Optimizer 사용 여부. |
| frontend_ip       | varchar(128) | 연결된 Frontend의 IP 주소                         |
| cpu_time_ms       | bigint       | 문 실행을 위해 Backend가 사용한 누적 CPU 시간(밀리초 단위) |
| sql_hash          | varchar(128) | 문의 해시 값                                  |
| sql_digest        | varchar(128) | 문의 다이제스트(서명)                          |
| peak_memory_bytes | bigint       | 문 실행 중 Backend의 최대 메모리 사용량  |
| workload_group    | text         | 문 실행에 사용된 Workload Group                  |
| compute_group                 | string    | 스토리지와 컴퓨팅이 분리된 모드에서 문 실행에 사용된 컴퓨팅 그룹. 3.0 버전부터 지원됩니다.|
| stmt              | text         | 문 텍스트                                               |


## 설명 {#description}

- `client_ip`: 프록시 서비스를 사용하면서 IP 전달을 활성화하지 않은 경우, 실제 클라이언트 IP 대신 프록시 서비스의 IP가 여기에 기록될 수 있습니다.
- `state`: `EOF`는 쿼리가 성공적으로 실행되었음을 나타냅니다. `OK`는 DDL 및 DML 문이 성공적으로 실행되었음을 나타냅니다. `ERR`는 문 실행에 실패했음을 나타냅니다.
- `scan_bytes`: BE가 처리한 데이터의 크기를 나타냅니다. Doris의 내부 페이지 캐시에서 읽은 데이터를 포함하여 디스크에서 읽은 데이터의 압축되지 않은 크기를 나타내며, 쿼리가 처리해야 하는 실제 데이터의 양을 반영합니다. 이 값은 `scan_bytes_from_local_storage` + `scan_bytes_from_remote_storage`와 같지 않습니다.
- `scan_rows`: 쿼리 실행 중 스캔한 행 수를 나타냅니다. Doris는 컬럼 기반 스토리지 데이터베이스이므로 먼저 조건자 필터가 있는 컬럼을 스캔한 다음, 필터링 결과를 바탕으로 다른 컬럼을 스캔합니다. 따라서 컬럼마다 실제로 스캔한 행 수가 다릅니다. 실제로 조건자 컬럼에서 스캔한 행 수는 조건자가 없는 컬럼에서 스캔한 행 수보다 많으며, 이 값은 쿼리 실행 중 조건자 컬럼에서 스캔한 행 수를 반영합니다.
- `scan_bytes_from_local_storage`: 로컬 디스크에서 읽은 데이터의 압축 전 크기를 나타냅니다. Doris의 페이지 캐시에서 읽은 데이터는 집계하지 않지만, 운영 체제의 페이지 캐시에서 읽은 데이터는 이 통계에 포함됩니다.
- `scan_bytes_from_remote_storage`: 원격 스토리지에서 읽은 데이터의 압축 전 크기를 나타냅니다.
