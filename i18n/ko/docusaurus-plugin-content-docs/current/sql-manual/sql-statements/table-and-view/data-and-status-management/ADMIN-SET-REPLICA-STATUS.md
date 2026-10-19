---
{
    "title": "ADMIN SET REPLICA STATUS",
    "language": "ko",
    "description": "이 문은 지정된 복제본의 상태를 설정하는 데 사용됩니다. 현재는 특정 복제본의 상태를 BAD로 수동 설정하는 데만 사용됩니다."
}
---

## 설명 {#description}

이 문은 지정된 복제본의 상태를 설정하는 데 사용됩니다. 현재는 특정 복제본의 상태를 수동으로 `BAD`, `DROP` 또는 `OK`로 설정하는 데만 사용되며, 이를 통해 시스템이 해당 복제본을 자동으로 복구하도록 할 수 있습니다.

## 구문 {#syntax}

```sql
ADMIN SET REPLICA STATUS 
PROPERTIES ("tablet_id"="<tablet_id>","backend_id"="<backend_id>","status"="<status>")
```

## 필수 매개변수 {#required-parameters}

**1. `<tablet_id>`**

복제본의 상태를 설정할 태블릿의 ID입니다.

**2. `<backend_id>`**

복제본이 있는 BE 노드의 ID입니다.

**3. `<status>`**

현재는 "drop", "bad", "ok" 값만 지원됩니다.
지정된 복제본이 없거나 이미 비정상 상태이면 이 작업은 무시됩니다.

**참고**：

- 복제본을 BAD 상태로 설정
 
  BAD로 표시된 복제본은 읽거나 쓸 수 없습니다. 그러나 복제본을 BAD로 설정해도 항상 적용되는 것은 아닙니다. 복제본의 실제 데이터가 올바르고 BE가 복제본 상태를 OK로 보고하면 FE는 복제본의 상태를 자동으로 OK로 되돌립니다. 이 작업으로 복제본이 즉시 삭제될 수 있으므로 주의해서 진행하세요.


- 복제본을 DROP 상태로 설정
  
  DROP으로 표시된 복제본은 계속 읽고 쓸 수 있습니다. 시스템은 먼저 다른 머신에 정상 복제본을 추가한 후 DROP 복제본을 삭제합니다. 복제본을 DROP으로 설정하는 작업은 BAD로 설정하는 것보다 안전합니다.


## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한       | 대상         | 참고                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | 데이터베이스 | 테이블 및 파티션 관리와 시스템 수준 명령을 비롯한 데이터베이스 관리 작업을 실행하는 데 필요합니다. |


## 예제 {#examples}

- BE 10001에 있는 태블릿 10003의 복제본을 bad로 설정

  ```sql
  ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "bad");
  ```

- BE 10001에 있는 태블릿 10003의 복제본을 drop으로 설정

  ```sql
  ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "drop");
  ```

- BE 10001에 있는 태블릿 10003의 복제본을 ok로 설정

  ```sql
  ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "ok");
  ```
