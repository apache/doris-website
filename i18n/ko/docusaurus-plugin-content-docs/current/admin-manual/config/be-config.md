---
{
    "title": "BE 구성",
    "language": "ko",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "이 문서는 BE의 주요 구성 항목을 소개합니다."
}
---

# BE 구성 {#be-configuration}

이 문서는 BE의 주요 구성 항목을 소개합니다.

BE 구성 파일 `be.conf`는 일반적으로 BE 배포 경로의 `conf/` 디렉터리에 저장됩니다. 버전 0.14에서는 `be_custom.conf`라는 구성 파일이 추가됩니다. 이 파일은 사용자가 실행 중에 동적으로 설정하고 영구 저장한 구성 항목을 기록합니다.

BE 프로세스가 시작되면 먼저 `be.conf`의 구성 항목을 읽고, 이어서 `be_custom.conf`의 구성 항목을 읽습니다. `be_custom.conf`의 항목은 `be.conf`의 동일한 항목을 덮어씁니다.

`be_custom.conf` 파일의 위치는 `be.conf`의 `custom_config_dir` 구성 항목으로 지정할 수 있습니다.

## 구성 항목 조회 {#view-configuration-items}

BE 구성 항목은 다음 두 가지 방법으로 조회할 수 있습니다.

1. BE 웹 페이지

    BE 웹 페이지에서 현재 구성 항목을 조회할 수 있습니다.

    `http://be_host:be_webserver_port/varz`

2. 명령으로 조회

   MySQL 클라이언트에서 다음 명령으로 BE 구성 항목을 조회할 수 있습니다. 자세한 구문은 [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG)를 참조하세요.

    `SHOW BACKEND CONFIG;`

    결과의 각 열은 다음을 의미합니다.

    1. BackendId: backend의 ID.
    2. Host: backend의 IP.
    3. Key: 구성 항목의 이름.
    4. Value: 현재 구성 항목의 값.
    5. Type: 정수나 문자열과 같은 구성 항목 값의 유형.
    6. IsMutable: 동적 설정 가능 여부. true이면 실행 중에 구성 항목을 동적으로 설정할 수 있습니다. false이면 `be.conf`에서만 설정할 수 있으며 BE를 재시작한 후 적용됩니다.

## 구성 항목 설정 {#set-configuration-items}

BE 구성 항목은 다음 두 가지 방법으로 설정할 수 있습니다.

1. 정적 설정

   `conf/be.conf` 파일에 구성 항목을 추가하고 값을 설정합니다. `be.conf`의 구성 항목은 BE 시작 시 읽힙니다. `be.conf`에 없는 항목에는 기본값이 사용됩니다.

2. 동적 설정

   BE가 시작된 후 다음 명령으로 구성 항목을 동적으로 설정할 수 있습니다.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}
    ```

   버전 0.13 이하에서는 이 방법으로 변경한 구성 항목이 BE 프로세스를 재시작하면 효력을 잃습니다. 버전 0.14 이상에서는 다음 명령으로 변경 내용을 영구 저장할 수 있습니다. 변경된 구성 항목은 `be_custom.conf` 파일에 저장됩니다.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}\&persist=true
    ```

## 예시 {#examples}

1. `max_base_compaction_threads`를 정적으로 변경

   `be.conf` 파일에 다음을 추가합니다.

   ```max_base_compaction_threads=5```

   그런 다음 BE 프로세스를 재시작하여 설정을 적용합니다.

2. `streaming_load_max_mb`를 동적으로 변경

   BE가 시작된 후 다음 명령으로 `streaming_load_max_mb` 구성 항목을 동적으로 설정합니다.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024
    ```

   다음 반환값은 설정이 성공했음을 나타냅니다.

    ```
    {
        "status": "OK",
        "msg": ""
    }
    ```

   BE를 재시작하면 이 설정은 효력을 잃습니다. 변경 내용을 영구 저장하려면 다음 명령을 사용하세요.

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024\&persist=true
    ```

## 구성 항목 {#configurations}

### 서비스 {#services}

#### `deploy_mode` {#deploy_mode}

* 유형: string
* 설명: BE의 실행 모드입니다. `cloud`는 스토리지와 컴퓨팅이 분리된 모드를 나타냅니다.
* 기본값: ""

#### `bvar_max_dump_multi_dimension_metric_num` {#bvar_max_dump_multi_dimension_metric_num}

* 유형: string
* 설명: 버전 4.1.5부터 지원합니다. `/brpc_metrics`가 내보내는 다차원 bvar 메트릭 샘플의 최대 개수입니다. `0`으로 설정하면 이 샘플을 비활성화합니다. 변경 사항을 적용하려면 BE를 재시작해야 합니다.
* 기본값: 5000

#### `be_port` {#be_port}

* 유형: int32
* 설명: FE의 요청을 수신하는 BE의 Thrift 서버 포트입니다.
* 기본값: 9060

#### `heartbeat_service_port` {#heartbeat_service_port}

* 유형: int32
* 설명: FE의 하트비트를 수신하는 BE의 하트비트 서비스 포트(Thrift)입니다.
* 기본값: 9050

#### `webserver_port` {#webserver_port}

* 유형: int32
* 설명: BE의 HTTP 서버 서비스 포트입니다.
* 기본값: 8040

#### `brpc_port` {#brpc_port}

* 유형: int32
* 설명: BE 간 통신에 사용되는 BE의 BRPC 포트입니다.
* 기본값: 8060

#### `arrow_flight_sql_port` {#arrow_flight_sql_port}

* 유형: int32
* 설명: Arrow Flight Client와 BE 간 통신에 사용되는 BE의 Arrow Flight SQL 서버 포트입니다.
* 기본값: -1

#### `enable_https` {#enable_https}

* 유형: bool
* 설명: HTTPS 지원 여부입니다. 지원하는 경우 be.conf에 `ssl_certificate_path`와 `ssl_private_key_path`를 설정하세요.
* 기본값: false

#### `priority_networks` {#priority_networks}

* 설명: IP가 여러 개인 서버에서 사용할 IP 선택 규칙을 지정합니다. 이 목록에 일치하는 IP는 최대 하나여야 합니다. 목록은 10.10.10.0/24처럼 CIDR 표기법을 사용하며 세미콜론으로 구분합니다. 규칙에 일치하는 IP가 없으면 무작위로 하나를 선택합니다.
* 기본값: 공란

#### `storage_root_path` {#storage_root_path}

* 유형: string

* 설명: 데이터 루트 경로를 세미콜론 ';'으로 구분하여 지정합니다. 각 루트 경로의 저장 매체를 HDD 또는 SSD로 지정할 수 있습니다. 각 루트 경로 끝에 쉼표 ','로 구분한 용량 제한을 추가할 수도 있습니다. SSD와 HDD 디스크를 혼용하지 않는다면 아래 예시 1과 예시 2의 방식으로 설정할 필요 없이 저장 디렉터리만 지정하면 됩니다. FE의 기본 저장 매체 설정도 변경할 필요가 없습니다.

  예시 1: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

    - 1./home/disk1/doris.HDD는 저장 매체가 HDD임을 나타냅니다.
    - 2./home/disk2/doris.SSD는 저장 매체가 SSD임을 나타냅니다.
    - 3./home/disk2/doris는 기본 저장 매체가 HDD임을 나타냅니다.

  예시 2: `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

    - 1./home/disk1/doris,medium:hdd는 저장 매체가 HDD임을 나타냅니다.
    - 2./home/disk2/doris,medium:ssd는 저장 매체가 SSD임을 나타냅니다.

* 기본값: ${DORIS_HOME}/storage

#### `heartbeat_service_thread_count` {#heartbeat_service_thread_count}

* 유형: int32
* 설명: BE에서 하트비트 서비스를 실행하는 스레드 수입니다. 기본값은 1이며 변경하지 않는 것이 좋습니다.
* 기본값: 1

#### `ignore_broken_disk` {#ignore_broken_disk}

* 유형: bool
* 설명: BE 시작 시 ``storage_root_path`` 구성에 지정된 모든 경로를 검사합니다.

    -  `ignore_broken_disk=true`

  경로가 없거나 해당 경로의 파일을 읽거나 쓸 수 없는 경우(디스크 장애), 해당 경로를 무시합니다. 다른 사용 가능한 경로가 있으면 시작을 중단하지 않습니다.

    -  `ignore_broken_disk=false`

  경로가 없거나 해당 경로의 파일을 읽거나 쓸 수 없는 경우(디스크 장애), 시작에 실패하고 프로세스가 종료됩니다.

* 기본값: false

#### `mem_limit` {#mem_limit}

* 유형: string
* 설명: BE 프로세스가 사용할 수 있는 서버 최대 메모리의 비율을 제한합니다. BE가 머신의 메모리를 지나치게 차지하지 않도록 합니다. 이 매개변수는 0보다 커야 합니다. 비율이 100%를 넘으면 값은 100%로 처리됩니다.
* 기본값: 90%

#### `cluster_id` {#cluster_id}

* 유형: int32
* 설명: BE가 속한 클러스터 ID를 설정합니다.
    - 일반적으로 FE가 하트비트를 통해 BE에 이 값을 전달하므로 별도로 설정할 필요가 없습니다. BE가 특정 Doris 클러스터에 속하는 것이 확인된 경우 설정할 수 있습니다. 이때 데이터 디렉터리의 cluster_id 파일도 이 매개변수와 동일하게 수정해야 합니다.
* 기본값: -1

#### `custom_config_dir` {#custom_config_dir}

* 설명: `be_custom.conf` 파일의 위치를 지정합니다. 기본 위치는 `conf/` 디렉터리입니다.
    - 일부 배포 환경에서는 시스템 업그레이드 시 `conf/` 디렉터리가 덮어써질 수 있습니다. 그러면 사용자가 변경한 구성 항목도 덮어써집니다. 이를 방지하려면 `be_custom.conf`를 별도로 지정한 디렉터리에 저장할 수 있습니다.
* 기본값: 공란

#### `trash_file_expire_time_sec` {#trash_file_expire_time_sec}

* 설명: 휴지통 정리 간격은 24시간입니다. 디스크 공간이 부족하면 trash 아래 파일의 보존 기간이 이 매개변수를 따르지 않을 수 있습니다.
* 기본값: 86400

#### `es_http_timeout_ms` {#es_http_timeout_ms}

* 설명: HTTP를 통해 ES에 연결할 때의 제한 시간입니다.
* 기본값: 5000 (ms)

#### `es_scroll_keepalive` {#es_scroll_keepalive}

* 설명: ES scroll의 keep-alive 유지 시간입니다.
* 기본값: 5 (m)

#### `external_table_connect_timeout_sec` {#external_table_connect_timeout_sec}

* 유형: int32
* 설명: ODBC 테이블 같은 외부 테이블과 연결을 설정할 때의 제한 시간입니다.
* 기본값: 5초

#### `pipeline_status_report_interval` {#pipeline_status_report_interval}

* 설명: 프로파일 보고 사이의 간격입니다.
* 기본값: 5초

#### `brpc_max_body_size` {#brpc_max_body_size}

* 설명: 주로 brpc의 `max_body_size` 매개변수를 변경하는 데 사용합니다.

  - 쿼리가 실패하고 BE 로그에 `body_size is too large` 오류가 표시되는 경우가 있습니다. SQL 모드가 "multi distinct + no group by + more than 1T of data"일 때 발생할 수 있습니다. 이 오류는 brpc 패킷 크기가 설정값을 초과했음을 뜻합니다. 설정값을 늘리면 오류를 방지할 수 있습니다.

#### `brpc_socket_max_unwritten_bytes` {#brpc_socket_max_unwritten_bytes}

* 설명: 주로 brpc의 `socket_max_unwritten_bytes` 매개변수를 변경하는 데 사용합니다.
  - 쿼리가 실패하고 BE 로그에 `The server is overcrowded` 오류가 표시되는 경우가 있습니다. 송신 측에 버퍼링할 메시지가 너무 많다는 뜻이며, SQL이 큰 bitmap 값을 전송해야 할 때 발생할 수 있습니다. 설정값을 늘리면 오류를 방지할 수 있습니다.

#### `transfer_large_data_by_brpc` {#transfer_large_data_by_brpc}

* 유형: bool
* 설명: Tuple/Block 데이터의 길이가 1.8G를 초과할 때 protoBuf 요청을 직렬화하고 Tuple/Block 데이터를 controller attachment에 포함하여 HTTP brpc로 전송할지 제어합니다. protoBuf 요청의 길이가 2G를 초과할 때 발생하는 오류 `Bad request, error_text=[E1003]Fail to compress request`를 방지하기 위한 설정입니다. 이전 버전에서는 Tuple/Block 데이터를 attachment에 넣은 뒤 기본 baidu_std brpc로 전송했지만, attachment가 2G를 넘으면 잘립니다. HTTP brpc 전송에는 2G 제한이 없습니다.
* 기본값: true

#### `brpc_num_threads` {#brpc_num_threads}

* 설명: 주로 brpc의 bthreads 수를 변경하는 데 사용합니다. 기본값은 256입니다.
  - QPS 성능을 높이려면 더 큰 값으로 설정할 수 있습니다. 자세한 내용은 `https://github.com/apache/incubator-brpc/blob/master/docs/cn/benchmark.md`를 참조하세요.
