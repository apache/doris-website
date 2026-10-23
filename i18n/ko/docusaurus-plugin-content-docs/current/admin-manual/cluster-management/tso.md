---
{
    "title": "Timestamp Oracle (TSO)",
    "language": "ko",
    "description": "TSO 구성, 상태 확인, 복구 및 시계 역행 시 동작."
}
---

<version since="dev">

</version>

## 개요 {#overview}

Timestamp Oracle (TSO)는 Master FE에서 단조 증가하는 타임스탬프를 할당하여 Doris 트랜잭션과 증분 처리에 전역 순서 기준을 제공합니다. 현재 dev에서만 사용할 수 있으며, FE 구성 `enable_feature_changelog`로 제어합니다. 이 구성의 기본값은 `false`입니다. 물리 시간 부분은 선제적으로 증가할 수 있으므로 TSO는 실제 시계의 시각을 정확하게 나타내는 값이 아닙니다.

## 기본 사용법 {#basic-usage}

1. `enable_feature_changelog = true`를 FE 구성 파일 `fe.conf`에 설정하고 FE를 다시 시작합니다. 이 실험적 구성은 동적으로 변경할 수 없으며, 모든 FE에서 동일하게 유지해야 합니다. 변경하기 전에 changelog 활성화가 클러스터에 미치는 영향을 평가하세요.
2. 클러스터에 사용 가능한 Master FE가 있는지 확인하고 유효한 Doris 인증 정보를 준비합니다.
3. 읽기 전용 상태 엔드포인트를 쿼리합니다. 다음 명령은 기본 HTTP 포트를 사용하며 root 비밀번호를 입력하라는 메시지를 표시합니다.

```bash
curl --user root http://127.0.0.1:8030/api/tso
```

성공한 응답은 `code = 0`이며, `data`에는 할당 커서, 물리 시간, 논리 카운터, 윈도우 종료 시점이 포함됩니다. Master가 아닌 FE로 전송된 요청은 기본적으로 Master FE로 전달됩니다. 전체 응답 예시는 [TSO 작업](../open-api/fe-http/tso-action.md)을 참조하세요.

요청을 받은 FE의 로컬 상태를 확인하려면 다음 명령을 사용합니다.

```bash
curl --user root 'http://127.0.0.1:8030/api/tso?local=true'
```

이 호출은 타임스탬프를 할당하지 않습니다. 로컬 상태는 초기화되지 않았을 수 있으며, Master가 아닌 FE의 로컬 결과는 현재 활성 Master의 할당 상태를 나타내지 않습니다.

## 타임스탬프 형식 및 복구 {#timestamp-format-and-recovery}

TSO는 밀리초 단위의 물리 시간 부분과 18비트 논리 카운터를 포함하는 64비트 정수입니다. 동일한 물리적 밀리초 내에서는 카운터를 증가시켜 이후에 할당되는 값이 더 커지도록 합니다. 물리 시간 부분이 증가하면 카운터가 다시 시작됩니다.

Master FE는 향후 사용할 할당 윈도우를 예약하고, 커밋된 TSO 상태와 함께 해당 윈도우의 경계를 영구 저장합니다. 시작 시 또는 Master 장애 조치 시 서비스는 이 상태를 재생하고, 타임스탬프를 할당하기 전에 안전한 시작 지점을 보정합니다. 영구 저장 기능은 현재 구현에 포함되어 있으므로 별도의 TSO 저널 또는 체크포인트 스위치가 필요하지 않습니다.

## 구성 참조 {#configuration-reference}

다음은 FE 구성 항목입니다. [FE 구성](../config/fe-config.md)을 참조하세요. 기본 스위치인 `enable_feature_changelog`의 유형은 `boolean`이고 기본값은 `false`이며, 동적으로 변경할 수 없고 Master FE에만 적용되는 구성도 아닙니다.

| 매개변수 | 유형 | 기본값 | 동적 변경 가능 | Master 전용 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `tso_service_update_interval_ms` | int | `50 ms` | false | true | 할당 윈도우 업데이트 여부를 확인하는 간격입니다. |
| `tso_max_update_retry_count` | int | `3` | true | true | TSO 상태 업데이트의 최대 시도 횟수입니다. |
| `tso_max_get_retry_count` | int | `10` | true | true | 실패를 보고하기 전까지 TSO 할당을 시도하는 최대 횟수입니다. |
| `tso_service_window_duration_ms` | int | `1000 ms` | true | true | 예약된 할당 윈도우의 지속 시간이며, 주기적 영구 저장 간격의 상한이기도 합니다. |
| `tso_clock_backward_startup_threshold_ms` | long | `1800000 ms` | true | true | 시작 시 보정 과정에서 재생된 윈도우 종료 시점과 시스템 시계 사이에 허용되는 최대 차이입니다. |
| `tso_time_offset_debug_mode` | int | `0 ms` | true | false | 테스트 전용 시계 오프셋입니다. 정상 운영에는 사용하지 마세요. |
| `enable_tso_forward_when_counter_full` | boolean | `true` | true | true | 논리 카운터가 용량의 절반을 초과하고 실제 시계의 진행이 충분하지 않으면 물리 시간 부분을 1 ms 증가시킵니다. |

## 오류 및 주의 사항 {#errors-and-caveats}

- 재생된 윈도우 경계가 시스템 시계보다 `tso_clock_backward_startup_threshold_ms`를 초과하여 앞서 있으면 시작 시 보정에 실패합니다. 이 경우 서비스는 새 TSO를 안전하게 할당할 수 없습니다. 시계 동기화, 영구 저장된 상태 및 FE 로그를 확인하세요.
- 실행 중 시계가 역행하면 서비스가 즉시 중지되는 대신 경고와 메트릭이 기록됩니다. 물리 시간이 증가할 수 없으면 논리 카운터가 소진될 수 있으며, 할당 재시도 횟수를 모두 소진하면 TSO가 필요한 트랜잭션이 실패할 수 있습니다.
- `/api/tso`는 스냅샷이며 논리 카운터를 소모하지 않습니다. 값이 영으로 표시되거나 스냅샷이 정상으로 보이더라도 초기화 및 트랜잭션 커밋 확인을 대신할 수는 없습니다.
- `information_schema.rowsets.COMMIT_TSO`는 단일 BIGINT가 아니라 rowset의 TSO 범위를 나타내는 문자열입니다. [rowsets](../system-tables/information_schema/rowsets.md)를 참조하세요.

## 권장 사항 {#best-practices}

FE 시계를 동기화하고 HTTP 엔드포인트로 상태를 확인하며, FE 로그를 사용하여 보정 또는 할당 실패를 진단하세요. 의도적인 테스트 외에는 디버그 시계 오프셋을 변경하지 마세요. changelog와 이에 의존하는 기능의 영향을 평가한 후에만 기본 스위치를 활성화하세요. 실제 시계의 시각 값을 얻으려는 목적만으로는 이 스위치를 활성화할 이유가 되지 않습니다.
