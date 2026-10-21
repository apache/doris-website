---
{
    "title": "CANCEL-ALTER-TABLE",
    "language": "ko",
    "description": "이 문은 진행 중인 ALTER TABLE 작업을 취소(철회)하는 데 사용합니다."
}
---

## 설명 {#description}

이 문은 진행 중인 ALTER TABLE 작업을 취소(철회)하는 데 사용합니다. ALTER TABLE 작업이 실행 중일 때 이 명령으로 작업을 종료할 수 있습니다.

## 구문 {#syntax}

```sql
CANCEL ALTER TABLE { COLUMN | MATERIALIZED VIEW | ROLLUP } FROM <db_name>.<table_name> [ <job_id1> [ , <job_id2> ... ]]
```

## 필수 매개변수 {#required-parameters}
**1. `{ COLUMN | MATERIALIZED VIEW | ROLLUP }`**
>취소할 변경 작업의 유형을 지정합니다. 다음 중 하나를 반드시 선택해야 합니다.
>- `COLUMN`: 테이블 열의 변경 작업을 취소합니다.
>- `ROLLUP`: 뷰의 변경 작업을 취소합니다.
>- `MATERIALIZED VIEW`: 구체화된 뷰의 변경 작업을 취소합니다.

**2.`<db_name>`**
> 데이터베이스의 식별자(즉, 이름)를 지정합니다.
>
> 식별자는 알파벳 문자로 시작해야 하며(Unicode 이름 지원이 활성화된 경우 모든 언어의 문자 허용), 식별자 문자열 전체를 따옴표로 묶은 경우(예: `My Database`)를 제외하고 공백이나 특수 문자를 포함할 수 없습니다.
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.

**3.`<table_name>`**
> 데이터베이스(Database) 내 테이블의 식별자(즉, 이름)를 지정합니다.
>
> 식별자는 알파벳 문자로 시작해야 하며(Unicode 이름 지원이 활성화된 경우 모든 언어의 문자 허용), 식별자 문자열 전체를 따옴표로 묶은 경우(예: `My Object`)를 제외하고 공백이나 특수 문자를 포함할 수 없습니다.
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.

## 선택적 매개변수 {#optional-parameters}
**1. `<job_id>`**
> 취소할 특정 작업의 ID입니다.
>
> 작업 ID를 지정하면 해당 작업만 취소합니다. 지정하지 않으면 테이블에서 진행 중인 지정된 유형(COLUMN 또는 ROLLUP)의 모든 변경 작업을 취소합니다.
>
> 쉼표로 구분하여 여러 작업 ID를 지정할 수 있습니다.
>
> 작업 ID는 `SHOW ALTER TABLE COLUMN` 또는 `SHOW ALTER TABLE ROLLUP` 명령으로 확인할 수 있습니다.


## 권한 제어 {#permission-control}
이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.


| 권한 | 객체 | 참고 사항                    |
| :---------------- | :------------- | :---------------------------- |
| ALTER_PRIV        | 테이블   | CANCEL ALTER TABLE은 테이블 ALTER 작업에 해당합니다. |


## 참고 사항 {#notes}
- 이 명령은 비동기 작업이므로, 실제 실행 결과는 `SHOW ALTER TABLE COLUMN` 또는 `SHOW ALTER TABLE ROLLUP`으로 작업 상태를 조회하여 확인해야 합니다.

## 예제 {#example}

1. ALTER TABLE COLUMN 작업 취소

```sql
CANCEL ALTER TABLE COLUMN
FROM db_name.table_name
```

2. ALTER TABLE ROLLUP 작업 취소  


```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name
```

3. 작업 ID를 기준으로 ALTER TABLE ROLLUP 작업 일괄 취소


```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name (jobid,...)
```
