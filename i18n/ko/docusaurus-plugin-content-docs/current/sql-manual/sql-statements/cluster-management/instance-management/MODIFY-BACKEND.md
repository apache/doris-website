---
{
    "title": "MODIFY BACKEND",
    "language": "ko",
    "description": "이 구문은 BE 노드의 속성을 수정하는 데 사용됩니다. BE 노드의 속성을 수정하면 쿼리, 쓰기,"
}
---

## 설명 {#description}

이 구문은 BE 노드의 속성을 수정하는 데 사용됩니다. BE 노드의 속성을 수정하면 해당 노드의 쿼리, 쓰기 및 데이터 분산에 영향을 미칩니다. 수정할 수 있는 속성은 다음과 같습니다.

| 속성        | 영향                                                                                                                                                                                                                                                                                                                                             |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `tag.location`  | BE의 리소스 태그이며, 기본값은 `default`입니다. 변경하면 동일한 태그 그룹 내 BE 간 데이터 균형 조정과 테이블 생성 시 데이터를 분산할 BE 노드에 영향을 미칩니다. 자세한 내용은 [리소스 그룹](../../../../admin-manual/workload-management/resource-group.md)을 참조하세요. |
| `disable_query` | 쿼리 비활성화 여부이며, 기본값은 `false`입니다. `true`로 설정하면 이 BE 노드에 새로운 쿼리 요청이 스케줄링되지 않습니다.                                                                                                                                                                                         |
| `disable_load`  | 데이터 적재 비활성화 여부이며, 기본값은 `false`입니다. `true`로 설정하면 이 BE 노드에 새로운 데이터 적재 요청이 스케줄링되지 않습니다.                                                                                                                                                                                           |

:::tip
이 명령은 스토리지와 컴퓨팅이 분리된 모드에서는 지원되지 않습니다.
:::

## 구문 {#syntax}

```sql
ALTER SYSTEM MODIFY BACKEND <be_identifier> [, <be_identifier> ... ]
SET (
     "<key>" = "<value>"
)
```

여기서 식별자의 형식은 다음과 같습니다.

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
`<be_host>`, `<be_heartbeat_port>`, `<backend_id>`는 모두 [SHOW BACKENDS](./SHOW-BACKENDS.md) 구문으로 조회할 수 있습니다.
:::

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 비고 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 사용 시 주의 사항 {#usage-notes}

이 작업은 BE 전체에 적용되고 영향 범위가 넓으므로, 신중하게 수행하지 않으면 클러스터 전체의 정상적인 쿼리, 데이터 적재, 나아가 테이블 생성 작업에도 영향을 미칠 수 있습니다. 주의해서 실행하세요.

## 예제 {#examples}

1. BE의 리소스 태그 수정

```sql
ALTER SYSTEM MODIFY BACKEND "127.0.0.1:9050" SET ("tag.location" = "group_a");
```

2. BE의 `disable_query` 속성 수정
   
```sql
ALTER SYSTEM MODIFY BACKEND "10002" SET ("disable_query" = "true");
```

3. BE의 `disable_load` 속성 수정
   
```sql
ALTER SYSTEM MODIFY BACKEND "127.0.0.1:9050" SET ("disable_load" = "true");
```
