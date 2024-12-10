---
{
    "title": "SHOW-CONFIG",
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

## SHOW-CONFIG

### Name

SHOW CONFIG

### Description

该语句用于展示当前集群的配置

语法：

```sql
SHOW (FRONTEND|BACKEND)  CONFIG [LIKE "pattern"];
```

查看FE配置项的结果中的各列含义如下：

1. Key：        配置项名称
2. Value：      配置项值
3. Type：       配置项类型
4. IsMutable：  是否可以通过 ADMIN SET CONFIG 命令设置
5. MasterOnly： 是否仅适用于 Master FE
6. Comment：    配置项说明

查看BE配置项的结果中的各列含义如下：

1. BackendId：   BE ID
2. Host：        BE的IP地址
3. Key：         配置项名称
4. Value：       配置项值
5. Type：        配置型类型 
6. IsMutable：   是否可以修改

### Example

1. 查看当前FE节点的配置

   ```sql
   SHOW FRONTEND CONFIG;
   ```

2. 使用like谓词搜索当前Fe节点的配置

    ```
    mysql> SHOW FRONTEND CONFIG LIKE '%check_java_version%';
    +--------------------+-------+---------+-----------+------------+---------+
    | Key                | Value | Type    | IsMutable | MasterOnly | Comment |
    +--------------------+-------+---------+-----------+------------+---------+
    | check_java_version | true  | boolean | false     | false      |         |
    +--------------------+-------+---------+-----------+------------+---------+
    1 row in set (0.01 sec)
    ```

3. 查看Be ID为`10001`的BE节点的配置项

    ```sql
    SHOW BACKEND CONFIG FROM 10001;
    ```
4. 使用like谓词查看Be ID为`10001`的配置
    ```
    mysql> SHOW BACKEND CONFIG LIKE "be_port" FROM 10001;
    +-----------+---------------+---------+-------+---------+-----------+
    | BackendId | Host          | Key     | Value | Type    | IsMutable |
    +-----------+---------------+---------+-------+---------+-----------+
    | 10001     | xx.xx.xxx.xxx | be_port | 9060  | int32_t | false     |
    +-----------+---------------+---------+-------+---------+-----------+
    ```
### Keywords

    SHOW, CONFIG

### Best Practice

