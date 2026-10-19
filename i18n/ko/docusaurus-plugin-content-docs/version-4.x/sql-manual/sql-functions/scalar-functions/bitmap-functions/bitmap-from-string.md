---
{
    "title": "BITMAP_FROM_STRING",
    "language": "ko",
    "description": "문자열을 BITMAP으로 변환합니다. 문자열은 쉼표로 구분된 unsigned bigint 숫자로 구성됩니다."
}
---

## 설명 {#description}

문자열을 BITMAP으로 변환합니다. 문자열은 쉼표로 구분된 unsigned bigint 숫자로 구성됩니다. (숫자 값의 범위: 0 ~ 18446744073709551615)
예를 들어, 문자열 "0, 1, 2"는 0번째, 1번째, 2번째 비트가 설정된 Bitmap으로 변환됩니다. 입력 필드가 유효하지 않으면 NULL을 반환합니다.

## 구문 {#syntax}

```sql
 BITMAP_FROM_STRING(<str>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명                                                                                    |
|-----------|------------------------------------------------------------------------------------------------|
| `<str>`   | 배열을 나타내는 문자열입니다. 예를 들어 "0, 1, 2" 문자열은 비트 0, 1, 2가 설정된 Bitmap으로 변환됩니다 |  

## 반환 값 {#return-value}

BITMAP을 반환합니다.
- 입력 필드가 유효하지 않으면 결과는 NULL입니다.

## 예제 {#examples}

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 2")) bts;
```

```text
+-------+
| bts   |
+-------+
| 0,1,2 |
+-------+
```

```sql
select bitmap_to_string(bitmap_from_string("-1, 0, 1, 2")) bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string(NULL)) bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string("18446744073709551616, 1")) bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 18446744073709551615")) bts;
```

```text
+--------------------------+
| bts                      |
+--------------------------+
| 0,1,18446744073709551615 |
+--------------------------+
```
