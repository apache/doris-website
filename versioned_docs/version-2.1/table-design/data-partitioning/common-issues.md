---
{
    "title": "Common Issues",
    "language": "en"
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


1. Incomplete syntax error prompts may occur in longer table creation statements. Here are some possible syntax errors for manual troubleshooting:

   - Syntax structure errors. Please carefully read [HELP CREATE TABLE](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE)  and check the relevant syntax structure.
   - Reserved words. When user-defined names encounter reserved words, they need to be enclosed in backticks ``. It is recommended to use this symbol for all custom names.
   - Chinese characters or full-width characters. Non-UTF8 encoded Chinese characters or hidden full-width characters (spaces, punctuation, etc.) can cause syntax errors. It is recommended to use a text editor that displays invisible characters for inspection.

2. Failed to create partition [xxx]. Timeout

   Doris creates tables sequentially based on partition granularity. When a partition fails to create, this error may occur. Even if partitions are not used, when there is a problem with table creation, `Failed to create partition` may still be reported because, as mentioned earlier, Doris creates an unmodifiable default partition for tables without specified partitions.

   When encountering this error, it is usually because the BE encountered a problem when creating data tablets. You can troubleshoot by following these steps:

   - In the fe.log, search for the `Failed to create partition` log entry at the corresponding timestamp. In this log entry, you may find a series of number pairs similar to `{10001-10010}`. The first number in the pair represents the Backend ID, and the second number represents the Tablet ID. For example, this number pair indicates that the creation of Tablet ID 10010 on Backend ID 10001 failed.  
   - Go to the be.INFO log of the corresponding Backend and search for Tablet ID-related logs within the corresponding time period to find error messages.  
   - Here are some common tablet creation failure errors, including but not limited to:  
     - The BE did not receive the relevant task. In this case, you cannot find Tablet ID-related logs in be.INFO or the BE reports success but actually fails. For these issues, please refer to the [Installation and Deployment](../../install/cluster-deployment/standard-deployment) section to check the connectivity between FE and BE.  
     - Pre-allocated memory failure. This may be because the byte length of a row in the table exceeds 100KB.  
     - `Too many open files`. The number of open file handles exceeds the Linux system limit. You need to modify the handle limit of the Linux system.  

* If there is a timeout when creating data tablets, you can also extend the timeout by setting `tablet_create_timeout_second=xxx` and `max_create_table_timeout_second=xxx` in the fe.conf file. By default, `tablet_create_timeout_second` is set to 1 second, and `max_create_table_timeout_second` is set to 60 seconds. The overall timeout is calculated as `min(tablet_create_timeout_second * replication_num, max_create_table_timeout_second)`. For specific parameter settings, please refer to the [FE Configuration](../../admin-manual/config/fe-config) section.

3. The table creation command does not return results for a long time.

* Doris's table creation command is a synchronous command. The timeout for this command is currently set simply as (tablet num * replication num) seconds. If many data tablets are created and some of them fail to create, it may result in a long wait before returning an error.  
* Under normal circumstances, the table creation statement should return within a few seconds or tens of seconds. If it exceeds one minute, it is recommended to cancel the operation directly and check the relevant errors in the FE or BE logs.

## More Help

For more detailed information on data partitioning, you can refer to the [CREATE TABLE](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE) command manual or enter `HELP CREATE TABLE;` in the MySQL client to get more help information.
