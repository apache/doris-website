---
{
    "title": "ADMIN CHECK TABLET",
    "language": "ko",
    "description": "이 문은 태블릿 집합에 지정된 검사 작업을 수행하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 태블릿 집합에 지정된 검사 작업을 수행하는 데 사용됩니다.

## 구문 {#syntax}

```sql
ADMIN CHECK TABLET ( <tablet_id> [,...] ) PROPERTIES("type" = "<type_value>")
```

## 필수 매개변수 {#required-parameters}

**1. `<tablet_id>`**

지정된 검사 작업을 수행할 태블릿의 ID입니다.


## 선택적 매개변수 {#optional-parameters}

**1. `<type_value>`**

현재는 consistency만 지원합니다.

- consistency:

  태블릿의 복제본 데이터 일관성을 검사합니다. 이 명령은 비동기적으로 실행되므로, 명령을 전송하면 Doris가 해당 태블릿의 일관성 검사 작업을 시작합니다.

## 반환 값 {#return-value}

이 문의 최종 결과는 `SHOW PROC "/cluster_health/tablet_health";` 실행 결과의 InconsistentNum 열에 반영됩니다.

| 열              | 데이터 유형 | 설명                                 |
|-----------------|----------|--------------------------------------|
| InconsistentNum | Int      | 일관성이 없는 태블릿 수 |


## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한       | 객체     | 설명                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | 데이터베이스 | 테이블 및 파티션 관리와 시스템 수준 명령 실행을 포함한 데이터베이스 관리 작업을 수행하는 데 필요합니다. |

## 예제 {#examples}
- 지정된 태블릿 집합에 대해 복제본 데이터 일관성 검사 수행

  ```sql
  admin check tablet (10000, 10001) PROPERTIES("type" = "consistency");
  ```
  
