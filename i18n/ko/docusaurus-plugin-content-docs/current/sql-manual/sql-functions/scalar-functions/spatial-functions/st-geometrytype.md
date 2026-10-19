---
{
    "title": "ST_GEOMETRYTYPE",
    "language": "ko",
    "description": "지오메트리 객체의 타입 이름을 반환합니다."
}
---

## 설명 {#description}

주어진 지오메트리 객체의 타입 이름을 대문자로 반환합니다. 도형의 구체적인 타입을 식별하는 데 사용합니다.

## 구문 {#syntax}

```sql
ST_GEOMETRYTYPE( <shape> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| :--- | :--- |
| `<shape>` | GEOMETRY 타입 또는 GEOMETRY로 변환할 수 있는 VARCHAR 타입(WKT 형식)의 입력 지오메트리입니다. |

## 반환 값 {#return-value}

지오메트리 객체의 타입을 나타내는 VARCHAR 타입의 대문자 문자열을 반환합니다.

`ST_GEOMETRYTYPE`의 특수한 경우는 다음과 같습니다.
-   입력 매개변수가 `NULL`이면 `NULL`을 반환합니다.
-   입력 매개변수를 유효한 지오메트리 객체로 파싱할 수 없으면 `NULL`을 반환합니다.
-   지원하는 지오메트리 타입과 각 타입의 반환 값 예시는 다음과 같습니다.
    -   `POINT`: `"ST_POINT"`
    -   `LINESTRING`: `"ST_LINESTRING"`
    -   `POLYGON`: `"ST_POLYGON"`
    -   `MULTIPOLYGON`: `"ST_MULTIPOLYGON"`
    -   `CIRCLE` : `"ST_CIRCLE"`

## 예제 {#example}

**점의 타입**
```sql
SELECT ST_GEOMETRYTYPE(ST_GeometryFromText('POINT(1 1)'));
```
```text
+----------------------------------------------------+
| ST_GEOMETRYTYPE(ST_GeometryFromText('POINT(1 1)')) |
+----------------------------------------------------+
| ST_POINT                                           |
+----------------------------------------------------+
```

**선의 타입**
```sql
SELECT ST_GEOMETRYTYPE(ST_LineFromText("LINESTRING (1 1,2 2,3 3)"));
```
```text
+--------------------------------------------------------------+
| ST_GEOMETRYTYPE(ST_LineFromText("LINESTRING (1 1,2 2,3 3)")) |
+--------------------------------------------------------------+
| ST_LINESTRING                                                |
+--------------------------------------------------------------+
```

**다각형의 타입**
```sql
SELECT ST_GEOMETRYTYPE(ST_GeometryFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))'));
```
```text
+--------------------------------------------------------------------------------+
| ST_GEOMETRYTYPE(ST_GeometryFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+--------------------------------------------------------------------------------+
| ST_POLYGON                                                                     |
+--------------------------------------------------------------------------------+
```

**원의 타입(Doris 확장)**
```sql
SELECT ST_GEOMETRYTYPE(ST_Circle(0, 0, 100));
```
```text
+---------------------------------------+
| ST_GEOMETRYTYPE(ST_Circle(0, 0, 100)) |
+---------------------------------------+
| ST_CIRCLE                             |
+---------------------------------------+
```

**유효하지 않은 매개변수(NULL 반환)**
```sql
SELECT ST_GEOMETRYTYPE('NOT_A_GEOMETRY');
```
```text
+-----------------------------------+
| ST_GEOMETRYTYPE('NOT_A_GEOMETRY') |
+-----------------------------------+
| NULL                              |
+-----------------------------------+
```

**NULL 매개변수**
```sql
SELECT ST_GEOMETRYTYPE(NULL);
```
```text
+-----------------------+
| ST_GEOMETRYTYPE(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```
