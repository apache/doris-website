---
{
    "title": "Unique update",
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

The Update command is used to update data in Doris. It can only be executed on tables that follow the Unique data model.

## Use cases

- Modifying the values of rows that meet certain conditions.

- This is suitable for updating a small amount of data that is not frequently updated.

## Principles

The Update command uses the filtering logic of the query engine's WHERE clause to select the rows that need to be updated from the target table. It then uses the inherent value column of the Unique data model to replace the old data with the new data. After modifying the selected rows, they are reinserted into the table, thereby achieving row-level updates.

### Synchronization

The Update syntax in Doris is synchronous. This means that once the Update statement is successfully executed, the update operation is completed, and the data is immediately visible.

### Performance

The performance of the Update statement depends on the number of rows to be updated and the efficiency of the condition used for retrieval.

- Number of rows to be updated: The more rows that need to be updated, the slower the Update statement will be. Update is suitable for scenarios where only a few rows need to be modified, such as updating the values of individual rows. It is not recommended for bulk data modification.

- Efficiency of the condition: The Update operation first reads the rows that satisfy the given condition. Therefore, if the condition can be efficiently retrieved, the update speed will be faster. It is recommended to have the condition column hit an index or perform partition and bucket pruning. This helps Doris to quickly locate the rows to be updated and improves update efficiency. It is strongly discouraged to have the condition column dependent on the value column.

## Examples

Assuming there is an order table in Doris, where the order ID is the key column and the order status and order amount are the value columns. 

Here is an example of the data:

| Order ID | Order Amount | Order Status |
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

Now, when a user clicks on the "Pay" button, the Doris system needs to update the order status of order ID '1' to 'To be shipped'. This requires the use of the Update functionality.

```sql
mysql> UPDATE test_order SET order_status = 'To be shipped' WHERE order_id = 1;
Query OK, 1 row affected (0.11 sec)
{'label':'update_20ae22daf0354fe0-b5aceeaaddc666c5', 'status':'VISIBLE', 'txnId':'33', 'queryId':'20ae22daf0354fe0-b5aceeaaddc666c5'}
```

After the update, the result will be as follows:

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        | 100          | To be shipped|
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

## More details

For more detailed syntax and usage information on data updates, please refer to the [Update](../../sql-manual/sql-reference/Data-Manipulation-Statements/Manipulation/UPDATE) command manual. You can also enter `HELP UPDATE` in the MySQL client command-line interface to get more help information.