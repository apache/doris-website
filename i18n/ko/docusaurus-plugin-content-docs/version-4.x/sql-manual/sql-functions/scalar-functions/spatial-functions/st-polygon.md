---
{
    "title": "ST_POLYGON",
    "language": "ko",
    "description": "WKT (Well-Known Text) 형식의 문자열을 메모리 내 Polygon 기하 객체로 변환합니다."
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->


## 설명 {#description}

WKT (Well-Known Text) 형식의 문자열을 메모리 내 Polygon 기하 객체로 변환합니다.

## 별칭 {#alias}

- st_polygonfromtext
- st_polyfromtext

## 구문 {#syntax}

```sql
ST_POLYGON( <wkt>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명                 |
|------|--------------------|
| `<wkt>` | POLYGON 함수로 생성된 다각형의 WKT 텍스트 |

## 반환값 {#return-value}

Polygon 타입의 기하 객체를 반환합니다. 이 객체는 Doris의 내부 공간 데이터 형식으로 메모리에 저장되며, 다른 공간 함수(예: ST_AREA, ST_CONTAINS 등)에 매개변수로 직접 전달하여 계산할 수 있습니다.

- 입력 WKT 문자열이 유효하지 않으면(예: 닫히지 않은 링, 구문 오류) NULL을 반환합니다.
- 입력 <wkt>가 NULL이거나 빈 문자열이면 NULL을 반환합니다.

## 예제 {#example}

기본 다각형
```sql
SELECT ST_AsText(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+------------------------------------------------------------------+
| st_astext(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+------------------------------------------------------------------+
| POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))                          |
+------------------------------------------------------------------+
```

자기 교차 다각형(유효하지 않음)

```sql
mysql> select st_polygon('POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))');
+---------------------------------------------------+
| st_polygon('POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))') |
+---------------------------------------------------+
| NULL                                              |
+---------------------------------------------------+
```

유효하지 않은 WKT(닫히지 않은 링)

```sql
mysql> SELECT ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10))");
+--------------------------------------------------+
| ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10))") |
+--------------------------------------------------+
| NULL                                             |
+--------------------------------------------------+
```

유효하지 않은 WKT(구문 오류)

```sql

mysql> SELECT ST_Polygon("POLYGON (0 0, 10 0, 10 10, 0 10, 0 0)");
+-----------------------------------------------------+
| ST_Polygon("POLYGON (0 0, 10 0, 10 10, 0 10, 0 0)") |
+-----------------------------------------------------+
| NULL                                                |
+-----------------------------------------------------+
```

NULL 입력

```sql
mysql> SELECT ST_Polygon(NULL);
+------------------+
| ST_Polygon(NULL) |
+------------------+
| NULL             |
+------------------+
```
