---
{
    "title": "Meta Service 구성",
    "language": "ko",
    "description": "컴퓨팅과 스토리지가 분리된 모드에서 Meta Service 구성 옵션의 유형, 기본값, 런타임 변경 가능 여부 및 적용 효과를 설명합니다."
}
---

이 페이지에서는 4.1.5에서 추가된 Meta Service 구성 옵션을 소개하며, 아직 모든 옵션을 다루지는 않습니다. Meta Service는 `doris_cloud.conf`를 사용합니다. 이 옵션들은 FE의 `fe.conf`나 BE의 `be.conf`에 설정하는 옵션이 아닙니다.

## 트랜잭션 관리 {#transaction-management}

### `enable_get_prepare_txn_by_coordinator_by_running_key` {#enable_get_prepare_txn_by_coordinator_by_running_key}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `true` |
| 런타임 변경 가능 여부 | 예 |
| 버전 | 4.1.5에서 추가됨 |

Meta Service가 코디네이터에 속한 준비 상태의 트랜잭션을 스캔하는 방식을 제어합니다. 기본적으로 실행 중인 트랜잭션의 인덱스를 먼저 스캔한 다음 해당 트랜잭션 정보를 조회하므로, 모든 트랜잭션 레코드를 스캔하지 않아도 됩니다. 트랜잭션 정보 레코드를 직접 스캔하려면 `false`로 설정하세요. 두 방식은 동일한 트랜잭션 선택 기준을 사용하며 같은 결과를 반환합니다. 스캔 전략을 변경해야 하는 경우가 아니라면 기본값을 유지하세요.

이 옵션을 명시적으로 설정하려면 Meta Service의 `doris_cloud.conf`에 다음 내용을 추가하세요.

```properties
enable_get_prepare_txn_by_coordinator_by_running_key = true
```
