---
{
    "title": "SHOW TABLET DIAGNOSIS",
    "language": "ko",
    "description": "이 문은 지정한 태블릿을 진단하는 데 사용됩니다. 결과에는 태블릿 정보와 발생할 수 있는 문제가 표시됩니다."
}
---

## 설명 {#description}

이 문은 지정한 태블릿을 진단하는 데 사용됩니다. 결과에는 태블릿 정보와 발생할 수 있는 문제가 표시됩니다.


## 구문 {#syntax}

```sql
SHOW TABLET DIAGNOSIS <tablet_id>
```

## 필수 매개변수 {#required-parameters}

**1. `<tablet_id>`**

진단할 태블릿의 ID입니다.

## 반환 값 {#return-value}

| 열                               | 데이터 타입 | 설명                                                                                |
|----------------------------------|----------|-------------------------------------------------------------------------------------|
| TabletExist                      | String   | 태블릿이 존재하는지 나타냅니다.                                                |
| TabletId                         | String   | 태블릿의 ID입니다.                                                               |
| Database                         | String   | 태블릿이 속한 데이터베이스와 해당 ID입니다.                              |
| Table                            | String   | 태블릿이 속한 테이블과 해당 ID입니다.                                 |
| Partition                        | String   | 태블릿이 속한 파티션과 해당 ID입니다.                             |
| MaterializedIndex                | String   | 태블릿이 속한 구체화된 인덱스와 해당 ID입니다.                    |
| Replicas(ReplicaId -> BackendId) | String   | 태블릿의 복제본과 각 복제본이 위치한 BE 노드입니다.                           |
| ReplicasNum                      | String   | 복제본 수가 올바른지 나타냅니다.                                |
| ReplicaBackendStatus             | String   | 복제본이 위치한 BE 노드가 정상적으로 작동하는지 나타냅니다. |
| ReplicaVersionStatus             | String   | 복제본의 버전 번호가 올바른지 나타냅니다.                     |
| ReplicaStatus                    | String   | 복제본 상태가 정상인지 나타냅니다.                                     |
| ReplicaCompactionStatus          | String   | 복제본의 컴팩션 상태가 정상인지 나타냅니다.                   |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다:

| 권한       | 객체     | 설명                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | 데이터베이스 | 테이블 및 파티션 관리, 시스템 수준 명령 실행을 비롯한 데이터베이스 관리 작업을 수행하는 데 필요합니다. |

## 예제 {#examples}

```sql
SHOW TABLET DIAGNOSIS 10145;
```

```text
+----------------------------------+------------------+------------+
| Item                             | Info             | Suggestion |
+----------------------------------+------------------+------------+
| TabletExist                      | Yes              |            |
| TabletId                         | 10145            |            |
| Database                         | test: 10103      |            |
| Table                            | sell_user: 10143 |            |
| Partition                        | sell_user: 10142 |            |
| MaterializedIndex                | sell_user: 10144 |            |
| Replicas(ReplicaId -> BackendId) | {"10146":10009}  |            |
| ReplicasNum                      | OK               |            |
| ReplicaBackendStatus             | OK               |            |
| ReplicaVersionStatus             | OK               |            |
| ReplicaStatus                    | OK               |            |
| ReplicaCompactionStatus          | OK               |            |
+----------------------------------+------------------+------------+
```
