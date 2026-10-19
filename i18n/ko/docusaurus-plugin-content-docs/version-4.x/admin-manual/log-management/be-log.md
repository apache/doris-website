---
{
    "title": "BE 로그 관리",
    "language": "ko",
    "description": "Apache Doris Backend (BE) 프로세스의 로그 관리 가이드: 로그 종류, 로그 경로 및 로테이션 정책 설정, DEBUG 로그 활성화 방법, 컨테이너 환경의 로그 출력 설정.",
    "keywords": [
        "Doris BE logs",
        "Backend logs",
        "be.INFO",
        "be.WARNING",
        "be.out",
        "jni.log",
        "be.gc.log",
        "sys_log_level",
        "sys_log_roll_mode",
        "sys_log_verbose_modules",
        "DEBUG logs",
        "dynamic log level adjustment",
        "glog adjust",
        "container logs",
        "Kubernetes BE logs",
        "enable_file_logger",
        "Doris log path",
        "BE log configuration"
    ]
}
---

이 문서는 Apache Doris Backend (BE) 프로세스의 로깅 시스템을 설명합니다. 로그 파일 종류, 로그 경로와 로테이션 정책 설정, DEBUG 로그 활성화 방법, Kubernetes와 같은 컨테이너 환경에서 로그를 표준 출력 스트림으로 보내는 방법을 다룹니다.

이 문서는 Apache Doris 2.1.4 이상에 적용됩니다.

<!-- Knowledge type: Configuration parameters / Procedures -->
<!-- Use cases: Daily operations / Troubleshooting / Containerized deployment -->

## 사용 사례 {#use-cases}

