---
{
    "title": "FE 로그 관리",
    "language": "ko",
    "description": "Apache Doris FE 로그 관리 가이드: 로그 유형(fe.log/fe.warn.log/fe.audit.log/fe.out/fe.gc.log), 로그 보존 및 롤링 설정, 런타임에 DEBUG 로그 활성화, 컨테이너 환경에서 stdout 로그 통합.",
    "keywords": [
        "Doris FE logs",
        "fe.log",
        "fe.warn.log",
        "fe.audit.log",
        "fe.out",
        "fe.gc.log",
        "audit log",
        "GC log",
        "log level",
        "DEBUG log",
        "sys_log_verbose_modules",
        "sys_log_mode",
        "log_rollover_strategy",
        "log rolling",
        "log retention",
        "log compression",
        "Kubernetes FE logs",
        "container logs",
        "stdout logs",
        "enable_file_logger",
        "runtime log level adjustment",
        "Doris log troubleshooting"
    ]
}
---

이 문서는 Doris 클러스터를 운영하는 운영 및 개발 엔지니어를 위한 문서입니다. FE(Frontend) 프로세스의 로깅 시스템을 설명하며, 로그 파일 유형, 로그 보존 및 롤링 정책, 런타임에 DEBUG 로그를 활성화하는 방법, 컨테이너 환경에서 로그를 통합하는 방법을 다룹니다.

> 이 문서는 Doris 2.1.4 이상 버전에 적용됩니다.

<!-- Knowledge type: Operations guide + Configuration parameters -->
<!-- Use cases: Daily operations / Troubleshooting / Performance tuning / Containerized deployment -->

## 사용 사례 {#use-cases}

