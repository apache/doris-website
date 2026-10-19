---
{
    "title": "SHOW CREATE FUNCTION",
    "language": "ko",
    "description": "이 문은 사용자 정의 함수의 생성문을 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 사용자 정의 함수의 생성문을 표시하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW CREATE [ GLOBAL ] FUNCTION <function_name>( <arg_type> ) [ FROM <db_name> ];
```

## 필수 매개변수 {#required-parameters}

**1. `<function_name>`**

> 생성문을 조회할 사용자 정의 함수의 이름입니다.

**2. `<arg_type>`**

> 생성문을 조회할 사용자 정의 함수의 매개변수 목록입니다.
>
> 매개변수 목록의 각 위치에는 해당 매개변수의 데이터 타입을 입력해야 합니다.

## 선택적 매개변수 {#optional-parameters}

**1.`GLOBAL`**

> GLOBAL은 선택적 매개변수입니다.
>
> GLOBAL을 설정하면 전역 범위에서 함수를 검색하여 삭제합니다.
>
> GLOABL을 입력하지 않으면 현재 데이터베이스에서 함수를 검색하여 삭제합니다.

**2.`<db_name>`**

> FROM db_name은 지정된 데이터베이스에서 사용자 정의 함수를 조회한다는 의미입니다.

## 반환값 {#return-value}

| 열          | 설명          |
|-----------------|-------------|
| SYMBOL          | 함수 패키지 이름        |
| FILE            | jar 패키지 경로     |
| ALWAYS_NULLABLE | 결과가 NULL일 수 있는지 여부 |
| TYPE            | 함수 타입        |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체   | 참고 사항       |
|:----------|:---------|:--------------|
| SHOW_PRIV | 함수 | 해당 함수에 대한 조회 권한이 필요합니다. |

## 예제 {#examples}

```sql
SHOW CREATE FUNCTION add_one(INT)
```

```text
| Function Signature | Create Function
+--------------------+-------------------------------------------------------
| add_one(INT)       | CREATE FUNCTION add_one(INT) RETURNS INT PROPERTIES (
  "SYMBOL"="org.apache.doris.udf.AddOne",
  "FILE"="file:///xxx.jar",
  "ALWAYS_NULLABLE"="true",
  "TYPE"="JAVA_UDF"
  ); |
+--------------------+-------------------------------------------------------
```
