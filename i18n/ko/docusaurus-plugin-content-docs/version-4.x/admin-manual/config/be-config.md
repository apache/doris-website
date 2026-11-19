---
{
    "title": "BE 구성",
    "language": "ko",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "이 문서에서는 BE의 관련 구성 항목을 주로 소개합니다."
}
---

# BE 구성 {#be-configuration}

이 문서에서는 BE의 관련 구성 항목을 주로 소개합니다.

BE 구성 파일 `be.conf`는 일반적으로 BE 배포 경로의 `conf/` 디렉터리에 저장됩니다. 0.14 버전에서는 또 다른 구성 파일 `be_custom.conf`가 도입됩니다. 이 구성 파일은 실행 중 사용자가 동적으로 구성하고 영구 저장한 구성 항목을 기록하는 데 사용됩니다.

BE 프로세스가 시작되면 먼저 `be.conf`의 구성 항목을 읽은 다음 `be_custom.conf`의 구성 항목을 읽습니다. `be_custom.conf`의 구성 항목은 `be.conf`의 동일한 구성 항목을 덮어씁니다.

`be_custom.conf` 파일의 위치는 `be.conf`의 `custom_config_dir` 구성 항목으로 설정할 수 있습니다.

## 구성 항목 보기 {#view-configuration-items}

BE의 구성 항목을 확인하는 방법은 두 가지입니다.

1. BE 웹 페이지

    사용자는 다음 BE 웹 페이지에 접속하여 현재 구성 항목을 확인할 수 있습니다.

    `http://be_host:be_webserver_port/varz`

2. 명령으로 보기

   다음 명령을 사용하여 MySQL 클라이언트에서 BE의 구성 항목을 확인할 수 있습니다. 구체적인 문법은 [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG)를 참조하세요.

    `SHOW BACKEND CONFIG;`

    결과 열의 의미는 다음과 같습니다.

    1. BackendId: backend의 ID입니다.
    2. Host: backend의 IP입니다.
    3. Key: 구성 항목의 이름입니다.
    4. Value: 현재 구성 항목의 값입니다.
    5. Type: 구성 항목 값의 유형입니다(예: 정수 또는 문자열).
    6. IsMutable: 동적으로 구성할 수 있는지 여부입니다. true이면 실행 중에 구성 항목을 동적으로 구성할 수 있습니다. false이면 `be.conf`에서만 구성할 수 있으며 BE를 다시 시작한 후 적용됩니다.

## 구성 항목 설정 {#set-configuration-items}

BE 구성 항목을 구성하는 방법은 두 가지입니다.

1. 정적 구성

   `conf/be.conf` 파일에 구성 항목을 추가하고 설정합니다. `be.conf`의 구성 항목은 BE가 시작될 때 읽힙니다. `be.conf`에 없는 구성 항목은 기본값을 사용합니다.

2. 동적 구성

   BE가 시작된 후 다음 명령으로 구성 항목을 동적으로 설정할 수 있습니다.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}
    ```

   0.13 이하 버전에서는 이 방법으로 수정한 구성 항목이 BE 프로세스를 다시 시작하면 무효화됩니다. 0.14 이상 버전에서는 다음 명령으로 수정한 구성을 영구 저장할 수 있습니다. 수정된 구성 항목은 `be_custom.conf` 파일에 저장됩니다.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}\&persist=true
    ```

## 예시 {#examples}

1. `max_base_compaction_threads` 정적으로 수정

   `conf/be.conf` 파일에 다음을 추가합니다.

   ```max_base_compaction_threads=5```

   그런 다음 BE 프로세스를 다시 시작해야 구성이 적용됩니다.

2. `streaming_load_max_mb` 동적으로 수정

   BE가 시작된 후 다음 명령으로 `streaming_load_max_mb` 구성 항목을 동적으로 설정합니다.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024
    ```

   다음과 같은 반환 값이 나오면 설정이 성공한 것입니다.

    ```
    {
        "status": "OK",
        "msg": ""
    }
    ```

   BE를 다시 시작하면 구성이 무효화됩니다. 수정 결과를 영구 저장하려면 다음 명령을 사용합니다.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024\&persist=true
    ```

## 구성 항목 {#configurations}

### 서비스 {#services}

#### `deploy_mode` {#deploy_mode}

* 유형: string
* 설명: BE가 실행되는 모드입니다. `cloud`는 스토리지와 컴퓨팅이 분리된 모드를 의미합니다.
* 기본값: ""

#### `bvar_max_dump_multi_dimension_metric_num` {#bvar_max_dump_multi_dimension_metric_num}

* 유형: string
* 설명: 4.1.5 버전부터 지원됩니다. `/brpc_metrics`로 내보내는 다차원 bvar 메트릭 샘플의 최대 개수입니다. `0`으로 설정하면 이러한 샘플 내보내기를 비활성화합니다. 변경하려면 BE를 다시 시작해야 합니다.
* 기본값: 5000

#### `be_port` {#be_port}

* 유형: int32
* 설명: FE의 요청을 수신하는 BE의 thrift 서버 포트입니다.
* 기본값: 9060

#### `heartbeat_service_port` {#heartbeat_service_port}

* 유형: int32
* 설명: FE의 heartbeat를 수신하는 BE의 heartbeat 서비스 포트(thrift)입니다.
* 기본값: 9050

#### `webserver_port` {#webserver_port}

* 유형: int32
* 설명: BE의 http 서버 서비스 포트입니다.
* 기본값: 8040

#### `brpc_port` {#brpc_port}

* 유형: int32
* 설명: BE 간 통신에 사용하는 BE의 BRPC 포트입니다.
* 기본값: 8060

#### `arrow_flight_sql_port` {#arrow_flight_sql_port}

* 유형: int32
* 설명: Arrow Flight Client와 BE 간 통신에 사용하는 BE의 Arrow Flight SQL 서버 포트입니다.
* 기본값: -1

#### `enable_https` {#enable_https}

* 유형: bool
* 설명: https를 지원할지 여부입니다. 지원하려면 be.conf에서 `ssl_certificate_path`와 `ssl_private_key_path`를 구성해야 합니다.
* 기본값: false

#### `priority_networks` {#priority_networks}

* 설명: 여러 IP를 가진 서버의 선택 전략을 선언합니다. 이 목록과 일치하는 IP는 최대 하나여야 합니다. CIDR 표기법을 사용하는 세미콜론으로 구분된 목록이며, 예를 들어 10.10.10.0/24와 같습니다. 이 규칙과 일치하는 IP가 없으면 하나를 무작위로 선택합니다.
* 기본값: 비어 있음

#### `storage_root_path` {#storage_root_path}

* 유형: string

* 설명: 데이터 루트 경로입니다. 경로는 `;`로 구분합니다. 각 루트 경로의 스토리지 미디어를 HDD 또는 SSD로 지정할 수 있습니다. 각 루트 경로 끝에 용량 제한을 추가할 수 있으며 `,`로 구분합니다. SSD와 HDD를 혼합하여 사용하지 않는 경우 아래 예시 1과 예시 2의 구성 방법을 사용할 필요 없이 스토리지 디렉터리만 지정하면 됩니다. FE의 기본 스토리지 미디어 구성도 수정할 필요가 없습니다.

  예시 1: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

    - 1. `/home/disk1/doris.HDD`: 스토리지 미디어가 HDD임을 나타냅니다.
    - 2. `/home/disk2/doris.SSD`: 스토리지 미디어가 SSD임을 나타냅니다.
    - 3. `/home/disk2/doris`: 스토리지 미디어는 기본적으로 HDD입니다.

  예시 2: `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

    - 1. `/home/disk1/doris,medium:hdd`: 스토리지 미디어가 HDD임을 나타냅니다.
    - 2. `/home/disk2/doris,medium:ssd`: 스토리지 미디어가 SSD임을 나타냅니다.

* 기본값: ${DORIS_HOME}/storage

#### `heartbeat_service_thread_count` {#heartbeat_service_thread_count}

* 유형: int32
* 설명: BE에서 heartbeat 서비스를 실행하는 스레드 수입니다. 기본값은 1이며 변경하지 않는 것이 좋습니다.
* 기본값: 1

#### `ignore_broken_disk` {#ignore_broken_disk}

* 유형: bool
* 설명: BE가 시작될 때 ``storage_root_path`` 구성 아래의 모든 경로를 검사합니다.

    - `ignore_broken_disk=true`

  경로가 존재하지 않거나 경로 아래의 파일을 읽거나 쓸 수 없으면(불량 디스크) 해당 경로를 무시합니다. 사용 가능한 다른 경로가 있으면 시작을 중단하지 않습니다.

    - `ignore_broken_disk=false`

  경로가 존재하지 않거나 경로 아래의 파일을 읽거나 쓸 수 없으면(불량 디스크) 시작이 중단되고 프로세스가 종료됩니다.

* 기본값: false

#### `mem_limit` {#mem_limit}

* 유형: string
* 설명: BE 프로세스가 사용하는 서버 최대 메모리의 비율을 제한합니다. BE 메모리가 시스템 메모리를 과도하게 점유하지 않도록 하는 데 사용됩니다. 이 매개변수는 0보다 커야 합니다. 비율이 100%보다 크면 값은 100%로 설정됩니다.
* 기본값: 90%

#### `cluster_id` {#cluster_id}

* 유형: int32
* 설명: BE가 속한 클러스터 ID를 구성합니다.
    - 이 값은 일반적으로 FE가 heartbeat를 통해 BE에 전달하므로 구성할 필요가 없습니다. BE가 특정 Doris 클러스터에 속하는 것이 확실한 경우 구성할 수 있습니다. 데이터 디렉터리의 cluster_id 파일도 수정하여 이 매개변수와 동일하게 해야 합니다.
* 기본값: -1

#### `custom_config_dir` {#custom_config_dir}

* 설명: `be_custom.conf` 파일의 위치를 구성합니다. 기본값은 `conf/` 디렉터리입니다.
    - 일부 배포 환경에서는 시스템 업그레이드로 인해 `conf/` 디렉터리가 덮어써질 수 있습니다. 그러면 사용자가 수정한 구성 항목도 덮어써집니다. 이때 `be_custom.conf`를 다른 지정 디렉터리에 저장하여 구성 파일이 덮어써지지 않도록 할 수 있습니다.
* 기본값: 비어 있음

#### `trash_file_expire_time_sec` {#trash_file_expire_time_sec}

* 설명: 휴지통을 정리하는 간격은 24시간입니다. 디스크 공간이 부족하면 trash 아래 파일의 보존 기간이 이 매개변수를 따르지 않을 수 있습니다.
* 기본값: 86400

#### `es_http_timeout_ms` {#es_http_timeout_ms}

* 설명: http를 통해 ES에 연결할 때의 제한 시간입니다.
* 기본값: 5000 (ms)

#### `es_scroll_keepalive` {#es_scroll_keepalive}

* 설명: es scroll keep-alive 유지 시간입니다.
* 기본값: 5 (m)

#### `external_table_connect_timeout_sec` {#external_table_connect_timeout_sec}

* 유형: int32
* 설명: ODBC 테이블과 같은 외부 테이블에 연결할 때의 제한 시간입니다.
* 기본값: 5초

#### `pipeline_status_report_interval` {#pipeline_status_report_interval}

* 설명: 프로필 보고서 사이의 간격입니다.
* 기본값: 5초

#### `brpc_max_body_size` {#brpc_max_body_size}

* 설명: 이 구성은 주로 brpc의 `max_body_size` 매개변수를 수정하는 데 사용됩니다.

  - 때때로 쿼리가 실패하고 BE 로그에 `body_size is too large`라는 오류 메시지가 나타납니다. SQL 모드가 "multi distinct + no group by + more than 1T of data"일 때 발생할 수 있습니다. 이 오류는 brpc 패킷 크기가 구성된 값을 초과했음을 의미합니다. 이때 구성을 늘리면 오류를 피할 수 있습니다.

#### `brpc_socket_max_unwritten_bytes` {#brpc_socket_max_unwritten_bytes}

* 설명: 이 구성은 주로 brpc의 `socket_max_unwritten_bytes` 매개변수를 수정하는 데 사용됩니다.
  - 때때로 쿼리가 실패하고 BE 로그에 `The server is overcrowded`라는 오류 메시지가 나타납니다. 이는 송신 측에서 버퍼링해야 할 메시지가 너무 많다는 뜻이며, SQL에서 큰 bitmap 값을 전송해야 할 때 발생할 수 있습니다. 구성을 늘리면 이 오류를 피할 수 있습니다.

#### `transfer_large_data_by_brpc` {#transfer_large_data_by_brpc}

* 유형: bool
* 설명: Tuple/Block 데이터의 길이가 1.8G보다 클 때 protoBuf 요청을 직렬화하고 Tuple/Block 데이터를 controller attachment에 포함하여 http brpc로 전송할지 제어합니다. protoBuf 요청 길이가 2G를 초과할 때 발생하는 `Bad request, error_text=[E1003]Fail to compress request` 오류를 피하기 위한 것입니다. 이전 버전에서는 Tuple/Block 데이터를 attachment에 넣은 후 기본 baidu_std brpc로 전송했지만 attachment가 2G를 초과하면 잘렸습니다. http brpc로 전송할 때는 2G 제한이 없습니다.
* 기본값: true

#### `brpc_num_threads` {#brpc_num_threads}

* 설명: 이 구성은 주로 brpc의 bthread 수를 수정하는 데 사용됩니다. 기본값은 256입니다.
  - 사용자는 이 값을 늘려 더 나은 QPS 성능을 얻을 수 있습니다. 자세한 내용은 `https://github.com/apache/incubator-brpc/blob/master/docs/cn/benchmark.md`를 참조하세요.
