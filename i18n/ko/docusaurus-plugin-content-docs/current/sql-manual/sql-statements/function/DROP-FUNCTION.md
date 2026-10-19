---
{
    "title": "DROP FUNCTION",
    "language": "ko",
    "description": "사용자 정의 함수를 삭제합니다."
}
---

## 설명 {#description}

사용자 정의 함수를 삭제합니다.

## 구문 {#syntax}

```sql
DROP [ GLOBAL ] FUNCTION <function_name> ( <arg_type> )
```

## 필수 매개변수 {#required-parameters}

**1. `<function_name>`**

> 삭제할 함수의 이름을 지정합니다.
>
> 함수 이름은 함수를 생성할 때 사용한 이름과 정확히 일치해야 합니다.

**2. `<arg_type>`**

> 삭제할 함수의 인수 목록을 지정합니다.
>
> 매개변수 목록의 각 위치에 해당 매개변수의 데이터 타입을 입력해야 합니다.

## 선택적 매개변수 {#optional-parameters}

**1.`GLOBAL`**

> GLOBAL은 선택적 매개변수입니다.
>
> GLOBAL을 지정하면 전역에서 함수를 검색하여 삭제합니다.
>
> GLOABL을 입력하지 않으면 현재 데이터베이스에서 함수를 검색하여 삭제합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한  | 객체         | 설명       |
|:-----------|:---------------|:------------|
| ADMIN_PRIV | 사용자 정의 함수| DROP은 관리 작업입니다 |


## 사용 시 주의 사항 {#usage-notes}

- 함수 이름과 매개변수 타입이 모두 일치하는 경우에만 함수를 삭제할 수 있습니다.

## 예제 {#examples}

```sql
DROP FUNCTION my_add(INT, INT)
```

```sql
DROP GLOBAL FUNCTION my_add(INT, INT)
```
