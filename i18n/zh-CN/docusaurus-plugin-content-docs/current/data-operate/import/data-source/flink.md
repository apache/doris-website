---
{
    "title": "Flink",
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

使用 Flink Doris Connector 可以实时的将 Flink 产生的数据（如：Flink 读取 Kafka，MySQL 中的数据）导入到 Doris 中。

## 使用限制

需要依赖用户部署的 Flink 集群。

## 使用 Flink 导入数据

使用 Flink 导入数据，详细步骤可以参考 [Flink-Doris-Connector](../../../ecosystem/flink-doris-connector)。在以下步骤中，演示如何通过 Flink 快速导入数据。

### 第 1 步：创建表

```sql
CREATE TABLE `students` (
  `id` INT NULL, 
  `name` VARCHAR(256) NULL,
  `age` INT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)      
COMMENT 'OLAP' 
DISTRIBUTED BY HASH(`id`) BUCKETS 1  
PROPERTIES (                                                         
"replication_allocation" = "tag.location.default: 1"
); 
```

### 第 2 步：使用 Flink 导入数据

运行 bin/sql-client.sh 打开 FlinkSQL 的控制台

```sql
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    ) 
    WITH (
      'connector' = 'doris',
      'fenodes' = '10.16.10.6:28737',
      'table.identifier' = 'test.students',
      'username' = 'root',
      'password' = '',
      'sink.label-prefix' = 'doris_label'
);

INSERT INTO student_sink values(1,'zhangsan',123)
```

### 第 3 步：检查导入数据

```sql
mysql> select * from test.students;                                                                                                                        
+------+----------+------+      
| id   | name     | age  |    
+------+----------+------+                                                                                                                             
|  1   | zhangsan |  123 |   
+------+----------+------+    
1 rows in set (0.05 sec)  
```