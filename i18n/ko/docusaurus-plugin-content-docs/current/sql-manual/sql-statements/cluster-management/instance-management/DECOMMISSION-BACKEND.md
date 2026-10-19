---
{
    "title": "DECOMMISSION BACKEND",
    "language": "ko",
    "description": "이 문을 사용하여 클러스터의 BE 노드를 안전하게 사용 중지할 수 있습니다. 이 작업은 비동기적으로 수행됩니다."
}
---

## 설명 {#description}

이 문을 사용하여 클러스터의 BE 노드를 안전하게 사용 중지할 수 있습니다. 이 작업은 비동기적으로 수행됩니다.

## 구문 {#syntax}

```sql
ALTER SYSTEM DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

각 항목의 정의는 다음과 같습니다.

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## 필수 매개변수 {#required-parameters}

**1. <be_host>**

> BE 노드의 호스트 이름 또는 IP 주소입니다.

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

## 사용 시 참고 사항 {#usage-notes}

1. 이 명령을 실행한 후 [SHOW BACKENDS](./SHOW-BACKENDS.md) 문을 사용하여 사용 중지 상태(`SystemDecommissioned` 열의 값이 `true`)와 진행 상황(`TabletNum` 열의 값이 점차 0으로 감소)을 확인할 수 있습니다.
2. 일반적으로 `TabletNum` 열의 값이 0으로 줄어들면 해당 BE 노드가 삭제됩니다. Doris가 BE를 자동으로 삭제하지 않도록 하려면 FE Master의 `drop_backend_after_decommission` 설정을 false로 변경할 수 있습니다.
3. 현재 BE에 저장된 데이터가 비교적 많으면 DECOMMISSION 작업이 몇 시간에서 며칠까지 걸릴 수 있습니다.
4. DECOMMISSION 작업이 더 이상 진행되지 않는 경우, 구체적으로 `TabletNum` 열의 값이 [SHOW BACKENDS](./SHOW-BACKENDS.md) 문에서 특정 값으로 유지되는 경우에는 다음과 같은 원인이 있을 수 있습니다.
   - 현재 BE의 tablet을 마이그레이션할 적절한 다른 BE가 없습니다. 예를 들어, 노드 3개로 구성된 클러스터에 복제본이 3개인 테이블이 있는 경우, 노드 하나를 사용 중지하려 해도 이 노드는 데이터를 마이그레이션할 다른 BE를 찾을 수 없습니다(다른 두 BE에는 이미 복제본이 하나씩 있습니다).
   - 현재 BE의 tablet이 아직 [휴지통](../../recycle/SHOW-CATALOG-RECYCLE-BIN.md)에 있습니다. [휴지통을 비운](../../recycle/DROP-CATALOG-RECYCLE-BIN.md) 후 사용 중지가 완료될 때까지 기다릴 수 있습니다.
   - 현재 BE의 tablet이 너무 커서 해당 tablet을 마이그레이션할 때마다 시간 초과가 발생하여 다른 곳으로 옮길 수 없습니다. FE Master의 `max_clone_task_timeout_sec` 설정을 더 큰 값으로 조정할 수 있습니다(기본값은 7200초).
   - 현재 BE의 tablet에 완료되지 않은 트랜잭션이 있습니다. 트랜잭션이 완료될 때까지 기다리거나 수동으로 중단할 수 있습니다.
   - 그 밖의 경우에는 FE Master 로그에서 `replicas to decommission` 키워드로 필터링하여 문제가 있는 tablet을 찾고, [SHOW TABLET](../../table-and-view/data-and-status-management/SHOW-TABLET.md) 문을 사용하여 해당 tablet이 속한 테이블을 확인할 수 있습니다. 그런 다음 새 테이블을 생성하고 기존 테이블의 데이터를 새 테이블로 마이그레이션한 후, 마지막으로 [DROP TABLE FORCE](../../table-and-view/table/DROP-TABLE.md)를 사용하여 기존 테이블을 삭제할 수 있습니다.

## 예제 {#examples}

1. BE의 Host와 HeartbeatPort를 기준으로 클러스터에서 두 노드를 안전하게 사용 중지합니다.
   ```sql
   ALTER SYSTEM DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. BE의 ID를 기준으로 클러스터에서 노드 하나를 안전하게 사용 중지합니다.
    ```sql
    ALTER SYSTEM DECOMMISSION BACKEND "10002";
    ```
