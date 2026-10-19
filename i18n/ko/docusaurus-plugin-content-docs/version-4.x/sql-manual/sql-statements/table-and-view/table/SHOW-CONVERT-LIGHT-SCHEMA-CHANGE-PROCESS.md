---
{
    "title": "SHOW CONVERT LIGHT SCHEMA CHANGE PROCESS",
    "language": "ko",
    "description": "경량 스키마 변경을 사용하지 않는 OLAP 테이블을 경량 스키마 변경을 사용하는 테이블로 전환하는 진행 상황을 조회합니다."
}
---

## 설명 {#description}

경량 스키마 변경을 사용하지 않는 OLAP 테이블을 경량 스키마 변경을 사용하는 테이블로 전환하는 진행 상황을 조회합니다.

## 구문 {#syntax}

```sql
SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS [ FROM <db_name> ]
```

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**
> FROM 절에서 조회할 데이터베이스의 이름을 지정할 수 있습니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다:

| 권한 | 대상 | 참고 사항 |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | 데이터베이스 | 현재는 **ADMIN** 권한이 있는 경우에만 이 작업을 수행할 수 있습니다 |

## 사용 시 참고 사항 {#usage-notes}

- 이 문을 실행하려면 `enable_convert_light_weight_schema_change` 설정을 활성화해야 합니다.

## 예제 {#examples}

- test 데이터베이스의 전환 진행 상황 조회

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS FROM test;
  ```

- 전체 전환 상태 조회

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS;
  ```
