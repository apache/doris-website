---
{
    "title": "BITMAP_UNION_COUNT",
    "language": "ko",
    "description": "입력 Bitmap의 합집합을 계산하고 해당 집합의 원소 수를 반환합니다."
}
---

## 설명 {#description}

입력 Bitmap의 합집합을 계산하고 해당 집합의 원소 수를 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_UNION_COUNT(<expr>)
```

## 인수 {#arguments}

| 인수 | 설명 |
| -- | -- |
| `<expr>` | Bitmap을 지원하는 데이터 타입 |

## 반환 값 {#return-value}

Bitmap 합집합의 크기, 즉 중복을 제외한 원소의 개수를 반환합니다. 그룹에 유효한 데이터가 없으면 0을 반환합니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE pv_bitmap (
    dt INT,
    page INT,
    user_id BITMAP
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
    (1, 100, to_bitmap(100)),
    (1, 100, to_bitmap(200)),
    (1, 100, to_bitmap(300)),
    (2, 200, to_bitmap(300));
```

```sql
select bitmap_union_count(user_id) from pv_bitmap;
```

중복을 제외한 user_id 값의 개수를 계산합니다.

```text
+-----------------------------+
| bitmap_union_count(user_id) |
+-----------------------------+
|                           3 |
+-----------------------------+
```

```sql
select bitmap_union_count(user_id) from pv_bitmap where user_id is null;
```

```text
+-----------------------------+
| bitmap_union_count(user_id) |
+-----------------------------+
|                           0 |
+-----------------------------+
```
