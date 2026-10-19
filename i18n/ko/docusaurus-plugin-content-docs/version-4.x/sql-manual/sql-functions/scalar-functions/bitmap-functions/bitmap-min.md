---
{
    "title": "BITMAP_MIN",
    "language": "ko",
    "description": "Bitmap의 최솟값을 계산하여 반환합니다."
}
---

## 설명 {#description}

Bitmap의 최솟값을 계산하여 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_MIN(<bitmap>)
```

## 매개변수 {#parameters}

| 매개변수  | 설명                     |
|------------|---------------------------------|
| `<bitmap>` | Bitmap 타입의 열 또는 표현식 |

## 반환 값 {#return-value}

Bitmap의 최솟값입니다.  
Bitmap이 비어 있거나 NULL 값이면 `NULL`을 반환합니다.

## 예제 {#examples}

빈 Bitmap의 최솟값을 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_min(bitmap_from_string('')) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
|  NULL |
+-------+
```

여러 요소가 있는 Bitmap의 최솟값을 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_min(bitmap_from_string('1,9999999999')) value;
```

결과는 다음과 같습니다:

```text
+-------+
| value |
+-------+
|     1 |
+-------+
```

```sql
select bitmap_min(bitmap_empty()) res1,bitmap_min(NULL) res2;
```

결과는 다음과 같습니다:

```text
+------+------+
| res1 | res2 |
+------+------+
| NULL | NULL |
+------+------+
```
