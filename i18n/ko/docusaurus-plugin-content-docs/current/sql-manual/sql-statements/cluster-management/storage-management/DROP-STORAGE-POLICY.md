---
{
    "title": "DROP STORAGE POLICY",
    "language": "ko",
    "description": "스토리지 정책을 삭제합니다. 스토리지 정책에 대한 자세한 설명은 \"스토리지 정책\" 장을 참고하세요."
}
---

## 설명 {#description}

스토리지 정책을 삭제합니다. 스토리지 정책에 대한 자세한 설명은 "스토리지 정책" 장을 참고하세요.

## 구문 {#syntax}

```sql
DROP STORAGE POLICY <policy_name>
```
## 필수 매개변수 {#required-parameters}

**<policy_name>**

> 스토리지 정책의 이름

## 권한 관리 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다:

| 권한  | 객체 | 비고 |
| :--------- | :----- | :---- |
| ADMIN_PRIV | 전역 |       |

## 예제 {#example}

1. policy1이라는 이름의 스토리지 정책을 삭제합니다.

    ```sql
    DROP STORAGE POLICY policy1
    ```
