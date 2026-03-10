---
{
  "title": "BEGIN",
  "language": "ja",
  "description": "ユーザーはLabelを指定できます。指定されない場合、システムが自動的にLabelを生成します。"
}
---
## 説明

ユーザーはLabelを指定できます。指定されない場合、システムが自動的にLabelを生成します。

## 構文

```sql
BEGIN [ WITH LABEL <label> ]
```
## オプションパラメータ

`[ WITH LABEL <label> ]`

> トランザクションに関連付けるLabelを明示的に指定します。指定されない場合、システムが自動的に[label](../../../data-operate/transaction)を生成します。

## 注意事項

- 明示的なトランザクションがcommitまたはrollbackなしで開始された場合、再度BEGINコマンドを実行しても効果がありません。

## 例

システム生成のLabelを使用して明示的なトランザクションを開始する

```sql
mysql> BEGIN;
{'label':'txn_insert_624a0e16ef4c43d4-9814c7fa3e83a705', 'status':'PREPARE', 'txnId':''}
```
指定されたLabelで明示的なトランザクションを開始する

```sql
mysql> BEGIN WITH LABEL load_1;
{'label':'load_1', 'status':'PREPARE', 'txnId':''}
```