* 기본값: 256

#### `thrift_rpc_timeout_ms` {#thrift_rpc_timeout_ms}

* 설명: Thrift의 기본 제한 시간입니다.
* 기본값: 60000

#### `thrift_client_retry_interval_ms` {#thrift_client_retry_interval_ms}

* 유형: int64
* 설명: FE Thrift 서버의 과부하를 방지하기 위해 BE의 Thrift 클라이언트 재시도 간격을 설정합니다. 단위는 ms입니다.
* 기본값: 1000

#### `thrift_connect_timeout_seconds` {#thrift_connect_timeout_seconds}

* 설명: Thrift 클라이언트 연결의 기본 제한 시간입니다.
* 기본값: 3 (s)

#### `thrift_server_type_of_fe` {#thrift_server_type_of_fe}

* 유형: string
* 설명: FE의 Thrift 서비스가 사용하는 서비스 모델을 나타냅니다. 값은 대소문자를 구분하지 않는 문자열이며 FE의 thrift_server_type 매개변수 설정과 일치해야 합니다. 현재 `THREADED`와 `THREAD_POOL` 두 값을 사용할 수 있습니다.

    - `THREADED`이면 비차단 I/O 모델입니다.

    - `THREAD_POOL`이면 차단 I/O 모델입니다.

#### `thrift_max_message_size` {#thrift_max_message_size}

기본값: 100MB

Thrift 서버가 수신하는 메시지의 최대 크기(바이트)입니다. 클라이언트가 보낸 메시지가 이 제한을 초과하면 Thrift 서버가 요청을 거부하고 연결을 닫습니다. 이 경우 클라이언트에 "connection has been closed by peer." 오류가 발생합니다. 이 매개변수를 늘려 볼 수 있습니다.

#### `txn_commit_rpc_timeout_ms` {#txn_commit_rpc_timeout_ms}

* 설명: txn 제출 RPC의 제한 시간입니다.
* 기본값: 60,000 (ms)

#### `txn_map_shard_size` {#txn_map_shard_size}

* 설명: txn_map_lock의 샤드 크기입니다. 값은 2^n이며 n=0,1,2,3,4입니다. txn 관리 성능을 높이는 기능입니다.
* 기본값: 128

#### `txn_shard_size` {#txn_shard_size}

* 설명: txn_lock의 샤드 크기입니다. 값은 2^n이며 n=0,1,2,3,4입니다. txn 제출 및 게시 성능을 높이는 기능입니다.
* 기본값: 1024

#### `unused_rowset_monitor_interval` {#unused_rowset_monitor_interval}

* 설명: 만료된 Rowset을 정리하는 시간 간격입니다.
* 기본값: 30 (s)

#### `max_client_cache_size_per_host` {#max_client_cache_size_per_host}

* 설명: 호스트당 최대 클라이언트 캐시 수입니다. BE에는 여러 종류의 클라이언트 캐시가 있지만 현재는 동일한 캐시 크기 설정을 사용합니다. 필요한 경우 서로 다른 설정으로 각 클라이언트 캐시를 설정하세요.
* 기본값: 10

#### `string_type_length_soft_limit_bytes` {#string_type_length_soft_limit_bytes}

* 유형: int32
* 설명: String 유형의 최대 길이에 대한 소프트 제한입니다.
* 기본값: 1,048,576

#### `big_column_size_buffer` {#big_column_size_buffer}

* 유형: int64
* 설명: ODBC 외부 테이블 사용 시 ODBC 소스 테이블의 열 유형이 HLL, CHAR 또는 VARCHAR이고 열 값의 길이가 이 값을 초과하면 쿼리에 'column value length longer than buffer length' 오류가 발생합니다. 이 값을 늘릴 수 있습니다.
* 기본값: 65535

#### `small_column_size_buffer` {#small_column_size_buffer}

* 유형: int64
* 설명: ODBC 외부 테이블 사용 시 ODBC 소스 테이블의 열 유형이 HLL, CHAR 또는 VARCHAR가 아니고 열 값의 길이가 이 값을 초과하면 쿼리에 'column value length longer than buffer length' 오류가 발생합니다. 이 값을 늘릴 수 있습니다.
* 기본값: 100

### 쿼리 {#query}

#### `ignore_not_found_file_in_external_table` {#ignore_not_found_file_in_external_table}

* 유형: bool
* 설명: 외부 테이블 리더가 누락된 파일을 건너뛸 수 있는지 지정합니다. 동적 설정을 지원합니다. 버전 4.1.5부터는 커밋된 Iceberg 스냅샷의 데이터 파일이나 삭제 파일이 누락된 경우 이 값이 `true`여도 쿼리가 실패합니다. 불완전한 스냅샷이 오류 없이 반환되는 것을 방지하기 위한 동작입니다.
* 기본값: true

#### `parquet_metadata_size_limit` {#parquet_metadata_size_limit}

* 유형: int64
* 설명: 버전 4.1.5부터 지원합니다. 네이티브 Parquet V2 리더에서 직렬화된 파일 footer 메타데이터의 최대 크기(바이트)입니다. `0`보다 커야 합니다. 제한을 초과하면 `Parquet v2 footer size ... exceeds metadata limit ...`가 반환됩니다. 동적 설정을 지원합니다. footer가 큰 유효한 파일을 처리해야 한다면 메모리 예산 내에서 값을 늘리세요.
* 기본값: 268435456 (256 MiB)

#### `fragment_mgr_asynic_work_pool_queue_size` {#fragment_mgr_asynic_work_pool_queue_size}

* 설명: 단일 노드에서 처리할 수 있는 비동기 작업의 상한입니다.
* 기본값: 4096

#### `fragment_mgr_asynic_work_pool_thread_num_min` {#fragment_mgr_asynic_work_pool_thread_num_min}

* 설명: 비동기 작업을 실행하는 스레드 수입니다. 기본 최소 스레드 수는 16입니다.
* 기본값: 16

#### `fragment_mgr_asynic_work_pool_thread_num_max` {#fragment_mgr_asynic_work_pool_thread_num_max}

* 설명: 후속 비동기 작업에 따라 스레드를 동적으로 생성하며 최대 512개까지 생성합니다.
* 기본값: 512

#### `doris_scanner_row_num` {#doris_scanner_row_num}

* 설명: 각 스캔 스레드가 한 번의 실행에서 반환하는 데이터 행의 최대 개수입니다.
* 기본값: 16384

#### `doris_scanner_row_bytes` {#doris_scanner_row_bytes}

* 설명: 한 번의 읽기 실행에서 fragment의 행에 허용되는 바이트 수입니다.
    - 참고: 테이블에 열이 너무 많아 `select *`가 멈추는 경우 이 설정을 조정할 수 있습니다.
* 기본값: 10485760

#### `doris_scanner_thread_pool_queue_size` {#doris_scanner_thread_pool_queue_size}

* 유형: int32
* 설명: Scanner 스레드 풀의 큐 길이입니다. Doris 스캔 작업에서는 각 Scanner가 스레드 작업으로 스레드 풀에 제출되어 스케줄링을 기다립니다. 제출된 작업 수가 큐 길이를 초과하면 이후 제출되는 작업은 큐에 빈자리가 생길 때까지 차단됩니다.
* 기본값: 102400

#### `doris_scanner_thread_pool_thread_num` {#doris_scanner_thread_pool_thread_num}

* 유형: int32
* 설명: Scanner 스레드 풀의 스레드 수입니다. Doris 스캔 작업에서는 각 Scanner가 스레드 작업으로 스레드 풀에 제출되어 스케줄링됩니다. 이 매개변수는 Scanner 스레드 풀의 크기를 결정합니다.
* 기본값: CPU 코어 수에 따라 달라집니다. `max(48, 2 * num_of_cpu_cores)`와 같습니다.

#### `doris_max_remote_scanner_thread_pool_thread_num` {#doris_max_remote_scanner_thread_pool_thread_num}

* 유형: int32
* 설명: Remote scanner 스레드 풀의 최대 스레드 수입니다. 이 풀은 모든 외부 데이터 소스의 스캔 작업에 사용됩니다.
* 기본값: 512

#### `exchg_node_buffer_size_bytes` {#exchg_node_buffer_size_bytes}

* 유형: int32
* 설명: ExchangeNode 노드의 Buffer 큐 크기(바이트)입니다. Sender 측에서 보낸 데이터량이 ExchangeNode의 Buffer 크기를 넘으면 이후 전송은 Buffer에 쓸 공간이 생길 때까지 차단됩니다.
* 기본값: 10485760

#### `doris_scan_range_max_mb` {#doris_scan_range_max_mb}

* 유형: int32
* 설명: 각 OlapScanner가 읽는 최대 데이터량입니다.
* 기본값: 1024

### 컴팩션 {#compaction}

#### `disable_auto_compaction` {#disable_auto_compaction}

* 유형: bool
* 설명: 자동 컴팩션 작업을 비활성화할지 지정합니다.
  - 일반적으로 비활성 상태로 두어야 합니다. 디버깅이나 테스트 환경에서 컴팩션 작업을 수동으로 수행하려면 이 설정을 활성화할 수 있습니다.
* 기본값: false

#### `enable_vertical_compaction` {#enable_vertical_compaction}

* 유형: bool
* 설명: 수직 컴팩션을 활성화할지 지정합니다.
* 기본값: true

#### `vertical_compaction_num_columns_per_group` {#vertical_compaction_num_columns_per_group}

* 유형: int32
* 설명: 수직 컴팩션에서 각 그룹에 포함되는 열 수입니다.
* 기본값: 5

#### `vertical_compaction_max_row_source_memory_mb` {#vertical_compaction_max_row_source_memory_mb}

* 유형: int32
* 설명: 수직 컴팩션에서 row_source_buffer가 사용하는 최대 메모리입니다. 단위는 MB입니다.
* 기본값: 200

#### `vertical_compaction_max_segment_size` {#vertical_compaction_max_segment_size}

* 유형: int32
* 설명: 수직 컴팩션에서 대상 segment 파일의 최대 크기입니다. 단위는 m바이트입니다.
* 기본값: 268435456

#### `enable_ordered_data_compaction` {#enable_ordered_data_compaction}

