---
{
    'title': 'Is your latest data really the latest? check the data update mechanism of your database',
    'description': "This is about how to support both row update and partial column update in a database in a way that is simple in execution and efficient in data quality guarantee.",
    'date': '2023-07-24',
    'author': 'Apache Doris',
    'tags': ['Tech Sharing'],
    "image": '/images/check-the-data-update-mechanism-of-your-database.jpg'
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

In databases, data update is to add, delete, or modify data. Timely data update is an important part of high quality data services.

Technically speaking, there are two types of data updates: you either update a whole row (**Row Update**) or just update part of the columns (**Partial Column Update**). Many databases supports both of them, but in different ways. This post is about one of them, which is simple in execution and efficient in data quality guarantee. 

As an open source analytic database, Apache Doris supports both Row Update and Partial Column Update with one data model: the [**Unique Key Model**](https://doris.apache.org/docs/dev/data-table/data-model#unique-model). It is where you put data that doesn't need to be aggregated. In the Unique Key Model, you can specify one column or the combination of several columns as the Unique Key (a.k.a. Primary Key). For one Unique Key, there will always be one row of data: the newly ingested data record replaces the old. That's how data updates work.

The idea is straightforward, but in real-life implementation, it happens that the latest data does not arrive the last or doesn't even get written at all, so I'm going to show you how Apache Doris implements data update and avoids messups with its Unique Key Model. 

![data-update](/images/Dataupdate_1.png)

## Row Update

For data writing to the Unique Key Model, Apache Doris adopts the **Upsert** semantics, which means **Update or Insert**. If the new data record includes a Unique Key that already exists in the table, the new record will replace the old record; if it includes a brand new Unique Key, the new record will be inserted into the table as a whole. The Upsert operation can provide high throughput and guarantee data reliability.

**Example**:

In the following table, the Unique Key is the combination of three columns: `user_id, date, group_id`.

```SQL
mysql> desc test_table;
+-------------+--------------+------+-------+---------+-------+
| Field       | Type         | Null | Key   | Default | Extra |
+-------------+--------------+------+-------+---------+-------+
| user_id     | BIGINT       | Yes  | true  | NULL    |       |
| date        | DATE         | Yes  | true  | NULL    |       |
| group_id    | BIGINT       | Yes  | true  | NULL    |       |
| modify_date | DATE         | Yes  | false | NULL    | NONE  |
| keyword     | VARCHAR(128) | Yes  | false | NULL    | NONE  |
+-------------+--------------+------+-------+---------+-------+
```

Execute `insert into` to write in a data record. Since the table was empty, by the Upsert semantics, it means to add a new row to the table.

```SQL
mysql> insert into test_table values (1, "2023-04-28", 2, "2023-04-28", "foo");
Query OK, 1 row affected (0.05 sec)
{'label':'insert_2fb45d1833db4348_b612b8791c97b467', 'status':'VISIBLE', 'txnId':'343'}

mysql> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2023-04-28 |        2 | 2023-04-28  | foo     |
+---------+------------+----------+-------------+---------+
```

Then insert two more data records, one of which has the same Unique Key with the previously inserted row. Now, by the Upsert semantics, it means to replace the old row with the new one of the same Unique Key, and insert the record of the new Unique Key.

```SQL
mysql> insert into test_table values (1, "2023-04-28", 2, "2023-04-29", "foo"), (2, "2023-04-29", 2, "2023-04-29", "bar");
Query OK, 2 rows affected (0.04 sec)
{'label':'insert_7dd3954468aa4ac1_a63a3852e3573b4c', 'status':'VISIBLE', 'txnId':'344'}

mysql> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       2 | 2023-04-29 |        2 | 2023-04-29  | bar     |
|       1 | 2023-04-28 |        2 | 2023-04-29  | foo     |
+---------+------------+----------+-------------+---------+
```

## Partial Column Update

Besides row update, under many circumstances, data analysts require the convenience of partial column update. For example, in user portraits, they would like to update certain dimensions of their users in real time. Or, if they need to maintain a flat table that is made of data from various source tables, they will prefer partial columm update than complicated join operations as a way of data update. 

Apache Doris supports partial column update with the UPDATE statement. It filters the rows that need to be modified, read them, changes a few values, and write the rows back to the table. 

**Example**:

Suppose that there is an order table, in which the Order ID is the Unique Key.

```SQL
+----------+--------------+-----------------+
| order_id | order_amount | order_status    |
+----------+--------------+-----------------+
| 1        |          100 | Payment Pending |
+----------+--------------+-----------------+
1 row in set (0.01 sec)
```

When the buyer completes the payment, Apache Doris should change the order status of Order ID 1 from "Payment Pending" to "Delivery Pending". This is when the Update command comes into play.

```SQL
mysql> UPDATE test_order SET order_status = 'Delivery Pending' WHERE order_id = 1;
Query OK, 1 row affected (0.11 sec)
{'label':'update_20ae22daf0354fe0-b5aceeaaddc666c5', 'status':'VISIBLE', 'txnId':'33', 'queryId':'20ae22daf0354fe0-b5aceeaaddc666c5'}
```

This is the table after updating.

```SQL
+----------+--------------+------------------+
| order_id | order_amount | order_status     |
+----------+--------------+------------------+
| 1        |          100 | Delivery Pending |
+----------+--------------+------------------+
1 row in set (0.01 sec)
```

The execution of the Update command consists of three steps in the system:

- Step One: Read the row where Order ID = 1 (1, 100, 'Payment Pending')
- Step Two: Modify the order status from "Payment Pending" to "Delivery Pending" (1, 100, 'Delivery Pending')
- Step Three: Insert the new row into the table

![partial-column-update-1](/images/Dataupdate_2.png)

The table is in the Unique Key Model, which means for rows of the same Unique Key, only the last inserted one will be reserved, so this is what the table will finally look like:

![partial-column-update-2](/images/Dataupdate_3.png)

## Order of Data Updates

So far this sounds simple, but in the actual world, data update might fail due to reasons such as data format errors, and thus mess up the data writing order. The order of data update matters more than you imagine. For example, in financial transactions, messed-up data writing order might lead to transaction data losses, errors, or duplication, which further leads to bigger problems.

Apache Doris provides two options for users to guarantee that their data is updated in the correct order:

**1. Update by the order of transaction commit** 

In Apache Doris, each data ingestion task is a transaction. Each successfully ingested task will be given a data version and the number of data versions is strictly increasing. If the ingestion fails, the transaction will be rolled back, and no new data version will be generated.

 By default, the Upsert semantics follows the order of the transaction commits. If there are two data ingestion tasks involving the same Unique Key, the first task generating data version 2 and the second, data version 3, then according to transaction commit order, data version 3 will replace data version 2.

**2. Update by the user-defined order**

In real-time data analytics, data updates often happen in high concurrency. It is possible that there are multiple data ingestion tasks updating the same row, but these tasks are committed in unknown order, so the last saved update remains unknown, too.

For example, these are two data updates, with "2023-04-30" and "2023-05-01" as the `modify_data`, respectively. If they are written into the system concurrently, but the "2023-05-01" one is successully committed first and the other later, then the "2023-04-30" record will be saved due to its higher data version number, but we know it is not the latest one.

```Plain
mysql> insert into test_table values (2, "2023-04-29", 2, "2023-05-01", "bbb");
Query OK, 1 row affected (0.04 sec)
{'label':'insert_e2daf8cea5524ee1_94e5c87e7bb74d67', 'status':'VISIBLE', 'txnId':'345'}

mysql> insert into test_table values (2, "2023-04-29", 2, "2023-04-30", "aaa");
Query OK, 1 row affected (0.03 sec)
{'label':'insert_ef906f685a7049d0_b135b6cfee49fb98', 'status':'VISIBLE', 'txnId':'346'}

mysql> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       2 | 2023-04-29 |        2 | 2023-04-30 | aaa     |
|       1 | 2023-04-28 |        2 | 2023-04-29  | foo     |
+---------+------------+----------+-------------+---------+
```

That's why in high-concurrency scenarios, Apache Doris allows data update in user-defined order. Users can designate a column to the Sequence Column. In this way, the system will identity save the latest data version based on value in the Sequence Column.

**Example:**

You can designate a Sequence Column by specifying the `function_column.sequence_col` property upon table creation.

```SQL
CREATE TABLE test.test_table
(
    user_id bigint,
    date date,
    group_id bigint,
    modify_date date,
    keyword VARCHAR(128)
)
UNIQUE KEY(user_id, date, group_id)
DISTRIBUTED BY HASH (user_id) BUCKETS 32
PROPERTIES(
    "function_column.sequence_col" = 'modify_date',
    "replication_num" = "1",
    "in_memory" = "false"
);
```

Then check and see, the data record with the highest value in the Sequence Column will be saved:

```SQL
mysql> insert into test_table values (2, "2023-04-29", 2, "2023-05-01", "bbb");
Query OK, 1 row affected (0.03 sec)
{'label':'insert_3aac37ae95bc4b5d_b3839b49a4d1ad6f', 'status':'VISIBLE', 'txnId':'349'}

mysql> insert into test_table values (2, "2023-04-29", 2, "2023-04-30", "aaa");
Query OK, 1 row affected (0.03 sec)
{'label':'insert_419d4008768d45f3_a6912e584cf1b500', 'status':'VISIBLE', 'txnId':'350'}

mysql> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       2 | 2023-04-29 |        2 | 2023-05-01  | bbb     |
|       1 | 2023-04-28 |        2 | 2023-04-29  | foo     |
+---------+------------+----------+-------------+---------+
```

## Conclusion

Congratulations. Now you've gained an overview of how data updates are implemented in Apache Doris. With this knowledge, you can basically guarantee efficiency and accuracy of data updating. But wait, there is so much more about that. As Apache Doris 2.0 is going to provide more powerful Partial Column Update capabilities, with improved execution of the Update statement and the support for more complicated multi-table Join queries, I will show you how to take advantage of them in details in my follow-up writings. [We](https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw) are constantly updating our data updates!

