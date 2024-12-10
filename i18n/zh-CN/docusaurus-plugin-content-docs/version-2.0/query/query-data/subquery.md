---
{
    "title": "子查询",
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


子查询是一种嵌套在其他 `SELECT` 语句中的 `SELECT` 语句。嵌套子查询通常称为查询内语句，而包含查询通常称为查询语句或外查询块。子查询返回外查询用作条件的数据，以确定需要检索哪些数据。您可以创建的嵌套子查询的数量没有限制。

与任何查询一样，子查询返回（单列单记录、单列多记录或多列多记录）表中的记录。

## Where 子句中的子查询举例

```Plain
SELECT * FROM sub_query_correlated_subquery1 WHERE k1 > (SELECT AVG(k1) FROM sub_query_correlated_subquery3) OR k1 < 10 order by k1, k2;
select * from sub_query_correlated_subquery1 where sub_query_correlated_subquery1.k1 not in (select sub_query_correlated_subquery3.k3 from sub_query_correlated_subquery3 where sub_query_correlated_subquery3.v2 = sub_query_correlated_subquery1.k2) or k1 < 10 order by k1, k2
```

##  Join 子句中的子查询举例

```Plaintext
select t1.* from t1 left join t2 on t1.k2 = t2.k3 and t1.k1 in ( select t3.k1 from t3 where t1.k2 = t3.k2 ) or t1.k1 < 10 order by t1.k1, t1.k2;
select t1.* from t1 left join t2 on t1.k2 = t2.k3 and exists ( select t3.k1 from t3 where t1.k2 = t3.k2 ) or t1.k1 < 10 order by t1.k1, t1.k2;
```