| 상황 | 권장 섹션 |
| --- | --- |
| FE가 생성하는 로그 파일과 각 파일의 용도 파악 | [로그 유형](#log-categories) |
| 로그 보존 일수, 단일 파일 크기 또는 롤링 정책 조정 | [로그 설정](#log-configuration) |
| 문제 해결 중 특정 클래스 또는 패키지의 DEBUG 로그 활성화 | [DEBUG 로그 활성화](#enable-debug-logs) |
| Kubernetes 또는 다른 컨테이너 환경에 배포하고 로그를 stdout으로 출력 | [컨테이너 환경의 로그 설정](#container-environment-log-configuration) |
| 감사 로그의 위치와 기록 내용 확인 | `fe.audit.log`에 대한 [로그 유형](#log-categories)의 설명 및 [로그 설정](#log-configuration)의 감사 관련 매개변수 |

## 로그 유형 {#log-categories}

<!-- Knowledge type: Concept overview -->
<!-- Use cases: Quickly confirm which log to look at before troubleshooting -->

`sh bin/start_fe.sh --daemon`으로 FE 프로세스를 시작하면 FE 로그 디렉터리(`LOG_DIR` 설정으로 지정하며, 기본값은 FE 배포 경로 아래의 `log/` 디렉터리)에 다음 로그 파일이 생성됩니다.

| 로그 파일 | 유형 | 설명 |
| --- | --- | --- |
| `fe.log` | 런타임 로그(주 로그) | FE 프로세스의 주 로그입니다. 모든 수준(DEBUG, INFO, WARN, ERROR 등)의 런타임 로그를 포함합니다. |
| `fe.warn.log` | 런타임 로그(경고) | WARN 수준 이상의 로그만 기록합니다. `fe.log`의 일부이며, 경고나 오류를 빠르게 확인하는 데 유용합니다. |
| `fe.audit.log` | 감사 로그 | 이 FE 노드를 통해 실행되는 모든 데이터베이스 작업(SQL, DDL, DML 등)을 기록합니다. |
| `fe.out` | 표준 출력 / 오류 스트림 | 시작 스크립트의 `echo` 출력과 log4j 프레임워크가 수집하지 못한 로그 메시지를 기록합니다. 런타임 로그를 보완하며, 드물게 추가 정보를 확인하기 위해 이 파일을 살펴봐야 할 수 있습니다. |
| `fe.gc.log` | JVM GC 로그 | FE JVM의 가비지 컬렉션 로그입니다. 동작은 `fe.conf`의 `JAVA_OPTS`로 제어합니다. |

## 로그 설정 {#log-configuration}

<!-- Knowledge type: Configuration parameters -->
<!-- Use cases: Adjust log retention policy, rolling mode, and compressed archiving -->

다음 설정 항목은 모두 `fe.conf` 파일에 있습니다. 로그 저장 경로, 보존 기간, 보존 개수, 단일 파일 크기 및 관련 동작을 제어합니다.

### 일반 설정 {#general-configuration}

| 설정 항목 | 기본값 | 옵션 | 설명 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` | | 모든 로그의 저장 경로입니다. 기본값은 FE 배포 경로 아래의 `log/` 디렉터리입니다. 이 항목은 환경 변수이므로 설정 이름을 대문자로 작성해야 합니다. |
| `sys_log_level` | `INFO` | `INFO`, `WARN`, `ERROR`, `FATAL` | `fe.log`의 로그 수준입니다. 기본값은 INFO입니다. INFO 수준에는 중요한 로그 메시지가 많이 포함되므로 변경하지 않는 것이 좋습니다. |
| `sys_log_mode` | `NORMAL` | `NORMAL`, `BRIEF`, `ASYNC` | FE 로그의 출력 모드입니다. 기본 모드인 `NORMAL`은 로그를 동기적으로 기록하며 위치 정보를 포함합니다. `ASYNC`는 로그를 비동기적으로 기록하며 위치 정보를 포함합니다. `BRIEF`는 로그를 비동기적으로 기록하지만 위치 정보는 생략합니다. 성능은 `NORMAL`, `ASYNC`, `BRIEF` 순으로 향상됩니다. |

:::note
3.0.2 버전부터 `sys_log_mode`의 기본값이 `ASYNC`로 변경되었습니다.
:::

### 런타임 로그(fe.log / fe.warn.log) {#runtime-logs-felog--fewarnlog}

| 설정 항목 | 기본값 | 옵션 | 설명 |
| --- | --- | --- | --- |
| `log_roll_size_mb` | 1024 | | 개별 `fe.log`, `fe.warn.log` 또는 `fe.audit.log` 파일의 최대 크기입니다. 기본값은 1024 MB입니다. 단일 로그 파일이 이 임계값을 초과하면 새 파일이 자동으로 생성됩니다. |
| `sys_log_roll_interval` | `DAY` | `DAY`, `HOUR` | `fe.log`와 `fe.warn.log`의 롤링 간격입니다. 기본값은 1일이며, 매일 새 로그 파일을 생성합니다. |
| `sys_log_roll_num` | 10 | | 하루 동안 보존하는 `fe.log`와 `fe.warn.log` 파일의 최대 개수입니다. 기본값은 10입니다. 롤링이나 분할로 파일 개수가 이 임계값을 초과하면 오래된 로그 파일을 삭제합니다. |
| `sys_log_enable_compress` | false | true, false | 이전 `fe.log` 및 `fe.warn.log` 파일의 압축을 활성화할지 여부입니다. 기본적으로 비활성화되어 있습니다. 활성화하면 이전 로그를 gzip으로 압축하여 보관합니다. |
| `sys_log_verbose_modules` | | | 지정한 Java 패키지 또는 클래스의 DEBUG 수준 로깅을 활성화합니다. [DEBUG 로그 활성화](#enable-debug-logs)를 참조하세요. |

:::tip
`sys_log_roll_num`은 전체 개수가 아닌 일별 로그 보존 개수를 제어합니다. 전체 로그 보존 개수는 `sys_log_delete_age`와 함께 고려해야 합니다.
:::

### 감사 로그(fe.audit.log) {#audit-log-feauditlog}

| 설정 항목 | 기본값 | 옵션 | 설명 |
| --- | --- | --- | --- |
| `audit_log_dir` | `ENV(DORIS_HOME)/log` | | `fe.audit.log`의 별도 저장 경로입니다. 기본값은 FE 배포 경로 아래의 `log/` 디렉터리입니다. |
| `audit_log_roll_interval` | `DAY` | `DAY`, `HOUR` | `fe.audit.log`의 롤링 간격입니다. 기본값은 1일이며, 매일 새 로그 파일을 생성합니다. |
| `audit_log_roll_num` | 90 | | `fe.audit.log` 파일의 최대 개수입니다. 기본값은 90입니다. 롤링이나 분할로 파일 개수가 이 임계값을 초과하면 오래된 로그 파일을 삭제합니다. |
| `audit_log_enable_compress` | false | true, false | 이전 `fe.audit.log` 파일의 압축을 활성화할지 여부입니다. 기본적으로 비활성화되어 있습니다. 활성화하면 이전 감사 로그를 gzip으로 압축하여 보관합니다. |
| `audit_log_modules` | `{"slow_query", "query", "load", "stream_load"}` | | `fe.audit.log`에 기록할 모듈 유형입니다. 기본값은 느린 쿼리, 쿼리, 데이터 적재, Stream Load입니다. "쿼리"에는 모든 DDL, DML 및 SQL 작업이 포함됩니다. "느린 쿼리"는 이러한 작업 중 실행 시간이 `qe_slow_log_ms` 임계값을 초과하는 작업을 의미합니다. "데이터 적재"는 Broker Load를, "Stream Load"는 Stream Load 작업을 의미합니다. |
| `qe_slow_log_ms` | 5000 | | DDL, DML 또는 SQL 문의 실행 시간이 이 임계값을 초과하면 `fe.audit.log`의 `slow_query` 모듈에 별도로 기록합니다. 기본값은 5000 ms입니다. |
| `sql_digest_generation_threshold_ms` | 5000 | | `sql_digest` 생성에 대한 시간 임계값이며, 단위는 밀리초입니다. 쿼리의 응답 시간이 이 임계값을 초과하면 `fe.audit.log`에 해당 쿼리의 `sql_digest`를 생성합니다. 기본값은 5000 ms입니다. |

### 기간 기준 보존(log_rollover_strategy = age) {#retention-by-time-log_rollover_strategy--age}

| 설정 항목 | 기본값 | 옵션 | 설명 |
| --- | --- | --- | --- |
| `log_rollover_strategy` | `age` | `age`, `size` | 로그 보존 전략입니다. 기본값인 `age`는 기간을 기준으로 이전 로그를 보존하고, `size`는 전체 크기를 기준으로 이전 로그를 보존합니다. |
| `sys_log_delete_age` | 7d | 7d, 10h, 60m, 120s 등의 형식 지원 | `log_rollover_strategy`가 `age`일 때만 적용됩니다. `fe.log` 및 `fe.warn.log` 파일의 보존 기간을 제어합니다. 기본값은 7일입니다. 7일이 지난 로그는 자동으로 삭제됩니다. |
| `audit_log_delete_age` | 30d | 7d, 10h, 60m, 120s 등의 형식 지원 | `log_rollover_strategy`가 `age`일 때만 적용됩니다. `fe.audit.log` 파일의 보존 기간을 제어합니다. 기본값은 30일입니다. 30일이 지난 로그는 자동으로 삭제됩니다. |

### 크기 기준 보존(log_rollover_strategy = size) {#retention-by-size-log_rollover_strategy--size}

| 설정 항목 | 기본값 | 옵션 | 설명 |
| --- | --- | --- | --- |
| `info_sys_accumulated_file_size` | 4 | | `log_rollover_strategy`가 `size`일 때만 적용됩니다. `fe.log` 파일의 누적 크기를 제어합니다. 기본값은 4 GB입니다. 로그의 누적 크기가 이 임계값을 초과하면 이전 로그 파일을 삭제합니다. |
| `warn_sys_accumulated_file_size` | 2 | | `log_rollover_strategy`가 `size`일 때만 적용됩니다. `fe.warn.log` 파일의 누적 크기를 제어합니다. 기본값은 2 GB입니다. 로그의 누적 크기가 이 임계값을 초과하면 이전 로그 파일을 삭제합니다. |
| `audit_sys_accumulated_file_size` | 4 | | `log_rollover_strategy`가 `size`일 때만 적용됩니다. `fe.audit.log` 파일의 누적 크기를 제어합니다. 기본값은 4 GB입니다. 로그의 누적 크기가 이 임계값을 초과하면 이전 로그 파일을 삭제합니다. |

## DEBUG 로그 활성화 {#enable-debug-logs}

<!-- Knowledge type: Procedures -->
<!-- Use cases: Troubleshooting / temporarily inspecting runtime details of a specific class or package -->

FE의 DEBUG 수준 로그는 설정 파일을 수정하거나 런타임에 UI 또는 REST API를 통해 활성화할 수 있습니다. 세 가지 방법을 비교하면 다음과 같습니다.

| 방법 | 재시작 필요 여부 | 적용 범위 | 사용 사례 |
| --- | --- | --- | --- |
| `fe.conf` 수정 | FE 재시작 필요 | 모든 노드가 재시작 후 각자의 설정 적용 | 특정 DEBUG 로그를 장기간 활성화 |
| FE UI | 재시작 불필요 | 현재 FE 노드에만 적용 | 임시 조사, 화면을 통한 조작 |
| REST API | 재시작 불필요 | 대상 FE 노드에만 적용 | 임시 조사, 스크립트를 통한 일괄 작업 |

### 방법 1: 설정 파일 사용 {#option-1-through-the-configuration-file}

`fe.conf`에 `sys_log_verbose_modules`를 추가합니다. 예를 들면 다음과 같습니다.

```text
# Enable DEBUG log only for the class org.apache.doris.catalog.Catalog
sys_log_verbose_modules=org.apache.doris.catalog.Catalog

# Enable DEBUG log for all classes under the package org.apache.doris.catalog
sys_log_verbose_modules=org.apache.doris.catalog

# Enable DEBUG log for all classes under the package org
sys_log_verbose_modules=org
```

설정 항목을 추가한 후 FE 노드를 재시작하면 적용됩니다.

### 방법 2: FE UI 사용 {#option-2-through-the-fe-ui}

UI에서는 FE 노드를 재시작하지 않고 런타임에 로그 수준을 변경할 수 있습니다. 절차는 다음과 같습니다.

1. 브라우저에서 FE 노드의 HTTP 포트(기본값 8030)에 접속한 후 UI에 로그인합니다.
2. 상단 탐색 모음에서 `Log` 탭을 클릭합니다.

    ![FE UI 사용](/images/log_manage/fe_web_log1.png)

3. 추가 입력란에 패키지 이름 또는 특정 클래스 이름을 입력하여 해당 DEBUG 로그를 활성화합니다. 예를 들어 `org.apache.doris.catalog.Catalog`를 입력하면 Catalog 클래스의 DEBUG 로깅이 활성화됩니다.

    ![FE UI 사용](/images/log_manage/fe_web_log2.png)

4. 삭제 입력란에 패키지 이름 또는 특정 클래스 이름을 입력하여 해당 DEBUG 로그를 비활성화합니다.

:::note
여기서 변경한 내용은 해당 FE 노드의 로그 수준에만 적용되며 다른 FE 노드에는 영향을 주지 않습니다.
:::

### 방법 3: REST API 사용 {#option-3-through-the-rest-api}

REST API를 통해서도 FE 노드를 재시작하지 않고 런타임에 로그 수준을 변경할 수 있습니다.

- **DEBUG 로그 활성화**

    ```shell
    curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?add_verbose=org.apache.doris.catalog.Catalog
    ```

    사용자 이름과 비밀번호는 Doris에 로그인하는 root 또는 admin 사용자의 인증 정보입니다. `add_verbose` 매개변수는 DEBUG 로깅을 활성화할 패키지 또는 클래스 이름을 지정합니다. 성공하면 다음 응답을 반환합니다.

    ```json
    {
        "msg": "success",
        "code": 0,
        "data": {
            "LogConfiguration": {
                "VerboseNames": "org,org.apache.doris.catalog.Catalog",
                "AuditNames": "slow_query,query,load",
                "Level": "INFO"
            }
        },
        "count": 0
    }
    ```

- **DEBUG 로그 비활성화**

    ```shell
    curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?del_verbose=org.apache.doris.catalog.Catalog
    ```

    `del_verbose` 매개변수는 DEBUG 로깅을 비활성화할 패키지 또는 클래스 이름을 지정합니다.

## 컨테이너 환경의 로그 설정 {#container-environment-log-configuration}

<!-- Knowledge type: Procedures + Configuration parameters -->
<!-- Use cases: Containerized deployment (Kubernetes) / sending logs to stdout for collection -->

일부 환경에서는(예: Kubernetes를 통해 FE 프로세스를 배포하는 경우) 컨테이너 로그 수집기가 모든 로그를 일관된 방식으로 수집할 수 있도록 파일 대신 표준 출력 스트림으로 로그를 보내야 합니다.

### 시작 방법 {#startup-method}

다음 명령으로 FE 프로세스를 포그라운드에서 시작합니다. 그러면 모든 로그가 표준 출력 스트림으로 전송됩니다.

```shell
sh bin/start_fe.sh --console
```

### 로그 접두사로 유형 식별 {#log-prefix-identification}

동일한 표준 출력 스트림에서 로그 유형을 구분할 수 있도록 각 로그 줄에 유형별 접두사가 추가됩니다. 출력 예시는 다음과 같습니다.

```text
RuntimeLogger 2024-06-24 00:05:21,522 INFO (main|1) [DorisFE.start():158] Doris FE starting...
RuntimeLogger 2024-06-24 00:05:21,530 INFO (main|1) [FrontendOptions.analyzePriorityCidrs():194] configured prior_cidrs value: 172.20.32.136/24
RuntimeLogger 2024-06-24 00:05:21,535 INFO (main|1) [FrontendOptions.initAddrUseIp():101] local address: /172.20.32.136.
RuntimeLogger 2024-06-24 00:05:21,740 INFO (main|1) [ConsistencyChecker.initWorkTime():106] consistency checker will work from 23:00 to 23:00
RuntimeLogger 2024-06-24 00:05:21,889 ERROR (main|1) [Util.report():128] SLF4J: Class path contains multiple SLF4J bindings.
```

각 접두사에 해당하는 로그 유형은 다음과 같습니다.

| 접두사 | 해당 로그 파일 | 설명 |
| --- | --- | --- |
| `StdoutLogger` | `fe.out` | 표준 출력 스트림의 로그입니다. |
| `StderrLogger` | `fe.out` | 표준 오류 스트림의 로그입니다. |
| `RuntimeLogger` | `fe.log` | FE의 주 런타임 로그입니다. |
| `AuditLogger` | `fe.audit.log` | 감사 로그입니다. |
| 접두사 없음 | `fe.gc.log` | GC 로그입니다. |

### 컨테이너 환경의 추가 설정 {#additional-configuration-for-container-environments}

| 설정 항목 | 기본값 | 옵션 | 설명 |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false | 파일 로깅을 활성화할지 여부입니다. 기본값은 `true`입니다. `--console` 명령으로 FE 프로세스를 시작하면 로그를 표준 출력 스트림과 일반 로그 파일에 모두 기록합니다. `false`로 설정하면 로그를 표준 출력 스트림에만 기록하며 로그 파일은 생성하지 않습니다. |
