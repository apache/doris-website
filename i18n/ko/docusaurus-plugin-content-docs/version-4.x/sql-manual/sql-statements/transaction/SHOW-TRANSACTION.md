---
{
    "title": "SHOW TRANSACTION",
    "language": "ko",
    "description": "지정된 트랜잭션 ID 또는 레이블에 해당하는 트랜잭션의 세부 정보를 조회하는 구문입니다."
}
---

## 설명 {#description}

지정된 트랜잭션 ID 또는 레이블에 해당하는 트랜잭션의 세부 정보를 조회하는 구문입니다.

## 구문 {#syntax}

```sql
SHOW TRANSACTION
[FROM <db_name>]
WHERE
[id = <transaction_id> | label = <label_name>];
```

## 필수 매개변수 {#required-parameters}

**1. `<transaction_id>`**

세부 정보를 조회할 트랜잭션의 ID입니다.

**2. `<label_name>`**

트랜잭션 세부 정보를 조회할 레이블입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**

트랜잭션 세부 정보를 조회할 데이터베이스입니다.

## 반환 값 {#return-value}

| 열 이름         | 설명 |
|---|---|
| TransactionId       | 트랜잭션 ID |
| Label               | 데이터 적재 작업과 연결된 레이블 |
| Coordinator         | 트랜잭션 조정을 담당하는 노드 |
| TransactionStatus   | 트랜잭션 상태 |
| PREPARE             | 준비 단계 |
| COMMITTED           | 트랜잭션이 성공했지만 아직 데이터를 조회할 수 없음 |
| VISIBLE             | 트랜잭션이 성공했으며 데이터를 조회할 수 있음  |
| ABORTED             | 트랜잭션 실패 |
| LoadJobSourceType   | 데이터 적재 작업의 유형 |
| PrepareTime         | 트랜잭션 시작 시각 |
| CommitTime          | 트랜잭션이 성공적으로 커밋된 시각 |
| FinishTime          | 데이터를 조회할 수 있게 된 시각 |
| Reason              | 오류 메시지 |
| ErrorReplicasCount  | 오류가 있는 복제본 수 |
| ListenerId          | 관련 데이터 적재 작업의 ID |
| TimeoutMs           | 트랜잭션 제한 시간(밀리초) |

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한 | 객체 | 비고 |
|:----------| :----------- | :------------------------ |
| LOAD_PRIV | 데이터베이스 |  |

## 예제 {#examples}

1. id가 4005인 트랜잭션을 조회합니다:

   ```sql
   SHOW TRANSACTION WHERE ID=4005;
   ```

2. 지정된 db에서 id가 4005인 트랜잭션을 조회합니다:

   ```sql
   SHOW TRANSACTION FROM db WHERE ID=4005;
   ```

3. 레이블이 label_name인 트랜잭션을 조회합니다:

   ```sql
   SHOW TRANSACTION WHERE LABEL = 'label_name';
   ```
