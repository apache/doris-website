---
{
    "title": "UPDATE Command to Update Data in Unique Model",
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

The main topic is how to use the UPDATE command to update data in Doris. The UPDATE command can only be executed on tables in the Unique data model.

## Use Cases

- Modify the values of rows that meet certain conditions.

- Suitable for updating a small amount of data that is not frequently updated.

## Basic Principles

By utilizing the filtering logic of the query engine's WHERE clause, the UPDATE command selects the rows that need to be updated from the target table. Then, using the built-in logic of the Value column in the Unique model, the old data is replaced with the new data, and the updated rows are reinserted into the table, thus achieving row-level updates.

### Synchronization

The UPDATE syntax in Doris is synchronous, meaning that when an UPDATE statement is executed successfully, the update operation is completed, and the data is immediately visible.

### Performance

The performance of the UPDATE statement depends on the number of rows to be updated and the efficiency of the condition retrieval.

- Number of rows to be updated: The more rows that need to be updated, the slower the UPDATE statement will be. The UPDATE command is suitable for scenarios where occasional updates are required, such as modifying values for individual rows. It is not suitable for bulk data modifications.

- Efficiency of condition retrieval: The UPDATE operation reads the rows that satisfy the condition first. Therefore, if the condition retrieval is efficient, the UPDATE operation will be faster. It is recommended to have the condition column indexed or utilize partitioning and bucketing pruning to quickly locate the rows to be updated, thus improving the update efficiency. It is strongly advised not to include the value column in the condition column.

## Example

Suppose there is an order table in Doris, where the order_id is the key column, and the order status and order amount are the Value columns. The data looks as follows:

| order_id | order_amount | order_status |
| -------- | ------------ | ------------ |
| 1        | 100          | Pending      |

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        | 100          | Pending      |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

Now, when a user clicks on the payment, the Doris system needs to update the order status of the order with ID '1' to 'To be shipped'. This requires using the UPDATE functionality.

```sql
mysql> UPDATE test_order SET order_status = 'To be shipped' WHERE order_id = 1;
Query OK, 1 row affected (0.11 sec)
{'label':'update_20ae22daf0354fe0-b5aceeaaddc666c5', 'status':'VISIBLE', 'txnId':'33', 'queryId':'20ae22daf0354fe0-b5aceeaaddc666c5'}
```

The updated result is as follows:

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        | 100          | To be shipped|
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

## More Details

For more detailed syntax on data updates, please refer to the [UPDATE](../../sql-manual/sql-reference/Data-Manipulation-Statements/Manipulation/UPDATE) command manual. You can also enter `HELP UPDATE` in the MySQL client command line for more information and assistance.