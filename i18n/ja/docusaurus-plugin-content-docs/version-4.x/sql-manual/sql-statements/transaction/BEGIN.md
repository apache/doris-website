---
{
    "title": "BEGIN",
    "language": "ja",
    "description": "ユーザーはラベルを指定できます。指定しない場合、システムがラベルを自動生成します。"
}
---

## 説明

ユーザーはラベルを指定できます。指定しない場合、システムがラベルを自動生成します。

## 構文

```sql
BEGIN [ WITH LABEL <label> ]
```

## オプションパラメータ

`[ WITH LABEL <label> ]`

> トランザクションに関連付けるラベルを明示的に指定します。指定しない場合、システムが[ラベル](../../../data-operate/transaction)を自動生成します。

## 注意事項

- 明示的なトランザクションを開始した後、コミットもロールバックもしていない状態で BEGIN コマンドを再度実行しても、効果はありません。

## 例

システムが生成したラベルを使用して、明示的なトランザクションを開始する

```sql
mysql> BEGIN;
{'label':'txn_insert_624a0e16ef4c43d4-9814c7fa3e83a705', 'status':'PREPARE', 'txnId':''}
```

指定したラベルを使用して、明示的なトランザクションを開始する

```sql
mysql> BEGIN WITH LABEL load_1;
{'label':'load_1', 'status':'PREPARE', 'txnId':''}
```
