---
{
    "title": "DROP BACKEND",
    "language": "ko",
    "description": "이 문은 Doris 클러스터에서 BE 노드를 제거하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 Doris 클러스터에서 BE 노드를 제거하는 데 사용됩니다.

## 구문 {#syntax}

```sql
ALTER SYSTEM DROP BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

각 식별자의 형식은 다음과 같습니다.

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## 필수 매개변수 {#required-parameters}

**1. <be_host>**

> BE 노드의 호스트 이름 또는 IP 주소를 지정할 수 있습니다.

**2. <heartbeat_port>**

> BE 노드의 하트비트 포트이며, 기본값은 9050입니다.

**3. <backend_id>**

> BE 노드의 ID입니다.

:::tip
`<be_host>`, `<be_heartbeat_port>`, `<backend_id>`는 모두 [SHOW BACKENDS](./SHOW-BACKENDS.md) 문으로 쿼리하여 확인할 수 있습니다.
:::

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 비고 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 사용 시 주의 사항 {#usage-notes}

1. BE 노드를 오프라인으로 전환하는 데 이 명령을 사용하는 것은 권장하지 않습니다. 이 명령은 클러스터에서 BE 노드를 즉시 제거합니다. 현재 노드의 데이터는 다른 BE 노드로 분산되지 않습니다. 클러스터에 단일 복제본 테이블이 있으면 데이터가 손실될 수 있습니다. [DECOMMISSION BACKEND](./DECOMMISSION-BACKEND.md) 명령을 사용하여 BE 노드를 안전하게 오프라인으로 전환하는 것이 더 나은 방법입니다.
2. 이 작업은 위험도가 높으므로 다음과 같이 명령을 직접 실행하면:
   ```sql
   ALTER SYSTEM DROP BACKEND "127.0.0.1:9050";
   ```
   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = It is highly NOT RECOMMENDED to use DROP BACKEND stmt.It is not safe to directly drop a backend. All data on this backend will be discarded permanently. If you insist, use DROPP instead of DROP
   ```
   위와 같은 안내 메시지가 표시됩니다. 수행하려는 작업을 충분히 이해하고 있다면 `DROP` 키워드를 `DROPP`로 바꾸고 계속 진행할 수 있습니다.
   ```sql
   ALTER SYSTEM DROPP BACKEND "127.0.0.1:9050";
   ```

## 예제 {#examples}

1. BE 노드의 Host와 HeartbeatPort를 기준으로 클러스터에서 노드 두 개를 제거합니다.
   ```sql
   ALTER SYSTEM DROPP BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. BE 노드의 ID를 기준으로 클러스터에서 노드 한 개를 제거합니다.
    ```sql
    ALTER SYSTEM DROPP BACKEND "10002";
    ```
