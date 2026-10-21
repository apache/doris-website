---
{
    "title": "TSO 작업",
    "language": "ko",
    "description": "마스터 전달 또는 로컬 상태 조회를 통해 TSO 상태를 확인합니다."
}
---

<version since="dev">

</version>

## 설명 {#description}

타임스탬프를 할당하거나 논리 카운터를 증가시키지 않고 TSO 상태의 스냅샷을 반환합니다. 유효한 Doris 사용자 인증이 필요합니다. Master가 아닌 FE는 기본적으로 요청을 Master FE로 전달합니다. `local=true`를 지정하면 요청을 수신한 FE의 로컬 상태를 반환합니다. 사전 요구 사항은 [TSO](../../cluster-management/tso.md)를 참조하세요.

## 요청 {#request}

`GET /api/tso`

## 매개변수 {#parameters}

| 매개변수 | 유형 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `local` | boolean | 아니요 | `false` | true이면 마스터로 전달하지 않고 요청을 수신한 FE의 로컬 상태를 쿼리합니다. |

경로 매개변수와 요청 본문은 없습니다.

## 예제 {#example}

기본 HTTP 포트를 사용하며 비밀번호 입력을 요청합니다:

```bash
curl --user root http://127.0.0.1:8030/api/tso
```

응답 예시(타임스탬프는 실행 중인 클러스터에 따라 달라집니다):

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "window_end_physical_time": 1625097601000,
    "current_tso": 426009585254400123,
    "current_tso_physical_time": 1625097600000,
    "current_tso_logical_counter": 123
  }
}
```

## 응답 필드 {#response-fields}

| 필드 | 유형 | 설명 |
| --- | --- | --- |
| `window_end_physical_time` | long | 예약된 할당 윈도우의 경계로, Unix 밀리초 단위입니다. |
| `current_tso` | long | 현재 조합된 64비트 할당 커서입니다. |
| `current_tso_physical_time` | long | current_tso의 물리적 구성 요소로, 밀리초 단위입니다. |
| `current_tso_logical_counter` | long | current_tso의 논리 카운터 구성 요소입니다. |

## 오류 및 유의 사항 {#errors-and-caveats}

인증 실패, FE가 준비되지 않은 상태 또는 전달 실패로 인해 정상 응답을 받지 못할 수 있습니다. 초기화되지 않은 로컬 서비스는 영을 값으로 반환할 수 있으며, 스냅샷은 이후 할당의 성공을 보장하지 않습니다. 활성 마스터만 TSO를 할당하지만, 준비된 FE는 모두 상태 요청을 수신할 수 있습니다. 윈도우 경계는 미래의 할당 윈도우를 예약하므로 일반적으로 현재 물리적 구성 요소보다 앞섭니다.
