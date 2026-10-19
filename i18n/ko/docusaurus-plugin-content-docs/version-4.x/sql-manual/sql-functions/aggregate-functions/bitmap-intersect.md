---
{
    "title": "BITMAP_INTERSECT",
    "language": "ko",
    "description": "그룹별 Bitmap의 교집합을 계산하는 데 사용합니다. 일반적인 사용 사례는 사용자 유지율 계산입니다."
}
---

## 설명 {#description}

그룹별 Bitmap의 교집합을 계산하는 데 사용합니다. 일반적인 사용 사례는 사용자 유지율 계산입니다.

## 구문 {#syntax}

```sql
BITMAP_INTERSECT(BITMAP <value>)
```

## 인수 {#arguments}

| 인수 | 설명 |
| -- | -- |
| `<value>` | Bitmap을 지원하는 데이터 타입 |

## 반환 값 {#return-value}

Bitmap 타입의 값을 반환합니다. 그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE user_tags (
	tag VARCHAR(20),
	date DATETIME,
	user_id BITMAP bitmap_union
) AGGREGATE KEY(tag, date) DISTRIBUTED BY HASH(tag) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO user_tags VALUES
	('A', '2020-05-18', to_bitmap(1)),
	('A', '2020-05-18', to_bitmap(2)),
	('A', '2020-05-19', to_bitmap(2)),
	('A', '2020-05-19', to_bitmap(3)),
	('B', '2020-05-18', to_bitmap(4)),
	('B', '2020-05-19', to_bitmap(4)),
	('B', '2020-05-19', to_bitmap(5));
```

```sql
select tag, bitmap_to_string(bitmap_intersect(user_id)) from (
	select tag, date, bitmap_union(user_id) user_id from user_tags where date in ('2020-05-18', '2020-05-19') group by tag, date
) a group by tag;
```

태그별로 어제 대비 오늘의 사용자 유지율을 쿼리합니다.

```text
+------+---------------------------------------------+
| tag  | bitmap_to_string(bitmap_intersect(user_id)) |
+------+---------------------------------------------+
| A    | 2                                           |
| B    | 4                                           |
+------+---------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_intersect(user_id)) from user_tags where tag is null;
```

```text
+---------------------------------------------+
| bitmap_to_string(bitmap_intersect(user_id)) |
+---------------------------------------------+
|                                             |
+---------------------------------------------+
```
