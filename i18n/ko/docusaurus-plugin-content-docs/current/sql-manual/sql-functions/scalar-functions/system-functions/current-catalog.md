---
{
    "title": "CURRENT_CATALOG",
    "language": "ko",
    "description": "현재 SQL 클라이언트 연결의 Catalog를 가져옵니다."
}
---

## 설명 {#description}

현재 SQL 클라이언트 연결의 Catalog를 가져옵니다.

## 구문 {#syntax}

```sql
CURRENT_CATALOG()
```

## 반환 값 {#return-value}

현재 SQL 클라이언트 연결의 Catalog 이름입니다.

## 예제 {#examples}

```sql
select current_catalog();
```

```text
+-------------------+
| current_catalog() |
+-------------------+
| internal          |
+-------------------+
```
