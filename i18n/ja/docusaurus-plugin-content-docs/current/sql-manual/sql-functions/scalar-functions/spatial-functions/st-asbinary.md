---
{
    "title": "ST_ASBINARY",
    "language": "ja",
    "description": "ジオメトリオブジェクトを標準の WKB（Well-Known Binary）バイナリ表現に変換します。WKB は地理空間データを表すバイナリ形式です。"
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

## 説明

ジオメトリオブジェクトを標準の WKB（Well-Known Binary）バイナリ表現に変換します。WKB は地理空間データを表すバイナリ形式で、地理情報システム（GIS）で広く使用されています。

現在サポートされているジオメトリ型は、Point、LineString、Polygon です。
## 構文

```sql
ST_ASBINARY( <geo>)
```

## パラメータ

| パラメータ | 説明       |
| -- |----------|
| `<geo>` | 	WKB 形式に変換するジオメトリオブジェクト。Point、LineString、Polygon が対象です。 |

## 戻り値

ジオメトリオブジェクトの WKB バイナリ表現を返します。結果は十六進数文字列（例：\x01010000...）として表示されます。

ST_ASBINARY には、次の特殊なケースがあります。

- 入力パラメータが NULL の場合、NULL を返します。
- 入力ジオメトリ型がサポートされていない場合、NULL を返します。

## 例


Point オブジェクトの変換

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

LineString オブジェクトの変換

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

Polygon オブジェクトの変換

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

サポートされていない型（MultiPolygon）は NULL を返す

```sql
mysql> SELECT ST_AsBinary(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))"));
+-------------------------------------------------------------------------------------------------------------+
| ST_AsBinary(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))")) |
+-------------------------------------------------------------------------------------------------------------+
| NULL                                                                                                        |
+-------------------------------------------------------------------------------------------------------------+
```

NULL 入力


```sql
mysql> SELECT ST_AsBinary(NULL);
+-------------------+
| ST_AsBinary(NULL) |
+-------------------+
| NULL              |
+-------------------+
```
