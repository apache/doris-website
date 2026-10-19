---
{
    "title": "BITMAP_UNION",
    "language": "ko",
    "description": "입력 Bitmap의 합집합을 계산하고 새로운 Bitmap을 반환합니다."
}
---

## 설명 {#description}

입력 Bitmap의 합집합을 계산하고 새로운 Bitmap을 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_UNION(<expr>)
```

## 인수 {#arguments}

| 인수 | 설명 |
| -- | -- |
| `<expr>` | Bitmap을 지원하는 데이터 타입 |

## 반환값 {#return-value}

Bitmap 타입의 값을 반환합니다. 그룹에 유효한 데이터가 없으면 빈 Bitmap을 반환합니다.

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
select bitmap_to_string(bitmap_union(user_id)) from pv_bitmap;
```

```text
+-----------------------------------------+
| bitmap_to_string(bitmap_union(user_id)) |
+-----------------------------------------+
| 100,200,300                             |
+-----------------------------------------+
```

```sql
select bitmap_to_string(bitmap_union(user_id)) from pv_bitmap where user_id is null;
```

```text
+-----------------------------------------+
| bitmap_to_string(bitmap_union(user_id)) |
+-----------------------------------------+
|                                         |
+-----------------------------------------+
```
