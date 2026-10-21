---
{
    "title": "DATABASE",
    "language": "ko",
    "description": "현재 SQL 클라이언트 연결의 데이터베이스를 반환합니다."
}
---

## 설명 {#description}

현재 SQL 클라이언트 연결의 데이터베이스를 반환합니다.

## 별칭 {#alias}

- SCHEMA

## 구문 {#syntax}

```sql
DATABASE()
```
또는

```sql
SCHEMA()
```

## 반환 값 {#return-value}

현재 SQL 클라이언트가 연결된 데이터베이스의 이름입니다.

## 예제 {#examples}

```sql
select database(),schema();
```

```text
+------------+------------+
| database() | database() |
+------------+------------+
| test       | test       |
+------------+------------+
```
