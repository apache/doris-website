---
{
    "title": "BITMAP_SUBSET_LIMIT",
    "language": "ko",
    "description": "지정된 위치부터 Bitmap 요소의 부분 집합을 추출하며, 요소 수는 지정된 카디널리티 제한을 따릅니다."
}
---

## 설명 {#description}

지정된 위치부터 Bitmap 요소의 부분 집합을 추출하며, 요소 수를 지정된 카디널리티 제한으로 제한하고 해당 부분 집합을 새로운 Bitmap으로 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_SUBSET_LIMIT(<bitmap>, <position>, <cardinality_limit>)
```

## 매개변수 {#parameters}

| 매개변수             | 설명                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | Bitmap 값              |
| `<position>`          | 시작 위치(해당 위치 포함) |
| `<cardinality_limit>` | 최대 요소 수 |

## 반환 값 {#return-value}

지정된 범위와 개수 제한에 해당하는 부분 집합 Bitmap입니다.
- 매개변수 값이 NULL이거나 유효하지 않으면 NULL을 반환합니다.

## 예제 {#examples}

Bitmap의 위치 0부터 요소를 최대 3개 포함하는 부분 집합을 가져오려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 0, 3)) value;
```

결과는 다음과 같습니다:

```text
+-----------+
| value     |
+-----------+
| 1,2,3     |
+-----------+
```

Bitmap의 위치 4부터 요소를 최대 3개 포함하는 부분 집합을 가져오려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, 3)) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
| 4,5   |
+-------+
```


```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, NULL)) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), -4, 3)) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, -3)) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
