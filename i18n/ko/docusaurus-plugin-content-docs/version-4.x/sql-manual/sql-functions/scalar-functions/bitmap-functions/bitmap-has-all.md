---
{
    "title": "BITMAP_HAS_ALL",
    "language": "ko",
    "description": "한 Bitmap이 다른 Bitmap의 모든 요소를 포함하는지 확인합니다."
}
---

## 설명 {#description}

한 Bitmap이 다른 Bitmap의 모든 요소를 포함하는지 확인합니다.

## 구문 {#syntax}

```sql
BITMAP_HAS_ALL(<bitmap1>, <bitmap2>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명       |
|-------------|-------------------|
| `<bitmap1>` | 첫 번째 Bitmap  |
| `<bitmap2>` | 두 번째 Bitmap |

## 반환 값 {#return-value}

`true`는 `<bitmap1>`이 `<bitmap2>`의 모든 요소를 포함할 때 반환됩니다.  
`true`는 `<bitmap2>`에 요소가 없을 때 반환됩니다.  
그 외에는 `false`를 반환합니다.
- 매개변수 값이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

한 Bitmap이 다른 Bitmap의 모든 요소를 포함하는지 확인하려면 다음과 같이 실행합니다.

```sql
select bitmap_has_all(bitmap_from_string('0, 1, 2'), bitmap_from_string('1, 2')) as res;
```

결과는 다음과 같습니다.

```text
+------+
| res  |
+------+
|    1 |
+------+
```

빈 Bitmap이 다른 Bitmap의 모든 요소를 포함하는지 확인하려면 다음과 같이 실행합니다.

```sql
select bitmap_has_all(bitmap_empty(), bitmap_from_string('1, 2')) as res;
```

결과는 다음과 같습니다.

```text
+------+
| res  |
+------+
|    0 |
+------+
```


```sql
select bitmap_has_all(bitmap_empty(), NULL) as res;
```

결과는 다음과 같습니다.

```text
+------+
| res  |
+------+
| NULL |
+------+
```