* 유형: bool
* 설명: 정렬된 데이터의 컴팩션을 활성화할지 지정합니다.
* 기본값: true

#### `ordered_data_compaction_min_segment_size` {#ordered_data_compaction_min_segment_size}

* 유형: int32
* 설명: 정렬된 데이터 컴팩션에서 입력 rowset의 최소 segment 크기입니다. 단위는 m바이트입니다.
* 기본값: 10485760

#### `max_base_compaction_threads` {#max_base_compaction_threads}

* 유형: int32
* 설명: base compaction 스레드 풀의 최대 스레드 수입니다. -1은 디스크당 스레드 하나를 의미합니다.
* 기본값: 4

#### `generate_compaction_tasks_interval_ms` {#generate_compaction_tasks_interval_ms}

* 설명: 컴팩션 작업을 생성하는 최소 간격(ms)입니다.
* 기본값: 10 (ms)

#### `base_compaction_min_rowset_num` {#base_compaction_min_rowset_num}

* 설명: BaseCompaction 트리거 조건 중 하나로, Cumulative 파일 수가 도달해야 하는 한도입니다. 이 한도에 도달하면 BaseCompaction이 트리거됩니다.
* 기본값: 5

#### `base_compaction_min_data_ratio` {#base_compaction_min_data_ratio}

* 설명: BaseCompaction 트리거 조건 중 하나로, Cumulative 파일 크기가 Base 파일 크기에 대해 도달해야 하는 비율입니다.
* 기본값: 0.3 (30%)

#### `total_permits_for_compaction_score` {#total_permits_for_compaction_score}

* 유형: int64
* 설명: 모든 컴팩션 작업이 보유할 수 있는 "permits"의 상한입니다. 컴팩션의 메모리 사용량을 제한하는 데 사용할 수 있습니다.
* 기본값: 10000
* 동적 변경 가능: 예

#### `compaction_promotion_size_mbytes` {#compaction_promotion_size_mbytes}

* 유형: int64
* 설명: cumulative compaction의 출력 rowset이 사용하는 총 디스크 크기가 이 설정값을 초과하면 해당 rowset을 base compaction에 사용합니다. 단위는 m바이트입니다.
  - 일반적으로 cumulative compaction 시간이 지나치게 길어져 버전이 쌓이는 것을 방지하려면 설정값을 2G 미만으로 둡니다.
* 기본값: 1024

#### `compaction_promotion_ratio` {#compaction_promotion_ratio}

* 유형: double
* 설명: cumulative compaction 출력 rowset의 총 디스크 크기가 base 버전 rowset에 대해 설정한 비율을 초과하면 해당 rowset을 base compaction에 사용합니다.
  - 일반적으로 설정값은 0.1보다 높지 않고 0.02보다 낮지 않게 하는 것이 좋습니다.
* 기본값: 0.05

#### `compaction_promotion_min_size_mbytes` {#compaction_promotion_min_size_mbytes}

* 유형: int64
* 설명: cumulative compaction 출력 rowset의 총 디스크 크기가 이 설정값보다 작으면 해당 rowset에는 base compaction을 수행하지 않고 cumulative compaction 과정에 그대로 둡니다. 단위는 m바이트입니다.
  - 일반적으로 설정값은 512m 이내로 둡니다. 너무 크게 설정하면 초기 base 버전의 크기가 너무 작아 base compaction이 수행되지 않습니다.
* 기본값: 128

#### `compaction_min_size_mbytes` {#compaction_min_size_mbytes}

* 유형: int64
* 설명: cumulative compaction에서 병합 대상으로 선택한 rowset의 디스크 크기가 이 설정값보다 크면 레벨 정책에 따라 나누어 병합합니다. 작으면 바로 병합합니다. 단위는 m바이트입니다.
  - 일반적으로 설정값은 128m 이내로 둡니다. 너무 크게 설정하면 cumulative compaction의 쓰기 증폭이 커집니다.
* 기본값: 64

#### `default_rowset_type` {#default_rowset_type}

* 유형: string
* 설명: BE가 기본으로 선택하는 저장 형식을 지정합니다. 설정 가능한 값은 "**ALPHA**", "**BETA**"입니다. 주로 다음 두 용도로 사용합니다.
  - 테이블의 storage_format을 Default로 설정한 경우 이 구성으로 BE의 저장 형식을 선택합니다.
  - BE가 Compaction을 수행할 때 저장 형식을 선택합니다.
* 기본값: BETA

#### `cumulative_compaction_min_deltas` {#cumulative_compaction_min_deltas}

* 설명: Cumulative compaction 정책에서 증분 파일의 최소 개수입니다.
* 기본값: 5

#### `cumulative_compaction_max_deltas` {#cumulative_compaction_max_deltas}

* 설명: Cumulative compaction 정책에서 증분 파일의 최대 개수입니다.
* 기본값: 1000

#### `base_compaction_trace_threshold` {#base_compaction_trace_threshold}

* 유형: int32
* 설명: Base compaction의 trace 정보를 로그에 기록하는 임계값입니다. 단위는 초입니다.
* 기본값: 10

Base compaction은 오래 걸리는 백그라운드 작업입니다. 이 설정은 trace 정보를 기록할지 결정하는 임계값입니다. 로그 파일의 trace 정보는 다음과 같습니다.

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
* 설명: Cumulative compaction의 trace 정보를 로그에 기록하는 임계값입니다. 단위는 초입니다.
  - `base_compaction_trace_threshold`와 유사합니다.
* 기본값: 2

#### `compaction_task_num_per_disk` {#compaction_task_num_per_disk}

* 유형: int32
* 설명: 디스크(HDD) 하나에서 병렬로 실행하는 컴팩션 작업 수입니다.
* 기본값: 4

#### `compaction_task_num_per_fast_disk` {#compaction_task_num_per_fast_disk}

* 유형: int32
* 설명: 고속 디스크(SSD) 하나에서 병렬로 실행하는 컴팩션 작업 수입니다.
* 기본값: 8

#### `cumulative_compaction_rounds_for_each_base_compaction_round` {#cumulative_compaction_rounds_for_each_base_compaction_round}

* 유형: int32
* 설명: 컴팩션 작업을 생성할 때 base compaction 한 라운드마다 수행하는 cumulative compaction 라운드 수입니다.
* 기본값: 9

#### `max_cumu_compaction_threads` {#max_cumu_compaction_threads}

* 유형: int32
* 설명: cumulative compaction 스레드 풀의 최대 스레드 수입니다. -1은 디스크당 스레드 하나를 의미합니다.
* 기본값: -1

#### `enable_segcompaction` {#enable_segcompaction}

* 유형: bool
* 설명: 데이터 적재 중 segment compaction을 사용하여 -238 오류를 방지합니다.
* 기본값: true

#### `segcompaction_batch_size` {#segcompaction_batch_size}

* 유형: int32
* 설명: segment 수가 이 임계값을 초과하면 segment compaction이 트리거됩니다. 단일 segment compaction 작업에 포함할 수 있는 원본 segment의 최대 개수도 제한합니다.
* 기본값: 10

#### `segcompaction_candidate_max_rows` {#segcompaction_candidate_max_rows}

* 유형: int32
* 설명: 단일 원본 segment에 허용되는 최대 행 수입니다. 더 큰 segment는 건너뜁니다.
* 기본값: 1048576

#### `segcompaction_candidate_max_bytes` {#segcompaction_candidate_max_bytes}

* 유형: int64
* 설명: 단일 원본 segment에 허용되는 최대 파일 크기입니다. 더 큰 segment는 건너뜁니다.
* 기본값: 104857600

#### `segcompaction_task_max_rows` {#segcompaction_task_max_rows}

* 유형: int32
* 설명: 단일 segcompaction 작업에 허용되는 최대 총 행 수입니다.
* 기본값: 1572864

#### `segcompaction_task_max_bytes` {#segcompaction_task_max_bytes}

* 유형: int64
* 설명: 단일 segcompaction 작업에 허용되는 최대 총 파일 크기입니다.
* 기본값: 157286400

#### `segcompaction_num_threads` {#segcompaction_num_threads}

* 유형: int32
* 설명: 전역 segcompaction 스레드 풀의 크기입니다.
* 기본값: 5

#### `disable_compaction_trace_log` {#disable_compaction_trace_log}

* 유형: bool
* 설명: 컴팩션 trace 로그를 비활성화합니다.
  - true로 설정하면 `cumulative_compaction_trace_threshold`와 `base_compaction_trace_threshold`가 작동하지 않고 로그 기록이 비활성화됩니다.
* 기본값: true

#### `pick_rowset_to_compact_interval_sec` {#pick_rowset_to_compact_interval_sec}

* 유형: int64
* 설명: 컴팩션할 rowset을 선택하는 시간 간격(초)입니다.
* 기본값: 86400

#### `update_replica_infos_interval_seconds` {#update_replica_infos_interval_seconds}

* 설명: 피어 복제본 정보를 갱신하는 최소 간격(s)입니다.
* 기본값: 60 (s)

#### `cold_data_compaction_score_threshold` {#cold_data_compaction_score_threshold}

* 유형: int32
* 설명: 콜드 데이터의 컴팩션을 트리거하기 전에 적용하는 최소 컴팩션 점수 임계값입니다. 콜드 데이터의 컴팩션 점수가 이 임계값을 초과하면 컴팩션을 고려합니다. 값을 조정하면 원격 스토리지의 콜드 데이터에 대한 컴팩션 빈도와 강도를 제어할 수 있습니다. 버전 3.1.3부터 지원합니다.
* 기본값: 100

#### `cold_data_compaction_thread_num` {#cold_data_compaction_thread_num}

* 유형: int32
* 설명: 콜드 데이터 컴팩션에 사용되는 스레드 수입니다. 컴팩션 작업의 병렬도를 제어합니다. 값을 늘리면 더 많은 작업을 동시에 실행하여 처리량을 높일 수 있지만 리소스 사용량도 늘어날 수 있습니다.
* 기본값: 2

#### `cold_data_compaction_interval_sec` {#cold_data_compaction_interval_sec}

* 유형: int32
* 설명: 콜드 데이터 컴팩션 트리거 사이의 간격(초)입니다. 간격이 짧을수록 컴팩션을 더 자주 고려하므로 정리가 빨라질 수 있지만 리소스 사용량이 늘어납니다.
* 기본값: 1800 (초)

#### `enable_compaction_pause_on_high_memory` {#enable_compaction_pause_on_high_memory}

* 유형: bool
* 설명: 프로세스 메모리 사용량이 높을 때 컴팩션 작업을 일시 중지할지 지정합니다. 동적 변경을 지원합니다.
  - 활성화하면 메모리 압박이 있을 때 BE가 컴팩션을 일시 중지하고 쿼리와 데이터 적재를 우선합니다.
  - 그러나 컴팩션을 일시 중지하면 컴팩션 점수가 높은 tablet의 병합이 더 어려워져 해소하려던 메타데이터와 메모리 적체가 심해집니다. **버전 4.0.8부터 기본값이 `true`에서 `false`로 변경되어**, 기본적으로 높은 메모리 사용량 때문에 컴팩션을 일시 중지하지 않습니다.
  - 이전 동작을 유지하려면 `true`로 설정하세요.
* 기본값: false (4.0.8 이전에는 true)

### 데이터 적재 {#load}

#### `request_cdc_client_timeout_ms` {#request_cdc_client_timeout_ms}

* 유형: int32
* 설명: CDC 클라이언트 요청의 제한 시간(밀리초)입니다. 동적 설정을 지원합니다. 버전 4.1.5에서는 느린 CDC 요청을 허용하기 위해 기본값을 `60000`에서 `120000`으로 높였습니다.
* 기본값: 120000 (4.1.5 이전에는 60000)