* 기본값: 256

#### `thrift_rpc_timeout_ms` {#thrift_rpc_timeout_ms}

* 설명: thrift 기본 제한 시간입니다.
* 기본값: 60000

#### `thrift_client_retry_interval_ms` {#thrift_client_retry_interval_ms}

* 유형: int64
* 설명: FE thrift 서버의 avalanche 장애를 방지하기 위해 BE의 thrift 클라이언트 재시도 간격을 설정합니다. 단위는 ms입니다.
* 기본값: 1000

#### `thrift_connect_timeout_seconds` {#thrift_connect_timeout_seconds}

* 설명: 기본 thrift 클라이언트 연결 제한 시간입니다.
* 기본값: 3 (s)

#### `thrift_server_type_of_fe` {#thrift_server_type_of_fe}

* 유형: string
* 설명: 이 구성은 FE의 Thrift 서비스에서 사용하는 서비스 모델을 나타냅니다. 유형은 string이며 대소문자를 구분하지 않습니다. 이 매개변수는 FE의 `thrift_server_type` 매개변수 설정과 일치해야 합니다. 현재 가능한 값은 `THREADED`와 `THREAD_POOL` 두 가지입니다.

    - 매개변수가 `THREADED`이면 비차단 I/O 모델입니다.

    - 매개변수가 `THREAD_POOL`이면 차단 I/O 모델입니다.

#### `thrift_max_message_size` {#thrift_max_message_size}

기본값: 100MB

Thrift 서버가 수신하는 메시지의 최대 크기(바이트)입니다. 클라이언트가 보내는 메시지가 이 제한을 초과하면 Thrift 서버는 요청을 거부하고 연결을 닫습니다. 그 결과 클라이언트에는 "connection has been closed by peer." 오류가 발생합니다. 이 경우 이 매개변수를 늘려 볼 수 있습니다.

#### `txn_commit_rpc_timeout_ms` {#txn_commit_rpc_timeout_ms}

* 설명: txn 제출 RPC 제한 시간입니다.
* 기본값: 60,000 (ms)

#### `txn_map_shard_size` {#txn_map_shard_size}

* 설명: txn_map_lock 조각 크기입니다. 값은 2^n이며 n=0,1,2,3,4입니다. txn 관리 성능을 향상하기 위한 기능입니다.
* 기본값: 128

#### `txn_shard_size` {#txn_shard_size}

* 설명: txn_lock 샤드 크기입니다. 값은 2^n이며 n=0,1,2,3,4입니다. txn 제출 및 게시 성능을 향상하기 위한 기능입니다.
* 기본값: 1024

#### `unused_rowset_monitor_interval` {#unused_rowset_monitor_interval}

* 설명: 만료된 Rowset을 정리하는 시간 간격입니다.
* 기본값: 30 (s)

#### `max_client_cache_size_per_host` {#max_client_cache_size_per_host}

* 설명: 호스트별 최대 클라이언트 캐시 수입니다. BE에는 여러 클라이언트 캐시가 있지만 현재는 동일한 캐시 크기 구성을 사용합니다. 필요한 경우 서로 다른 구성을 사용하여 클라이언트 캐시를 각각 설정할 수 있습니다.
* 기본값: 10

#### `string_type_length_soft_limit_bytes` {#string_type_length_soft_limit_bytes}

* 유형: int32
* 설명: String 유형의 최대 길이에 대한 소프트 제한입니다.
* 기본값: 1,048,576

#### `big_column_size_buffer` {#big_column_size_buffer}

* 유형: int64
* 설명: ODBC 외부 테이블을 사용할 때 ODBC 원본 테이블의 열 유형이 HLL, CHAR 또는 VARCHAR이고 열 값의 길이가 이 값을 초과하면 쿼리에서 'column value length longer than buffer length' 오류를 보고합니다. 이 값을 늘릴 수 있습니다.
* 기본값: 65535

#### `small_column_size_buffer` {#small_column_size_buffer}

* 유형: int64
* 설명: ODBC 외부 테이블을 사용할 때 ODBC 원본 테이블의 열 유형이 HLL, CHAR 또는 VARCHAR가 아니고 열 값의 길이가 이 값을 초과하면 쿼리에서 'column value length longer than buffer length' 오류를 보고합니다. 이 값을 늘릴 수 있습니다.
* 기본값: 100

### 쿼리 {#query}

#### `ignore_not_found_file_in_external_table` {#ignore_not_found_file_in_external_table}

* 유형: bool
* 설명: 외부 테이블 리더가 누락된 파일을 건너뛸 수 있는지 여부입니다. 동적 구성을 지원합니다. 4.1.5 버전부터 커밋된 Iceberg 스냅샷의 데이터 파일이나 삭제 파일 누락은 허용되지 않습니다. 값이 `true`여도 쿼리가 실패하여 불완전한 스냅샷을 조용히 반환하지 않습니다.
* 기본값: true

#### `parquet_metadata_size_limit` {#parquet_metadata_size_limit}

* 유형: int64
* 설명: 4.1.5 버전부터 지원됩니다. 네이티브 Parquet V2 리더에서 직렬화된 파일 footer 메타데이터의 최대 크기(바이트)입니다. `0`보다 커야 합니다. 초과하면 `Parquet v2 footer size ... exceeds metadata limit ...`를 반환합니다. 동적 구성을 지원합니다. footer가 큰 유효한 파일의 경우 메모리 예산 내에서 값을 늘릴 수 있습니다.
* 기본값: 268435456 (256 MiB)

#### `fragment_mgr_asynic_work_pool_queue_size` {#fragment_mgr_asynic_work_pool_queue_size}

* 설명: 단일 노드에서 처리할 수 있는 비동기 작업의 상한입니다.
* 기본값: 4096

#### `fragment_mgr_asynic_work_pool_thread_num_min` {#fragment_mgr_asynic_work_pool_thread_num_min}

* 설명: 비동기 작업을 실행할 스레드 수입니다. 기본 최소 스레드 수는 16입니다.
* 기본값: 16

#### `fragment_mgr_asynic_work_pool_thread_num_max` {#fragment_mgr_asynic_work_pool_thread_num_max}

* 설명: 후속 비동기 작업에 따라 스레드를 동적으로 생성하며 최대 512개의 스레드를 생성합니다.
* 기본값: 512

#### `doris_scanner_row_num` {#doris_scanner_row_num}

* 설명: 단일 실행에서 각 스캔 스레드가 반환하는 데이터 행의 최대 수입니다.
* 기본값: 16384

#### `doris_scanner_row_bytes` {#doris_scanner_row_bytes}

* 설명: 단일 읽기 실행 프래그먼트의 행 바이트 수입니다.
    - 참고: 테이블에 열이 너무 많아 `select *`가 멈추면 이 구성을 조정할 수 있습니다.
* 기본값: 10485760

#### `doris_scanner_thread_pool_queue_size` {#doris_scanner_thread_pool_queue_size}

* 유형: int32
* 설명: Scanner 스레드 풀의 큐 길이입니다. Doris의 스캔 작업에서는 각 Scanner가 스레드 작업으로 스레드 풀에 제출되어 스케줄링을 기다립니다. 제출된 작업 수가 스레드 풀 큐 길이를 초과하면 큐에 빈 슬롯이 생길 때까지 이후 작업 제출이 차단됩니다.
* 기본값: 102400

#### `doris_scanner_thread_pool_thread_num` {#doris_scanner_thread_pool_thread_num}

* 유형: int32
* 설명: Scanner 스레드 풀의 스레드 수입니다. Doris의 스캔 작업에서는 각 Scanner가 스레드 작업으로 스레드 풀에 제출되어 스케줄링을 기다립니다. 이 매개변수가 Scanner 스레드 풀의 크기를 결정합니다.
* 기본값: CPU 코어 수에 따라 다름. `max(48, 2 * num_of_cpu_cores)`와 같음

#### `doris_max_remote_scanner_thread_pool_thread_num` {#doris_max_remote_scanner_thread_pool_thread_num}

* 유형: int32
* 설명: Remote scanner 스레드 풀의 최대 스레드 수입니다. Remote scanner 스레드 풀은 모든 외부 데이터 소스의 스캔 작업에 사용됩니다.
* 기본값: 512

#### `exchg_node_buffer_size_bytes` {#exchg_node_buffer_size_bytes}

* 유형: int32
* 설명: ExchangeNode 노드의 Buffer 큐 크기(바이트)입니다. Sender 측에서 전송한 데이터 양이 ExchangeNode의 Buffer 크기보다 커지면 Buffer에 쓸 공간이 생길 때까지 이후 데이터 전송이 차단됩니다.
* 기본값: 10485760

#### `doris_scan_range_max_mb` {#doris_scan_range_max_mb}

* 유형: int32
* 설명: 각 OlapScanner가 읽는 최대 데이터 양입니다.
* 기본값: 1024

### compaction {#compaction}

#### `disable_auto_compaction` {#disable_auto_compaction}

* 유형: bool
* 설명: 자동 compaction 작업을 비활성화할지 여부입니다.
  - 일반적으로 꺼 두어야 합니다. 디버깅 또는 테스트 환경에서 compaction 작업을 수동으로 수행하려면 이 구성을 켤 수 있습니다.
* 기본값: false

#### `enable_vertical_compaction` {#enable_vertical_compaction}

* 유형: bool
* 설명: vertical compaction을 활성화할지 여부입니다.
* 기본값: true

#### `vertical_compaction_num_columns_per_group` {#vertical_compaction_num_columns_per_group}

* 유형: int32
* 설명: vertical compaction에서 각 그룹의 열 수입니다.
* 기본값: 5

#### `vertical_compaction_max_row_source_memory_mb` {#vertical_compaction_max_row_source_memory_mb}

* 유형: int32
* 설명: vertical compaction에서 row_source_buffer의 최대 메모리 사용량입니다. 단위는 MB입니다.
* 기본값: 200

#### `vertical_compaction_max_segment_size` {#vertical_compaction_max_segment_size}

* 유형: int32
* 설명: vertical compaction에서 대상 segment 파일의 최대 크기입니다. 단위는 m 바이트입니다.
* 기본값: 268435456

#### `enable_ordered_data_compaction` {#enable_ordered_data_compaction}

* 유형: bool
* 설명: ordered data compaction을 활성화할지 여부입니다.
* 기본값: true

#### `ordered_data_compaction_min_segment_size` {#ordered_data_compaction_min_segment_size}

