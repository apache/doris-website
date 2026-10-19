---
{
    "title": "SHOW CREATE STREAM",
    "language": "ko",
    "description": "테이블 Stream의 CREATE 문을 표시합니다."
}
---

## 설명 {#description}

테이블 Stream의 CREATE 문을 표시합니다. 여기에는 기본 테이블, 주석, 속성이 포함됩니다.

## 구문 {#syntax}

```sql
SHOW CREATE STREAM [<db_name>.]<stream_name>
```

## 필수 매개변수 {#required-parameters}

**1. `<stream_name>`**
> Stream 이름입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**
> Stream이 속한 데이터베이스입니다. 기본값은 현재 데이터베이스입니다.

## 반환값 {#return-value}

| 열 | 설명 |
|---|---|
| `Stream` | Stream 이름 |
| `Create Stream` | CREATE 문 |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 참고 |
| :-------- | :----- | :---- |
| SHOW_PRIV | Stream | |

## 사용 시 참고 사항 {#usage-notes}

일반 테이블에 이 문을 실행하면 실패하며, `SHOW CREATE TABLE`을 사용하라는 안내가 표시됩니다. 기본 테이블이 삭제된 경우 `ON TABLE`에 `UNKNOWN`이 표시됩니다.

## 예제 {#examples}

```sql
SHOW CREATE STREAM orders_stream\G
```

```text
*************************** 1. row ***************************
       Stream: orders_stream
Create Stream: CREATE STREAM `orders_stream`
ON TABLE internal.demo.orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
"type" = "MIN_DELTA",
"show_initial_rows" = "false"
);
```
