---
{
    "title": "SHOW CREATE LOAD",
    "language": "ko",
    "description": "이 문은 데이터 적재 작업의 생성 구문을 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 데이터 적재 작업의 생성 구문을 표시하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW CREATE LOAD FOR <load_name>;
```

## 필수 매개변수 {#required-parameters}

**`<load_name>`**

> 정기 데이터 적재 작업의 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 비고 |
| :---------------- | :------------- | :---------------------------- |
| ADMIN/NODE_PRIV | 데이터베이스 | 클러스터 관리자 권한이 필요합니다. |

## 반환 값 {#return-value}

지정된 데이터 적재 작업의 생성 구문을 반환합니다.

## 예제 {#examples}

- 기본 데이터베이스에서 지정된 데이터 적재 작업의 생성 구문을 표시합니다.

```sql
SHOW CREATE LOAD for test_load
```
