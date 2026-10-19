---
{
    "title": "ST_ASBINARY",
    "language": "ko",
    "description": "기하 객체를 표준 WKB (Well-Known Binary) 바이너리 표현으로 변환합니다. WKB는 지리 공간 데이터를 표현하는 바이너리 형식입니다."
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

##  설명 {#description}

기하 객체를 표준 WKB (Well-Known Binary) 바이너리 표현으로 변환합니다. WKB는 지리 공간 데이터를 표현하는 바이너리 형식으로, Geographic Information Systems (GIS)에서 널리 사용됩니다.

현재 지원하는 기하 유형은 Point, LineString, Polygon입니다.
## 구문 {#syntax}

```sql
ST_ASBINARY( <geo>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명       |
| -- |----------|
| `<geo>` | 	WKB 형식으로 변환할 기하 객체입니다. Point, LineString, Polygon을 포함합니다. |

## 반환값 {#return-value}

기하 객체의 WKB 바이너리 표현을 반환하며, 십육진수 문자열(예: \x01010000...)로 표시됩니다.

ST_ASBINARY는 다음과 같은 특수한 경우에 아래와 같이 동작합니다.

- 입력 매개변수가 NULL이면 NULL을 반환합니다.
- 입력 기하 유형을 지원하지 않으면 NULL을 반환합니다.

## 예제 {#example}


Point 객체 변환

```sql
select ST_AsBinary(st_point(24.7, 56.7));
```

```text
+----------------------------------------------+
| st_asbinary(st_point(24.7, 56.7))            |
+----------------------------------------------+
| \x01010000003333333333b338409a99999999594c40 |
+----------------------------------------------+
```

LineString 객체 변환

```sql
select ST_AsBinary(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
```

```text
+--------------------------------------------------------------------------------------+
| st_asbinary(st_geometryfromtext('LINESTRING (1 1, 2 2)'))                            |
+--------------------------------------------------------------------------------------+
| \x010200000002000000000000000000f03f000000000000f03f00000000000000400000000000000040 |
+--------------------------------------------------------------------------------------+
```

Polygon 객체 변환

```sql
select ST_AsBinary(ST_Polygon("POLYGON ((114.104486 22.547119,114.093758 22.547753,114.096504 22.532057,114.104229 22.539826,114.106203 22.542680,114.104486 22.547119))"));
```

```text
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| st_asbinary(st_polygon('POLYGON ((114.104486 22.547119,114.093758 22.547753,114.096504 22.532057,114.104229 22.539826,114.106203 22.542680,114.104486 22.547119))'))                                                         |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| \x01030000000100000006000000f3380ce6af865c402d05a4fd0f8c364041ef8d2100865c403049658a398c3640b9fb1c1f2d865c409d9b36e334883640de921cb0ab865c40cf876709328a36402cefaa07cc865c407b319413ed8a3640f3380ce6af865c402d05a4fd0f8c3640 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

지원하지 않는 유형(MultiPolygon)을 입력하면 NULL 반환

```sql
mysql> SELECT ST_AsBinary(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))"));
+-------------------------------------------------------------------------------------------------------------+
| ST_AsBinary(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))")) |
+-------------------------------------------------------------------------------------------------------------+
| NULL                                                                                                        |
+-------------------------------------------------------------------------------------------------------------+
```

NULL 입력


```sql
mysql> SELECT ST_AsBinary(NULL);
+-------------------+
| ST_AsBinary(NULL) |
+-------------------+
| NULL              |
+-------------------+
```
