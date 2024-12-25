---
{
"title": "Kill Query",
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

## 获取查询列表

    语法：
    ```sql
    SHOW PROCESSLIST;
    ```
    可以显示当前FE 所有的连接，以及每个连接上正在运行的Query 的列表，例如：

    ```sql
    SHOW PROCESSLIST;
    +------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
    | CurrentConnected | Id   | User | Host               | LoginTime           | Catalog  | Db      | Command | Time | State | QueryId                           | Info                                                                                  |
    +------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
    | Yes              |   48 | root | 10.16.xx.xx:44834   | 2023-12-29 16:49:47 | internal | test | Query   |    0 | OK    | e6e4ce9567b04859-8eeab8d6b5513e38 | SHOW PROCESSLIST                                                                      |
    |                  |   50 | root | 192.168.xx.xx:52837 | 2023-12-29 16:51:34 | internal |      | Sleep   | 1837 | EOF   | deaf13c52b3b4a3b-b25e8254b50ff8cb | SELECT @@session.transaction_isolation                                                |
    |                  |   51 | root | 192.168.xx.xx:52843 | 2023-12-29 16:51:35 | internal |      | Sleep   |  907 | EOF   | 437f219addc0404f-9befe7f6acf9a700 | /* ApplicationName=DBeaver Ultimate 23.1.3 - Metadata */ SHOW STATUS                  |
    |                  |   55 | root | 192.168.xx.xx:55533 | 2023-12-29 17:09:32 | internal | test | Sleep   |  271 | EOF   | f02603dc163a4da3-beebbb5d1ced760c | /* ApplicationName=DBeaver Ultimate 23.1.3 - SQLEditor <Console> */ SELECT DATABASE() |
    |                  |   47 | root | 10.16.xx.xx:35678   | 2023-12-29 16:21:56 | internal | test | Sleep   | 3528 | EOF   | f4944c543dc34a99-b0d0f3986c8f1c98 | select * from test                                                                    |
    +------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
    5 rows in set (0.00 sec)
    ```


- Id 是连接的唯一标识，也可以称为processlist_id；
- QueryId 是Query的唯一标识。  



## Kill 查询

    语法：

    ```sql
    KILL QUERY query_id | processlist_id
    ```
    用于Kill 某一个指定的Query，或者某一个连接上正在运行的Query，例如：

    ```sql
    kill query 55;
    Query OK, 0 rows affected (0.01 sec)
    ```
    表示Kill 连接Id=55 上正在运行的Query，但是连接仍然有效。
    
    ```sql
    kill query 'f02603dc163a4da3-beebbb5d1ced760c';
    Query OK, 0 rows affected (0.01 sec)
    ```
    表示Kill QueryId=f02603dc163a4da3-beebbb5d1ced760c 的Query，与之前的processlist_id=55 实际是同一个Query。

## Kill 连接

    语法：

    ```sql
    KILL CONNECTION processlist_id
    ```
    表示断开processlist_id标识的客户端与FE 之间的连接，正在执行的Query也会被Cancel。