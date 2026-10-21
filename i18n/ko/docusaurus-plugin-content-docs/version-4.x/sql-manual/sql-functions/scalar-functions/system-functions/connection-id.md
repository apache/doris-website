---
{
    "title": "CONNECTION_ID",
    "language": "ko",
    "description": "현재 SQL 클라이언트의 연결 번호를 가져옵니다."
}
---

## 설명 {#description}

현재 SQL 클라이언트의 연결 번호를 가져옵니다.

## 구문 {#syntax}

```sql
CONNECTION_ID()
```

## 반환 값 {#return-value}

현재 SQL 클라이언트의 연결 번호입니다.

## 예제 {#examples}

```sql
select connection_id();
```

```text
+-----------------+
| connection_id() |
+-----------------+
|             549 |
+-----------------+
```
