---
{
    "title": "GROUP_BITMAP_XOR",
    "language": "ko",
    "description": "주로 여러 bitmap의 값을 병합하고 그 결과에 대해 비트 단위 xor 연산을 수행하는 데 사용됩니다."
}
---

## 설명 {#description}

주로 여러 bitmap의 값을 병합하고 그 결과에 대해 비트 단위 xor 연산을 수행하는 데 사용됩니다.

## 구문 {#syntax}

```sql
GROUP_BITMAP_XOR(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 지원되는 bitmap 데이터 타입 |

## 반환 값 {#return-value}

반환 값의 데이터 타입은 BITMAP입니다. 그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE pv_bitmap (
	page varchar(10),
	user_id BITMAP
) DISTRIBUTED BY HASH(page) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
	('m', to_bitmap(4)),
	('m', to_bitmap(7)),
	('m', to_bitmap(8)),
	('m', to_bitmap(1)),
	('m', to_bitmap(3)),
	('m', to_bitmap(6)),
	('m', to_bitmap(15)),
	('m', to_bitmap(4)),
	('m', to_bitmap(7));
```

```sql
select page, bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap group by page;
```

```text
+------+---------------------------------------------+
| page | bitmap_to_string(group_bitmap_xor(user_id)) |
+------+---------------------------------------------+
| m    | 1,3,6,8,15                                  |
+------+---------------------------------------------+
```

```sql
select bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap where page is null;
```

```text
+---------------------------------------------+
| bitmap_to_string(group_bitmap_xor(user_id)) |
+---------------------------------------------+
| NULL                                        |
+---------------------------------------------+
```