#### `enable_table_memtable_flush_backpressure` {#enable_table_memtable_flush_backpressure}

* 유형: bool
* 설명: 버전 4.1.4에서 추가되었습니다. 이 BE에서 한 테이블의 MemTable이 너무 많이 flush를 기다릴 때 해당 테이블에 대한 새 쓰기를 차단할지 지정합니다. FE 설정 `enable_adaptive_random_bucket_load`와 함께 사용하여 적응형 무작위 버킷 데이터 적재 중 MemTable이 쌓여 메모리 사용량이 늘어나는 것을 방지합니다.
* 기본값: true

#### `table_memtable_flush_pending_count_limit` {#table_memtable_flush_pending_count_limit}

* 유형: int32
* 설명: 버전 4.1.4에서 추가되었습니다. 이 BE에서 단일 테이블에 대해 flush를 기다릴 수 있는 MemTable의 최대 개수입니다. 제한을 초과하면 제한 아래로 내려갈 때까지 새 쓰기가 차단됩니다. `enable_table_memtable_flush_backpressure = true`인 경우에만 적용됩니다.
* 기본값: 10

#### `group_commit_max_wal_num_per_table` {#group_commit_max_wal_num_per_table}

* 유형: int32
* 설명: 버전 4.1.4에서 추가되었습니다. 단일 테이블에 존재할 수 있는 Group Commit WAL 파일의 최대 개수이며, `0`은 제한 없음을 뜻합니다. WAL 재생이 계속 실패하여 WAL이 이 제한을 넘게 쌓이면 해당 테이블의 `async_mode` Group Commit 데이터 적재가 `EXCEEDED_LIMIT` 오류와 함께 거부됩니다. 오류 메시지는 `Too many group commit async WALs for table ...`와 비슷합니다. 이 제한은 WAL이 끝없이 늘어나 디스크를 가득 채우는 것을 방지합니다.
* 기본값: 10

#### `enable_stream_load_record` {#enable_stream_load_record}

* 유형: bool
* 설명: Stream Load 기록 기능을 활성화할지 지정합니다. 기본적으로 비활성화되어 있습니다.
* 기본값: false

#### `load_data_reserve_hours` {#load_data_reserve_hours}

* 설명: mini load에 사용합니다. 이 시간이 지나면 mini load 데이터 파일을 삭제합니다.
* 기본값: 4 (h)

#### `push_worker_count_high_priority` {#push_worker_count_high_priority}

* 설명: HIGH 우선순위 작업을 처리하는 데이터 적재 스레드 수입니다.
* 기본값: 3

#### `push_worker_count_normal_priority` {#push_worker_count_normal_priority}

* 설명: NORMAL 우선순위 작업을 처리하는 데이터 적재 스레드 수입니다.
* 기본값: 3

#### `enable_single_replica_load` {#enable_single_replica_load}

* 설명: 단일 복제본 데이터 적재 기능을 활성화할지 지정합니다.
* 기본값: true

#### `load_error_log_reserve_hours` {#load_error_log_reserve_hours}

* 설명: 이 시간이 지나면 데이터 적재 오류 로그를 삭제합니다.
* 기본값: 48 (h)

#### `load_error_log_limit_bytes` {#load_error_log_limit_bytes}

* 설명: 데이터 적재 오류 로그가 이 값보다 크면 잘립니다.
* 기본값: 209715200 (byte)

#### `load_process_max_memory_limit_percent` {#load_process_max_memory_limit_percent}

* 설명: 단일 노드의 모든 데이터 적재 스레드가 차지할 수 있는 메모리 상한의 비율입니다. 기본값은 50%입니다.
  - 사용자가 Doris를 업그레이드할 때 데이터 적재 성능에 영향을 주지 않도록 이러한 기본값을 크게 설정합니다. 필요한 경우 사용자가 적절한 값으로 설정해야 합니다.
* 기본값: 50 (%)

#### `load_process_soft_mem_limit_percent` {#load_process_soft_mem_limit_percent}

* 설명: 소프트 제한은 단일 노드의 데이터 적재 메모리 제한에 대한 비율입니다. 예를 들어 모든 데이터 적재 작업의 메모리 제한이 20GB라면 소프트 제한의 기본값은 그 값의 50%인 10GB입니다. 데이터 적재 메모리 사용량이 소프트 제한을 초과하면 메모리를 가장 많이 사용하는 작업을 선택해 flush하여 메모리 공간을 확보합니다. 기본값은 50%입니다.
* 기본값: 50 (%)

#### `slave_replica_writer_rpc_timeout_sec` {#slave_replica_writer_rpc_timeout_sec}

* 유형: int32
* 설명: 단일 복제본 데이터 적재에서 master 복제본과 slave 복제본 사이 brpc의 제한 시간을 변경하는 데 사용합니다.
* 기본값: 60

#### `max_segment_num_per_rowset` {#max_segment_num_per_rowset}

* 유형: int32
* 설명: 데이터 적재 시 새로 생성되는 rowset의 segment 수를 제한합니다. 임계값을 넘으면 데이터 적재가 -238 오류와 함께 실패합니다. segment가 너무 많으면 컴팩션이 많은 메모리를 사용하여 OOM 오류가 발생할 수 있습니다.
* 기본값: 200

#### `high_priority_flush_thread_num_per_store` {#high_priority_flush_thread_num_per_store}

* 유형: int32
* 설명: 우선순위가 높은 데이터 적재 작업을 위해 각 저장 경로에 할당하는 flush 스레드 수입니다.
* 기본값: 1

#### `routine_load_consumer_pool_size` {#routine_load_consumer_pool_size}

* 유형: int32
* 설명: Routine Load가 사용하는 데이터 consumer의 캐시 수입니다.
* 기본값: 10

#### `multi_table_batch_plan_threshold` {#multi_table_batch_plan_threshold}

* 유형: int32
* 설명: 단일 스트림 다중 테이블 데이터 적재에 사용합니다. Kafka에서 메시지 배치를 수신할 때 배치 크기가 이 임계값을 넘으면 관련된 모든 테이블의 계획을 요청합니다.
* 기본값: 200

#### `multi_table_max_wait_tables` {#multi_table_max_wait_tables}

* 유형: int32
* 설명: 단일 스트림 다중 테이블 데이터 적재에 사용합니다. Kafka에서 메시지 배치를 수신할 때 계획을 기다리는 테이블 수가 이 임계값을 넘으면 관련된 모든 테이블의 계획을 요청합니다. 한 번에 너무 많은 계획을 요청하고 실행하지 않도록 하는 매개변수입니다. 데이터 적재 중 여러 테이블을 작은 배치로 처리하면 단일 RPC의 부담을 줄이고 데이터의 실시간 처리 성능을 높일 수 있습니다.
* 기본값: 5

#### `single_replica_load_download_num_workers` {#single_replica_load_download_num_workers}

* 유형: int32
* 설명: 단일 복제본 데이터 적재에서 segment 다운로드에 사용하는 HTTP 작업 스레드 수입니다. 데이터 적재의 동시성이 높아지면 이 매개변수를 조정하여 Slave 복제본이 Master 복제본의 데이터 파일을 제때 동기화하도록 할 수 있습니다. 필요한 경우 IO 성능을 높이기 위해 `webserver_num_workers`도 늘려야 합니다.
* 기본값: 64

#### `load_task_high_priority_threshold_second` {#load_task_high_priority_threshold_second}

* 유형: int32
* 설명: 데이터 적재 작업의 제한 시간이 이 임계값보다 짧으면 Doris가 이를 우선순위가 높은 작업으로 간주합니다. 우선순위가 높은 작업은 별도의 flush 스레드 풀을 사용합니다.
* 기본값: 120

#### `min_load_rpc_timeout_ms` {#min_load_rpc_timeout_ms}

* 유형: int32
* 설명: 데이터 적재 작업에서 각 RPC의 최소 제한 시간입니다.
* 기본값: 20

#### `kafka_api_version_request` {#kafka_api_version_request}

* 유형: bool
* 설명: 사용하는 Kafka 버전이 0.10.0.0보다 낮으면 이 값을 false로 설정해야 합니다.
* 기본값: true

#### `kafka_broker_version_fallback` {#kafka_broker_version_fallback}

* 설명: 사용하는 Kafka 버전이 0.10.0.0보다 낮고 kafka_api_version_request를 false로 설정했다면 kafka_broker_version_fallback에 설정된 대체 버전을 사용합니다. 유효한 값은 0.9.0.x와 0.8.x.y입니다.
* 기본값: 0.10.0

#### `max_consumer_num_per_group` {#max_consumer_num_per_group}

* 설명: Routine Load에 사용하는 데이터 consumer 그룹의 최대 consumer 수입니다.
* 기본값: 3

#### `streaming_load_max_mb` {#streaming_load_max_mb}

* 유형: int64
* 설명: 단일 Stream Load 요청 본문의 최대 크기를 제한합니다. `read_json_by_line=true`가 설정되지 않은 JSON 데이터 적재에는 `streaming_load_json_max_mb` 제한도 적용됩니다.
  - Stream Load는 일반적으로 수 GB 미만의 데이터 적재에 적합하며 지나치게 큰 데이터의 적재에는 적합하지 않습니다.
* 기본값: 102400 (MB)
* 동적 변경 가능: 예

이 값은 소스 코드의 기본값이며, 실제 적용값은 배포 설정에 따라 달라집니다. ADMIN_PRIV 권한이 있는 사용자는 `SHOW BACKEND CONFIG LIKE 'streaming_load_max_mb';`를 실행하여 각 BE의 적용값을 확인할 수 있습니다. 이 매개변수는 BE를 재시작하지 않고 동적으로 변경할 수 있습니다. 관리형 클라우드 서비스를 사용한다면 서비스가 제공하는 구성 방식을 사용하거나 관리자에게 문의하여 값을 확인하거나 조정하세요.

**버전 이력:**

- 3.x 계열에서는 Doris 3.0.2부터 `streaming_load_max_mb`의 기본값이 10240 MB(10 GB)에서 102400 MB(100 GB)로 증가했습니다. Doris 3.0.0과 3.0.1은 기본값으로 10 GB를 사용합니다.
- 2.1 계열에서는 같은 변경이 2.1.7부터 적용되었습니다.
- Doris 4.x와 dev는 기본값 100 GB를 유지합니다. 실제 적용값은 배포 설정에 따라 달라집니다.

#### `streaming_load_json_max_mb` {#streaming_load_json_max_mb}

* 유형: int64
* 설명: 한 번의 Stream Load에서 허용되는 JSON 데이터의 최대 크기를 제한합니다. 단위는 MB입니다.
  - JSON 같은 일부 데이터 형식은 분할할 수 없습니다. Doris는 파싱을 시작하기 전에 모든 데이터를 메모리로 읽어야 합니다. 따라서 이 값은 단일 Stream Load에서 적재할 수 있는 데이터의 최대 크기를 제한합니다.
* 기본값: 100
* 동적 변경 가능: 예

#### `olap_table_sink_send_interval_microseconds` {#olap_table_sink_send_interval_microseconds}

* 설명: 데이터 적재 중 Coordinator의 sink 노드에는 해당 BE로 데이터를 계속 보내는 폴링 스레드가 있습니다. 이 스레드는 `olap_table_sink_send_interval_microseconds`마이크로초마다 전송할 데이터가 있는지 확인합니다.
* 기본값: 1000

#### `olap_table_sink_send_interval_auto_partition_factor` {#olap_table_sink_send_interval_auto_partition_factor}

* 설명: 자동 분할이 활성화된 테이블에 데이터를 적재할 때 `olap_table_sink_send_interval_microseconds`의 간격이 너무 길면 실제 간격에 이 계수를 곱합니다.
* 기본값: 0.001

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

