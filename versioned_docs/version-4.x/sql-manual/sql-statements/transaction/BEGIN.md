---
{
    "title": "BEGIN",
    "language": "en",
    "description": "Users can specify a Label. If not specified, the system will generate a Label automatically."
}
---

## Description

Users can specify a Label. If not specified, the system will generate a Label automatically.

## Syntax

```sql
BEGIN [ WITH LABEL <label> ]
```

## Optional Parameter

`[ WITH LABEL <label> ]`

> Explicitly specify the Label associated with the transaction. If not specified, the system will generate a [label](../../../data-operate/transaction) automatically.

## Notes

- If an explicit transaction is started without a commit or rollback, executing the BEGIN command again will not take effect.

## Examples

Start an explicit transaction using a system-generated Label

```sql
mysql> BEGIN;
{'label':'txn_insert_624a0e16ef4c43d4-9814c7fa3e83a705', 'status':'PREPARE', 'txnId':''}
```

Start an explicit transaction with a specified Label

```sql
mysql> BEGIN WITH LABEL load_1;
{'label':'load_1', 'status':'PREPARE', 'txnId':''}
```
