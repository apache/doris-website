---
{
    "title": "SHOW EXPORT",
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

该语句用于展示指定的导出任务的执行情况

语法：

```sql
SHOW EXPORT
[FROM db_name]
  [
    WHERE
      [ID = your_job_id]
      [STATE = ["PENDING"|"EXPORTING"|"FINISHED"|"CANCELLED"]]
      [LABEL = your_label]
   ]
[ORDER BY ...]
[LIMIT limit];
```
说明：
      1. 如果不指定 db_name，使用当前默认 db
      2. 如果指定了 STATE，则匹配 EXPORT 状态
      3. 可以使用 ORDER BY 对任意列组合进行排序
      4. 如果指定了 LIMIT，则显示 limit 条匹配记录。否则全部显示

`show export` 命令返回的结果各个列的含义如下：

* JobId：作业的唯一 ID
* Label：该导出作业的标签，如果 Export 没有指定，则系统会默认生成一个。
* State：作业状态：
  * PENDING：作业待调度
  * EXPORTING：数据导出中
  * FINISHED：作业成功
  * CANCELLED：作业失败
* Progress：作业进度。该进度以查询计划为单位。假设一共 10 个线程，当前已完成 3 个，则进度为 30%。
* TaskInfo：以 Json 格式展示的作业信息：
  * db：数据库名
  * tbl：表名
  * partitions：指定导出的分区。`空`列表 表示所有分区。
  * column\_separator：导出文件的列分隔符。
  * line\_delimiter：导出文件的行分隔符。
  * tablet num：涉及的总 Tablet 数量。
  * broker：使用的 broker 的名称。
  * coord num：查询计划的个数。
  * max\_file\_size：一个导出文件的最大大小。
  * delete\_existing\_files：是否删除导出目录下已存在的文件及目录。
  * columns：指定需要导出的列名，空值代表导出所有列。
  * format：导出的文件格式
* Path：远端存储上的导出路径。
* CreateTime/StartTime/FinishTime：作业的创建时间、开始调度时间和结束时间。
* Timeout：作业超时时间。单位是秒。该时间从 CreateTime 开始计算。
* ErrorMsg：如果作业出现错误，这里会显示错误原因。
* OutfileInfo：如果作业导出成功，这里会显示具体的`SELECT INTO OUTFILE`结果信息。

## 示例

1. 展示默认 db 的所有导出任务
   
    ```sql
    SHOW EXPORT;
    ```
    
2. 展示指定 db 的导出任务，按 StartTime 降序排序
   
    ```sql
     SHOW EXPORT FROM example_db ORDER BY StartTime DESC;
    ```
    
3. 展示指定 db 的导出任务，state 为 "exporting", 并按 StartTime 降序排序
   
    ```sql
    SHOW EXPORT FROM example_db WHERE STATE = "exporting" ORDER BY StartTime DESC;
    ```
    
4. 展示指定 db，指定 job_id 的导出任务
   
    ```sql
      SHOW EXPORT FROM example_db WHERE ID = job_id;
    ```
    
5. 展示指定 db，指定 label 的导出任务
   
    ```sql
     SHOW EXPORT FROM example_db WHERE LABEL = "mylabel";
    ```

## 关键词

    SHOW, EXPORT

### 最佳实践

