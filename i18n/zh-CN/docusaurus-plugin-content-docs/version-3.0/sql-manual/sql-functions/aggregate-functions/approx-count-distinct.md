---
{
    "title": "DAYOFMONTH",
    "language": "zh-CN"
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


## 语法

`INT DAYOFMONTH(DATETIME date)`


获得日期中的天信息，返回值范围从 1-31。

参数为 Date 或者 Datetime 类型

## 举例

```
mysql> select dayofmonth('1987-01-31');
+-----------------------------------+
| dayofmonth('1987-01-31 00:00:00') |
+-----------------------------------+
|                                31 |
+-----------------------------------+
```



*注：在导入中，由于原始类型均为 String，将值为浮点的原始数据做 cast 的时候数据会被转换成 NULL，比如 12.0。Doris 目前不会对原始数据做截断。*

如果想强制将这种类型的原始数据 cast to int 的话。请看下面写法：

```
curl --location-trusted -u root: -T ~/user_data/bigint -H "columns: tmp_k1, k1=cast(cast(tmp_k1 as DOUBLE) as BIGINT)"  http://host:port/api/test/bigint/_stream_load

mysql> select cast(cast ("11.2" as double) as bigint);
+----------------------------------------+
| CAST(CAST('11.2' AS DOUBLE) AS BIGINT) |
+----------------------------------------+
|                                     11 |
+----------------------------------------+
1 row in set (0.00 sec)
```

对于 DECIMALV3，DATETIME 类型，cast 会进行四舍五入
```
mysql> select cast (1.115 as DECIMALV3(16, 2));
+---------------------------------+
| cast(1.115 as DECIMALV3(16, 2)) |
+---------------------------------+
|                            1.12 |
+---------------------------------+

mysql> select cast('2024-12-29-20:40:50.123500' as datetime(3));
+-----------------------------------------------------+
| cast('2024-12-29-20:40:50.123500' as DATETIMEV2(3)) |
+-----------------------------------------------------+
| 2024-12-29 20:40:50.124                             |
+-----------------------------------------------------+

mysql> select cast('2024-12-29-20:40:50.123499' as datetime(3));
+-----------------------------------------------------+
| cast('2024-12-29-20:40:50.123499' as DATETIMEV2(3)) |
+-----------------------------------------------------+
| 2024-12-29 20:40:50.123                             |
+-----------------------------------------------------+
```