* 유형: int32
* 설명: ordered data compaction에서 입력 rowset의 최소 segment 크기입니다. 단위는 m 바이트입니다.
* 기본값: 10485760

#### `max_base_compaction_threads` {#max_base_compaction_threads}

* 유형: int32
* 설명: base compaction 스레드 풀의 최대 스레드 수입니다. -1은 디스크당 하나의 스레드를 의미합니다.
* 기본값: 4

#### `generate_compaction_tasks_interval_ms` {#generate_compaction_tasks_interval_ms}

* 설명: compaction 작업을 생성하는 최소 간격(ms)입니다.
* 기본값: 10 (ms)

#### `base_compaction_min_rowset_num` {#base_compaction_min_rowset_num}

* 설명: BaseCompaction의 트리거 조건 중 하나입니다. 도달해야 하는 Cumulative 파일 수의 제한입니다. 이 제한에 도달하면 BaseCompaction이 트리거됩니다.
* 기본값: 5

#### `base_compaction_min_data_ratio` {#base_compaction_min_data_ratio}

* 설명: BaseCompaction의 트리거 조건 중 하나입니다. Cumulative 파일 크기가 Base 파일에서 차지하는 비율입니다.
* 기본값: 0.3 (30%)

#### `total_permits_for_compaction_score` {#total_permits_for_compaction_score}

* 유형: int64
* 설명: 모든 compaction 작업이 보유할 수 있는 "permits"의 상한입니다. compaction의 메모리 사용량을 제한하는 데 사용할 수 있습니다.
* 기본값: 10000
* 동적 수정 가능: 예

#### `compaction_promotion_size_mbytes` {#compaction_promotion_size_mbytes}

* 유형: int64
* 설명: cumulative compaction 출력 rowset의 총 디스크 크기가 이 구성 크기를 초과하면 해당 rowset을 base compaction에 사용합니다. 단위는 m 바이트입니다.
  - 일반적으로 구성을 2G 이하로 설정하여 cumulative compaction 시간이 너무 길어져 버전이 누적되는 것을 방지합니다.
* 기본값: 1024

#### `compaction_promotion_ratio` {#compaction_promotion_ratio}

* 유형: double
* 설명: cumulative compaction 출력 rowset의 총 디스크 크기가 base 버전 rowset에 대한 구성 비율을 초과하면 해당 rowset을 base compaction에 사용합니다.
  - 일반적으로 0.1보다 높지 않고 0.02보다 낮지 않게 구성하는 것이 좋습니다.
* 기본값: 0.05

#### `compaction_promotion_min_size_mbytes` {#compaction_promotion_min_size_mbytes}

* 유형: int64
* 설명: cumulative compaction 출력 rowset의 총 디스크 크기가 이 구성 크기보다 작으면 rowset은 base compaction을 수행하지 않고 cumulative compaction 프로세스에 남습니다. 단위는 m 바이트입니다.
  - 일반적으로 512m 이내로 설정합니다. 너무 크게 설정하면 초기 base 버전의 크기가 너무 작아져 base compaction이 수행되지 않습니다.
* 기본값: 128

#### `compaction_min_size_mbytes` {#compaction_min_size_mbytes}

* 유형: int64
* 설명: cumulative compaction에서 병합할 때 선택된 rowset의 디스크 크기가 이 구성보다 크면 level 정책에 따라 나누어 병합합니다. 이 구성보다 작으면 직접 병합합니다. 단위는 m 바이트입니다.
  - 일반적으로 128m 이내로 설정합니다. 너무 크게 설정하면 cumulative compaction의 쓰기 증폭이 증가합니다.
* 기본값: 64

#### `default_rowset_type` {#default_rowset_type}

* 유형: string
* 설명: BE가 기본적으로 선택하는 스토리지 형식을 식별합니다. 구성 가능한 매개변수는 "**ALPHA**", "**BETA**"입니다. 주로 다음 두 가지 역할을 합니다.
  - 테이블의 storage_format이 Default로 설정되면 이 구성으로 BE의 스토리지 형식을 선택합니다.
  - BE가 Compaction을 수행할 때 스토리지 형식을 선택합니다.
* 기본값: BETA

#### `cumulative_compaction_min_deltas` {#cumulative_compaction_min_deltas}

* 설명: cumulative compaction 전략의 최소 증분 파일 수입니다.
* 기본값: 5

#### `cumulative_compaction_max_deltas` {#cumulative_compaction_max_deltas}

* 설명: cumulative compaction 전략의 최대 증분 파일 수입니다.
* 기본값: 1000

#### `base_compaction_trace_threshold` {#base_compaction_trace_threshold}

* 유형: int32
* 설명: base compaction의 trace 정보를 기록하는 임계값(초)입니다.
* 기본값: 10

Base compaction은 시간이 오래 걸리는 백그라운드 작업입니다. 이 구성은 trace 정보를 기록하는 임계값입니다. 로그 파일의 trace 정보 예시는 다음과 같습니다.

```
W0610 11:26:33.804431 56452 storage_engine.cpp:552] execute base compaction cost 0.00319222
BaseCompaction:546859:
  - filtered_rows: 0
   - input_row_num: 10
   - input_rowsets_count: 10
   - input_rowsets_data_size: 2.17 KB
   - input_segments_num: 10
   - merge_rowsets_latency: 100000.510ms
   - merged_rows: 0
   - output_row_num: 10
   - output_rowset_data_size: 224.00 B
   - output_segments_num: 1
0610 11:23:03.727535 (+     0us) storage_engine.cpp:554] start to perform base compaction
0610 11:23:03.728961 (+  1426us) storage_engine.cpp:560] found best tablet 546859
0610 11:23:03.728963 (+     2us) base_compaction.cpp:40] got base compaction lock
0610 11:23:03.729029 (+    66us) base_compaction.cpp:44] rowsets picked
0610 11:24:51.784439 (+108055410us) compaction.cpp:46] got concurrency lock and start to do compaction
0610 11:24:51.784818 (+   379us) compaction.cpp:74] prepare finished
0610 11:26:33.359265 (+101574447us) compaction.cpp:87] merge rowsets finished
0610 11:26:33.484481 (+125216us) compaction.cpp:102] output rowset built
0610 11:26:33.484482 (+     1us) compaction.cpp:106] check correctness finished
0610 11:26:33.513197 (+ 28715us) compaction.cpp:110] modify rowsets finished
0610 11:26:33.513300 (+   103us) base_compaction.cpp:49] compaction finished
0610 11:26:33.513441 (+   141us) base_compaction.cpp:56] unused rowsets have been moved to GC queue
```

#### `cumulative_compaction_trace_threshold` {#cumulative_compaction_trace_threshold}

* 유형: int32
* 설명: cumulative compaction의 trace 정보를 기록하는 임계값(초)입니다.
  - `base_compaction_trace_threshold`와 유사합니다.
* 기본값: 2

#### `compaction_task_num_per_disk` {#compaction_task_num_per_disk}

* 유형: int32
* 설명: 디스크(HDD) 하나에서 병렬로 실행되는 compaction 작업 수입니다.
* 기본값: 4

#### `compaction_task_num_per_fast_disk` {#compaction_task_num_per_fast_disk}

* 유형: int32
* 설명: 고속 디스크(SSD) 하나에서 병렬로 실행되는 compaction 작업 수입니다.
* 기본값: 8

#### `cumulative_compaction_rounds_for_each_base_compaction_round` {#cumulative_compaction_rounds_for_each_base_compaction_round}

* 유형: int32
* 설명: compaction 작업 생성 시 base compaction 한 라운드마다 수행할 cumulative compaction 라운드 수입니다.
* 기본값: 9

#### `max_cumu_compaction_threads` {#max_cumu_compaction_threads}

* 유형: int32
* 설명: cumulative compaction 스레드 풀의 최대 스레드 수입니다. -1은 디스크당 하나의 스레드를 의미합니다.
* 기본값: -1

#### `enable_segcompaction` {#enable_segcompaction}

* 유형: bool
* 설명: 로드 중 segment compaction을 사용하여 -238 오류를 방지할지 여부입니다.
* 기본값: true

#### `segcompaction_batch_size` {#segcompaction_batch_size}

* 유형: int32
* 설명: segment 수가 이 임계값을 초과하면 segment compaction이 트리거됩니다. 이 구성은 하나의 segment compaction 작업에서 처리하는 원시 segment의 최대 수도 제한합니다.
* 기본값: 10

#### `segcompaction_candidate_max_rows` {#segcompaction_candidate_max_rows}

* 유형: int32
* 설명: 하나의 원본 segment에서 허용되는 최대 행 수입니다. 더 큰 segment는 건너뜁니다.
* 기본값: 1048576

#### `segcompaction_candidate_max_bytes` {#segcompaction_candidate_max_bytes}

* 유형: int64
* 설명: 하나의 원본 segment에서 허용되는 최대 파일 크기입니다. 더 큰 segment는 건너뜁니다.
* 기본값: 104857600

#### `segcompaction_task_max_rows` {#segcompaction_task_max_rows}

* 유형: int32
* 설명: 하나의 segcompaction 작업에서 허용되는 최대 총 행 수입니다.
* 기본값: 1572864

#### `segcompaction_task_max_bytes` {#segcompaction_task_max_bytes}

* 유형: int64
* 설명: 하나의 segcompaction 작업에서 허용되는 최대 총 파일 크기입니다.
* 기본값: 157286400

#### `segcompaction_num_threads` {#segcompaction_num_threads}

* 유형: int32
* 설명: 전역 segcompaction 스레드 풀 크기입니다.
* 기본값: 5

#### `disable_compaction_trace_log` {#disable_compaction_trace_log}

* 유형: bool
* 설명: compaction의 trace 로그를 비활성화합니다.
  - true로 설정하면 `cumulative_compaction_trace_threshold`와 `base_compaction_trace_threshold`가 작동하지 않고 로그가 비활성화됩니다.
* 기본값: true

#### `pick_rowset_to_compact_interval_sec` {#pick_rowset_to_compact_interval_sec}

* 유형: int64
* 설명: rowset을 선택하여 compaction하는 시간 간격(초)입니다.
* 기본값: 86400

#### `update_replica_infos_interval_seconds` {#update_replica_infos_interval_seconds}

* 설명: peer replica 정보를 업데이트하는 최소 간격(s)입니다.
* 기본값: 60 (s)

#### `cold_data_compaction_score_threshold` {#cold_data_compaction_score_threshold}

* 유형: int32
* 설명: 이 구성은 compaction을 트리거하기 전에 콜드 데이터에 필요한 최소 compaction score 임계값을 지정합니다. 콜드 데이터의 compaction score가 이 임계값을 초과하면 compaction을 고려합니다. 이 값을 조정하면 원격 스토리지의 콜드 데이터에 대한 compaction 빈도와 공격성을 제어할 수 있습니다. 3.1.3 버전부터 지원됩니다.
* 기본값: 100

#### `cold_data_compaction_thread_num` {#cold_data_compaction_thread_num}

* 유형: int32
* 설명: 콜드 데이터 compaction에 사용하는 스레드 수입니다. 콜드 데이터 compaction 작업의 병렬 처리 수준을 제어합니다. 값을 늘리면 더 많은 작업을 동시에 실행할 수 있어 처리량이 향상될 수 있지만 리소스 사용량도 증가합니다.
* 기본값: 2

#### `cold_data_compaction_interval_sec` {#cold_data_compaction_interval_sec}

* 유형: int32
* 설명: 콜드 데이터 compaction을 트리거하는 간격(초)입니다. 간격이 짧으면 더 자주 compaction을 고려하여 정리가 빨라질 수 있지만 리소스 사용량이 증가할 수 있습니다.
* 기본값: 1800 (seconds)

#### `enable_compaction_pause_on_high_memory` {#enable_compaction_pause_on_high_memory}

