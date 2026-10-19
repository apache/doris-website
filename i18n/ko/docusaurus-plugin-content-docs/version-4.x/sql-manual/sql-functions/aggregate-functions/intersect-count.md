---
{
    "title": "INTERSECT_COUNT",
    "language": "ko",
    "description": "둘 이상의 bitmap의 교집합을 계산합니다. 사용법: intersectcount(bitmapcolumntocount, filtercolumn, filtervalues ..."
}
---

## 설명 {#description}

둘 이상의 bitmap의 교집합을 계산합니다.
사용법: intersect_count(bitmap_column_to_count, filter_column, filter_values ...)
예: intersect_count(user_id, event, 'A', 'B', 'C')는 A/B/C 3개 bitmap 모두에 포함된 user_id의 개수를 구한다는 의미입니다.
bitmap_column의 원소 중 column_to_filter가 filter_values 내의 값과 일치하는 원소의 교집합 원소 수, 즉 bitmap 교집합의 원소 수를 계산합니다.

## 구문 {#syntax}

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values> [, ...])
```

## 매개변수 {#parameters}

| 매개변수         | 설명                                      |
|------------------|--------------------------------------------------|
| `<bitmap_column>`  | 입력 bitmap 매개변수 컬럼입니다. 지원 타입: Bitmap. |
| `<column_to_filter>` | 필터링에 사용하는 차원 컬럼입니다. 지원 타입: TinyInt, SmallInt, Integer, BigInt, LargeInt. |
| `<filter_values>`  | 차원 컬럼을 필터링하는 데 사용하는 서로 다른 값입니다. 지원 타입: TinyInt, SmallInt, Integer, BigInt, LargeInt. |


## 반환 값 {#return-value}

주어진 bitmap들의 교집합에 포함된 원소 수를 반환합니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE pv_bitmap (
	dt INT,
	user_id BITMAP,
	city STRING
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
	(20250801, to_bitmap(1), 'beijing'),
	(20250801, to_bitmap(2), 'beijing'),
	(20250801, to_bitmap(3), 'shanghai'),
	(20250802, to_bitmap(3), 'beijing'),
	(20250802, to_bitmap(4), 'shanghai'),
	(20250802, to_bitmap(5), 'shenzhen');
```

```sql
select intersect_count(user_id,dt,20250801) from pv_bitmap;
```

```text
+--------------------------------------+
| intersect_count(user_id,dt,20250801) |
+--------------------------------------+
|                                    3 |
+--------------------------------------+
```

두 날짜의 교집합을 구하여 `20250801`과 `20250802`에 모두 존재하는 사용자의 수를 계산합니다(두 날짜에 모두 나타나는 사용자는 `user_id`가 3인 사용자뿐입니다):

```sql
select intersect_count(user_id,dt,20250801,20250802) from pv_bitmap;
```

```text
+-----------------------------------------------+
| intersect_count(user_id,dt,20250801,20250802) |
+-----------------------------------------------+
|                                             1 |
+-----------------------------------------------+
```
