---
{
  "title": "ST_POLYGON",
  "language": "ja",
  "description": "WKT（Well-Known Text）形式の文字列をメモリ内のPolygon幾何オブジェクトに変換します。"
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

WKT（Well-Known Text）形式の文字列をメモリ内のPolygon幾何オブジェクトに変換します。

## 別名

- st_polygonfromtext
- st_polyfromtext

## 構文

```sql
ST_POLYGON( <wkt>)
```
## パラメータ

| パラメータ   | 説明                 |
|------|--------------------|
| `<wkt>` | POLYGON関数によって生成されたポリゴンのWKTテキスト |

## 戻り値

Polygon型の幾何オブジェクトを返します。これはDorisの内部空間データ形式でメモリに格納され、他の空間関数（ST_AREA、ST_CONTAINSなど）のパラメータとして直接渡して計算することができます。

- 入力WKT文字列が無効な場合（例：閉じられていないリング、構文エラー）、NULLを返します。
- 入力`<wkt>`がNULLまたは空文字列の場合、NULLを返します。

## 例

基本的なポリゴン

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
自己交差ポリゴン（無効）

```sql
mysql> select st_polygon('POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))');
+---------------------------------------------------+
| st_polygon('POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))') |
+---------------------------------------------------+
| NULL                                              |
+---------------------------------------------------+
```
無効なWKT（未閉鎖のリング）

```sql
mysql> SELECT ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10))");
+--------------------------------------------------+
| ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10))") |
+--------------------------------------------------+
| NULL                                             |
+--------------------------------------------------+
```
無効なWKT（構文エラー）

```sql

mysql> SELECT ST_Polygon("POLYGON (0 0, 10 0, 10 10, 0 10, 0 0)");
+-----------------------------------------------------+
| ST_Polygon("POLYGON (0 0, 10 0, 10 10, 0 10, 0 0)") |
+-----------------------------------------------------+
| NULL                                                |
+-----------------------------------------------------+
```
input NULL

```sql
mysql> SELECT ST_Polygon(NULL);
+------------------+
| ST_Polygon(NULL) |
+------------------+
| NULL             |
+------------------+
```
