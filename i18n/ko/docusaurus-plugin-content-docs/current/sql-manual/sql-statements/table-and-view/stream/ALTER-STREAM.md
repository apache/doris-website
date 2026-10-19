---
{
    "title": "ALTER STREAM",
    "language": "ko",
    "description": "테이블 Stream의 주석을 수정합니다."
}
---

## 설명 {#description}

테이블 Stream의 주석을 수정합니다. 테이블 Stream의 소비 유형(`type`)과 `show_initial_rows` 속성은 생성 후 변경할 수 없으므로, Stream을 삭제하고 다시 생성해야 합니다.

## 구문 {#syntax}

```sql
ALTER STREAM [<db_name>.]<stream_name> { SET | MODIFY } COMMENT '<comment>'
```

## 필수 매개변수 {#required-parameters}

**1. `<stream_name>`**
> 수정할 Stream입니다.

**2. `<comment>`**
> 새 주석입니다. `SET COMMENT`와 `MODIFY COMMENT`는 동일하게 동작합니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**
> Stream이 속한 데이터베이스입니다. 기본값은 현재 데이터베이스입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한 | 객체 | 비고 |
| :-------- | :----- | :---- |
| ALTER_PRIV | Stream | |

## 사용 시 참고 사항 {#usage-notes}

새 주석은 `SHOW CREATE STREAM`의 출력과 `STREAM_COMMENT` 열에 표시됩니다. 해당 열은 `information_schema.table_streams`에 있습니다.

## 예제 {#examples}

```sql
ALTER STREAM orders_stream SET COMMENT 'sync order changes to dwd';
ALTER STREAM orders_stream MODIFY COMMENT 'sync order changes to dwd, hourly';
```