* 유형: bool
* 설명: 컴퓨팅과 스토리지가 분리된 모드에서 Group Commit의 Stream Load BE 전달 기능을 활성화할지 지정합니다. Doris 4.0 계열의 버전 4.0.8과 4.1 계열의 버전 4.1.4에서 추가되었습니다. 동적 변경을 지원합니다.
  - 로드 밸런서가 같은 테이블의 Group Commit 요청을 서로 다른 BE에 무작위로 분산해 효과적인 배치 처리를 막는 문제를 해결합니다. 활성화하면 BE가 요청을 단일 대상 BE로 전달합니다.
  - **버전 4.0.8부터 BE 엔드포인트 `/api/{db}/{table}/_stream_load_forward`는 이 설정의 제어를 받습니다. `false`이면 해당 엔드포인트의 요청이 `403 Forbidden`과 `Stream load forward is disabled`를 반환합니다. `true`이면 요청에 인증을 통과하고 전역 `LOAD` 권한도 있어야 합니다.**
  - 이 전달 기능에 의존하는 배포에서는 FE와 BE 모두에서 설정을 `true`로 지정해야 합니다. FE의 같은 이름의 설정은 [FE 구성](./fe-config)을 참조하세요.
* 기본값: false

### 스레드 {#thread}

#### `delete_worker_count` {#delete_worker_count}

* 설명: 데이터 삭제 작업을 수행하는 스레드 수입니다.
* 기본값: 3

#### `clear_transaction_task_worker_count` {#clear_transaction_task_worker_count}

* 설명: 트랜잭션 정리에 사용되는 스레드 수입니다.
* 기본값: 1

#### `clone_worker_count` {#clone_worker_count}

* 설명: 복제 작업을 수행하는 스레드 수입니다.
* 기본값: 3

#### `be_service_threads` {#be_service_threads}

* 유형: int32
* 설명: BE의 Thrift 서버 서비스 실행 스레드 수로, FE 요청을 실행하는 데 사용할 수 있는 스레드 수를 나타냅니다.
* 기본값: 64

#### `download_worker_count` {#download_worker_count}

* 설명: 다운로드 스레드 수입니다.
* 기본값: 1

#### `drop_tablet_worker_count` {#drop_tablet_worker_count}

* 설명: tablet을 삭제하는 스레드 수입니다.
* 기본값: 3

#### `flush_thread_num_per_store` {#flush_thread_num_per_store}

* 설명: 각 저장소의 메모리 테이블을 새로 고치는 데 사용되는 스레드 수입니다.
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
* 설명: SendBatch 스레드 풀의 스레드 수입니다. NodeChannel의 데이터 전송 작업에서 각 NodeChannel의 SendBatch 작업은 스레드 작업으로 스레드 풀에 제출되어 스케줄링됩니다. 이 매개변수는 SendBatch 스레드 풀의 크기를 결정합니다.
* 기본값: 64

#### `send_batch_thread_pool_queue_size` {#send_batch_thread_pool_queue_size}

* 유형: int32
* 설명: SendBatch 스레드 풀의 큐 길이입니다. NodeChannel의 데이터 전송 작업에서 각 NodeChannel의 SendBatch 작업은 스레드 작업으로 스레드 풀에 제출되어 스케줄링을 기다립니다. 제출된 작업 수가 큐 길이를 초과하면 이후 제출되는 작업은 큐에 빈자리가 생길 때까지 차단됩니다.
* 기본값: 102400

#### `make_snapshot_worker_count` {#make_snapshot_worker_count}

* 설명: 스냅샷을 생성하는 스레드 수입니다.
* 기본값: 5

#### `release_snapshot_worker_count` {#release_snapshot_worker_count}

* 설명: 스냅샷을 해제하는 스레드 수입니다.
* 기본값: 5

### 메모리 {#memory}

#### `madvise_huge_pages` {#madvise_huge_pages}

* 유형: bool
* 설명: Linux 메모리 huge page를 사용할지 지정합니다.
* 기본값: false

#### `max_memory_sink_batch_count` {#max_memory_sink_batch_count}

* 설명: 외부 스캔 캐시의 최대 배치 수입니다. 캐시에 `max_memory_cache_batch_count * batch_size`행을 저장한다는 뜻입니다. 기본값은 20이고 batch_size의 기본값은 1024이므로 20 * 1024행이 캐시됩니다.
* 기본값: 20

#### `memory_max_alignment` {#memory_max_alignment}

* 설명: 최대 메모리 정렬 크기입니다.
* 기본값: 16

#### `mmap_buffers` {#mmap_buffers}

* 설명: 메모리 할당에 mmap을 사용할지 지정합니다.
* 기본값: false

#### `memtable_mem_tracker_refresh_interval_ms` {#memtable_mem_tracker_refresh_interval_ms}

* 설명: memtable flush 관리자의 갱신 작업 사이 간격(밀리초)입니다.
* 기본값: 100

#### `zone_map_row_num_threshold` {#zone_map_row_num_threshold}

* 유형: int32
* 설명: 페이지의 행 수가 이 값보다 작으면 데이터 크기 증가를 줄이기 위해 zonemap을 만들지 않습니다.
* 기본값: 20

#### `memory_mode` {#memory_mode}

* 유형: string
* 설명: tcmalloc의 GC를 제어합니다. performance 모드에서는 메모리 사용량이 `90% * mem_limit` 이상일 때 Doris가 tcmalloc 캐시의 메모리를 반환합니다. 다른 모드에서는 사용량이 `50% * mem_limit` 이상일 때 반환합니다.
* 기본값: performance

#### `max_sys_mem_available_low_water_mark_bytes` {#max_sys_mem_available_low_water_mark_bytes}