* 유형: bool
* 설명: 프로세스 메모리 사용량이 높을 때 compaction 작업을 일시 중지할지 여부입니다. 동적 수정을 지원합니다.
  - 활성화하면 메모리 압박이 있는 동안 BE가 compaction을 일시 중지하여 쿼리와 로드를 우선 처리합니다.
  - 그러나 compaction을 일시 중지하면 compaction score가 높은 tablet을 병합하기가 더 어려워져 완화하려던 메타데이터와 메모리 누적이 심해집니다. **4.0.8 버전부터 기본값이 `true`에서 `false`로 변경**되어 기본적으로 높은 메모리 사용량 때문에 compaction이 일시 중지되지 않습니다.
  - 이전 동작을 유지하려면 `true`로 설정하세요.
* 기본값: false (4.0.8 이전에는 true)

### 로드 {#load}

#### `request_cdc_client_timeout_ms` {#request_cdc_client_timeout_ms}

* 유형: int32
* 설명: CDC 클라이언트 요청 제한 시간(밀리초)입니다. 동적 구성을 지원합니다. 4.1.5 버전에서는 느린 CDC 요청을 허용하기 위해 기본값을 `60000`에서 `120000`으로 높였습니다.
* 기본값: 120000 (4.1.5 이전에는 60000)

#### `enable_table_memtable_flush_backpressure` {#enable_table_memtable_flush_backpressure}

* 유형: bool
* 설명: 4.1.4 버전부터 추가되었습니다. 이 BE에서 한 테이블의 MemTable이 너무 많이 flush 대기 중일 때 해당 테이블에 대한 새 쓰기를 차단할지 여부입니다. FE 구성 `enable_adaptive_random_bucket_load`와 함께 사용하여 adaptive random bucket 로드 중 MemTable이 누적되어 메모리가 증가하는 것을 방지합니다.
* 기본값: true

#### `table_memtable_flush_pending_count_limit` {#table_memtable_flush_pending_count_limit}

* 유형: int32
* 설명: 4.1.4 버전부터 추가되었습니다. 이 BE에서 하나의 테이블에 대해 flush 대기할 수 있는 MemTable의 최대 개수입니다. 제한을 초과하면 제한 아래로 떨어질 때까지 새 쓰기가 차단됩니다. `enable_table_memtable_flush_backpressure = true`일 때만 적용됩니다.
* 기본값: 10

#### `group_commit_max_wal_num_per_table` {#group_commit_max_wal_num_per_table}

* 유형: int32
* 설명: 4.1.4 버전부터 추가되었습니다. 하나의 테이블에 존재할 수 있는 Group Commit WAL 파일의 최대 개수입니다. `0`은 제한 없음을 의미합니다. WAL 재생이 계속 실패하여 WAL이 이 제한을 초과해 누적되면 해당 테이블의 `async_mode` Group Commit 로드가 `EXCEEDED_LIMIT` 오류로 거부됩니다. 오류 메시지는 `Too many group commit async WALs for table ...`와 같은 형식입니다. 이 제한은 WAL이 무제한으로 증가하여 디스크를 가득 채우는 것을 방지합니다.
* 기본값: 10

#### `enable_stream_load_record` {#enable_stream_load_record}

* 유형: bool
* 설명: stream load 기록 기능을 활성화할지 여부입니다. 기본값은 false입니다.
* 기본값: false

#### `load_data_reserve_hours` {#load_data_reserve_hours}

* 설명: mini load에 사용됩니다. mini load 데이터 파일은 이 시간이 지나면 삭제됩니다.
* 기본값: 4 (h)

#### `push_worker_count_high_priority` {#push_worker_count_high_priority}

* 설명: HIGH 우선순위 작업을 처리하는 로드 스레드 수입니다.
* 기본값: 3

#### `push_worker_count_normal_priority` {#push_worker_count_normal_priority}

* 설명: NORMAL 우선순위 작업을 처리하는 로드 스레드 수입니다.
* 기본값: 3

#### `enable_single_replica_load` {#enable_single_replica_load}

* 설명: 단일 복제본 데이터 로드 기능을 활성화할지 여부입니다.
* 기본값: true

#### `load_error_log_reserve_hours` {#load_error_log_reserve_hours}

* 설명: 로드 오류 로그는 이 시간이 지나면 삭제됩니다.
* 기본값: 48 (h)

#### `load_error_log_limit_bytes` {#load_error_log_limit_bytes}

* 설명: 이 값보다 큰 로드 오류 로그는 잘립니다.
* 기본값: 209715200 (byte)

#### `load_process_max_memory_limit_percent` {#load_process_max_memory_limit_percent}

* 설명: 단일 노드에서 모든 로드 스레드가 사용하는 메모리 상한의 비율입니다. 기본값은 50%입니다.
  - 사용자가 Doris를 업그레이드할 때 로드 성능에 영향을 주지 않도록 이 기본값은 매우 크게 설정되어 있습니다. 필요한 경우 사용자가 이러한 구성을 올바르게 설정해야 합니다.
* 기본값: 50 (%)

#### `load_process_soft_mem_limit_percent` {#load_process_soft_mem_limit_percent}

* 설명: 소프트 제한은 단일 노드의 로드 메모리 제한에 대한 비율입니다. 예를 들어 모든 로드 작업의 메모리 제한이 20GB이면 소프트 제한은 기본적으로 이 값의 50%, 즉 10GB입니다. 로드 메모리 사용량이 소프트 제한을 초과하면 메모리를 가장 많이 사용하는 작업을 선택하여 flush하고 메모리 공간을 해제합니다. 기본값은 50%입니다.
* 기본값: 50 (%)

#### `slave_replica_writer_rpc_timeout_sec` {#slave_replica_writer_rpc_timeout_sec}

* 유형: int32
* 설명: 단일 복제본 로드에 사용되는 master 복제본과 slave 복제본 간 brpc 제한 시간을 수정합니다.
* 기본값: 60

#### `max_segment_num_per_rowset` {#max_segment_num_per_rowset}

* 유형: int32
* 설명: 로드 시 새로 생성되는 rowset의 segment 수를 제한합니다. 임계값을 초과하면 로드가 -238 오류로 실패합니다. segment가 너무 많으면 compaction이 많은 메모리를 사용하여 OOM 오류가 발생할 수 있습니다.
* 기본값: 200

#### `high_priority_flush_thread_num_per_store` {#high_priority_flush_thread_num_per_store}

* 유형: int32
* 설명: 높은 우선순위 로드 작업에 할당되는 저장 경로별 flush 스레드 수입니다.
* 기본값: 1

#### `routine_load_consumer_pool_size` {#routine_load_consumer_pool_size}

* 유형: int32
* 설명: routine load에서 사용하는 데이터 consumer 캐시 수입니다.
* 기본값: 10

#### `multi_table_batch_plan_threshold` {#multi_table_batch_plan_threshold}

* 유형: int32
* 설명: 단일 스트림 다중 테이블 로드에 사용됩니다. Kafka에서 메시지 배치를 수신했을 때 배치 크기가 이 임계값보다 크면 관련된 모든 테이블의 계획을 요청합니다.
* 기본값: 200

#### `multi_table_max_wait_tables` {#multi_table_max_wait_tables}

* 유형: int32
* 설명: 단일 스트림 다중 테이블 로드에 사용됩니다. Kafka에서 메시지 배치를 수신했을 때 계획을 기다리는 테이블 수가 이 임계값보다 크면 관련된 모든 테이블의 계획을 요청합니다. 이 매개변수는 한 번에 너무 많은 계획을 요청하고 실행하는 것을 방지합니다. 로드 과정에서 여러 테이블을 소규모 배치로 처리하면 단일 RPC의 부담을 줄이고 데이터 실시간 처리 성능을 높일 수 있습니다.
* 기본값: 5

#### `single_replica_load_download_num_workers` {#single_replica_load_download_num_workers}

* 유형: int32
* 설명: segment 다운로드에 사용하는 HTTP 작업 스레드 수를 수정합니다. 단일 복제본 로드에 사용됩니다. 로드 동시성이 증가하면 이 매개변수를 조정하여 Slave 복제본이 Master 복제본에서 데이터 파일을 제때 동기화하도록 할 수 있습니다. 필요한 경우 더 나은 IO 성능을 위해 `webserver_num_workers`도 늘려야 합니다.
* 기본값: 64

#### `load_task_high_priority_threshold_second` {#load_task_high_priority_threshold_second}

* 유형: int32
* 설명: 로드 작업의 제한 시간이 이 임계값보다 작으면 Doris는 이를 높은 우선순위 작업으로 간주합니다. 높은 우선순위 작업은 별도의 flush 스레드 풀을 사용합니다.
* 기본값: 120

#### `min_load_rpc_timeout_ms` {#min_load_rpc_timeout_ms}

* 유형: int32
* 설명: 로드 작업의 각 RPC에 대한 최소 제한 시간입니다.
* 기본값: 20

#### `kafka_api_version_request` {#kafka_api_version_request}

* 유형: bool
* 설명: 종속 Kafka 버전이 0.10.0.0보다 낮으면 이 값을 false로 설정해야 합니다.
* 기본값: true

#### `kafka_broker_version_fallback` {#kafka_broker_version_fallback}

* 설명: 종속 Kafka 버전이 0.10.0.0보다 낮고 `kafka_api_version_request`가 false이면 fallback 버전 `kafka_broker_version_fallback`에 설정된 값을 사용합니다. 유효한 값은 0.9.0.x, 0.8.x.y입니다.
* 기본값: 0.10.0

#### `max_consumer_num_per_group` {#max_consumer_num_per_group}

* 설명: routine load에 사용하는 데이터 consumer 그룹의 최대 consumer 수입니다.
* 기본값: 3

#### `streaming_load_max_mb` {#streaming_load_max_mb}

* 유형: int64
* 설명: 하나의 Stream Load에 대한 최대 요청 본문 크기를 제한합니다. `read_json_by_line=true`가 아닌 JSON 로드는 `streaming_load_json_max_mb`의 제한도 받습니다.
  - Stream Load는 일반적으로 몇 GB 미만의 데이터를 로드하는 데 적합하며 너무 큰 데이터를 로드하는 데는 적합하지 않습니다.
* 기본값: 102400 (MB)
* 동적 수정 가능: 예

이는 소스 코드의 기본값이며 실제 적용 값은 배포 구성에 따라 달라집니다. ADMIN_PRIV 권한이 있는 사용자는 `SHOW BACKEND CONFIG LIKE 'streaming_load_max_mb';`를 실행하여 각 BE의 실제 적용 값을 확인할 수 있습니다. 이 매개변수는 BE를 다시 시작하지 않고 동적으로 변경할 수 있습니다. 관리형 클라우드 서비스에서는 서비스가 제공하는 구성 방법을 사용하거나 관리자에게 문의하여 값을 확인하거나 조정하세요.

**버전 기록:**

- 3.x 시리즈에서는 Doris 3.0.2부터 `streaming_load_max_mb`의 기본값이 10240 MB(10 GB)에서 102400 MB(100 GB)로 증가했습니다. Doris 3.0.0 및 3.0.1은 10 GB 기본값을 사용합니다.
- 2.1 시리즈에서는 2.1.7부터 동일한 변경이 적용되었습니다.
- Doris 4.x 및 dev는 100 GB 기본값을 유지합니다. 실제 적용 값은 배포 구성에 따라 달라집니다.

#### `streaming_load_json_max_mb` {#streaming_load_json_max_mb}

* 유형: int64
* 설명: 하나의 Stream load에서 허용되는 최대 JSON 데이터 양을 제한하는 데 사용됩니다. 단위는 MB입니다.
  - JSON과 같은 일부 데이터 형식은 분할할 수 없습니다. 파싱을 시작하려면 모든 데이터를 메모리로 읽어야 하므로 이 값은 한 번의 Stream load에서 로드할 수 있는 최대 데이터 양을 제한합니다.
* 기본값: 100
* 동적 수정 가능: 예

#### `olap_table_sink_send_interval_microseconds` {#olap_table_sink_send_interval_microseconds}

* 설명: 데이터를 로드하는 동안 Coordinator의 sink 노드에 폴링 스레드가 있어 해당 BE로 데이터를 계속 전송합니다. 이 스레드는 `olap_table_sink_send_interval_microseconds` 마이크로초마다 전송할 데이터가 있는지 확인합니다.
* 기본값: 1000

