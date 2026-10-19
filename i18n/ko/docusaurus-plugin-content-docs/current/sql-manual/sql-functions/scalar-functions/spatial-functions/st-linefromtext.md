---
{
    "title": "ST_LINEFROMTEXT",
    "language": "ko",
    "description": "WKT (Well Known Text) 문자열을 메모리 내 Line 표현으로 변환합니다"
}
---

## 설명 {#description}

WKT (Well Known Text) 문자열을 메모리 내 Line 표현으로 변환합니다

## 별칭 {#alias}

- ST_LINESTRINGFROMTEXT

## 구문 {#syntax}

```sql
ST_LINEFROMTEXT( <wkt>)
```

## 매개변수 {#parameters}

| 매개변수  | 설명         |
|-----|------------|
| `<wkt>` | LINESTRING 타입에 맞는 WKT 문자열로, 형식은 다음과 같습니다.
"LINESTRING (x1 y1, x2 y2)"
여기서 (x1 y1), (x2 y2)는 선분의 꼭짓점 좌표입니다. 좌표 값은 숫자(정수 또는 소수)입니다. |

## 반환 값 {#return-value}

Line 타입의 기하 객체를 반환합니다. 이 객체는 Doris의 내부 공간 데이터 형식으로 메모리에 저장됩니다. 다른 공간 함수(예: ST_LENGTH, ST_INTERSECTS 등)에 매개변수로 직접 전달하여 계산에 사용할 수 있습니다.

- 입력 WKT 문자열이 유효하지 않으면(예: 꼭짓점이 2개 미만이거나, 구문 오류가 있거나, 좌표가 숫자가 아닌 경우 등) NULL을 반환합니다.
- <wkt>가 NULL이거나 빈 문자열이면 NULL을 반환합니다.

## 예제 {#example}


일반적인 LINE 타입

```sql
mysql> SELECT ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)"));
+-----------------------------------------------------+
| ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)")) |
+-----------------------------------------------------+
| LINESTRING (1 1, 2 2)                               |
+-----------------------------------------------------+
```

유효하지 않은 WKT(꼭짓점 부족)

```sql
mysql> SELECT ST_LineFromText("LINESTRING (1 1)");
+-------------------------------------+
| ST_LineFromText("LINESTRING (1 1)") |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

유효하지 않은 WKT(구문 오류)

```sql
mysql> SELECT ST_LineFromText("LINESTRING (1 1, 2 2");
+-----------------------------------------+
| ST_LineFromText("LINESTRING (1 1, 2 2") |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+
```

여러 꼭짓점이 있는 LineString

```sql
mysql> SELECT ST_AsText(ST_LineFromText('LINESTRING (1 1, 2 2)'));
+-----------------------------------------------------+
| ST_AsText(ST_LineFromText('LINESTRING (1 1, 2 2)')) |
+-----------------------------------------------------+
| LINESTRING (1 1, 2 2)                               |
+-----------------------------------------------------+
```

NULL 입력

```sql
mysql> SELECT ST_LineFromText(NULL);
+-----------------------+
| ST_LineFromText(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```
