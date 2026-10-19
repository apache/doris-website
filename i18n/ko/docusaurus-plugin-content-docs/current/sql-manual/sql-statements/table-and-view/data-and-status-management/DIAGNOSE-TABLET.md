---
{
    "title": "DIAGNOSE TABLET",
    "language": "ko",
    "description": "컴퓨팅과 스토리지가 결합된 모드에서 이 문은 지정된 tablet을 진단하는 데 사용됩니다."
}
---

## 설명 {#description}

컴퓨팅과 스토리지가 결합된 모드에서 이 문은 지정된 tablet을 진단하는 데 사용됩니다. 결과에는 tablet 정보와 잠재적인 문제가 표시됩니다.

이 명령은 스토리지와 컴퓨팅이 분리된 모드에서는 지원되지 않습니다.

## 구문 {#syntax}

```sql
SHOW TABLET DIAGNOSIS <tablet_id>;
```

## 필수 매개변수 {#required-parameters}

<tablet_id>

> 진단할 tablet의 ID

## 반환 값 (반환 값) {#return-value-return-value}

해당 tablet에 대한 정보를 반환합니다.

- TabletExist

  > tablet의 존재 여부

- TabletId

    > tablet ID

- Database

  > tablet이 속한 DB와 해당 ID

- Table

  > tablet이 속한 테이블과 해당 ID

- Partition

  > tablet이 속한 파티션과 해당 ID

- MaterializedIndex

  > tablet이 속한 구체화된 뷰와 해당 ID

- Replicas

  > tablet의 replica와 각 replica에 해당하는 BE

- ReplicasNum

  > replica 수가 올바른지 여부

- ReplicaBackendStatus

  > replica가 위치한 BE 노드가 정상인지 여부

- ReplicaVersionStatus

  > replica의 버전 번호가 정상인지 여부

- ReplicaStatus

  > replica의 상태가 정상인지 여부

- ReplicaCompactionStatus

  > replica의 compaction 상태가 정상인지 여부

## 예시 {#examples}

1. tablet ID가 10078인 tablet의 정보를 진단합니다.

  ```sql
  show tablet diagnosis 10078;
  +----------------------------------+---------------------------------------------+------------+
  | Item                             | Info                                        | Suggestion |
  +----------------------------------+---------------------------------------------+------------+
  | TabletExist                      | Yes                                         |            |
  | TabletId                         | 10078                                       |            |
  | Database                         | __internal_schema: 10005                    |            |
  | Table                            | audit_log: 10058                            |            |
  | Partition                        | p20241109: 10075                            |            |
  | MaterializedIndex                | audit_log: 10059                            |            |
  | Replicas(ReplicaId -> BackendId) | {"10099":10003,"10116":10002,"10079":10004} |            |
  | ReplicasNum                      | OK                                          |            |
  | ReplicaBackendStatus             | OK                                          |            |
  | ReplicaVersionStatus             | OK                                          |            |
  | ReplicaStatus                    | OK                                          |            |
  | ReplicaCompactionStatus          | OK                                          |            |
  +----------------------------------+---------------------------------------------+------------+
  ```

## 접근 제어 요구 사항 (접근 제어 요구 사항) {#access-control-requirements-access-control-requirements}

이 SQL 명령을 실행하려면 ADMIN_PRIV 권한이 있어야 합니다. 권한 관련 문서를 참조하세요.

| 권한 (권한) | 대상 (대상)                      | 참고 사항 (참고 사항)                   |
| :-------------------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV            | 전체 클러스터 관리 권한 | NODE_PRIV를 제외한 모든 권한 |

## 사용 시 참고 사항 (사용 시 참고 사항) {#usage-note-usage-note}

1. 이 명령은 스토리지와 컴퓨팅이 분리된 모드에서는 지원되지 않습니다. 이 모드에서 실행하면 오류가 발생합니다. 예를 들면 다음과 같습니다.

  ```sql
  show tablet diagnosis 15177;
  ```

  오류 메시지는 다음과 같습니다.

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
  ```