#### `olap_table_sink_send_interval_auto_partition_factor` {#olap_table_sink_send_interval_auto_partition_factor}

* 설명: 자동 파티션이 활성화된 테이블에 데이터를 로드할 때 `olap_table_sink_send_interval_microseconds`의 간격이 너무 느릴 수 있습니다. 이 경우 실제 간격은 이 계수를 곱한 값이 됩니다.
* 기본값: 0.001

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

* 유형: bool
* 설명: 스토리지와 컴퓨팅이 분리된 모드에서 Group Commit의 Stream Load BE 전달을 활성화할지 여부입니다. Doris 4.0 시리즈에서는 4.0.8 버전부터, 4.1 시리즈에서는 4.1.4 버전부터 추가되었습니다. 동적 수정을 지원합니다.
  - 로드 밸런서가 동일한 테이블의 Group Commit 요청을 여러 BE에 무작위로 분산하여 효과적인 배치 처리를 방해하는 문제를 해결합니다. 활성화하면 BE가 요청을 하나의 대상 BE로 전달합니다.
  - **4.0.8 버전부터 BE 엔드포인트 `/api/{db}/{table}/_stream_load_forward`는 이 구성으로 제어됩니다. `false`이면 해당 엔드포인트 요청이 `Stream load forward is disabled` 메시지와 함께 `403 Forbidden`을 반환합니다. `true`이면 요청은 인증을 통과해야 하며 전역 `LOAD` 권한이 필요합니다.**
  - 이 전달 기능에 의존하는 배포에서는 FE와 BE 모두에서 이 구성을 `true`로 설정해야 합니다([FE 구성](./fe-config)의 같은 이름 구성 참조).
* 기본값: false

### 스레드 {#thread}

#### `delete_worker_count` {#delete_worker_count}

* 설명: 데이터 삭제 작업을 수행하는 스레드 수입니다.
* 기본값: 3

#### `clear_transaction_task_worker_count` {#clear_transaction_task_worker_count}

* 설명: 트랜잭션 정리에 사용하는 스레드 수입니다.
* 기본값: 1

#### `clone_worker_count` {#clone_worker_count}

* 설명: 복제 작업을 수행하는 스레드 수입니다.
* 기본값: 3

#### `be_service_threads` {#be_service_threads}

* 유형: int32
* 설명: FE 요청을 실행하는 데 사용할 수 있는 스레드 수를 나타내는 BE thrift 서버 서비스 실행 스레드 수입니다.
* 기본값: 64

#### `download_worker_count` {#download_worker_count}

* 설명: 다운로드 스레드 수입니다.
* 기본값: 1

#### `drop_tablet_worker_count` {#drop_tablet_worker_count}

* 설명: tablet을 삭제하는 스레드 수입니다.
* 기본값: 3

#### `flush_thread_num_per_store` {#flush_thread_num_per_store}

* 설명: 저장소별 메모리 테이블을 새로 고치는 데 사용하는 스레드 수입니다.
* 기본값: 2

#### `publish_version_worker_count` {#publish_version_worker_count}

* 설명: 버전을 게시하는 스레드 수입니다.
* 기본값: 8

#### `upload_worker_count` {#upload_worker_count}

* 설명: 파일 업로드에 사용하는 최대 스레드 수입니다.
* 기본값: 1

#### `webserver_num_workers` {#webserver_num_workers}

* 설명: 웹 서버의 기본 작업 스레드 수입니다.
* 기본값: 48

#### `send_batch_thread_pool_thread_num` {#send_batch_thread_pool_thread_num}

* 유형: int32
* 설명: SendBatch 스레드 풀의 스레드 수입니다. NodeChannels의 데이터 전송 작업에서 각 NodeChannel의 SendBatch 작업은 스레드 작업으로 스레드 풀에 제출되어 스케줄링됩니다. 이 매개변수가 SendBatch 스레드 풀의 크기를 결정합니다.
* 기본값: 64

#### `send_batch_thread_pool_queue_size` {#send_batch_thread_pool_queue_size}

* 유형: int32
* 설명: SendBatch 스레드 풀의 큐 길이입니다. NodeChannels의 데이터 전송 작업에서 각 NodeChannel의 SendBatch 작업은 스레드 작업으로 스레드 풀에 제출되어 스케줄링을 기다립니다. 제출된 작업 수가 큐 길이를 초과하면 큐에 빈 슬롯이 생길 때까지 이후 작업이 차단됩니다.
* 기본값: 102400

#### `make_snapshot_worker_count` {#make_snapshot_worker_count}

* 설명: 스냅샷을 만드는 스레드 수입니다.
* 기본값: 5

#### `release_snapshot_worker_count` {#release_snapshot_worker_count}

* 설명: 스냅샷을 해제하는 스레드 수입니다.
* 기본값: 5

### 메모리 {#memory}

#### `madvise_huge_pages` {#madvise_huge_pages}

* 유형: bool
* 설명: Linux 메모리 huge page를 사용할지 여부입니다.
* 기본값: false

#### `max_memory_sink_batch_count` {#max_memory_sink_batch_count}

* 설명: 외부 스캔 캐시 배치의 최대 개수입니다. 캐시는 `max_memory_cache_batch_count * batch_size`개의 행을 저장하며 기본값은 20입니다. `batch_size`의 기본값은 1024이므로 20 * 1024개의 행이 캐시됩니다.
* 기본값: 20

#### `memory_max_alignment` {#memory_max_alignment}

* 설명: 최대 메모리 정렬입니다.
* 기본값: 16

#### `mmap_buffers` {#mmap_buffers}

* 설명: mmap을 사용하여 메모리를 할당할지 여부입니다.
* 기본값: false

#### `memtable_mem_tracker_refresh_interval_ms` {#memtable_mem_tracker_refresh_interval_ms}

* 설명: memtable flush 관리자의 새로 고침 반복 사이 간격(밀리초)입니다.
* 기본값: 100

#### `zone_map_row_num_threshold` {#zone_map_row_num_threshold}

* 유형: int32
* 설명: 페이지의 행 수가 이 값보다 작으면 데이터 확장을 줄이기 위해 zonemap을 생성하지 않습니다.
* 기본값: 20

#### `memory_mode` {#memory_mode}

* 유형: string
* 설명: tcmalloc의 GC를 제어합니다. performance 모드에서는 사용량이 `90% * mem_limit` 이상일 때 Doris가 tcmalloc 캐시의 메모리를 해제하고, 그렇지 않으면 사용량이 `50% * mem_limit` 이상일 때 해제합니다.
* 기본값: performance

#### `max_sys_mem_available_low_water_mark_bytes` {#max_sys_mem_available_low_water_mark_bytes}

