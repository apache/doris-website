---
{
    "title": "DROP STREAM",
    "language": "ko",
    "description": "Table Stream을 삭제합니다."
}
---

## 설명 {#description}

Table Stream을 삭제합니다. Stream을 삭제해도 기본 테이블이나 해당 테이블의 변경 로그에는 영향을 주지 않습니다.

## 구문 {#syntax}

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE]
```

## 필수 매개변수 {#required-parameters}

**1. `<stream_name>`**
> 삭제할 Stream입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**
> Stream이 속한 데이터베이스입니다. 기본값은 현재 데이터베이스입니다.

**2. `IF EXISTS`**
> Stream이 존재하지 않아도 오류를 보고하지 않습니다.

**3. `FORCE`**
> 휴지통을 거치지 않고 바로 삭제합니다. 기본 테이블이 삭제된 Stream은 반드시 `FORCE`를 사용하여 삭제해야 합니다. 컴퓨팅-스토리지 분리 모드에서는 `FORCE`가 필수입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 참고 |
| :-------- | :----- | :---- |
| DROP_PRIV | Stream | |

## 사용 시 참고 사항 {#usage-notes}

- Stream에 대해 `DROP TABLE`을 실행하면 `DROP STREAM`을 사용하라는 안내와 함께 실패합니다.
- 컴퓨팅-스토리지 분리 모드에서 `FORCE`를 생략하면 `Cloud Table Stream only supports DROP STREAM ... FORCE` 오류가 발생합니다.
- 소비 오프셋은 Stream과 함께 삭제됩니다. 같은 이름으로 다시 생성한 Stream은 생성 시점부터 데이터를 소비하기 시작합니다.

## 예제 {#examples}

```sql
DROP STREAM IF EXISTS orders_stream;
DROP STREAM orders_stream FORCE;
```
