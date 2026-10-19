---
{
    "title": "SHOW REPLICA STATUS",
    "language": "ko",
    "description": "이 문은 테이블 또는 파티션의 복제본 상태 정보를 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 테이블 또는 파티션의 복제본 상태 정보를 표시하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW REPLICA STATUS FROM [ <database_name>.]<table_name> [<partition_list>] 
[where_clause]
```
각 항목은 다음과 같이 정의됩니다.

```sql
partition_list
: PARTITION (<partition_name>[ , ... ])
```

각 항목은 다음과 같이 정의됩니다.

```sql
where_clause
: WHERE <output_column_name> = <value>
```

## 필수 매개변수 {#required-parameters}

**1. `<table_name>`**

> 테이블의 식별자(즉, 이름)로, 데이터베이스(Database) 내에서 고유해야 합니다.
> 
> 식별자는 문자로 시작해야 하며(Unicode 이름 지원이 활성화된 경우 지원 언어의 모든 문자로 시작할 수 있음), 식별자 문자열 전체를 백틱으로 감싸지 않으면 공백이나 특수 문자를 포함할 수 없습니다(예: My Object).
> 
> 식별자에는 예약 키워드를 사용할 수 없습니다.
> 
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.


## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**

> 데이터베이스의 식별자(즉, 이름)로, 클러스터(Cluster) 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 하며(Unicode 이름 지원이 활성화된 경우 지원 언어의 모든 문자로 시작할 수 있음), 식별자 문자열 전체를 백틱으로 감싸지 않으면 공백이나 특수 문자를 포함할 수 없습니다(예: My Object).
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.

**2. `<partition_list>`**

> 쉼표로 구분된 파티션 식별자(즉, 이름) 목록으로, 각 식별자는 테이블(Table) 내에서 고유해야 합니다.
> 
> 식별자는 문자로 시작해야 하며(Unicode 이름 지원이 활성화된 경우 지원 언어의 모든 문자로 시작할 수 있음), 식별자 문자열 전체를 백틱으로 감싸지 않으면 공백이나 특수 문자를 포함할 수 없습니다(예: My Object).
> 
> 식별자에는 예약 키워드를 사용할 수 없습니다.
> 
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.

**3. `WHERE <output_column_name> = <value>`**

> 출력의 필터링 조건을 지정합니다. output_column_name은 출력 필드 목록에 포함되어야 합니다.
> 
> output_column_name이 STATUS인 경우 값은 다음 중 하나일 수 있습니다.
>
> - DEAD:           복제본이 위치한 백엔드를 사용할 수 없습니다.
> - VERSION_ERROR:  복제본의 데이터 버전이 불완전합니다.
> - SCHEMA_ERROR:   복제본의 스키마 해시가 올바르지 않습니다.
> - MISSING:        복제본이 존재하지 않습니다.

## 반환 값 {#return-value}

| 열                 | 데이터 타입 | 설명                                                                      |
|--------------------|----------|---------------------------------------------------------------------------|
| TabletId           | Int      | 태블릿의 고유 식별자입니다.                                               |
| ReplicaId          | Int      | 복제본의 고유 식별자입니다.                                               |
| BackendId          | Int      | 복제본이 위치한 Backend (BE) 노드의 ID입니다.                              |
| Version            | Int      | 복제본의 현재 버전입니다.                                                 |
| LastFailedVersion  | Int      | 복제본에서 마지막으로 실패가 발생한 버전입니다. -1은 실패한 적이 없음을 의미합니다. |
| LastSuccessVersion | Int      | 복제본에서 마지막으로 성공한 버전입니다.                                  |
| CommittedVersion   | Int      | 복제본의 커밋된 버전입니다.                                               |
| SchemaHash         | Int      | 복제본의 스키마를 나타내는 해시 값입니다.                                 |
| VersionNum         | Int      | 복제본이 거쳐 온 버전 수입니다.                                           |
| IsBad              | Boolean  | 복제본이 불량 상태인지 나타냅니다(true/false).                             |
| IsUserDrop         | Boolean  | 사용자의 삭제 요청에 따라 복제본에 삭제 표시가 되었는지 나타냅니다.        |
| State              | String   | 복제본의 현재 상태입니다(예: NORMAL).                                     |
| Status             | String   | 복제본의 정상 여부를 나타내는 상태입니다(예: OK).                          |


## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한       | 객체     | 설명                                                                                                                             |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | 테이블 및 파티션 관리와 시스템 수준 명령을 포함하여 데이터베이스에 대한 관리 작업을 실행하는 데 필요합니다.                       |


## 예제 {#examples}

- 테이블의 모든 복제본에 대한 상태 표시

  ```sql
  SHOW REPLICA STATUS FROM db1.tbl1;
  ```

  ```text
  +----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+------------+--------+--------+
  | TabletId | ReplicaId | BackendId | Version | LastFailedVersion | LastSuccessVersion | CommittedVersion | SchemaHash | VersionNum | IsBad | IsUserDrop | State  | Status |
  +----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+------------+--------+--------+
  | 10145    | 10146     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  | 10147    | 10148     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  | 10149    | 10150     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  | 10151    | 10152     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  +----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+------------+--------+--------+
  ```
  
- 특정 파티션에서 VERSION_ERROR 상태인 복제본 표시

  ```sql
  SHOW REPLICA STATUS FROM tbl1 PARTITION (p1, p2)
  WHERE STATUS = "VERSION_ERROR";
  ```

- 테이블에서 비정상 상태인 모든 복제본 표시

  ```sql
  SHOW REPLICA STATUS FROM tbl1
  WHERE STATUS != "OK";
  ```
