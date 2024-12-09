---
{
    "title": "BEGIN",
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


## 描述

开启一个显式事务。用户可以指定 Label，如未指定，系统自动生成 Label。

## 语法

```sql
BEGIN [ WITH LABEL <label> ]
```

## 可选参数

`[ WITH LABEL <label> ]`

> 显式指定该事务关联的 Label，如未指定，系统自动生成 [label](../../../data-operate/transaction#不重不丢) 。

## 注意事项

- 如果开启了一个显式事务，没有执行提交或回滚，再次执行 BEGIN 命令不生效

## 示例

使用系统自动生成的 Label 开启显式事务

```sql
mysql> BEGIN;
{'label':'txn_insert_624a0e16ef4c43d4-9814c7fa3e83a705', 'status':'PREPARE', 'txnId':''}
```

指定 Label 开启显式事务

```sql
mysql> BEGIN WITH LABEL load_1;
{'label':'load_1', 'status':'PREPARE', 'txnId':''}
```
