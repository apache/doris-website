---
{
    'title': "From Presto, Trino, ClickHouse, and Hive to Apache Doris: SQL convertor for easy migration",
    'description': "Users can execute queries with their old SQL syntaxes directly in Doris or batch convert their existing SQL statements on the visual SQL conversion interface.",
    'date': '2024-05-06',
    'author': 'Apache Doris',
    'tags': ['Tech Sharing'],
    "image": '/images/sql-convertor-feature.jpeg'
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

[Apache Doris](https://doris.apache.org/) is an all-in-one data platform that is capable of real-time reporting, ad-hoc queries, data lakehousing, log management and analysis, and batch data processing. As more and more companies have been replacing their component-heavy data architecture with Apache Doris, there is an increasing need for a more convenient data migration solution. **That's why the Doris SQL Convertor is made.**

Most database systems run their own SQL dialects. Thus, migration between systems often entails modifications of SQL syntaxes. Since SQLs work closely with a company's business logic, in many cases, users have to modify their business logic, too. To reduce the transition pain for users, Apache Doris 2.1 provides the Doris SQL Convertor. It supports the SQL syntaxes of Presto, Trino, Hive, ClickHouse, and PostgreSQL. With it, users can execute queries with their old SQL syntaxes directly in Doris or batch convert their existing SQL statements on the visual interface.

## Doris SQL Convertor

The Doris SQL Convertor requires **zero rewriting** of SQL. Simply `set sql_dialect = "trino"` in the session variable, then you can execute queries in Doris using Trino SQLs. 

The SQL compatibility of it has been proven by extensive tests. For example, a user tested the Doris SQL Convertor with over 30,000 SQL queries from their production environment. Turned out that the Convertor successfully converted 99.6% of the Trino SQLs and 98% of the ClickHouse SQLs.

Currently, Presto, Trino, Hive, ClickHouse, and PostgreSQL dialects are supported. We are working to add Teradata, SQL Server, and Snowflake to the list, and consistently increase the compatibility level of each SQL dialect.

## Installation & usage

### SQL conversion service

1. **Download** **[Doris SQL Convertor](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/doris-sql-convertor/doris-sql-convertor-1.0.3-bin-x86.tar.gz)**

2. On any frontend (FE) node, start the service using the following command.

- The SQL conversion service is stateless and can be started or stopped at any time.

- `port=5001` in the command specifies the service port. (You can use any available port.)

- It is advisable to start a service individually for each FE node.

```Shell
nohup ./doris-sql-convertor-1.0.1-bin-x86 run --host=0.0.0.0 --port=5001 &
```

3. Start a Doris cluster **(Use Doris 2.1.0 or newer)**.

4. Set the URL for SQL conversion service in Doris. `127.0.0.1:5001` in the command represents the IP and port number of the node where the service is deployed.

```Shell
MySQL> set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert"
```

After deployment, you can execute SQL directly in the command line. You can start the service by `set sql_dialect = XXX`. The following examples are based on ClickHouse SQL dialects.

- Presto

```sql
mysql> set sql_dialect=presto;                                                                                                                                                                                                             
Query OK, 0 rows affected (0.00 sec) 

mysql> SELECT cast(start_time as varchar(20)) as col1,                                                                                                                                                                                     
            array_distinct(arr_int) as col2,                                                                                                                                                                                             
            FILTER(arr_str, x -> x LIKE '%World%') as col3,                                                                                                                                                                              
            to_date(value,'%Y-%m-%d') as col4,                                                                                                                                                                                           
            YEAR(start_time) as col5,                                                                                                                                                                                                    
            date_add('month', 1, start_time) as col6,                                                                                                                                                                                    
            REGEXP_EXTRACT_ALL(value, '-.') as col7,                                                                                                                                                                                     
            JSON_EXTRACT('{"id": "33"}', '$.id')as col8,                                                                                                                                                                                 
            element_at(arr_int, 1) as col9,                                                                                                                                                                                              
            date_trunc('day',start_time) as col10                                                                                                                                                                                        
         FROM test_sqlconvert                                                                                                                                                                                                            
         where date_trunc('day',start_time)= DATE'2024-05-20'                                                                                                                                                                            
     order by id;                                                                                                                                                                                                                        
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+                                                                                                
| col1                | col2      | col3      | col4       | col5 | col6                | col7        | col8 | col9 | col10               |                                                                                                
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+                                                                                                
| 2024-05-20 13:14:52 | [1, 2, 3] | ["World"] | 2024-01-14 | 2024 | 2024-06-20 13:14:52 | ['-0','-1'] | "33" |    1 | 2024-05-20 00:00:00 |                                                                                                
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+                                                                                                
1 row in set (0.03 sec)    
```

- ClickHouse

```sql
mysql> set sql_dialect=clickhouse;                                                                                                                                             
Query OK, 0 rows affected (0.00 sec)                                                                                                                                           
                                                                                                                                                                               
mysql> select  toString(start_time) as col1,                                                                                                                                   
             arrayCompact(arr_int) as col2,                                                                                                                                  
             arrayFilter(x -> x like '%World%',arr_str)as col3,                                                                                                              
             toDate(value) as col4,                                                                                                                                          
             toYear(start_time)as col5,                                                                                                                                      
             addMonths(start_time, 1)as col6,                                                                                                                                
             extractAll(value, '-.')as col7,                                                                                                                                 
             JSONExtractString('{"id": "33"}' , 'id')as col8,                                                                                                                
             arrayElement(arr_int, 1) as col9,                                                                                                                               
             date_trunc('day',start_time) as col10                                                                                                                           
          FROM test_sqlconvert                                                                                                                                               
          where date_trunc('day',start_time)= '2024-05-20 00:00:00'                                                                                                          
     order by id;                                                                                                                                                   
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+                                    
| col1                | col2      | col3      | col4       | col5 | col6                | col7        | col8 | col9 | col10               |                                    
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+                                    
| 2024-05-20 13:14:52 | [1, 2, 3] | ["World"] | 2024-01-14 | 2024 | 2024-06-20 13:14:52 | ['-0','-1'] | "33" |    1 | 2024-05-20 00:00:00 |                                    
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+                                    
1 row in set (0.02 sec)
```

### Visual interface

For large-scale conversion, it is recommended to use the visual interface, on which you can batch upload the files for dialect conversion.

Follow these steps to deploy the visual conversion interface:

1. Environment: Docker, Docker-Compose

2. Get Doris-SQL-Convertor Docker image

3. Create a network for the image

```shell
docker network create app_network
```

4. Decompress the package

```shell
tar xzvf doris-sql-convertor-1.0.1.tar.gz

cd doris-sql-convertor
```

5. Edit the environment variables
   
```shell
FLASK_APP=server/app.py
FLASK_DEBUG=1
API_HOST=http://doris-sql-convertor-api:5000

# DOCKER TAG
API_TAG=latest
WEB_TAG=latest
```

6. Start it up

```shell
sh start.sh
```

After deployment, you can access the service by `ip:8080` via your local browser. `8080` is the default port. You can change the mapping port. On the visual interface, you can select the source dialect type and target dialect type, and then click "Convert".

:::info Note
1. For batch conversion, each SQL statement should end with `; `.

2. The Doris SQL Convertor supports 239 UNION ALL conversions at most.
:::

Join the [Apache Doris community](https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw) to seek guidance from the Doris makers or provide your feedback!







