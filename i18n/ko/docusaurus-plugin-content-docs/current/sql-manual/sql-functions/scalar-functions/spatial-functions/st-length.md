---
{
    "title": "ST_LENGTH",
    "language": "ko",
    "description": "선 또는 면 지오메트리 객체의 길이(또는 둘레)를 반환합니다. 단위는 미터입니다."
}
---

## 설명 {#description}

선 지오메트리 객체의 구면 길이 또는 면 지오메트리 객체의 경계 둘레를 미터 단위로 반환합니다. 이 함수는 구형 지구 모델을 사용하여 계산합니다.
- `LINESTRING` 또는 `MULTILINESTRING`의 경우, 구면상에서 모든 선분의 대권 거리를 합산하여 반환합니다. 즉, 선 객체의 **길이**를 반환합니다.
- `POLYGON` 또는 `MULTIPOLYGON`의 경우, 구면상에서 외부 경계와 내부 경계(구멍)의 대권 거리를 합산하여 반환합니다. 즉, 면 객체의 **둘레**를 반환합니다.
- `CIRCLE`의 경우, `2 * π * radius` 공식으로 계산한 원둘레를 반환합니다.
- `POINT`의 경우, `0.0`을 반환합니다.

## 구문 {#syntax}

```sql
ST_LENGTH( <shape> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| :--- | :--- |
| `<shape>` | 입력 지오메트리입니다. GEOMETRY 타입이거나 GEOMETRY로 변환할 수 있는 VARCHAR 타입(WKT 형식)입니다. `LINESTRING`, `POLYGON`, `CIRCLE`, `POINT` 등의 타입을 지원합니다. |

## 반환 값 {#return-value}

지오메트리 객체의 길이 또는 둘레를 미터 단위로 반환합니다(DOUBLE 타입).

`ST_LENGTH`는 다음과 같은 특수한 경우에 아래와 같이 동작합니다.
- 입력 매개변수가 `NULL`이면 `NULL`을 반환합니다.
- 입력 매개변수를 유효한 지오메트리 객체로 파싱할 수 없으면 `NULL`을 반환합니다.
- 입력 지오메트리 객체가 `POINT`이거나 길이가 영인 선이면 `0.0`을 반환합니다.
- `CIRCLE` 타입의 경우, 올바른 원둘레(미터 단위)를 반환하려면 `ST_CIRCLE`로 생성할 때 반지름 매개변수를 미터 단위로 지정해야 합니다.

## 예제 {#example}

**선(LINESTRING)의 길이 계산**
```sql
-- Calculate the length of a line segment with a 1-degree longitude difference on the equator
SELECT ST_LENGTH(ST_GeometryFromText('LINESTRING(0 0, 1 0)'));
```
```text
+--------------------------------------------------------+
| ST_LENGTH(ST_GeometryFromText('LINESTRING(0 0, 1 0)')) |
+--------------------------------------------------------+
|                                      111195.1011774839 |
+--------------------------------------------------------+
```

**다각형(POLYGON)의 둘레 계산**
```sql
-- Calculate the perimeter of a small square with a side length of approximately 0.0009 degrees (~100 meters)
SELECT ST_LENGTH(ST_GeometryFromText('POLYGON((-0.00045 -0.00045, 0.00045 -0.00045, 0.00045 0.00045, -0.00045 0.00045, -0.00045 -0.00045))')) AS perimeter;
```
```text
+-------------------+
| perimeter         |
+-------------------+
| 400.3023642327689 |
+-------------------+
```

**원(CIRCLE)의 둘레 계산**
```sql
-- Calculate the circumference of a circle with a radius of 100 meters
SELECT ST_LENGTH(ST_Circle(0, 0, 100));
```
```text
+---------------------------------+
| ST_LENGTH(ST_Circle(0, 0, 100)) |
+---------------------------------+
|               628.3185307179587 |
+---------------------------------+
```

**점의 길이**
```sql
SELECT ST_LENGTH(ST_GeometryFromText('POINT(1 1)'));
```
```text
+----------------------------------------------+
| ST_LENGTH(ST_GeometryFromText('POINT(1 1)')) |
+----------------------------------------------+
|                                            0 |
+----------------------------------------------+
```

**유효하지 않은 매개변수(NULL 반환)**
```sql
SELECT ST_LENGTH('NOT_A_GEOMETRY');
```
```text
+-----------------------------+
| ST_LENGTH('NOT_A_GEOMETRY') |
+-----------------------------+
|                        NULL |
+-----------------------------+
```

**NULL 매개변수**
```sql
SELECT ST_LENGTH(NULL);
```
```text
+-----------------+
| ST_LENGTH(NULL) |
+-----------------+
|            NULL |
+-----------------+
```

**복잡한 선 객체의 길이**
```sql
-- Calculate the total length of a polyline
SELECT ST_LENGTH(ST_LineFromText("LINESTRING (0 0,1 0,1 1)"));
```
```text
+--------------------------------------------------------+
| ST_LENGTH(ST_LineFromText("LINESTRING (0 0,1 0,1 1)")) |
+--------------------------------------------------------+
|                                      222390.2023549679 |
+--------------------------------------------------------+
```
