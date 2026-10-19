---
{
    "title": "SHOW PARTITION ID",
    "language": "ko",
    "description": "이 구문은 파티션 ID를 기준으로 해당 데이터베이스 이름, 테이블 이름, 파티션 이름을 찾는 데 사용합니다."
}
---

## 설명 {#description}

이 구문은 파티션 ID를 기준으로 해당 데이터베이스 이름, 테이블 이름, 파티션 이름을 찾는 데 사용합니다.

## 구문 {#syntax}

```sql
SHOW PARTITION <partition_id>
```

## 필수 매개변수 {#required-parameters}

**1. `<partition_id>`**

> 파티션 ID

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다.

| 권한                  | 객체 | 비고 |
|---------------------|----|----|
| ADMIN_PRIV |    |    |

## 예제 {#examples}

1. 파티션 ID를 기준으로 해당 데이터베이스 이름, 테이블 이름, 파티션 이름을 찾습니다.

    ```sql
    SHOW PARTITION 10002;
    ```
