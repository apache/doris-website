---
{
    "title": "UNCOMPRESS",
    "language": "ko",
    "description": "UNCOMPRESS 함수는 바이너리 데이터의 압축을 해제하여 문자열이나 값으로 변환합니다. 바이너리 데이터가 COMPRESS 함수의 결과인지 확인해야 합니다."
}
---

## 설명 {#description}
UNCOMPRESS 함수는 바이너리 데이터의 압축을 해제하여 문자열이나 값으로 변환합니다. 바이너리 데이터가 `COMPRESS` 함수의 결과인지 확인해야 합니다.

## 구문 {#syntax}

```sql
UNCOMPRESS(<compressed_str>)
```

## 매개변수 {#parameters}

| 매개변수          | 설명            |
|--------------------|------------------------|
| `<compressed_str>` | 압축된 바이너리 데이터이며, 매개변수 타입은 varchar 또는 string입니다. |

## 반환값 {#return-value}

반환값의 타입은 입력 `compressed_str`의 타입과 동일합니다.

특수한 경우:
- `compressed_str`이 `COMPRESS`로 얻은 바이너리 데이터가 아니면 NULL을 반환합니다.


## 예제 {#examples}

``` sql
select uncompress(compress('abc'));
```
```text 
+-----------------------------+
| uncompress(compress('abc')) |
+-----------------------------+
| abc                         |
+-----------------------------+
```
```sql
select uncompress(compress(''));
```
```text 
+--------------------------+
| uncompress(compress('')) |
+--------------------------+
|                          |
+--------------------------+
```
```sql
select uncompress('abc');
```
```text 
+-------------------+
| uncompress('abc') |
+-------------------+
| NULL              |
+-------------------+
```

### 키워드 {#keywords}

    UNCOMPRESS, COMPRESS
