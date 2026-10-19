---
{
    "title": "SHOW CREATE ROUTINE LOAD",
    "language": "ko",
    "description": "이 문은 Routine Load 작업의 생성문을 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 Routine Load 작업의 생성문을 표시하는 데 사용됩니다.

결과에는 현재 소비 중인 Kafka 파티션과 각 파티션에서 소비할 오프셋이 표시됩니다. 이 결과가 실시간 소비 위치를 반영하지 않을 수 있으므로 [show routine load](./SHOW-ROUTINE-LOAD.md)의 결과를 기준으로 해야 합니다.

## 구문 {#syntax}

```sql
SHOW [ALL] CREATE ROUTINE LOAD for <load_name>;
```

## 필수 매개변수 {#required-parameters}

**1. `<load_name>`**

> Routine Load 작업의 이름

## 선택적 매개변수 {#optional-parameters}

**1. `[ALL]`**

> 과거 작업을 포함한 모든 작업을 조회하도록 지정하는 선택적 매개변수

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 있어야 합니다.

| 권한  | 객체 | 설명                                                    |
| :--------- | :----- | :------------------------------------------------------- |
| LOAD_PRIV  | 테이블  | SHOW CREATE ROUTINE LOAD를 실행하려면 테이블에 대한 LOAD 권한이 필요합니다 |

## 예제 {#examples}

- 기본 데이터베이스에서 지정된 Routine Load 작업의 생성문 표시

   ```sql
   SHOW CREATE ROUTINE LOAD for test_load
   ```
