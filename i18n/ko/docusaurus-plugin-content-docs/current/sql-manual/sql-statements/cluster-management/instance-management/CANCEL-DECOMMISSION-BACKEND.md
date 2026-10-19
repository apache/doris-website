---
{
    "title": "CANCEL DECOMMISSION BACKEND",
    "language": "ko",
    "description": "이 문은 BE 노드의 디커미션 작업을 취소하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 BE 노드의 디커미션 작업을 취소하는 데 사용됩니다.

:::tip
이 문은 스토리지와 컴퓨팅 분리 모드에서 지원되지 않습니다.
:::

## 구문 {#syntax}

```sql
CANCEL DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

여기서 각 식별자는 다음과 같이 지정합니다.

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## 필수 매개변수 {#required-parameters}

**<be_host>**

> BE 노드의 호스트 이름 또는 IP 주소입니다.

**<heartbeat_port>**

> BE 노드의 하트비트 포트이며, 기본값은 9050입니다.

**<backend_id>**

> BE 노드의 ID입니다.

:::tip
`<be_host>`, `<be_heartbeat_port>`, `<backend_id>`는 모두 [SHOW BACKENDS](./SHOW-BACKENDS.md) 문으로 쿼리하여 확인할 수 있습니다.
:::

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 참고 사항 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 사용 시 참고 사항 {#usage-notes}

1. 이 명령을 실행한 후 디커미션 상태(`SystemDecommissioned` 열의 값이 false)와 디커미션 진행 상황(`TabletNum` 열의 값이 더 이상 서서히 감소하지 않음)을 [SHOW BACKENDS](./SHOW-BACKENDS.md) 문으로 확인할 수 있습니다.
2. 클러스터는 다른 노드의 tablet을 현재 BE로 서서히 다시 마이그레이션하므로, 각 BE의 tablet 수는 결국 비슷해집니다.

## 예제 {#examples}

1. BE의 Host와 HeartbeatPort를 기준으로 클러스터에서 노드 두 개를 안전하게 디커미션합니다.
   ```sql
   CANCEL DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. BE의 ID를 기준으로 클러스터에서 노드 한 개를 안전하게 디커미션합니다.
   ```sql
   CANCEL DECOMMISSION BACKEND "10002";
   ```
