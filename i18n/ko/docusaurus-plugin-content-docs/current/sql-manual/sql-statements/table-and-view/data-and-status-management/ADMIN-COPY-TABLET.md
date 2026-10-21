---
{
    "title": "ADMIN COPY TABLET",
    "language": "ko",
    "description": "이 문은 지정한 tablet의 스냅샷을 생성하며, 주로 로컬에서 tablet 데이터를 적재해 문제를 재현할 때 사용합니다."
}
---

## 설명 {#description}

이 문은 지정한 tablet의 스냅샷을 생성하며, 주로 로컬에서 tablet 데이터를 적재해
문제를 재현할 때 사용합니다.

## 구문 {#syntax}

```sql
ADMIN COPY TABLET <tablet_id> PROPERTIES ("<key>"="<value>" [,...]).
```

## 필수 매개변수 {#required-parameters}

**1. `<tablet_id>`**

복사할 tablet의 ID입니다.

## 선택적 매개변수 {#optional-parameters}

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```

PROPERTIES 절에서 추가 매개변수를 지정할 수 있습니다:

**1. `<backend_id>`**

복제본이 있는 BE 노드의 ID를 지정합니다. 지정하지 않으면 복제본을 무작위로 선택합니다.

**2. `<version>`**

스냅샷의 버전을 지정합니다. 버전은 복제본의 최대 버전 이하여야 합니다. 지정하지
않으면 최대 버전을 사용합니다.

**3. `<expiration_minutes>`**

스냅샷 보관 시간입니다. 기본값은 1시간입니다. 보관 시간이 지나면 스냅샷이 자동으로 삭제됩니다. 단위는 분입니다.

## 반환 값 {#return-value}

| 열                | 데이터 타입 | 설명                                                                                                                                                                                                                 |
|-------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| TabletId          | string   | 스냅샷을 생성한 tablet의 ID입니다.                                                                                                                                                             |
| BackendId         | string   | 스냅샷이 저장된 BE 노드의 ID입니다.                                                                                                                                                                  |
| Ip                | string   | 스냅샷을 저장하는 BE 노드의 IP 주소입니다.                                                                                                                                                                  |
| Path              | string   | BE 노드에서 스냅샷이 저장된 경로입니다.                                                                                                                                                         |
| ExpirationMinutes | string   | 스냅샷이 자동으로 삭제될 때까지의 시간입니다. 단위는 분입니다.                                                                                                                                    |
| CreateTableStmt   | string   | tablet에 해당하는 테이블의 생성문입니다. 원래 테이블 생성문이 아니라, 나중에 로컬에서 tablet 데이터를 적재하기 위해 간소화한 테이블 생성문입니다. |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 갖추어야 합니다:

| 권한       | 객체     | 설명                                                                                                                             |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | 데이터베이스 | 테이블과 파티션 관리 및 시스템 수준 명령 실행을 포함한 데이터베이스 관리 작업에 필요합니다. |

## 예제 {#examples}

- 지정한 BE 노드에 있는 복제본의 스냅샷 생성

  ```sql
  ADMIN COPY TABLET 10020 PROPERTIES("backend_id" = "10003");
  ```

  ```text
           TabletId: 10020
          BackendId: 10003
                 Ip: 192.168.10.1
               Path: /path/to/be/storage/snapshot/20220830101353.2.3600
  ExpirationMinutes: 60
    CreateTableStmt: CREATE TABLE `tbl1` (
    `k1` int(11) NULL,
    `k2` int(11) NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k1`, `k2`)
  DISTRIBUTED BY HASH(k1) BUCKETS 1
  PROPERTIES (
  "replication_num" = "1",
  "version_info" = "2"
  );
  ```

- 지정한 BE 노드에 있는 복제본의 지정한 버전에 대한 스냅샷 생성

  ```sql
  ADMIN COPY TABLET 10010 PROPERTIES("backend_id" = "10003", "version" = "10");
  ```

  ```text
           TabletId: 10010
          BackendId: 10003
                 Ip: 192.168.10.1
               Path: /path/to/be/storage/snapshot/20220830101353.2.3600
  ExpirationMinutes: 60
    CreateTableStmt: CREATE TABLE `tbl1` (
    `k1` int(11) NULL,
    `k2` int(11) NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k1`, `k2`)
  DISTRIBUTED BY HASH(k1) BUCKETS 1
  PROPERTIES (
  "replication_num" = "1",
  "version_info" = "2"
  );
  ```