* 유형: int64
* 설명: 시스템 `/proc/meminfo/MemAvailable`의 최대 하한값입니다. 단위는 바이트이고 기본값은 1.6G이며 실제 하한값은 min(1.6G, MemTotal * 10%)입니다. 메모리가 16G보다 큰 머신에서 메모리를 지나치게 낭비하지 않도록 합니다. 최대값을 높이면 메모리가 16G보다 큰 머신에서 Full GC를 위해 더 많은 메모리 버퍼를 남깁니다. 최대값을 낮추면 가능한 한 많은 메모리를 사용합니다.
* 기본값: 1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes` {#memory_limitation_per_thread_for_schema_change_bytes}

* 설명: 단일 schema change 작업에 허용되는 최대 메모리입니다.
* 기본값: 2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes` {#mem_tracker_consume_min_size_bytes}

* 유형: int32
* 설명: TCMalloc Hook이 MemTracker의 consume/release를 호출할 때 적용하는 최소 길이입니다. 이 값보다 작은 consume 크기는 계속 누적하여 MemTracker의 consume/release가 자주 호출되지 않도록 합니다. 값을 낮추면 호출 빈도가 높아지고, 높이면 MemTracker 통계의 정확도가 낮아집니다. 이론적으로 MemTracker의 통계값과 실제 값의 차이는 `( mem_tracker_consume_min_size_bytes * 해당 MemTracker가 위치한 BE 스레드 수)`입니다.
* 기본값: 1,048,576

#### `min_buffer_size` {#min_buffer_size}

* 설명: 최소 읽기 버퍼 크기입니다.
* 기본값: 1024 (byte)

#### `write_buffer_size` {#write_buffer_size}

* 설명: flush 전 버퍼 크기입니다.
  - 적재된 데이터는 먼저 BE의 메모리 블록에 기록되고, 블록이 임계값에 도달하면 디스크에 기록됩니다. 기본 크기는 200MB입니다. 임계값이 너무 작으면 BE에 작은 파일이 많이 생길 수 있습니다. 값을 늘려 파일 수를 줄일 수 있지만, 너무 크게 설정하면 RPC 제한 시간 초과가 발생할 수 있습니다.
* 기본값: 209,715,200

#### `remote_storage_read_buffer_mb` {#remote_storage_read_buffer_mb}

* 유형: int32
* 설명: HDFS 또는 객체 스토리지의 파일을 읽을 때 사용하는 캐시 크기입니다.
  - 값을 늘리면 원격 데이터 읽기 호출 횟수가 줄지만 메모리 사용량은 늘어납니다.
* 기본값: 16 (MB)

#### `file_cache_type` {#file_cache_type}

* 유형: string
* 설명: 캐시 파일 유형입니다. `whole_file_cache`는 segment 파일 전체를 다운로드합니다. `sub_file_cache`는 segment 파일을 크기에 따라 여러 파일로 나눕니다. ""로 설정하면 캐시를 사용하지 않습니다. 캐시가 필요할 때 이 매개변수를 설정하세요.
* 기본값: ""

#### `path_gc_check` {#path_gc_check}

* 유형: bool
* 설명: 재활용 데이터 스캔 스레드의 검사를 활성화할지 지정합니다.
* 기본값: true

#### `path_gc_check_interval_second` {#path_gc_check_interval_second}

* 설명: 재활용 데이터 스캔 스레드의 검사 간격입니다.
* 기본값: 86400 (s)

#### `path_gc_check_step` {#path_gc_check_step}

* 기본값: 1000

#### `path_gc_check_step_interval_ms` {#path_gc_check_step_interval_ms}

* 기본값: 10 (ms)

#### `scan_context_gc_interval_min` {#scan_context_gc_interval_min}

* 설명: 컨텍스트 GC 스레드의 스케줄링 주기입니다. 단위는 분이며 기본값은 5분입니다.
* 기본값: 5

### 스토리지 {#storage}

#### `enable_kuromoji_analyzer` {#enable_kuromoji_analyzer}

* 유형: bool
* 설명: kuromoji(일본어) 역인덱스 분석기를 활성화할지 지정합니다. Doris 5.0.0부터 지원합니다.
* 기본값: false

#### `inverted_index_skip_norms_for_variant` {#inverted_index_skip_norms_for_variant}

* 유형: bool
* 설명: 버전 4.1.5부터 지원하며 동적 설정이 가능합니다. `true`이면 VARIANT 하위 경로의 역인덱스에서 인덱스의 `norms` 속성과 관계없이 Norms를 생략합니다. 여러 하위 경로의 인덱스 저장 공간을 줄일 수 있지만, 해당 인덱스는 Norms가 필요한 BM25 `score()` 계산을 더는 지원하지 않습니다. 기본적으로 Norms를 유지합니다. [관련성 점수](../../table-design/index/inverted-index/scoring.md)를 참조하세요.
* 기본값: false

#### `default_num_rows_per_column_file_block` {#default_num_rows_per_column_file_block}

* 유형: int32
* 설명: 단일 RowBlock에 포함되는 데이터 행 수를 설정합니다.
* 기본값: 1024

#### `disable_storage_page_cache` {#disable_storage_page_cache}

* 유형: bool
* 설명: 인덱스 캐시에 page cache를 사용하지 않도록 설정합니다. BETA 저장 형식에서만 적용되며 일반적으로 false로 두는 것이 좋습니다.
* 기본값: false

#### `disk_stat_monitor_interval` {#disk_stat_monitor_interval}

* 설명: 디스크 상태 검사 간격입니다.
* 기본값: 5 (s)

#### `max_free_io_buffers` {#max_free_io_buffers}

* 설명: 각 IO 버퍼 크기에 대해 IoMgr이 유지하는 최대 버퍼 수입니다. 버퍼 크기는 1024B에서 8MB까지이며 전체 버퍼 크기는 약 2GB까지입니다.
* 기본값: 128

#### `max_garbage_sweep_interval` {#max_garbage_sweep_interval}

* 설명: 디스크의 불필요한 데이터를 정리하는 최대 간격입니다.
* 기본값: 3600 (s)

#### `max_percentage_of_error_disk` {#max_percentage_of_error_disk}

* 유형: int32
* 설명: 스토리지 엔진이 허용하는 손상된 하드 디스크의 비율입니다. 손상된 디스크의 비율이 설정값을 넘으면 BE가 자동으로 종료됩니다.
* 기본값: 0

#### `min_garbage_sweep_interval` {#min_garbage_sweep_interval}

* 설명: 디스크의 불필요한 데이터를 정리하는 최소 간격입니다.
* 기본값: 180 (s)

#### `pprof_profile_dir` {#pprof_profile_dir}

* 설명: pprof 프로파일을 저장하는 디렉터리입니다.
* 기본값: ${DORIS_HOME}/log

#### `small_file_dir` {#small_file_dir}

* 설명: SmallFileMgr이 다운로드한 파일을 저장하는 디렉터리입니다.
* 기본값: ${DORIS_HOME}/lib/small_file/

#### `user_function_dir` {#user_function_dir}

* 설명: udf 함수 디렉터리입니다.
* 기본값: `${DORIS_HOME}/lib/udf`

#### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

* 설명: 데이터 디렉터리에 남아 있어야 하는 최소 바이트 수입니다.
* 기본값: 1073741824

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

* 설명: storage_flood_stage_usage_percent와 storage_flood_stage_left_capacity_bytes 설정은 데이터 디렉터리 용량의 최대 사용량을 제한합니다.
* 기본값: 90 (90%)

#### `storage_medium_migrate_count` {#storage_medium_migrate_count}

* 설명: 복제에 사용하는 스레드 수입니다.
* 기본값: 1

#### `storage_page_cache_limit` {#storage_page_cache_limit}

* 설명: 스토리지 페이지 캐시 크기입니다.
* 기본값: 20%

#### `storage_page_cache_shard_size` {#storage_page_cache_shard_size}

* 설명: StoragePageCache의 샤드 크기로, 값은 2의 거듭제곱이어야 합니다. 잠금 경합을 줄이려면 BE 코어 수에 가까운 값으로 설정하는 것이 좋습니다.
* 기본값: 16

#### `index_page_cache_percentage` {#index_page_cache_percentage}

* 유형: int32
* 설명: 전체 스토리지 페이지 캐시에서 인덱스 페이지 캐시가 차지하는 비율입니다. 값 범위는 [0, 100]입니다.
* 기본값: 10

#### `segment_cache_capacity` {#segment_cache_capacity}
* 유형: int32
* 설명: segment 캐시 항목의 최대 개수입니다. 키는 rowset ID입니다. -1은 이전 버전과의 호환을 위해 fd_number * 2/5를 사용한다는 뜻입니다.
* 기본값: -1

#### `storage_strict_check_incompatible_old_format` {#storage_strict_check_incompatible_old_format}

* 유형: bool
* 설명: 호환되지 않는 이전 형식을 엄격하게 검사하는 데 사용합니다.
* 기본값: true
* 동적 변경: false

#### `sync_tablet_meta` {#sync_tablet_meta}

* 설명: 스토리지 엔진이 동기화를 활성화하여 메타데이터를 디스크에 유지할지 지정합니다.
* 기본값: true

#### `pending_data_expire_time_sec` {#pending_data_expire_time_sec}

* 설명: 스토리지 엔진이 검증되지 않은 데이터를 보존하는 최대 시간입니다.
* 기본값: 1800 (s)

#### `ignore_rowset_stale_unconsistent_delete` {#ignore_rowset_stale_unconsistent_delete}

* 유형: boolean
* 설명: 병합된 오래된 rowset이 일관된 버전 경로를 구성하지 못할 때 이를 삭제할지 결정합니다.
  - 병합된 만료 rowset의 버전 경로는 반 시간 후 삭제됩니다. 비정상적인 상황에서 이 버전을 삭제하면 쿼리의 일관된 경로를 구성하지 못할 수 있습니다. false이면 프로그램이 엄격하게 검사하고 즉시 오류를 보고한 뒤 종료합니다. true이면 오류를 무시하고 정상적으로 실행합니다. 일반적으로 오류를 무시해도 쿼리에는 영향이 없지만, FE가 병합된 버전을 배포할 때 -230 오류가 발생할 수 있습니다.
* 기본값: false

#### `create_tablet_worker_count` {#create_tablet_worker_count}

* 설명: BE가 tablet을 생성하는 작업 스레드 수입니다.
* 기본값: 3

#### `check_consistency_worker_count` {#check_consistency_worker_count}

* 설명: tablet의 체크섬을 계산하는 작업 스레드 수입니다.
* 기본값: 1

#### `max_tablet_version_num` {#max_tablet_version_num}

* 유형: int
* 설명: 단일 tablet의 버전 수를 제한합니다. 데이터 적재가 너무 잦거나 컴팩션이 제때 수행되지 않아 버전이 대량으로 쌓이는 문제를 방지합니다. 제한을 초과하면 데이터 적재 작업을 거부합니다.
* 기본값: 2000

#### `tablet_map_shard_size` {#tablet_map_shard_size}

* 설명: tablet_map_lock의 샤드 크기입니다. 값은 2^n이며 n=0,1,2,3,4입니다. tablet 관리를 개선하는 데 사용합니다.
* 기본값: 4

#### `tablet_meta_checkpoint_min_interval_secs` {#tablet_meta_checkpoint_min_interval_secs}

* 설명: TabletMeta Checkpoint 스레드의 폴링 간격입니다.
* 기본값: 600 (s)

#### `tablet_meta_checkpoint_min_new_rowsets_num` {#tablet_meta_checkpoint_min_new_rowsets_num}

* 설명: TabletMeta Checkpoint 저장에 필요한 최소 Rowset 수입니다.
* 기본값: 10

#### `tablet_rowset_stale_sweep_time_sec` {#tablet_rowset_stale_sweep_time_sec}

* 유형: int64
* 설명: 병합된 rowset 버전을 정리하기까지의 만료 시간을 제어합니다. 현재 시각 now()에서 버전 경로에 있는 가장 최근에 생성된 rowset의 생성 시각을 뺀 값이 tablet_rowset_stale_sweep_time_sec보다 크면 현재 경로를 정리하고 병합된 rowset을 삭제합니다. 단위는 초입니다.
  - 쓰기가 너무 잦으면 FE가 병합된 버전을 조회하지 못해 쿼리에 -230 오류가 발생할 수 있습니다. 이 매개변수를 늘리면 문제를 방지할 수 있습니다.
* 기본값: 300

#### `tablet_writer_open_rpc_timeout_sec` {#tablet_writer_open_rpc_timeout_sec}

* 설명: tablet 상태 캐시의 갱신 간격입니다.
    - 데이터 적재 중 Batch(1024행)를 보낼 때의 RPC 제한 시간입니다. 기본값은 60초입니다. 이 RPC에서 여러 메모리 배치를 디스크에 기록해야 할 수 있으므로 쓰기 작업 때문에 제한 시간을 초과할 수 있습니다. 제한 시간을 조정하면 send batch fail 같은 오류를 줄일 수 있습니다. `write_buffer_size` 설정을 늘릴 때는 이 매개변수도 늘려야 합니다.
* 기본값: 60

#### `tablet_writer_ignore_eovercrowded` {#tablet_writer_ignore_eovercrowded}

* 유형: bool
* 설명: 데이터 쓰기 중 brpc 오류 '[E1011]The server is overcrowded'를 무시하는 데 사용합니다.
* 기본값: false

#### `streaming_load_rpc_max_alive_time_sec` {#streaming_load_rpc_max_alive_time_sec}

* 설명: TabletsChannel의 수명입니다. 이 시간 동안 채널이 데이터를 받지 못하면 삭제됩니다.
* 기본값: 1200

#### `alter_tablet_worker_count` {#alter_tablet_worker_count}

* 설명: schema change를 수행하는 스레드 수입니다.
* 기본값: 3

#### `alter_index_worker_count` {#alter_index_worker_count}

* 설명: 인덱스 변경을 수행하는 스레드 수입니다.
* 기본값: 3

#### `ignore_load_tablet_failure` {#ignore_load_tablet_failure}

* 유형: bool
* 설명: tablet 적재에 실패했을 때 오류를 무시하고 BE 시작을 계속할지 지정합니다.
* 기본값: false

BE가 시작되면 각 데이터 디렉터리마다 별도의 스레드를 시작하여 tablet 헤더의 메타데이터를 적재합니다. 기본 설정에서는 데이터 디렉터리에서 tablet 적재에 실패하면 시작 프로세스가 종료됩니다. 동시에 ` be The following error message is seen in the INFO ` 로그에 다음 오류 메시지가 표시됩니다.

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

이 메시지는 해당 데이터 디렉터리에서 적재에 실패한 tablet 수를 나타냅니다. 로그에는 적재에 실패한 tablet의 구체적인 정보도 기록됩니다. 이때는 수동으로 오류 원인을 조사해야 합니다. 조사 후에는 일반적으로 다음 두 방법 중 하나로 복구합니다.
  - tablet 정보를 복구할 수 없고 다른 복제본이 정상이라면 `meta_tool` 도구로 문제가 있는 tablet을 삭제할 수 있습니다.
  - `ignore_load_tablet_failure`를 true로 설정하면 BE가 문제가 있는 tablet을 무시하고 정상적으로 시작합니다.

#### `report_disk_state_interval_seconds` {#report_disk_state_interval_seconds}

* 설명: 에이전트가 FE에 디스크 상태를 보고하는 간격입니다.
* 기본값: 60 (s)

#### `result_buffer_cancelled_interval_time` {#result_buffer_cancelled_interval_time}

* 설명: 결과 버퍼를 취소하기까지의 시간입니다.
* 기본값: 300 (s)

#### `snapshot_expire_time_sec` {#snapshot_expire_time_sec}

* 설명: 스냅샷 파일 정리 간격입니다.
* 기본값: 172800 (48시간)

### 로그 {#log}

#### `sys_log_dir` {#sys_log_dir}

* 유형: string
* 설명: BE 로그 데이터를 저장하는 디렉터리입니다.
* 기본값: `${DORIS_HOME}/log`

#### `sys_log_level` {#sys_log_level}

* 설명: 로그 수준입니다. INFO < WARNING < ERROR < FATAL
* 기본값: INFO

#### `sys_log_roll_mode` {#sys_log_roll_mode}

* 설명: 로그 분할 크기입니다. 로그 파일을 1G마다 분할합니다.
* 기본값: SIZE-MB-1024

#### `sys_log_roll_num` {#sys_log_roll_num}

* 설명: 보존할 로그 파일 수입니다.
* 기본값: 10

#### `sys_log_verbose_level` {#sys_log_verbose_level}

* 설명: 코드에서 VLOG로 시작하는 로그의 출력을 제어하는 로그 표시 수준입니다.
* 기본값: 10

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

* 설명: 로그를 출력할 모듈입니다. olap을 지정하면 olap 모듈의 로그만 출력합니다.
* 기본값: 비어 있음

#### `aws_log_level` {#aws_log_level}

* 유형: int32
* 설명: AWS SDK의 로그 수준입니다.
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

* 설명: 로그 flush 전략입니다. 기본적으로 로그를 메모리에 유지합니다.
* 기본값: 비어 있음

### 기타 {#others}

#### `enable_arrow_input_validation` {#enable_arrow_input_validation}

* 유형: bool
* 설명: 버전 4.1.4에서 추가되었습니다. Arrow 데이터를 Doris 내부 열로 변환하기 전에 Arrow 입력 버퍼를 검증할지 지정합니다. 활성화하면 소량의 추가 검증 비용이 들지만 형식이 잘못된 Arrow 데이터로 BE가 중단되는 것을 방지할 수 있습니다.
* 기본값: true

#### `report_tablet_interval_seconds` {#report_tablet_interval_seconds}

* 설명: 에이전트가 FE에 olap 테이블을 보고하는 간격입니다.
* 기본값: 60 (s)

#### `report_task_interval_seconds` {#report_task_interval_seconds}

* 설명: 에이전트가 FE에 작업 시그니처를 보고하는 간격입니다.
* 기본값: 10 (s)

#### `periodic_counter_update_period_ms` {#periodic_counter_update_period_ms}

* 설명: rate counter와 sampling counter의 갱신 주기입니다.
* 기본값: 500 (ms)

#### `enable_metric_calculator` {#enable_metric_calculator}

* 설명: true이면 metric calculator가 실행되어 BE 관련 지표 정보를 수집합니다. false이면 실행되지 않습니다.
* 기본값: true

#### `enable_system_metrics` {#enable_system_metrics}

* 설명: 시스템 지표의 활성화 여부를 사용자가 제어합니다.
* 기본값: true

#### `enable_token_check` {#enable_token_check}

* 설명: 이후 버전과의 호환성을 위한 설정이며 나중에 제거될 예정입니다.
* 기본값: true

#### `max_runnings_transactions_per_txn_map` {#max_runnings_transactions_per_txn_map}

* 설명: txn manager의 각 txn_partition_map에 허용되는 최대 txn 수입니다. manager에 너무 많은 txn이 저장되지 않도록 보호합니다.
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

* 설명: 파일을 배치로 다운로드할지 지정합니다. binlog가 활성화되어 있을 때 켜는 것이 좋습니다.
* 기본값: false

#### `priority_queue_remaining_tasks_increased_frequency` {#priority_queue_remaining_tasks_increased_frequency}

* 설명: BlockingPriorityQueue에 남아 있는 작업의 우선순위가 높아지는 빈도입니다.
* 기본값: 512


#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

* 설명: JDBC 드라이버를 저장하는 기본 디렉터리입니다.
* 기본값: `${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader` {#enable_simdjson_reader}

* 설명: Stream Load 중 JSON을 파싱할 때 simdjson을 사용할지 지정합니다.
* 기본값: true

#### `user_files_secure_path` {#user_files_secure_path}

* 설명: `local` 테이블 값 함수가 조회하는 파일의 저장 디렉터리입니다.
* 기본값: `${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes` {#brpc_streaming_client_batch_bytes}

* 설명: brpc 스트리밍 클라이언트가 데이터를 전송할 때의 배치 크기입니다.
* 기본값: 262144

#### `grace_shutdown_wait_seconds` {#grace_shutdown_wait_seconds}

* 설명: 클라우드 네이티브 배포에서는 BE가 클러스터에 자주 추가되거나 클러스터에서 제거될 수 있습니다. 종료 중인 BE에서 fragment가 실행 중이면 사용자 쿼리가 실패합니다. `stop_be.sh --grace`를 사용하면 실행 중인 모든 쿼리가 끝날 때까지 BE가 기다려 쿼리 실패를 방지할 수 있습니다. 다만 대기 시간이 제한을 넘으면 BE가 바로 종료됩니다. 대기 중에는 FE가 해당 BE에 새 쿼리를 보내지 않습니다.
* 기본값: 120

#### `enable_java_support` {#enable_java_support}

* 설명: BE에서 java-jni를 사용할지 지정합니다. 활성화하면 c++와 java 간 상호 호출을 허용합니다. 현재 hudi, java-udf, jdbc, max-compute, paimon, preload, avro를 지원합니다.
* 기본값: true

#### `group_commit_wal_path` {#group_commit_wal_path}

* Group Commit의 `WAL` 디렉터리입니다.
* 기본값: `storage_root_path`의 각 디렉터리 아래에 `wal`이라는 디렉터리가 생성됩니다. 설정 예시:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

### 컴퓨팅과 스토리지 분리 모드 {#compute-and-storage-disaggregated-mode}

#### `deploy_mode` {#deploy_mode-1}

* 기본값: ""

* 설명: BE의 실행 모드입니다. `cloud`는 스토리지와 컴퓨팅이 분리된 모드를 나타냅니다.

#### `meta_service_endpoint` {#meta_service_endpoint}

기본값: ""

* 설명: Meta Service 엔드포인트는 'host1:port,host2:port' 형식으로 지정해야 합니다. 일반적으로 FE가 하트비트를 통해 BE에 이 값을 전달하므로 설정할 필요가 없습니다.

#### `enable_file_cache` {#enable_file_cache}

기본값: true (버전 4.1.5부터 기본 활성화, 이전에는 false, 컴퓨팅과 스토리지가 분리된 모드에서는 항상 활성화).

* 설명: File Cache를 사용할지 지정합니다. 변경 사항을 적용하려면 BE를 재시작해야 합니다. 세션 변수 `enable_file_cache`도 활성화해야 합니다. 버전 4.1.5에서는 BE 구성과 세션 변수의 기본값이 모두 `true`로 변경되었습니다. 기존에 명시한 구성과 영구 저장된 전역 변수는 각각 확인하세요.

#### `enable_ms_rpc_host_level_rate_limit_dry_run` {#enable_ms_rpc_host_level_rate_limit_dry_run}

* 유형: bool
* 설명: 버전 4.1.5부터 지원하며 동적 설정이 가능합니다. 실제로 대기하지 않고 BE에서 Meta Service로 보내는 RPC의 호스트 수준 속도 제한을 평가합니다. `enable_ms_rpc_host_level_rate_limit`와 독립적이므로 해당 설정이 `false`여도 평가가 실행됩니다. 두 설정이 모두 `true`이면 dry-run이 우선합니다. 속도 제한을 실제로 적용하려면 `enable_ms_rpc_host_level_rate_limit`를 활성화하고 이 설정을 비활성화하세요.
* 기본값: true

#### `enable_ms_backpressure_handling_dry_run` {#enable_ms_backpressure_handling_dry_run}

* 유형: bool
* 설명: 버전 4.1.5부터 지원하며 동적 설정이 가능합니다. 실제로 대기하지 않고 Meta Service의 `MS_BUSY` 응답으로 트리거되는 테이블 수준 적응형 속도 제한을 평가합니다. `enable_ms_backpressure_handling`과 독립적이며 두 설정이 모두 `true`이면 dry-run이 우선합니다. 테이블 수준 속도 제한을 실제로 적용하려면 `enable_ms_backpressure_handling`을 활성화하고 이 설정을 비활성화하세요.
* 기본값: true

#### `cache_peer_read_failure_threshold` {#cache_peer_read_failure_threshold}

* 유형: int32
* 설명: 버전 4.2.0부터 지원하며 동적 설정이 가능합니다. 피어 주소에서 연결 또는 RPC 실패가 연속으로 발생하여 회로 차단기가 열리기까지의 횟수입니다. 실제 적용되는 최소값은 `1`입니다. 이 주소 수준의 상태는 서로 다른 tablet의 피어 읽기가 공유하여 연결할 수 없는 노드에 반복해서 접속하지 않도록 합니다.
* 기본값: 3

#### `cache_peer_read_circuit_open_seconds` {#cache_peer_read_circuit_open_seconds}

* 유형: int32
* 설명: 버전 4.2.0부터 지원하며 동적 설정이 가능합니다. 피어 회로 차단기가 열린 동안 해당 주소로의 읽기를 거부하는 시간(초)입니다. 음수는 `0`으로 처리합니다. 이 기간이 지나면 복구를 확인하는 시도를 한 번 허용합니다.
* 기본값: 30

#### `delete_bitmap_store_v2_max_bytes_in_fdb` {#delete_bitmap_store_v2_max_bytes_in_fdb}

* 유형: int64
* 설명: 컴퓨팅과 스토리지가 분리된 모드에서 Delete Bitmap V2를 FDB에 직접 저장할 때 허용되는 최대 직렬화 크기(바이트)입니다. 동적 설정을 지원합니다. 값이 음수가 아닌 임계값을 초과하면 대신 객체 스토리지 파일에 저장합니다. 음수이면 크기에 따른 외부 저장을 비활성화합니다. 버전 4.1.5에서는 기본값을 `1024`에서 `89000`으로 높여 90000바이트 청크에 추가 메시지 필드를 넣을 공간을 남겼습니다.
* 기본값: 89000 (4.1.5 이전에는 1024)

#### `enable_remove_agg_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_agg_pre_rowsets_delete_bitmap_by_keys}

* 유형: bool
* 설명: 버전 4.1.5부터 지원하며 동적 설정이 가능합니다. 컴퓨팅과 스토리지가 분리된 모드에서 집계된 과거 Delete Bitmap을 교체할 때 끝 버전의 레코드를 키별로 삭제합니다. `false`로 설정하면 범위 삭제를 사용합니다. 기존 정리 작업에서 레코드를 삭제하는 방식만 변경하며 추가 정리 작업을 활성화하지 않습니다.
* 기본값: true

#### `enable_remove_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_pre_rowsets_delete_bitmap_by_keys}

* 유형: bool
* 설명: 버전 4.1.5부터 지원하며 동적 설정이 가능합니다. 컴퓨팅과 스토리지가 분리된 모드에서 집계 범위의 과거 Delete Bitmap을 정리할 때 시작 버전(포함)부터 끝 버전(제외)까지의 레코드를 키별로 삭제합니다. `false`로 설정하면 범위 삭제를 사용합니다. 기존 정리 스위치와 적용 조건은 그대로 적용됩니다.
* 기본값: true

#### `file_cache_path` {#file_cache_path}

기본값: [{"path":"${DORIS_HOME}/file_cache"}]
* 설명: File Cache에 사용하는 디스크 경로와 기타 매개변수를 디스크당 하나의 항목을 가진 배열로 나타냅니다. `path`는 디스크 경로를 지정하고 `total_size`는 캐시 크기를 제한합니다. -1 또는 0을 지정하면 디스크 공간 전체를 사용합니다.
* 형식: [{"path":"/path/to/file_cache","total_size":21474836480,{"path":"/path/to/file_cache2","total_size":21474836480}]

#### `enable_async_file_cache_write` {#enable_async_file_cache_write}

* 유형: bool
* 설명: 버전 4.1.4에서 추가되었습니다. File Cache에 비동기적으로 쓸지 지정합니다. 활성화하면 원격 데이터를 File Cache에 다시 쓰는 작업을 백그라운드 스레드 풀에 맡겨 읽기 경로가 차단되지 않으므로 콜드 읽기 지연 시간이 줄어듭니다.
* 기본값: false

#### `async_file_cache_write_workers_per_disk` {#async_file_cache_write_workers_per_disk}

* 유형: int32
* 설명: 버전 4.1.4에서 추가되었습니다. File Cache에 비동기적으로 쓸 때 각 캐시 디스크에 사용하는 쓰기 스레드 수입니다. `enable_async_file_cache_write = true`일 때만 적용됩니다.
* 기본값: 16

#### `async_file_cache_write_max_pending_bytes` {#async_file_cache_write_max_pending_bytes}

* 유형: int64
* 설명: 버전 4.1.4에서 추가되었습니다. File Cache 비동기 쓰기를 기다리는 데이터의 최대 총 크기(바이트)입니다. 이 제한을 넘는 쓰기 요청은 버려집니다. 쿼리의 정확성에는 영향이 없지만 데이터가 캐시되지 않습니다. `-1`은 제한 없음을 뜻합니다.
* 기본값: -1

#### `enable_file_cache_write_from_s3_file_writer` {#enable_file_cache_write_from_s3_file_writer}

* 유형: bool
* 설명: 버전 4.1.4에서 추가되었습니다. 객체 스토리지에 데이터를 쓸 때 로컬 File Cache에도 데이터를 써서 새로 쓴 데이터를 캐시에서 바로 읽을 수 있게 할지 지정합니다.
* 기본값: true

#### `enable_file_cache_write_index_file_only` {#enable_file_cache_write_index_file_only}

* 유형: bool
* 설명: 버전 4.1.4에서 추가되었습니다. 인덱스 파일만 File Cache에 쓸지 지정합니다. 활성화하면 캐시 공간이 제한되어 있을 때 인덱스가 캐시에 우선 유지됩니다.
* 기본값: false

#### `enable_cache_read_from_peer` {#enable_cache_read_from_peer}

* 유형: bool
* 설명: 피어 캐시 읽기의 주 스위치입니다. 활성화하면 로컬 File Cache에서 블록을 찾지 못했을 때 먼저 다른 BE의 File Cache에서 읽습니다. 다른 BE는 같은 컴퓨팅 그룹 또는 다른 컴퓨팅 그룹에 있을 수 있습니다. 어느 BE에도 블록이 없을 때만 객체 스토리지에서 읽습니다. 같은 그룹과 그룹 간 피어 읽기는 이 스위치로 함께 제어되며 그룹 간 읽기만 따로 끌 수 없습니다. 그룹 간 피어 읽기는 버전 4.2.0부터 지원하며 이 버전에서 `cache_read_from_peer_expired_seconds` 구성 항목도 제거되었습니다. [피어 캐시 읽기](../../compute-storage-decoupled/file-cache/file-cache-peer-read)를 참조하세요.
* 기본값: false (필요할 때 명시적으로 활성화)

#### `enable_peer_s3_race` {#enable_peer_s3_race}

* 유형: bool
* 설명: 버전 4.2.0에서 추가되었습니다. 피어 읽기와 객체 스토리지 읽기를 경쟁적으로 실행하여 먼저 완료된 결과를 사용할지 지정합니다. 비활성화하면 피어 후보를 순서대로 시도하고 모두 실패한 후에만 객체 스토리지에서 읽습니다.
* 기본값: true

#### `peer_race_hedge_delay_ms` {#peer_race_hedge_delay_ms}

* 유형: int32
* 설명: 버전 4.2.0에서 추가되었습니다. 경쟁 읽기에서 피어 읽기에 먼저 주는 시간(밀리초)입니다. 이 시간 안에 피어가 응답하면 객체 스토리지 읽기를 시작하지 않습니다. `0`이면 두 읽기를 동시에 시작합니다.
* 기본값: 20

#### `max_concurrent_peer_races` {#max_concurrent_peer_races}

* 유형: int32
* 설명: 버전 4.2.0에서 추가되었습니다. 단일 BE에서 동시에 실행할 수 있는 피어 읽기와 객체 스토리지 읽기의 경쟁 작업 최대 개수입니다. 이 제한을 넘는 캐시 미스는 순차적으로 읽습니다.
* 기본값: 64

#### `peer_cache_fill_compute_group_id` {#peer_cache_fill_compute_group_id}

* 유형: string
* 설명: 버전 4.2.0에서 추가되었습니다. 읽기를 요청하는 BE에 설정합니다. 그룹 간 캐시 채우기를 담당하는 컴퓨팅 그룹의 ID입니다. 이는 컴퓨팅 그룹 이름이 아니라 `SHOW BACKENDS`의 `Tag` 열에 있는 `compute_group_id`입니다. 선택한 피어 후보가 이 컴퓨팅 그룹에 속하고 해당 블록이 없으면, 요청은 피어가 객체 스토리지에서 블록을 가져와 자체 File Cache에 쓰도록 합니다. 빈 값은 캐시 채우기를 사용하지 않음을 뜻합니다.
* 기본값: ""

#### `enable_peer_server_cache_fill` {#enable_peer_server_cache_fill}

* 유형: bool
* 설명: 버전 4.2.0에서 추가되었습니다. 캐시를 제공하는 BE에 설정하며, 캐시 채우기 플래그가 있는 피어 읽기 요청을 수락할지 지정합니다. 비활성화하면 로컬에 캐시되지 않은 블록을 찾을 수 없다고 보고하며 요청한 BE는 객체 스토리지에서 읽습니다.
* 기본값: true

#### `peer_server_cache_fill_timeout_ms` {#peer_server_cache_fill_timeout_ms}

* 유형: int32
* 설명: 버전 4.2.0에서 추가되었습니다. 제공 측에서 한 번의 캐시 채우기를 기다리는 최대 시간(밀리초)입니다. 시간이 초과되면 요청한 BE가 객체 스토리지에서 읽습니다.
* 기본값: 6000

#### `max_concurrent_peer_server_fills` {#max_concurrent_peer_server_fills}

* 유형: int32
* 설명: 버전 4.2.0에서 추가되었습니다. 제공 측에서 동시에 실행하는 캐시 채우기 작업의 최대 개수입니다. 제한을 넘는 요청은 거부되며 요청한 BE가 객체 스토리지에서 읽습니다.
* 기본값: 32

#### `peer_rpc_failure_eviction_threshold` {#peer_rpc_failure_eviction_threshold}

* 유형: int32
* 설명: 버전 4.2.0에서 추가되었습니다. 피어 후보에서 RPC 실패가 이 횟수만큼 연속으로 발생하면 후보 목록에서 제거합니다.
* 기본값: 3

#### `peer_all_miss_cooldown_threshold` {#peer_all_miss_cooldown_threshold}

* 유형: int32
* 설명: 버전 4.2.0에서 추가되었습니다. 모든 피어 후보에서 캐시 미스가 발생하는 읽기가 연속으로 몇 번 일어나면 tablet이 냉각 기간에 들어갈지 지정합니다. 냉각 기간에는 객체 스토리지에서 바로 읽습니다.
* 기본값: 5

#### `peer_all_miss_cooldown_duration_s` {#peer_all_miss_cooldown_duration_s}

* 유형: int64
* 설명: 버전 4.2.0에서 추가되었습니다. 피어 읽기 냉각 기간의 길이(초)입니다.
* 기본값: 300

#### `peer_candidate_expiry_s` {#peer_candidate_expiry_s}

* 유형: int64
* 설명: 버전 4.2.0에서 추가되었습니다. 마지막 사용 시점부터 계산하는 피어 후보 항목의 만료 시간(초)입니다. 만료된 항목은 메모리에서 제거하고 다음 캐시 미스 때 FE에서 다시 가져옵니다.
* 기본값: 3600

#### `peer_candidate_cleanup_interval_s` {#peer_candidate_cleanup_interval_s}

* 유형: int64
* 설명: 버전 4.2.0에서 추가되었습니다. 만료된 피어 후보를 제거하는 백그라운드 작업의 간격(초)입니다.
* 기본값: 3600

#### `peer_fetch_queue_timeout_ms` {#peer_fetch_queue_timeout_ms}

* 유형: int32
* 설명: 버전 4.2.0에서 추가되었습니다. 피어 읽기 요청이 제공 측의 처리 큐에서 기다릴 수 있는 최대 시간(밀리초)입니다. 더 오래 기다린 요청은 거부하여 요청한 BE가 신속하게 객체 스토리지에서 읽도록 합니다.
* 기본값: 100

#### `brpc_peer_fetch_pool_threads` {#brpc_peer_fetch_pool_threads}

* 유형: int32
* 설명: 버전 4.2.0에서 추가되었습니다. 제공 측에서 피어 읽기 요청을 처리하는 스레드 풀의 크기입니다. 데이터 적재 같은 부하가 큰 RPC의 스레드 풀과 분리됩니다. `-1`은 `max(64, 2 × CPU 코어 수)`를 뜻합니다. 동적으로 변경할 수 없습니다.
* 기본값: -1

#### `brpc_peer_fetch_pool_max_queue_size` {#brpc_peer_fetch_pool_max_queue_size}

* 유형: int32
* 설명: 버전 4.2.0에서 추가되었습니다. 제공 측의 피어 읽기 스레드 풀 큐 길이입니다. `-1`은 `max(4096, 128 × CPU 코어 수)`를 뜻합니다. 동적으로 변경할 수 없습니다.
* 기본값: -1

#### `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num` {#min_peer_race_s3_thread_num--max_peer_race_s3_thread_num}

* 유형: int32
* 설명: 버전 4.2.0에서 추가되었습니다. 피어 읽기와 객체 스토리지 읽기가 경쟁할 때 요청 측에서 객체 스토리지 읽기를 수행하는 스레드 풀의 최소 / 최대 스레드 수입니다. 동적으로 변경할 수 없습니다.
* 기본값: 0 / 32

#### `s3_get_requests_per_second_per_core` / `s3_put_requests_per_second_per_core` {#s3_get_requests_per_second_per_core--s3_put_requests_per_second_per_core}

* 유형: int64
* 설명: 버전 4.1.4에서 추가되었습니다. CPU 코어당 계산하는 객체 스토리지 GET / PUT 요청의 QPS 제한입니다. 음수는 이 방식을 비활성화하고 기존 절대 토큰 설정으로 돌아간다는 뜻이며, `0`은 QPS를 제한하지 않는다는 뜻입니다.
* 기본값: -1

#### `s3_get_requests_per_second_max` / `s3_put_requests_per_second_max` {#s3_get_requests_per_second_max--s3_put_requests_per_second_max}

* 유형: int64
* 설명: 버전 4.1.4에서 추가되었습니다. CPU 코어 수에서 계산한 GET / PUT QPS의 절대 상한입니다. `0` 이하이면 상한이 없습니다.
* 기본값: 0

#### `s3_get_bytes_per_second_per_core` / `s3_put_bytes_per_second_per_core` {#s3_get_bytes_per_second_per_core--s3_put_bytes_per_second_per_core}

* 유형: int64
* 설명: 버전 4.1.4에서 추가되었습니다. CPU 코어당 계산하는 객체 스토리지 GET / PUT 대역폭 제한입니다. 단위는 코어당 초당 바이트입니다. `0` 이하이면 대역폭을 제한하지 않습니다.
* 기본값: -1

#### `s3_get_bytes_per_second_max` / `s3_put_bytes_per_second_max` {#s3_get_bytes_per_second_max--s3_put_bytes_per_second_max}

* 유형: int64
* 설명: 버전 4.1.4에서 추가되었습니다. CPU 코어 수에서 계산한 GET / PUT 대역폭의 절대 상한입니다. 단위는 초당 바이트입니다. `0` 이하이면 상한이 없습니다.
* 기본값: 0

#### `s3_rate_limiter_cpu_cores_override` {#s3_rate_limiter_cpu_cores_override}

* 유형: int32
* 설명: 버전 4.1.4에서 추가되었습니다. 위의 속도 제한을 계산할 때 사용하는 CPU 코어 수입니다. `0` 이하이면 머신의 코어 수를 자동으로 감지합니다.
* 기본값: 0

#### `s3_rate_limiter_log_interval` {#s3_rate_limiter_log_interval}

* 유형: int64
* 설명: 버전 4.1.4에서 추가되었습니다. 객체 스토리지 속도 제한이 트리거될 때 출력하는 로그 항목 사이의 최소 간격(밀리초)입니다.
* 기본값: 1000

#### `file_cache_mem_storage_shard_num` {#file_cache_mem_storage_shard_num}

* 유형: int32
* 설명: 버전 4.1.4에서 추가되었습니다. 동시 접근 시 잠금 경합을 줄이는 데 사용하는 File Cache 메모리 저장소의 샤드 수입니다.
* 기본값: 1024

#### `time_series_max_tablet_version_num` {#time_series_max_tablet_version_num}

* 유형: int
* 설명: 시계열 컴팩션 정책을 사용하는 단일 tablet의 버전 수를 제한합니다. 데이터 적재가 너무 잦거나 컴팩션이 제때 수행되지 않아 버전이 대량으로 쌓이는 문제를 방지합니다. 제한을 초과하면 데이터 적재 작업을 거부합니다.
* 기본값: 20000
