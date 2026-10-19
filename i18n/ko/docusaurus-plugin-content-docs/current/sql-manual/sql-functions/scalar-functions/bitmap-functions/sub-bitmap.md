---
{
    "title": "SUB_BITMAP",
    "language": "ko",
    "description": "지정된 위치에서 시작하여 지정된 카디널리티 제한 내에서 Bitmap 요소의 부분 집합을 추출합니다."
}
---

## 설명 {#description}

지정된 위치에서 시작하여 지정된 카디널리티 제한 내에서 Bitmap 요소의 부분 집합을 추출하고, 이 부분 집합을 새로운 Bitmap으로 반환합니다.

## 구문 {#syntax}

```sql
SUB_BITMAP(<bitmap>, <position>, <cardinality_limit>)
```

## 매개변수 {#parameters}

| 매개변수              | 설명                          |
|-----------------------|-------------------------------|
| `<bitmap>`            | Bitmap 값                     |
| `<position>`          | 시작 위치(해당 위치 포함). 인덱스가 음수이면 마지막 요소의 인덱스는 -1입니다. |
| `<cardinality_limit>` | 최대 요소 수                   |

## 반환 값 {#return-value}

지정된 범위와 제한 내에 있는 부분 집합 Bitmap을 반환합니다.
- 매개변수가 NULL이면 NULL을 반환합니다.


## 예제 {#examples}

시작 위치가 0이고 카디널리티 제한이 3인 Bitmap의 부분 집합을 가져오려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 0, 3)) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
| 0,1,2 |
+-------+
```

시작 위치가 -3이고 카디널리티 제한이 2인 Bitmap의 부분 집합을 가져오려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), -3, 2)) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
| 2,3   |
+-------+
```

시작 위치가 2이고 카디널리티 제한이 100인 Bitmap의 부분 집합을 가져오려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, 100)) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
| 2,3,5 |
+-------+
```

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, NULL)) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
