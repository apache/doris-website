---
{
    "title": "Tablet Compaction 점수 조회",
    "language": "ko",
    "description": "BE 노드의 tablet compaction 점수를 조회하고 순위를 확인합니다. 스토리지-컴퓨트 분리 모드에서는 선택적으로 메타데이터를 동기화할 수 있습니다."
}
---

# Tablet Compaction 점수 조회 {#view-tablet-compaction-score}

## 설명 {#description}

이 읽기 전용 API를 사용하면 단일 BE 노드에서 compaction 점수가 높은 tablet을 찾을 수 있습니다. tablet의 점수는 해당 tablet에 속한 rowset 점수의 합계입니다. 결과는 `compaction_score`를 기준으로 내림차순 정렬됩니다. 스토리지-컴퓨트 분리 모드에서 이 API는 클러스터의 모든 tablet이 아니라 해당 BE에 현재 캐시된 실행 중인 tablet을 검사합니다.

## 사전 요구 사항 {#prerequisites}

BE HTTP 포트(기본값: 8040)에 직접 연결하세요. BE 설정 `enable_all_http_auth`가 활성화되어 있으면 전역 `ADMIN` 권한이 있는 Doris 계정을 사용하세요. 예제의 인증 정보를 해당 계정의 인증 정보로 바꾸세요.

## 요청 {#request}

```text
GET /api/compaction_score?top_n=<integer>&sync_meta=<boolean>
```

요청 본문은 없습니다.

## 쿼리 매개변수 {#query-parameters}

| 매개변수 | 유형 | 필수 여부 | 기본값 | 설명 |
|---|---|---|---|---|
| `top_n` | 음이 아닌 정수 | 아니요 | 사용 가능한 모든 tablet | 점수가 가장 높은 tablet을 최대 N개 반환합니다. `0`이면 `[]`를 반환합니다. 값은 부호 있는 64비트 정수 범위 내에 있어야 합니다. |
| `sync_meta` | Boolean: `true` 또는 `false` | 아니요 | `false` | 스토리지-컴퓨트 분리 모드에서만 사용할 수 있습니다. `true`이면 점수를 계산하기 전에 Meta Service에서 해당 BE에 캐시된 실행 중인 tablet의 메타데이터와 rowset을 동기화합니다. 스토리지-컴퓨트 결합 모드에서는 `sync_meta=false`를 포함해 이 매개변수를 아예 지정하지 마세요. |

## 기본 사용법 {#basic-usage}

다음 요청은 tablet 행을 반환하지 않고 연결 상태와 매개변수 처리를 확인합니다:

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=0'
```

```json
[]
```

## 응답 {#response}

요청이 성공하면 HTTP 200 상태 코드와 JSON 배열을 반환합니다. 각 요소에는 문자열 값을 갖는 필드가 두 개 있습니다:

| 필드 | 설명 |
|---|---|
| `tablet_id` | tablet ID. |
| `compaction_score` | tablet에 속한 rowset의 compaction 점수 합계. |

예를 들어, 다음과 같이 최대 10개의 tablet을 반환할 수 있습니다:

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=10'
```

다음 출력은 예시입니다. ID, 점수, 반환되는 tablet 수는 BE에 따라 달라집니다:

```json
[
    {"compaction_score": "5", "tablet_id": "42595"},
    {"compaction_score": "4", "tablet_id": "10034"}
]
```

스토리지-컴퓨트 분리 모드에서는 점수를 계산하기 전에 캐시된 tablet의 최신 메타데이터를 요청할 수 있습니다:

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=10&sync_meta=true'
```

응답은 동일한 JSON 형식을 사용하며, 동기화 후에 계산된 결과를 반환합니다.

## 오류 처리 및 주의 사항 {#error-handling-and-caveats}

- `top_n`을 파싱할 수 없거나 값이 음수이면 HTTP 400을 반환합니다. 예: `invalid argument: top_n=wrong`.
- 스토리지-컴퓨트 결합 모드에서 `sync_meta`가 비어 있지 않으면 HTTP 400을 반환합니다: ``param `sync_meta` is only available for cloud mode``.
- 스토리지-컴퓨트 분리 모드에서 `sync_meta`가 비어 있지 않고 `true`나 `false`가 아니면 HTTP 400을 반환합니다. 예: `invalid argument: sync_meta=wrong`.
- 메타데이터 동기화에 실패하면 HTTP 500을 반환합니다. 인증이 활성화된 경우 인증 정보가 누락되었거나 유효하지 않으면 HTTP 401 또는 403을 반환할 수 있습니다.
- `top_n`은 응답 크기를 제한하며, 검사하거나 동기화하는 tablet 수를 제한하지는 않습니다. 점수는 해당 BE의 tablet 상태를 관찰한 값이며, 클러스터 전체의 원자적 스냅샷은 아닙니다.

## 권장 사항 {#best-practices}

추가 조사가 필요한 tablet을 찾으려면 작은 `top_n` 값과 기본값인 `sync_meta=false`로 시작하세요. 최신 메타데이터가 필요한 경우 `sync_meta=true`를 사용하세요. 이 설정은 `top_n`을 적용하기 전에 캐시된 모든 실행 중인 tablet을 동기화하므로 지연 시간과 Meta Service 부하가 증가할 수 있습니다.
