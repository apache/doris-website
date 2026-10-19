---
{
    "title": "BITMAP_FROM_ARRAY",
    "language": "ko",
    "description": "TINYINT/SMALLINT/INT/BIGINT 타입의 배열을 BITMAP으로 변환합니다. 입력 필드가 유효하지 않으면 결과로 NULL을 반환합니다."
}
---

## 설명 {#description}

TINYINT/SMALLINT/INT/BIGINT 타입의 배열을 BITMAP으로 변환합니다. 입력 필드가 유효하지 않으면 결과로 NULL을 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_FROM_ARRAY(<arr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명   |
|-----------|---------------|
| `<arr>`   | 정수 배열 |

## 반환 값 {#return-value}

BITMAP을 반환합니다.

- 입력 필드가 유효하지 않으면 결과는 NULL입니다.

## 예제 {#examples}

```sql
SELECT bitmap_to_string(bitmap_from_array(array(1, 0, 1, 1, 0, 1, 0))) AS bs;
```

```text
+------+
| bs   |
+------+
| 0,1  |
+------+
```


```sql
SELECT bitmap_to_string(bitmap_from_array(NULL)) AS bs;
```

```text
+------+
| bs   |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_array([1,2,3,-1]));
```

```text
+-------------------------------------------------+
| bitmap_to_string(bitmap_from_array([1,2,3,-1])) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```
