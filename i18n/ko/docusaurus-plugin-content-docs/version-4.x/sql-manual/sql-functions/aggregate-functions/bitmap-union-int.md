---
{
    "title": "BITMAP-UNION-INT",
    "language": "ko",
    "description": "입력 표현식에 포함된 고유한 값의 개수를 계산합니다. 반환 값은 COUNT(DISTINCT expr)와 같습니다."
}
---

## 설명 {#description}

입력 표현식에 포함된 고유한 값의 개수를 계산합니다. 반환 값은 COUNT(DISTINCT expr)와 같습니다.

## 구문 {#syntax}

```sql
BITMAP_UNION_INT(<expr>)
```

## 인수 {#arguments}

| 인수 | 설명 |
| -- | -- |
| `<expr>` | 입력 표현식입니다. 지원되는 타입: TinyInt, SmallInt, Integer. |

## 반환 값 {#return-value}

열에 있는 고유한 값의 개수를 반환합니다. 그룹에 유효한 데이터가 없으면 0을 반환합니다.

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
    (1, 300, to_bitmap(300)),
    (2, 200, to_bitmap(300));
```

```sql
select bitmap_union_int(dt) from pv_bitmap;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    2 |
+----------------------+
```

```sql
select bitmap_union_int(dt) from pv_bitmap where dt is null;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    0 |
+----------------------+
```
