---
{
    "title": "SHOW-TRANSACTION",
    "language": "en"
}
---

## SHOW-TRANSACTION

### Name

SHOW TRANSACTION

### Description

This syntax is used to view transaction details for the specified transaction id or label.

grammar:

```sql
SHOW TRANSACTION
[FROM db_name]
WHERE
[id=transaction_id]
[label = label_name];
```

Example of returned result:

```
     TransactionId: 4005
             Label: insert_8d807d5d-bcdd-46eb-be6d-3fa87aa4952d
       Coordinator: FE: 10.74.167.16
 TransactionStatus: VISIBLE
 LoadJobSourceType: INSERT_STREAMING
       PrepareTime: 2020-01-09 14:59:07
        CommitTime: 2020-01-09 14:59:09
        FinishTime: 2020-01-09 14:59:09
            Reason:
ErrorReplicasCount: 0
        ListenerId: -1
         TimeoutMs: 300000
```

* TransactionId: transaction id
* Label: the label corresponding to the import task
* Coordinator: The node responsible for transaction coordination
* TransactionStatus: transaction status
  * PREPARE: preparation stage
  * COMMITTED: The transaction succeeded, but the data was not visible
  * VISIBLE: The transaction succeeded and the data is visible
  * ABORTED: Transaction failed
* LoadJobSourceType: Type of import job.
* PrepareTime: transaction start time
* CommitTime: The time when the transaction was successfully committed
* FinishTime: The time when the data is visible
* Reason: error message
* ErrorReplicasCount: The number of replicas with errors
* ListenerId: The id of the related import job
* TimeoutMs: Transaction timeout, in milliseconds

### Example

1. View the transaction with id 4005:

   ```sql
   SHOW TRANSACTION WHERE ID=4005;
   ```

2. In the specified db, view the transaction with id 4005:

   ```sql
   SHOW TRANSACTION FROM db WHERE ID=4005;
   ```

3. View the transaction whose label is label_name:

   ```sql
   SHOW TRANSACTION WHERE LABEL = 'label_name';
   ```

### Keywords

    SHOW, TRANSACTION

### Best Practice

