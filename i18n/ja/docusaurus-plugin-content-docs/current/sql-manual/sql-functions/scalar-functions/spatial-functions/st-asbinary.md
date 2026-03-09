---
{
  "title": "ST_ASBINARY",
  "language": "ja",
  "description": "幾何オブジェクトを標準的なWKB（Well-Known Binary）バイナリ表現に変換します。WKBは地理空間データを表現するためのバイナリ形式です。"
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

##  説明 

幾何オブジェクトを標準的なWKB（Well-Known Binary）バイナリ表現に変換します。WKBは地理空間データを表現するためのバイナリ形式で、Geographic Information Systems（GIS）で広く使用されています。

現在サポートされている幾何タイプには、Point、LineString、Polygonが含まれます。
## 構文

```sql
ST_ASBINARY( <geo>)
```
## パラメータ

| パラメータ | 説明       |
| -- |----------|
| `<geo>` | 	WKB形式に変換される幾何オブジェクト。Point、LineString、Polygonを含む。） |

## 戻り値

幾何オブジェクトのWKBバイナリ表現を16進数文字列として返します（例：\x01010000...）。

ST_ASBINARYには以下のエッジケースがあります：

- 入力パラメータがNULLの場合、NULLを返します。
- 入力された幾何タイプがサポートされていない場合、NULLを返します。

## 例


Pointオブジェクトの変換

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
LineString オブジェクト変換

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
Polygonオブジェクトの変換

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
サポートされていないタイプ（MultiPolygon）はNULLを返します

```sql
mysql> SELECT ST_AsBinary(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))"));
+-------------------------------------------------------------------------------------------------------------+
| ST_AsBinary(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))")) |
+-------------------------------------------------------------------------------------------------------------+
| NULL                                                                                                        |
+-------------------------------------------------------------------------------------------------------------+
```
NULL入力

```sql
mysql> SELECT ST_AsBinary(NULL);
+-------------------+
| ST_AsBinary(NULL) |
+-------------------+
| NULL              |
+-------------------+
```
