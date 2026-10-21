---
{
    "title": "ST_ISCLOSED",
    "language": "ko",
    "description": "LineString의 첫 번째 점과 마지막 점을 비교하여 닫혀 있는지 판별합니다."
}
---

<version since="dev">

</version>

## 설명 {#description}

`LINESTRING`이 닫혀 있는지 판별합니다. `LINESTRING`은 첫 번째 점과 마지막 점이 정확히 일치하면 닫혀 있는 것으로 간주합니다. 이 함수는 거리 허용 오차를 사용하지 않습니다.

## 구문 {#syntax}

```sql
ST_ISCLOSED( <shape> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| :--- | :--- |
| `<shape>` | `VARCHAR` 타입의 인코딩된 도형 값으로, `ST_GeometryFromText` 또는 `ST_LineFromText`와 같은 공간 생성자가 반환합니다. 원시 WKT 텍스트는 먼저 생성자를 사용하여 변환해야 합니다. |

## 반환 값 {#return-value}

BOOLEAN 값을 반환합니다.

- `true`: 입력이 유효한 `LINESTRING`이고 첫 번째 점과 마지막 점이 정확히 일치하는 경우.
- `false`: 입력이 유효한 `LINESTRING`이고 첫 번째 점과 마지막 점이 서로 다른 경우.
- `NULL`: 입력이 `NULL`이거나, `LINESTRING`이 아니거나, 유효한 도형으로 디코딩할 수 없는 경우.

SQL 출력에서 `true`는 `1`로, `false`는 `0`으로 표시됩니다.

## 예제 {#example}

**닫힌 LineString**

```sql
SELECT ST_IsClosed(
    ST_GeometryFromText('LINESTRING(0 0, 1 1, 0 0)')
) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|         1 |
+-----------+
```

**열린 LineString**

```sql
SELECT ST_IsClosed(
    ST_GeometryFromText('LINESTRING(0 0, 1 1)')
) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|         0 |
+-----------+
```

**NULL 입력**

```sql
SELECT ST_IsClosed(NULL) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|      NULL |
+-----------+
```

**LineString이 아닌 입력**

```sql
SELECT ST_IsClosed(ST_Point(0, 0)) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|      NULL |
+-----------+
```
