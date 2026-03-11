---
{
  "title": "SHOW TRANSACTION",
  "description": "この構文は、指定されたtransaction idまたはlabelのトランザクション詳細を表示するために使用されます。",
  "language": "ja"
}
---
## 説明

この構文は、指定されたtransaction idまたはlabelのトランザクション詳細を表示するために使用されます。

## 構文

```sql
SHOW TRANSACTION
[FROM <db_name>]
WHERE
[id = <transaction_id> | label = <label_name>];
```
## 必須パラメータ

**1. `<transaction_id>`**

詳細を表示する必要があるトランザクションID。

**2. `<label_name>`**

トランザクション詳細を表示する必要があるラベル。

## オプションパラメータ

**1. `<db_name>`**

トランザクション詳細を表示する必要があるデータベース。

## 戻り値

| カラム名            | 説明 |
|---|---|
| TransactionId       | トランザクションID | 
| Label               | インポートタスクに関連付けられたラベル | 
| Coordinator         | トランザクションの調整を担当するノード | 
| TransactionStatus   | トランザクションのステータス | 
| PREPARE             | 準備フェーズ | 
| COMMITTED           | トランザクションは成功したが、データはまだ表示されない | 
| VISIBLE             | トランザクションは成功し、データが表示される  | 
| ABORTED             | トランザクションが失敗した | 
| LoadJobSourceType   | インポートタスクのタイプ | 
| PrepareTime         | トランザクションの開始時刻 | 
| CommitTime          | トランザクションが正常にコミットされた時刻 | 
| FinishTime          | データが表示可能になった時刻 | 
| Reason              | エラーメッセージ | 
| ErrorReplicasCount  | エラーのあるレプリカの数 | 
| ListenerId          | 関連するインポートジョブのID | 
| TimeoutMs           | トランザクションタイムアウト期間（ミリ秒） |

## アクセス制御要件

| 権限 | オブジェクト | 備考 |
|:----------| :----------- | :------------------------ |
| LOAD_PRIV | Database |  |

## 例

1. ID 4005のトランザクションを表示：

   ```sql
   SHOW TRANSACTION WHERE ID=4005;
   ```
2. 指定されたdbで、id 4005のトランザクションを表示します：

   ```sql
   SHOW TRANSACTION FROM db WHERE ID=4005;
   ```
3. ラベルがlabel_nameであるトランザクションを表示する：

   ```sql
   SHOW TRANSACTION WHERE LABEL = 'label_name';
   ```
