---
{
    "title": "SHOW STREAMS",
    "language": "ko",
    "description": "데이터베이스의 테이블 Stream 목록을 표시합니다."
}
---

## 설명 {#description}

현재 데이터베이스 또는 지정한 데이터베이스의 테이블 Stream 목록을 표시합니다. 사용자가 SHOW 권한을 가진 Stream만 표시됩니다. 각 Stream의 유형, 기본 테이블 및 상태는 [information_schema.table_streams](../../../../admin-manual/system-tables/information_schema/table_streams)에서 확인할 수 있습니다.

## 구문 {#syntax}

```sql
SHOW STREAMS [{FROM | IN} <db_name>] [LIKE '<pattern>' | WHERE <expr>]
```

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**
> 데이터베이스 이름입니다. 기본값은 현재 데이터베이스입니다.

**2. `LIKE '<pattern>'`**
> 패턴과 일치하는 Stream 이름을 찾습니다. 구문은 `SHOW TABLES LIKE`와 동일합니다.

**3. `WHERE <expr>`**
> 조건에 따라 필터링합니다. 구문은 `SHOW TABLES WHERE`와 동일합니다.

## 반환 값 {#return-value}

| 열 | 설명 |
|---|---|
| `Tables_in_<db_name>` | Stream 이름 |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다.

| 권한 | 객체 | 참고 사항 |
| :-------- | :----- | :---- |
| SHOW_PRIV | Stream | 이 권한이 있는 Stream만 표시됩니다 |

## 예제 {#examples}

```sql
SHOW STREAMS;
```

```text
+----------------+
| Tables_in_demo |
+----------------+
| orders_stream  |
| events_stream  |
+----------------+
```

```sql
SHOW STREAMS FROM demo LIKE 'orders%';
```
