---
{
    "title": "BITMAP_SUBSET_IN_RANGE",
    "language": "ko",
    "description": "지정된 범위 내의 Bitmap 부분집합을 반환합니다(범위의 끝값은 제외)."
}
---

## 설명 {#description}

지정된 범위 내의 Bitmap 부분집합을 반환합니다(범위의 끝값은 제외).

## 구문 {#syntax}

```sql
BITMAP_SUBSET_IN_RANGE(<bitmap>, <range_start_include>, <range_end_exclude>)
```

## 매개변수 {#parameters}

| 매개변수             | 설명                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | Bitmap 값              |
| `<range_start_include>` | 범위의 시작값(포함) |
| `<range_end_exclude>`   | 범위의 끝값(제외)   |

## 반환값 {#return-value}

지정된 범위 내의 Bitmap 부분집합입니다.
- 매개변수 값이 NULL이거나 범위가 유효하지 않으면 NULL을 반환합니다.

## 예제 {#examples}

0부터 9까지의 범위에 속하는 Bitmap 부분집합을 가져오려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 0, 9)) value;
```

결과는 다음과 같습니다:

```text
+-----------+
| value     |
+-----------+
| 1,2,3,4,5 |
+-----------+
```

2부터 3까지의 범위에 속하는 Bitmap 부분집합을 가져오려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, 3)) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
| 2     |
+-------+
```


```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, NULL)) value;
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
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, -10000)) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