| 시나리오 | 권장 섹션 |
| --- | --- |
| BE 프로세스가 생성하는 로그 파일 확인 | [로그 종류](#log-categories) |
| 로그 저장 경로, 로테이션 정책 또는 보관 파일 수 조정 | [로그 설정](#log-configuration) |
| DEBUG 수준 로그가 필요한 문제 해결 | [DEBUG 로그 활성화](#enable-debug-logs) |
| Kubernetes와 같은 컨테이너 환경에 BE를 배포하고 로그를 stdout으로 전송 | [컨테이너 환경의 로그 설정](#container-environment-log-configuration) |
| BE 비정상 종료 후 스택 트레이스 확인 | `be.out` 확인([로그 종류](#log-categories) 참조) |

## 로그 종류 {#log-categories}

`sh bin/start_be.sh --daemon`으로 BE 프로세스를 시작하면 BE 로그 디렉터리에 다음 로그 파일이 생성됩니다.

| 파일 이름 | 내용 | 참고 사항 |
| --- | --- | --- |
| `be.INFO` | BE 프로세스의 기본 런타임 로그입니다. DEBUG, INFO, WARN, ERROR 등 모든 수준의 로그를 포함합니다. | 현재 최신 BE 런타임 로그 파일을 가리키는 심볼릭 링크입니다. |
| `be.WARNING` | WARN 수준 이상의 런타임 로그만 포함합니다. `be.INFO`의 일부입니다. | 현재 최신 BE 경고 로그 파일을 가리키는 심볼릭 링크입니다. 경고나 오류를 빠르게 확인할 때 유용합니다. |
| `be.out` | 표준 출력 스트림(stdout)과 표준 오류 스트림(stderr)의 로그입니다. 시작 스크립트의 `echo` 출력과 glog 프레임워크가 수집하지 못한 로그 등이 포함됩니다. | BE가 비정상 종료되면 일반적으로 이 파일에 비정상 종료 시점의 스택 트레이스가 기록됩니다. |
| `jni.log` | BE가 JNI를 통해 호출하는 Java 프로그램에서 출력한 로그입니다. | TODO: 향후 릴리스에서는 이 로그가 `be.INFO`로 통합될 예정입니다. |
| `be.gc.log` | BE JVM의 GC 로그입니다. | JVM 시작 옵션 `JAVA_OPTS`로 제어합니다. 이 옵션은 `be.conf`에서 설정합니다. |

## 로그 설정 {#log-configuration}

<!-- Knowledge type: Configuration parameters -->
<!-- Use cases: Log path adjustment / Rolling policy tuning / Log retention policy management -->

다음 설정 항목은 모두 `be.conf` 파일에 있습니다. 로그 저장 경로, 보관 기간, 보관 파일 수, 파일당 크기, 로테이션 정책 등을 제어합니다.

| 설정 항목 | 기본값 | 옵션 | 설명 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` | — | 모든 로그의 저장 경로입니다. 기본값은 BE 배포 경로 아래의 `log/` 디렉터리입니다. 환경 변수이므로 설정 이름을 대문자로 작성해야 합니다. |
| `sys_log_level` | `INFO` | `INFO`, `WARNING`, `ERROR`, `FATAL` | `be.INFO`의 로그 수준입니다. 기본값은 `INFO`입니다. `INFO` 수준에는 중요한 로그 메시지가 많이 포함되므로 변경하지 않는 것이 좋습니다. |
| `sys_log_roll_num` | `10` | — | `be.INFO`와 `be.WARNING`의 최대 파일 수입니다. 기본값은 10입니다. 로그 로테이션이나 분할로 파일 수가 이 한도를 초과하면 오래된 로그가 삭제됩니다. |
| `sys_log_verbose_modules` | 비어 있음 | — | DEBUG 수준 로그를 활성화할 소스 코드 파일을 지정합니다. 자세한 내용은 [DEBUG 로그 활성화](#enable-debug-logs)를 참조하세요. |
| `sys_log_verbose_level` | 비어 있음 | — | DEBUG 로그의 상세 수준입니다. 자세한 내용은 [DEBUG 로그 활성화](#enable-debug-logs)를 참조하세요. |
| `sys_log_verbose_flags_v` | 비어 있음 | — | glog의 `FLAGS_v`에 해당합니다. DEBUG 로그의 상세 수준을 전역으로 제어합니다. 자세한 내용은 [DEBUG 로그 활성화](#enable-debug-logs)를 참조하세요. |
| `sys_log_roll_mode` | `SIZE-MB-1024` | `TIME-DAY`, `TIME-HOUR`, `SIZE-MB-nnn` | `be.INFO`와 `be.WARNING`의 로테이션 정책입니다. 기본값은 `SIZE-MB-1024`이며, 로그 크기가 1024 MB에 도달할 때마다 새 파일을 생성합니다. 일별 또는 시간별로 로테이션하도록 변경할 수도 있습니다. |
| `log_buffer_level` | 비어 있음 | 비어 있음 또는 `-1` | BE 로그 출력 모드입니다. 기본적으로 비동기 방식으로 디스크에 플러시합니다. `-1`로 설정하면 로그를 실시간으로 플러시하므로 성능이 다소 저하되지만, BE가 비정상 종료될 때 최신 로그를 최대한 보존할 수 있습니다. |
| `disable_compaction_trace_log` | `true` | `true`, `false` | Compaction 작업의 추적 로그를 비활성화할지 여부입니다. 기본값은 `true`로, 추적 로그가 비활성화됩니다. `false`로 설정하면 Compaction 관련 문제 해결에 도움이 되는 Compaction 추적 로그를 출력합니다. |
| `aws_log_level` | `0` | `0`–`6` | AWS SDK의 로그 수준을 제어합니다. 기본값은 `0`(비활성화)입니다. glog가 기본적으로 AWS SDK 로그를 수집하고 출력하므로, 수집되지 않은 로그를 확인해야 할 때만 활성화하세요. 수준별 매핑: `Off=0`, `Fatal=1`, `Error=2`, `Warn=3`, `Info=4`, `Debug=5`, `Trace=6`. |
| `s3_file_writer_log_interval_second` | `60` | — | S3 Upload 작업 중 진행 상황을 출력하는 간격입니다. 단위는 초입니다. |
| `enable_debug_log_timeout_secs` | `0` | — | `0`보다 크면 문제 해결을 위해 Pipeline 실행 엔진의 상세 실행 로그를 출력합니다. 기본적으로 비활성화되어 있습니다. |
| `sys_log_enable_custom_date_time_format` | `false` | `true`, `false` | 로그의 날짜 형식을 사용자 지정할 수 있도록 허용할지 여부입니다(버전 2.1.7부터 지원). |
| `sys_log_custom_date_time_format` | `%Y-%m-%d %H:%M:%S` | — | 로그에 사용할 사용자 지정 날짜 형식입니다. `sys_log_enable_custom_date_time_format`이 `true`일 때만 적용됩니다(버전 2.1.7부터 지원). |
| `sys_log_custom_date_time_ms_format` | `,{:03d}` | — | 로그 날짜의 밀리초 부분에 사용할 사용자 지정 형식입니다. `sys_log_enable_custom_date_time_format`이 `true`일 때만 적용됩니다(버전 2.1.7부터 지원). |

## DEBUG 로그 활성화 {#enable-debug-logs}

<!-- Knowledge type: Procedures -->
<!-- Use cases: Troubleshooting / Performance issue diagnosis -->

BE는 DEBUG 로그를 활성화하는 두 가지 방법을 지원합니다.

- **정적 설정**: `be.conf`에서 설정한 후 BE를 재시작하면 변경 사항이 적용됩니다. 설정은 재시작 후에도 유지됩니다.
- **동적 조정**: 재시작 없이 RESTful API를 통해 실행 중에 변경합니다. 설정은 영구 저장되지 않으며 BE를 재시작하면 사라집니다.

### 정적 설정 {#static-configuration}

`sys_log_verbose_modules`와 `sys_log_verbose_level`을 `be.conf`에 설정합니다.

```text
sys_log_verbose_modules=plan_fragment_executor,olap_scan_node
sys_log_verbose_level=3
```

매개변수 설명:

| 매개변수 | 용도 |
| --- | --- |
| `sys_log_verbose_modules` | DEBUG를 활성화할 소스 파일 이름을 지정합니다. 여러 파일은 쉼표로 구분합니다. 와일드카드 `*`를 지원합니다. 예를 들어 `sys_log_verbose_modules=*`로 설정하면 모든 모듈의 DEBUG 로그가 활성화됩니다. |
| `sys_log_verbose_level` | DEBUG 로그의 상세 수준입니다. 유효 범위는 `1`에서 `10`까지입니다. 값이 클수록 더 상세한 로그가 출력됩니다. |
| `sys_log_verbose_flags_v` | glog의 `FLAGS_v`에 해당하며 로그의 상세 수준을 전역으로 제어합니다. `VLOG(n)` 로그는 `n <= FLAGS_v`일 때만 출력되므로 출력 범위를 더 세밀하게 제어할 수 있습니다. 적용 범위는 `sys_log_verbose_modules`로 **제한되지 않습니다**. |

대부분의 경우 `sys_log_verbose_modules`와 `sys_log_verbose_level`을 설정하는 것으로 충분합니다. 일부 디버그 로그가 예상대로 출력되지 않을 때만 `sys_log_verbose_flags_v`를 설정하세요.

### 동적 조정 {#dynamic-adjustment}

Doris 2.1부터는 RESTful API를 통해 BE DEBUG 로그를 동적으로 조정할 수 있습니다.

```bash
curl -X POST "http://<be_host>:<webport>/api/glog/adjust?module=<module_name>&level=<level_number>"
```

매개변수:

- `<be_host>`: BE 노드의 호스트 주소입니다.
- `<webport>`: BE의 HTTP 포트입니다. 기본값은 `8040`입니다.
- `<module_name>`: 조정할 모듈의 이름(소스 파일 이름)입니다. 와일드카드 `*`를 지원합니다.
- `<level_number>`: DEBUG 로그의 상세 수준입니다. `-1`로 설정하면 비활성화됩니다.

사용 시 참고 사항:

- **설정이 영구 저장되지 않음**: 동적으로 조정한 설정은 BE를 재시작하면 사라집니다. 재시작 후 다시 설정해야 합니다.
- **와일드카드와 개별 모듈 설정은 서로 독립적임**: 예를 들어 먼저 `moduleA`의 vlog 수준을 `10`으로 설정한 다음 `module=*&level=-1`을 실행해도 `moduleA`의 vlog는 **꺼지지 않습니다**.
- **모듈 이름의 유효성을 검사하지 않음**: 어떤 방법을 사용하든 모듈이 존재하지 않으면 glog는 해당 로그 모듈을 생성하고 오류를 반환하지 않습니다. 이 경우 실제 효과는 없습니다.

## 컨테이너 환경의 로그 설정 {#container-environment-log-configuration}

<!-- Knowledge type: Configuration parameters / Procedures -->
<!-- Use cases: Kubernetes / Containerized deployment / stdout log collection -->

Kubernetes와 같은 컨테이너 환경에 BE를 배포할 때는 일반적으로 모든 로그를 파일 대신 표준 출력 스트림으로 보내야 합니다. 이렇게 하면 컨테이너 오케스트레이션 플랫폼에서 로그를 중앙 집중식으로 수집할 수 있습니다.

### 시작 {#startup}

`--console` 매개변수를 사용하면 BE 프로세스를 포그라운드에서 시작하고 모든 로그를 표준 출력 스트림으로 보낼 수 있습니다.

```shell
sh bin/start_be.sh --console
```

### 로그 접두사 설명 {#log-prefix-description}

여러 종류의 로그가 동일한 표준 출력 스트림으로 전송되므로, BE는 각 로그 항목에 접두사를 붙여 구분합니다. 출력 예시:

```text
RuntimeLogger W20240624 00:36:46.325274 1460943 olap_server.cpp:710] Have not get FE Master heartbeat yet
RuntimeLogger I20240624 00:36:46.325999 1459644 olap_server.cpp:208] tablet checkpoint tasks producer thread started
RuntimeLogger I20240624 00:36:46.326066 1460954 olap_server.cpp:448] begin to produce tablet meta checkpoint tasks.
RuntimeLogger I20240624 00:36:46.326093 1459644 olap_server.cpp:213] tablet path check thread started
RuntimeLogger I20240624 00:36:46.326190 1459644 olap_server.cpp:219] cache clean thread started
RuntimeLogger I20240624 00:36:46.326336 1459644 olap_server.cpp:231] path gc threads started. number:1
RuntimeLogger I20240624 00:36:46.326643 1460958 olap_server.cpp:424] try to start path gc thread!
```

각 접두사의 의미:

| 접두사 | 해당 로그 |
| --- | --- |
| `RuntimeLogger` | `be.INFO`의 로그 |

> `jni.log`의 접두사 지원은 향후 릴리스에 추가될 예정입니다.

### 컨테이너 전용 설정 {#container-specific-configuration}

| 설정 항목 | 기본값 | 옵션 | 설명 |
| --- | --- | --- | --- |
| `enable_file_logger` | `true` | `true`, `false` | 파일 로깅도 함께 활성화할지 여부입니다. 기본값은 `true`이며, BE를 `--console`로 시작하면 로그가 stdout과 로그 파일에 모두 기록됩니다. `false`로 설정하면 로그가 stdout에만 기록되며 로그 파일은 생성되지 않습니다. |

## 자주 묻는 질문 {#faq}

### Q: BE가 비정상 종료되었지만 `be.INFO`에 뚜렷한 스택 트레이스가 없습니다 {#q-be-crashed-but-no-obvious-stack-trace-appears-in-beinfo}

`be.out`을 확인하세요. BE가 비정상 종료되었을 때의 스택 트레이스는 일반적으로 이 파일에 기록됩니다.

### Q: `be.conf`를 수정한 후 로그 설정이 적용되지 않습니다 {#q-log-configuration-does-not-take-effect-after-editing-beconf}

정적 설정은 BE를 재시작해야 적용됩니다. 변경 사항을 즉시 적용하려면 [동적 조정](#dynamic-adjustment) RESTful API를 사용하세요.

### Q: 동적으로 조정한 vlog 수준이 재시작 후 사라집니다 {#q-a-dynamically-adjusted-vlog-level-is-lost-after-a-restart}

동적으로 조정한 설정은 영구 저장되지 않습니다. 재시작 후 다시 설정하거나 `be.conf`에 설정을 작성하세요.

### Q: DEBUG 로그를 활성화한 후 로그 양이 너무 많아 디스크 공간이 부족합니다 {#q-after-enabling-debug-logs-the-log-volume-is-too-large-and-disk-space-is-tight}

`sys_log_verbose_level`을 낮추거나, `sys_log_verbose_modules`의 적용 범위를 좁히거나, `sys_log_roll_num`을 조정하여 보관 파일 수를 제어하세요.

### Q: 컨테이너 환경에서 stdout에 로그가 출력되지 않습니다 {#q-no-log-output-appears-on-stdout-in-a-container-environment}

BE가 `sh bin/start_be.sh --console`로 시작되었는지 확인하세요. 파일 로깅을 비활성화하려면 `enable_file_logger`를 `false`로 설정하세요.

### Q: AWS SDK 문제는 어떻게 해결하나요? {#q-troubleshooting-aws-sdk-issues}

`aws_log_level`을 일시적으로 높인 뒤(예: `4` 또는 `5`), 문제 해결이 끝나면 로그가 과도하게 출력되지 않도록 다시 `0`으로 설정하세요.
