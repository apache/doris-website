---
{
    "title": "BITMAP_EMPTY",
    "language": "ko",
    "description": "빈 BITMAP을 생성합니다. 주로 삽입 또는 Stream Load 시 기본값을 채우는 데 사용합니다. 예:"
}
---

## 설명 {#description}

빈 BITMAP을 생성합니다. 주로 삽입 또는 Stream Load 시 기본값을 채우는 데 사용합니다. 예:

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,v1,v2=bitmap_empty()"   http://127.0.0.1:8040/api/test_database/test_table/_stream_load
```

## 구문 {#syntax}

```sql
BITMAP_EMPTY()
```

## 반환 값 {#return-value}

요소가 없는 빈 배열을 반환합니다

## 예제 {#examples}

```sql
select bitmap_to_string(bitmap_empty());
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```

```sql
select bitmap_count(bitmap_empty());
```

```text
+------------------------------+
| bitmap_count(bitmap_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```