* 유형: int64
* 설명: 시스템 `/proc/meminfo/MemAvailable`의 최대 low water mark입니다. 단위는 바이트이며 기본값은 1.6G입니다. 실제 low water mark는 `min(1.6G, MemTotal * 10%)`입니다. 16G보다 큰 메모리를 가진 시스템에서 메모리를 과도하게 낭비하지 않기 위한 것입니다. max를 늘리면 16G보다 큰 시스템에서 Full GC를 위해 더 많은 메모리 버퍼가 예약됩니다. max를 줄이면 가능한 한 많은 메모리를 사용합니다.
* 기본값: 1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes` {#memory_limitation_per_thread_for_schema_change_bytes}

* 설명: 하나의 schema change 작업에 허용되는 최대 메모리입니다.
* 기본값: 2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes` {#mem_tracker_consume_min_size_bytes}

* 유형: int32
* 설명: MemTracker를 consume/release할 때 TCMalloc Hook의 최소 길이입니다. 이 값보다 작은 consume 크기는 MemTracker의 consume/release를 자주 호출하지 않도록 계속 누적됩니다. 값을 줄이면 consume/release 빈도가 증가하고, 늘리면 MemTracker 통계가 부정확해집니다. 이론적으로 MemTracker의 통계값과 실제값의 차이는 `(mem_tracker_consume_min_size_bytes * MemTracker가 위치한 BE 스레드 수)`입니다.
* 기본값: 1,048,576

#### `min_buffer_size` {#min_buffer_size}

* 설명: 최소 읽기 버퍼 크기입니다.
* 기본값: 1024 (byte)

#### `write_buffer_size` {#write_buffer_size}

* 설명: flush 전 버퍼 크기입니다.
  - 로드된 데이터는 먼저 BE의 메모리 블록에 기록되고, 이 메모리 블록이 임계값에 도달할 때만 디스크에 기록됩니다. 기본 크기는 200MB입니다. 임계값이 너무 작으면 BE에 작은 파일이 많이 생길 수 있습니다. 임계값을 늘리면 파일 수를 줄일 수 있지만 너무 크게 설정하면 RPC 제한 시간이 발생할 수 있습니다.
* 기본값: 209,715,200

#### `remote_storage_read_buffer_mb` {#remote_storage_read_buffer_mb}

* 유형: int32
* 설명: HDFS 또는 객체 스토리지에서 파일을 읽을 때 사용하는 캐시 크기입니다.
  - 이 값을 늘리면 원격 데이터 읽기 호출 횟수를 줄일 수 있지만 메모리 오버헤드가 증가합니다.
* 기본값: 16 (MB)

#### `file_cache_type` {#file_cache_type}

* 유형: string
* 설명: 캐시 파일의 유형입니다. `whole_file_cache`는 전체 segment 파일을 다운로드하고, `sub_file_cache`는 segment 파일을 크기별 여러 파일로 나눕니다. `""`로 설정하면 캐시하지 않습니다. 캐시가 필요할 때 이 매개변수를 설정하세요.
* 기본값: ""

#### `path_gc_check` {#path_gc_check}

* 유형: bool
* 설명: recycle scan data 스레드 검사를 활성화할지 여부입니다.
* 기본값: true

#### `path_gc_check_interval_second` {#path_gc_check_interval_second}

* 설명: recycle scan data 스레드 검사 간격입니다.
* 기본값: 86400 (s)

#### `path_gc_check_step` {#path_gc_check_step}

* 기본값: 1000

#### `path_gc_check_step_interval_ms` {#path_gc_check_step_interval_ms}

* 기본값: 10 (ms)

#### `scan_context_gc_interval_min` {#scan_context_gc_interval_min}

* 설명: context GC 스레드의 스케줄링 주기에 사용하는 구성입니다. 단위는 분이며 기본값은 5분입니다.
* 기본값: 5

### 스토리지 {#storage}

#### `inverted_index_skip_norms_for_variant` {#inverted_index_skip_norms_for_variant}

* 유형: bool
* 설명: 4.1.5 버전부터 지원됩니다. 동적 구성을 지원합니다. `true`이면 인덱스의 `norms` 속성과 관계없이 VARIANT 하위 경로의 역색인에서 Norms를 생략합니다. 여러 하위 경로에 대한 인덱스 저장 공간을 줄일 수 있지만 해당 인덱스는 Norms가 필요한 BM25 `score()` 계산을 더 이상 지원하지 않습니다. 기본적으로 Norms는 유지됩니다. [관련성 점수](../../table-design/index/inverted-index/scoring.md)를 참조하세요.
* 기본값: false

#### `default_num_rows_per_column_file_block` {#default_num_rows_per_column_file_block}

* 유형: int32
* 설명: 하나의 RowBlock에 포함되는 데이터 행 수를 구성합니다.
* 기본값: 1024

#### `disable_storage_page_cache` {#disable_storage_page_cache}

* 유형: bool
* 설명: 인덱스 캐시에 page cache를 사용하지 않을지 여부입니다. 이 구성은 BETA 스토리지 형식에서만 적용되며 일반적으로 false로 설정하는 것이 좋습니다.
* 기본값: false

#### `disk_stat_monitor_interval` {#disk_stat_monitor_interval}

* 설명: 디스크 상태 확인 간격입니다.
* 기본값: 5 (s)

#### `max_free_io_buffers` {#max_free_io_buffers}

* 설명: 각 IO 버퍼 크기마다 IoMgr가 예약하는 최대 버퍼 수입니다. 1024B에서 8MB 버퍼까지이며 최대 약 2GB의 버퍼입니다.
* 기본값: 128

#### `max_garbage_sweep_interval` {#max_garbage_sweep_interval}

* 설명: 디스크 가비지 정리의 최대 간격입니다.
* 기본값: 3600 (s)

#### `max_percentage_of_error_disk` {#max_percentage_of_error_disk}

* 유형: int32
* 설명: 스토리지 엔진에서 허용하는 손상 디스크 비율입니다. 손상 디스크가 이 비율을 초과하면 BE가 자동으로 종료됩니다.
* 기본값: 0

#### `min_garbage_sweep_interval` {#min_garbage_sweep_interval}

* 설명: 디스크 가비지 정리 사이의 최소 간격입니다.
* 기본값: 180 (s)

#### `pprof_profile_dir` {#pprof_profile_dir}

* 설명: pprof 프로필 저장 디렉터리입니다.
* 기본값: ${DORIS_HOME}/log

#### `small_file_dir` {#small_file_dir}

* 설명: SmallFileMgr가 다운로드한 파일을 저장합니다.
* 기본값: ${DORIS_HOME}/lib/small_file/

#### `user_function_dir` {#user_function_dir}

* 설명: UDF 함수 디렉터리입니다.
* 기본값: `${DORIS_HOME}/lib/udf`

#### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

* 설명: 데이터 디렉터리에 남아 있어야 하는 최소 바이트 수입니다.
* 기본값: 1073741824

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

* 설명: `storage_flood_stage_usage_percent`와 `storage_flood_stage_left_capacity_bytes` 구성은 데이터 디렉터리 용량의 최대 사용량을 제한합니다.
* 기본값: 90 (90%)

#### `storage_medium_migrate_count` {#storage_medium_migrate_count}

* 설명: 복제에 사용하는 스레드 수입니다.
* 기본값: 1

#### `storage_page_cache_limit` {#storage_page_cache_limit}

* 설명: 스토리지 페이지 크기 캐시입니다.
* 기본값: 20%

#### `storage_page_cache_shard_size` {#storage_page_cache_shard_size}

* 설명: StoragePageCache의 샤드 크기입니다. 값은 2의 거듭제곱이어야 합니다. 잠금 경합을 줄이려면 BE 코어 수에 가까운 값으로 설정하는 것이 좋습니다.
* 기본값: 16

#### `index_page_cache_percentage` {#index_page_cache_percentage}

* 유형: int32
* 설명: 전체 스토리지 페이지 캐시에서 인덱스 페이지 캐시가 차지하는 비율입니다. 값의 범위는 [0, 100]입니다.
* 기본값: 10

#### `segment_cache_capacity` {#segment_cache_capacity}
* 유형: int32
* 설명: segment 캐시(rowset id가 키)의 최대 항목 수입니다. -1은 이전 버전과의 호환성을 위해 fd_number * 2/5를 사용합니다.
* 기본값: -1

#### `storage_strict_check_incompatible_old_format` {#storage_strict_check_incompatible_old_format}

* 유형: bool
* 설명: 호환되지 않는 이전 형식을 엄격하게 검사할지 여부입니다.
* 기본값: true
* 동적 수정 가능: 아니요

#### `sync_tablet_meta` {#sync_tablet_meta}

* 설명: 스토리지 엔진이 sync를 활성화하고 디스크에 유지할지 여부입니다.
* 기본값: true

#### `pending_data_expire_time_sec` {#pending_data_expire_time_sec}

* 설명: 스토리지 엔진이 보존하는 검증되지 않은 데이터의 최대 기간입니다.
* 기본값: 1800 (s)

#### `ignore_rowset_stale_unconsistent_delete` {#ignore_rowset_stale_unconsistent_delete}

* 유형: boolean
* 설명: 일관된 버전 경로를 구성할 수 없는 경우 오래된 병합 rowset을 삭제할지 결정합니다.
  - 병합된 만료 rowset 버전 경로는 30분 후 삭제됩니다. 비정상적인 상황에서 이러한 버전을 삭제하면 쿼리의 일관된 경로를 구성할 수 없게 됩니다. false이면 프로그램 검사가 엄격해져 오류를 직접 보고하고 종료합니다. true이면 프로그램이 정상적으로 실행되며 이 오류를 무시합니다. 일반적으로 이 오류를 무시해도 쿼리에 영향을 주지 않지만, FE가 병합된 버전을 전달할 때는 -230 오류가 발생할 수 있습니다.
* 기본값: false

#### `create_tablet_worker_count` {#create_tablet_worker_count}

* 설명: BE가 tablet을 생성하는 작업자 스레드 수입니다.
* 기본값: 3

#### `check_consistency_worker_count` {#check_consistency_worker_count}

* 설명: tablet의 체크섬을 계산하는 작업자 스레드 수입니다.
* 기본값: 1

#### `max_tablet_version_num` {#max_tablet_version_num}

* 유형: int
* 설명: 하나의 tablet 버전 수를 제한합니다. 너무 잦은 로드 또는 시기적절하지 않은 compaction으로 인한 버전 누적을 방지하는 데 사용됩니다. 제한을 초과하면 로드 작업이 거부됩니다.
* 기본값: 2000

#### `tablet_map_shard_size` {#tablet_map_shard_size}

* 설명: tablet_map_lock 조각 크기입니다. 값은 2^n이며 n=0,1,2,3,4입니다. tablet을 더 효율적으로 관리하기 위한 것입니다.
* 기본값: 4

#### `tablet_meta_checkpoint_min_interval_secs` {#tablet_meta_checkpoint_min_interval_secs}

* 설명: TabletMeta Checkpoint 스레드 폴링 간격입니다.
* 기본값: 600 (s)

#### `tablet_meta_checkpoint_min_new_rowsets_num` {#tablet_meta_checkpoint_min_new_rowsets_num}

* 설명: TabletMeta Checkpoint 저장을 위한 최소 Rowset 수입니다.
* 기본값: 10

#### `tablet_rowset_stale_sweep_time_sec` {#tablet_rowset_stale_sweep_time_sec}

* 유형: int64
* 설명: 병합된 rowset 버전 정리의 만료 시간을 제어합니다. 현재 시간 now()에서 버전 경로에 있는 가장 최근 생성 rowset의 생성 시간을 뺀 값이 tablet_rowset_stale_sweep_time_sec보다 크면 현재 경로를 정리하고 병합된 rowset을 삭제합니다. 단위는 초입니다.
  - 쓰기가 너무 빈번하면 FE가 병합된 버전을 조회하지 못해 -230 쿼리 오류가 발생할 수 있습니다. 이 매개변수를 늘리면 문제를 피할 수 있습니다.
* 기본값: 300

#### `tablet_writer_open_rpc_timeout_sec` {#tablet_writer_open_rpc_timeout_sec}

* 설명: tablet 상태 캐시의 업데이트 간격입니다.
    - 로드 중 Batch(1024행)를 전송하는 RPC 제한 시간입니다. 기본값은 60초입니다. 이 RPC에는 여러 메모리 배치를 기록하는 작업이 포함될 수 있어 배치 기록으로 인해 RPC 제한 시간이 발생할 수 있습니다. 이 제한 시간을 조정하여 send batch fail 오류와 같은 제한 시간 오류를 줄일 수 있습니다. `write_buffer_size` 구성을 늘리는 경우 이 매개변수도 늘려야 합니다.
* 기본값: 60

#### `tablet_writer_ignore_eovercrowded` {#tablet_writer_ignore_eovercrowded}

* 유형: bool
* 설명: 데이터를 쓸 때 brpc 오류 '[E1011]The server is overcrowded'를 무시하는 데 사용됩니다.
* 기본값: false

#### `streaming_load_rpc_max_alive_time_sec` {#streaming_load_rpc_max_alive_time_sec}

* 설명: TabletsChannel의 수명입니다. 이 시간 동안 채널이 데이터를 수신하지 않으면 채널이 삭제됩니다.
* 기본값: 1200

#### `alter_tablet_worker_count` {#alter_tablet_worker_count}

* 설명: 스키마 변경을 수행하는 스레드 수입니다.
* 기본값: 3

#### `alter_index_worker_count` {#alter_index_worker_count}

* 설명: 인덱스 변경을 수행하는 스레드 수입니다.
* 기본값: 3

#### `ignore_load_tablet_failure` {#ignore_load_tablet_failure}

* 유형: bool
* 설명: tablet 로드 실패 시 오류를 무시하고 BE를 계속 시작할지 결정합니다.
* 기본값: false

BE가 시작되면 각 데이터 디렉터리에 별도의 스레드를 시작하여 tablet 헤더의 메타 정보를 로드합니다. 기본 구성에서 데이터 디렉터리의 tablet 로드에 실패하면 시작 프로세스가 종료됩니다. 동시에 `be.INFO` 로그에 다음 오류 메시지가 표시됩니다.

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

이는 해당 데이터 디렉터리에서 로드에 실패한 tablet 수를 나타냅니다. 로그에는 로드에 실패한 tablet의 구체적인 정보도 포함됩니다. 이때 오류 원인을 조사하기 위해 수동 개입이 필요합니다. 조사 후 일반적으로 다음 두 가지 방법으로 복구할 수 있습니다.
  - tablet 정보를 복구할 수 없고 다른 복제본이 정상이라면 `meta_tool` 도구로 잘못된 tablet을 삭제할 수 있습니다.
  - `ignore_load_tablet_failure`를 true로 설정하면 BE가 이러한 오류 tablet을 무시하고 정상적으로 시작합니다.

#### `report_disk_state_interval_seconds` {#report_disk_state_interval_seconds}

* 설명: 에이전트가 디스크 상태를 FE에 보고하는 간격입니다.
* 기본값: 60 (s)

#### `result_buffer_cancelled_interval_time` {#result_buffer_cancelled_interval_time}

* 설명: 결과 버퍼 취소 시간입니다.
* 기본값: 300 (s)

#### `snapshot_expire_time_sec` {#snapshot_expire_time_sec}

* 설명: 스냅샷 파일 정리 간격입니다.
* 기본값:172800 (48 hours)

### 로그 {#log}

#### `sys_log_dir` {#sys_log_dir}

* 유형: string
* 설명: BE 로그 데이터 저장 디렉터리입니다.
* 기본값: `${DORIS_HOME}/log`

#### `sys_log_level` {#sys_log_level}

* 설명: 로그 수준입니다. INFO < WARNING < ERROR < FATAL
* 기본값: INFO

#### `sys_log_roll_mode` {#sys_log_roll_mode}

* 설명: 로그 분할 크기입니다. 1G마다 로그 파일 하나를 분할합니다.
* 기본값: SIZE-MB-1024

#### `sys_log_roll_num` {#sys_log_roll_num}

* 설명: 보존하는 로그 파일 수입니다.
* 기본값: 10

#### `sys_log_verbose_level` {#sys_log_verbose_level}

* 설명: 로그 표시 수준입니다. 코드에서 VLOG로 시작하는 로그 출력을 제어하는 데 사용됩니다.
* 기본값: 10

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

* 설명: 로그 출력 모듈입니다. olap을 지정하면 olap 모듈 아래의 로그만 출력합니다.
* 기본값: 비어 있음

#### `aws_log_level` {#aws_log_level}

* 유형: int32
* 설명: AWS SDK 로그 수준입니다.
  ```
     Off = 0,
     Fatal = 1,
     Error = 2,
     Warn = 3,
     Info = 4,
     Debug = 5,
     Trace = 6
  ```
* 기본값: 3

#### `log_buffer_level` {#log_buffer_level}

* 설명: 로그 flush 전략입니다. 기본적으로 메모리에 유지됩니다.
* 기본값: 비어 있음

### 기타 {#others}

#### `enable_arrow_input_validation` {#enable_arrow_input_validation}

* 유형: bool
* 설명: 4.1.4 버전부터 추가되었습니다. Arrow 데이터를 Doris 내부 열로 변환하기 전에 Arrow 입력 버퍼를 검증할지 여부입니다. 활성화하면 잘못된 Arrow 데이터로 인해 BE가 충돌하는 것을 방지할 수 있으며, 소량의 추가 검증 오버헤드가 발생합니다.
* 기본값: true

#### `report_tablet_interval_seconds` {#report_tablet_interval_seconds}

* 설명: 에이전트가 olap 테이블을 FE에 보고하는 간격입니다.
* 기본값: 60 (s)

#### `report_task_interval_seconds` {#report_task_interval_seconds}

* 설명: 에이전트가 작업 서명을 FE에 보고하는 간격입니다.
* 기본값: 10 (s)

#### `periodic_counter_update_period_ms` {#periodic_counter_update_period_ms}

* 설명: 속도 카운터와 샘플링 카운터의 업데이트 주기입니다.
* 기본값: 500 (ms)

#### `enable_metric_calculator` {#enable_metric_calculator}

* 설명: true로 설정하면 metric calculator가 실행되어 BE 관련 지표 정보를 수집하고, false이면 실행되지 않습니다.
* 기본값: true

#### `enable_system_metrics` {#enable_system_metrics}

* 설명: 시스템 지표를 켜고 끌지 제어합니다.
* 기본값: true

#### `enable_token_check` {#enable_token_check}

* 설명: 이전 버전과의 호환성을 위한 구성으로, 이후 제거될 예정입니다.
* 기본값: true

#### `max_runnings_transactions_per_txn_map` {#max_runnings_transactions_per_txn_map}

* 설명: txn 관리자의 각 txn_partition_map에 허용되는 최대 txn 수입니다. 관리자에 너무 많은 txn이 저장되는 것을 방지하기 위한 자체 보호 기능입니다.
* 기본값: 2000

#### `max_download_speed_kbps` {#max_download_speed_kbps}

* 설명: 최대 다운로드 속도 제한입니다.
* 기본값: 50000 (kb/s)

#### `download_low_speed_time` {#download_low_speed_time}

* 설명: 다운로드 시간 제한입니다.
* 기본값: 300 (s)

#### `download_low_speed_limit_kbps` {#download_low_speed_limit_kbps}

* 설명: 최소 다운로드 속도입니다.
* 기본값: 50 (KB/s)

#### `enable_batch_download` {#enable_batch_download}

* 설명: 파일을 일괄 다운로드할지 여부입니다. binlog가 활성화된 경우 켜는 것이 좋습니다.
* 기본값: false

#### `priority_queue_remaining_tasks_increased_frequency` {#priority_queue_remaining_tasks_increased_frequency}

* 설명: BlockingPriorityQueue에서 남은 작업의 우선순위를 높이는 빈도입니다.
* 기본값: 512


#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

* 설명: JDBC 드라이버를 저장하는 기본 디렉터리입니다.
* 기본값: `${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader` {#enable_simdjson_reader}

* 설명: stream load 중 simdjson을 활성화하여 JSON을 파싱할지 여부입니다.
* 기본값: true

#### `user_files_secure_path` {#user_files_secure_path}

* 설명: `local` 테이블 값 함수가 쿼리하는 파일의 저장 디렉터리입니다.
* 기본값: `${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes` {#brpc_streaming_client_batch_bytes}

* 설명: brpc 스트리밍 클라이언트가 데이터를 전송하는 배치 크기입니다.
* 기본값: 262144

#### `grace_shutdown_wait_seconds` {#grace_shutdown_wait_seconds}

* 설명: 클라우드 네이티브 배포 시나리오에서는 BE가 클러스터에 추가되고 제거되는 일이 매우 자주 발생할 수 있습니다. 종료 중인 BE에서 프래그먼트가 실행 중이면 사용자 쿼리가 실패합니다. 사용자는 `stop_be.sh --grace`를 사용할 수 있습니다. 그러면 BE는 실행 중인 모든 쿼리가 종료될 때까지 기다려 실행 중인 쿼리의 실패를 방지합니다. 그러나 대기 시간이 제한을 초과하면 BE가 직접 종료됩니다. 이 기간 동안 FE는 BE로 새 쿼리를 보내지 않고 실행 중인 모든 쿼리가 종료되기를 기다립니다.
* 기본값: 120

#### `enable_java_support` {#enable_java_support}

* 설명: BE에서 java-jni 사용을 활성화할지 여부입니다. 활성화하면 C++와 Java 간 상호 호출이 허용됩니다. 현재 hudi, java-udf, jdbc, max-compute, paimon, preload, avro를 지원합니다.
* 기본값: true

#### `group_commit_wal_path` {#group_commit_wal_path}

* 설명: group commit의 `WAL` 디렉터리입니다.
* 기본값: `storage_root_path`의 각 디렉터리 아래에 `wal`이라는 디렉터리를 생성합니다. 구성 예시:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

### 컴퓨팅 및 스토리지 분리 모드 {#compute-and-storage-disaggregated-mode}

#### `deploy_mode` {#deploy_mode-1}

* 기본값: ""

* 설명: BE가 실행되는 모드입니다. `cloud`는 스토리지와 컴퓨팅이 분리된 모드를 의미합니다.

#### `meta_service_endpoint` {#meta_service_endpoint}

기본값: ""

* 설명: Meta Service 엔드포인트는 'host1:port,host2:port' 형식으로 지정해야 합니다. 이 값은 일반적으로 FE가 heartbeat를 통해 BE에 전달하므로 구성할 필요가 없습니다.

#### `enable_file_cache` {#enable_file_cache}

기본값: true (4.1.5 버전부터 기본 활성화, 이전에는 false, 컴퓨팅 및 스토리지 분리 모드에서는 항상 활성화)

* 설명: 파일 캐시를 사용할지 여부입니다. 변경하려면 BE를 다시 시작해야 합니다. 세션 변수 `enable_file_cache`도 활성화해야 합니다. 4.1.5 버전에서는 BE 구성과 세션 변수의 기본값을 모두 `true`로 변경했으므로 기존의 명시적 구성과 영구 저장된 전역 변수를 별도로 확인해야 합니다.

#### `enable_ms_rpc_host_level_rate_limit_dry_run` {#enable_ms_rpc_host_level_rate_limit_dry_run}

* 유형: bool
* 설명: 4.1.5 버전부터 지원됩니다. 동적 구성을 지원합니다. BE에서 Meta Service로 보내는 RPC의 호스트 수준 속도 제한을 대기 없이 평가합니다. `enable_ms_rpc_host_level_rate_limit`과 독립적이므로 해당 설정이 `false`여도 평가가 실행됩니다. 두 설정이 모두 `true`이면 dry-run이 우선합니다. 실제 속도 제한을 적용하려면 `enable_ms_rpc_host_level_rate_limit`을 활성화하고 이 설정을 비활성화하세요.
* 기본값: true

#### `enable_ms_backpressure_handling_dry_run` {#enable_ms_backpressure_handling_dry_run}

* 유형: bool
* 설명: 4.1.5 버전부터 지원됩니다. 동적 구성을 지원합니다. Meta Service의 `MS_BUSY` 응답으로 트리거되는 테이블 수준 adaptive rate limiting을 대기 없이 평가합니다. `enable_ms_backpressure_handling`과 독립적이며 두 설정이 모두 `true`이면 dry-run이 우선합니다. 테이블 수준 속도 제한을 적용하려면 `enable_ms_backpressure_handling`을 활성화하고 이 설정을 비활성화하세요.
* 기본값: true

#### `cache_peer_read_failure_threshold` {#cache_peer_read_failure_threshold}

* 유형: int32
* 설명: 4.2.0 버전부터 지원됩니다. 동적 구성을 지원합니다. 피어 주소에서 연속으로 발생한 연결 또는 RPC 실패 횟수가 이 값에 도달하면 회로 차단기가 열립니다. 실제 최소값은 `1`입니다. 이 주소 수준 상태는 서로 다른 tablet의 피어 읽기에서 공유되므로 도달할 수 없는 노드에 반복적으로 연결하는 것을 방지합니다.
* 기본값: 3

#### `cache_peer_read_circuit_open_seconds` {#cache_peer_read_circuit_open_seconds}

* 유형: int32
* 설명: 4.2.0 버전부터 지원됩니다. 동적 구성을 지원합니다. 열린 피어 회로 차단기가 해당 주소에 대한 읽기를 거부하는 시간(초)입니다. 음수 값은 `0`으로 처리됩니다. 이 기간이 지나면 복구 프로브 하나가 허용됩니다.
* 기본값: 30

#### `delete_bitmap_store_v2_max_bytes_in_fdb` {#delete_bitmap_store_v2_max_bytes_in_fdb}

* 유형: int64
* 설명: 컴퓨팅 및 스토리지 분리 모드에서 FDB에 직접 저장되는 Delete Bitmap V2의 직렬화된 최대 크기(바이트)입니다. 동적 구성을 지원합니다. 음수가 아닌 임계값을 초과하면 객체 스토리지 파일에 저장하고, 음수 값은 크기 기반 분산 저장을 비활성화합니다. 4.1.5 버전에서는 90000바이트 청크 안에 추가 메시지 필드를 저장할 여유를 두기 위해 기본값을 `1024`에서 `89000`으로 높였습니다.
* 기본값: 89000 (4.1.5 이전에는 1024)

#### `enable_remove_agg_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_agg_pre_rowsets_delete_bitmap_by_keys}

* 유형: bool
* 설명: 4.1.5 버전부터 지원됩니다. 동적 구성을 지원합니다. 컴퓨팅 및 스토리지 분리 모드에서 집계된 기존 Delete Bitmap을 교체할 때 끝 버전의 레코드를 키로 삭제합니다. `false`로 설정하면 범위 삭제를 사용합니다. 기존 정리 작업이 레코드를 삭제하는 방식만 변경하며 추가 정리 작업을 활성화하지 않습니다.
* 기본값: true

#### `enable_remove_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_pre_rowsets_delete_bitmap_by_keys}

* 유형: bool
* 설명: 4.1.5 버전부터 지원됩니다. 동적 구성을 지원합니다. 컴퓨팅 및 스토리지 분리 모드에서 집계 범위 내의 기존 Delete Bitmap을 정리할 때 시작 버전(포함)부터 끝 버전(미포함)까지의 레코드를 키로 삭제합니다. `false`로 설정하면 범위 삭제를 사용합니다. 기존 정리 스위치와 전제 조건은 계속 적용됩니다.
* 기본값: true

#### `file_cache_path` {#file_cache_path}

기본값: [{"path":"${DORIS_HOME}/file_cache"}]
* 설명: 파일 캐시에 사용하는 디스크 경로와 기타 매개변수입니다. 배열로 표현하며 디스크마다 하나의 항목을 둡니다. `path`는 디스크 경로를 지정하고 `total_size`는 캐시 크기를 제한합니다. -1 또는 0이면 전체 디스크 공간을 사용합니다.
* 형식: [{"path":"/path/to/file_cache","total_size":21474836480,{"path":"/path/to/file_cache2","total_size":21474836480}]

#### `enable_async_file_cache_write` {#enable_async_file_cache_write}

* 유형: bool
* 설명: 4.1.4 버전부터 추가되었습니다. 파일 캐시에 비동기 방식으로 쓸지 여부입니다. 활성화하면 원격 데이터를 파일 캐시에 기록하는 작업이 백그라운드 스레드 풀로 전달되어 읽기 경로를 차단하지 않으므로 콜드 읽기 지연 시간이 줄어듭니다.
* 기본값: false

#### `async_file_cache_write_workers_per_disk` {#async_file_cache_write_workers_per_disk}

* 유형: int32
* 설명: 4.1.4 버전부터 추가되었습니다. 파일 캐시에 비동기 방식으로 쓸 때 캐시 디스크별 쓰기 스레드 수입니다. `enable_async_file_cache_write = true`일 때만 적용됩니다.
* 기본값: 16

#### `async_file_cache_write_max_pending_bytes` {#async_file_cache_write_max_pending_bytes}

* 유형: int64
* 설명: 4.1.4 버전부터 추가되었습니다. 비동기 파일 캐시 쓰기를 대기 중인 데이터의 최대 총 크기(바이트)입니다. 이 제한을 초과하는 write-back 요청은 삭제되며 쿼리 정확성에는 영향을 주지 않지만 데이터가 캐시되지 않습니다. `-1`은 제한 없음을 의미합니다.
* 기본값: -1

#### `enable_file_cache_write_from_s3_file_writer` {#enable_file_cache_write_from_s3_file_writer}

* 유형: bool
* 설명: 4.1.4 버전부터 추가되었습니다. 객체 스토리지에 쓰는 동안 데이터를 로컬 파일 캐시에도 기록할지 여부입니다. 이렇게 하면 새로 기록된 데이터를 캐시에서 직접 읽을 수 있습니다.
* 기본값: true

#### `enable_file_cache_write_index_file_only` {#enable_file_cache_write_index_file_only}

* 유형: bool
* 설명: 4.1.4 버전부터 추가되었습니다. 인덱스 파일만 파일 캐시에 기록할지 여부입니다. 활성화하면 캐시 공간이 제한될 때 인덱스를 우선 캐시에 상주하게 할 수 있습니다.
* 기본값: false

#### `enable_cache_read_from_peer` {#enable_cache_read_from_peer}

* 유형: bool
* 설명: 피어 캐시 읽기의 마스터 스위치입니다. 활성화하면 로컬 File Cache가 누락된 경우 먼저 같은 컴퓨팅 그룹 또는 다른 컴퓨팅 그룹의 다른 BE에 있는 File Cache에서 블록을 읽고, 어느 BE에도 없을 때만 객체 스토리지로 폴백합니다. 같은 그룹과 그룹 간 피어 읽기는 이 스위치로 함께 제어되며 그룹 간 읽기만 별도로 끌 수는 없습니다. 그룹 간 피어 읽기는 4.2.0 버전부터 지원되며, 이 버전에서는 `cache_read_from_peer_expired_seconds` 구성 항목도 제거되었습니다. [피어 캐시 읽기](../../compute-storage-decoupled/file-cache/file-cache-peer-read)를 참조하세요.
* 기본값: false (필요할 때 명시적으로 활성화)

#### `enable_peer_s3_race` {#enable_peer_s3_race}

* 유형: bool
* 설명: 4.2.0 버전부터 추가되었습니다. 피어 읽기와 객체 스토리지 읽기를 동시에 실행하여 먼저 반환된 결과를 사용할지 여부입니다. 비활성화하면 순차적으로 읽습니다. 피어 후보를 하나씩 시도하고 모두 실패한 후에만 객체 스토리지를 읽습니다.
* 기본값: true

#### `peer_race_hedge_delay_ms` {#peer_race_hedge_delay_ms}

* 유형: int32
* 설명: 4.2.0 버전부터 추가되었습니다. 경쟁 시 피어 읽기에 부여하는 선행 시간(밀리초)입니다. 이 시간 안에 피어가 응답하면 객체 스토리지 읽기를 보내지 않으며, `0`이면 두 읽기를 동시에 시작합니다.
* 기본값: 20

#### `max_concurrent_peer_races` {#max_concurrent_peer_races}

* 유형: int32
* 설명: 4.2.0 버전부터 추가되었습니다. 하나의 BE에서 동시에 수행할 수 있는 피어와 객체 스토리지 간 경쟁의 최대 수입니다. 이 제한을 초과한 누락은 순차적으로 읽습니다.
* 기본값: 64

#### `peer_cache_fill_compute_group_id` {#peer_cache_fill_compute_group_id}

* 유형: string
* 설명: 4.2.0 버전부터 추가되었습니다. 읽기를 발행하는 BE에 설정합니다. 그룹 간 채우기를 담당하는 컴퓨팅 그룹의 ID입니다(`SHOW BACKENDS`의 `Tag` 열에 있는 `compute_group_id`이며 컴퓨팅 그룹 이름이 아님). 선택된 피어 후보가 이 컴퓨팅 그룹에 속하면 해당 피어가 블록을 객체 스토리지에서 가져와 자체 File Cache에 기록하도록 요청합니다. 비어 있으면 채우기를 사용하지 않습니다.
* 기본값: ""

#### `enable_peer_server_cache_fill` {#enable_peer_server_cache_fill}

* 유형: bool
* 설명: 4.2.0 버전부터 추가되었습니다. 캐시를 제공하는 BE에 설정합니다. 채우기 플래그가 포함된 피어 읽기 요청을 수락할지 여부입니다. 비활성화하면 로컬에 캐시되지 않은 블록을 찾을 수 없음으로 보고하고 요청 BE가 객체 스토리지로 폴백합니다.
* 기본값: true

#### `peer_server_cache_fill_timeout_ms` {#peer_server_cache_fill_timeout_ms}

* 유형: int32
* 설명: 4.2.0 버전부터 추가되었습니다. 제공 측에서 한 번의 채우기에 허용되는 최대 대기 시간(밀리초)입니다. 제한 시간이 초과되면 요청 BE가 객체 스토리지로 폴백합니다.
* 기본값: 6000

#### `max_concurrent_peer_server_fills` {#max_concurrent_peer_server_fills}

* 유형: int32
* 설명: 4.2.0 버전부터 추가되었습니다. 제공 측에서 동시에 수행할 수 있는 채우기의 최대 수입니다. 제한을 초과하는 채우기 요청은 거부되고 요청 BE가 객체 스토리지로 폴백합니다.
* 기본값: 32

#### `peer_rpc_failure_eviction_threshold` {#peer_rpc_failure_eviction_threshold}

* 유형: int32
* 설명: 4.2.0 버전부터 추가되었습니다. 피어 후보는 연속 RPC 실패가 이 횟수에 도달하면 후보 목록에서 제거됩니다.
* 기본값: 3

#### `peer_all_miss_cooldown_threshold` {#peer_all_miss_cooldown_threshold}

* 유형: int32
* 설명: 4.2.0 버전부터 추가되었습니다. 모든 피어 후보가 누락되는 연속 읽기 횟수입니다. 이 횟수에 도달하면 tablet이 cooldown 상태에 들어가며, cooldown 동안 읽기는 객체 스토리지로 직접 이동합니다.
* 기본값: 5

#### `peer_all_miss_cooldown_duration_s` {#peer_all_miss_cooldown_duration_s}

* 유형: int64
* 설명: 4.2.0 버전부터 추가되었습니다. 피어 읽기 cooldown 기간(초)입니다.
* 기본값: 300

#### `peer_candidate_expiry_s` {#peer_candidate_expiry_s}

* 유형: int64
* 설명: 4.2.0 버전부터 추가되었습니다. 피어 후보 항목의 만료 시간(초)이며 마지막 사용 시점부터 계산합니다. 만료된 항목은 메모리에서 삭제되고 다음 누락 시 FE에서 다시 가져옵니다.
* 기본값: 3600

#### `peer_candidate_cleanup_interval_s` {#peer_candidate_cleanup_interval_s}

* 유형: int64
* 설명: 4.2.0 버전부터 추가되었습니다. 만료된 피어 후보를 삭제하는 백그라운드 작업의 간격(초)입니다.
* 기본값: 3600

#### `peer_fetch_queue_timeout_ms` {#peer_fetch_queue_timeout_ms}

* 유형: int32
* 설명: 4.2.0 버전부터 추가되었습니다. 피어 읽기 요청이 제공 측의 처리 큐에서 대기할 수 있는 최대 시간(밀리초)입니다. 이 시간보다 오래 대기한 요청은 거부되어 요청 BE가 객체 스토리지로 빠르게 폴백합니다.
* 기본값: 100

#### `brpc_peer_fetch_pool_threads` {#brpc_peer_fetch_pool_threads}

* 유형: int32
* 설명: 4.2.0 버전부터 추가되었습니다. 제공 측에서 피어 읽기 요청을 처리하는 스레드 풀의 크기입니다. 로드와 같은 대규모 RPC의 스레드 풀과 격리됩니다. `-1`은 `max(64, 2 × CPU cores)`를 의미합니다. 동적으로 수정할 수 없습니다.
* 기본값: -1

#### `brpc_peer_fetch_pool_max_queue_size` {#brpc_peer_fetch_pool_max_queue_size}

* 유형: int32
* 설명: 4.2.0 버전부터 추가되었습니다. 제공 측 피어 읽기 스레드 풀의 큐 길이입니다. `-1`은 `max(4096, 128 × CPU cores)`를 의미합니다. 동적으로 수정할 수 없습니다.
* 기본값: -1

#### `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num` {#min_peer_race_s3_thread_num--max_peer_race_s3_thread_num}

* 유형: int32
* 설명: 4.2.0 버전부터 추가되었습니다. 피어와 객체 스토리지 간 경쟁 중 요청 측에서 객체 스토리지 읽기를 수행하는 풀의 최소/최대 스레드 수입니다. 동적으로 수정할 수 없습니다.
* 기본값: 0 / 32

#### `s3_get_requests_per_second_per_core` / `s3_put_requests_per_second_per_core` {#s3_get_requests_per_second_per_core--s3_put_requests_per_second_per_core}

* 유형: int64
* 설명: 4.1.4 버전부터 추가되었습니다. CPU 코어당 계산되는 객체 스토리지 GET/PUT 요청 QPS 제한입니다. 음수 값은 이 모드를 비활성화하고 기존의 절대 토큰 구성으로 폴백합니다. `0`은 QPS 제한이 없음을 의미합니다.
* 기본값: -1

#### `s3_get_requests_per_second_max` / `s3_put_requests_per_second_max` {#s3_get_requests_per_second_max--s3_put_requests_per_second_max}

* 유형: int64
* 설명: 4.1.4 버전부터 추가되었습니다. CPU 코어 수에서 계산되는 GET/PUT QPS의 하드 상한입니다. `0` 이하이면 상한이 없습니다.
* 기본값: 0

#### `s3_get_bytes_per_second_per_core` / `s3_put_bytes_per_second_per_core` {#s3_get_bytes_per_second_per_core--s3_put_bytes_per_second_per_core}

* 유형: int64
* 설명: 4.1.4 버전부터 추가되었습니다. CPU 코어당 계산되는 객체 스토리지 GET/PUT 대역폭 제한(코어당 초당 바이트 수)입니다. `0` 이하이면 대역폭 제한이 없습니다.
* 기본값: -1

#### `s3_get_bytes_per_second_max` / `s3_put_bytes_per_second_max` {#s3_get_bytes_per_second_max--s3_put_bytes_per_second_max}

* 유형: int64
* 설명: 4.1.4 버전부터 추가되었습니다. CPU 코어 수에서 계산되는 GET/PUT 대역폭의 하드 상한(초당 바이트)입니다. `0` 이하이면 상한이 없습니다.
* 기본값: 0

#### `s3_rate_limiter_cpu_cores_override` {#s3_rate_limiter_cpu_cores_override}

* 유형: int32
* 설명: 4.1.4 버전부터 추가되었습니다. 위 속도 제한을 계산하는 데 사용할 CPU 코어 수입니다. `0` 이하이면 시스템의 코어 수를 자동으로 감지합니다.
* 기본값: 0

#### `s3_rate_limiter_log_interval` {#s3_rate_limiter_log_interval}

* 유형: int64
* 설명: 4.1.4 버전부터 추가되었습니다. 객체 스토리지 속도 제한이 트리거될 때 출력되는 로그 항목 사이의 최소 간격(밀리초)입니다.
* 기본값: 1000

#### `file_cache_mem_storage_shard_num` {#file_cache_mem_storage_shard_num}

* 유형: int32
* 설명: 4.1.4 버전부터 추가되었습니다. 동시 액세스 시 잠금 경합을 줄이는 파일 캐시 메모리 저장소의 샤드 수입니다.
* 기본값: 1024

#### `time_series_max_tablet_version_num` {#time_series_max_tablet_version_num}

* 유형: int
* 설명: time-series compaction 정책에서 하나의 tablet이 가질 수 있는 버전 수를 제한합니다. 너무 잦은 로드 또는 시기적절하지 않은 compaction으로 인한 버전 누적을 방지하는 데 사용됩니다. 제한을 초과하면 로드 작업이 거부됩니다.
* 기본값: 20000
