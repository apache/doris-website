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

詳細を確認する必要があるトランザクションID。

**2. `<label_name>`**

トランザクション詳細を確認する必要があるラベル。

## オプションパラメータ

**1. `<db_name>`**

トランザクション詳細を確認する必要があるデータベース。

## 戻り値

| カラム名         | 説明 |
|---|---|
| TransactionId       | トランザクションID | 
| Label               | インポートタスクに関連付けられたラベル | 
| Coordinator         | トランザクションの調整を担当するノード | 
| TransactionStatus   | トランザクションのステータス | 
| PREPARE             | 準備フェーズ | 
| COMMITTED           | トランザクションは成功したが、データはまだ可視ではない | 
| VISIBLE             | トランザクションは成功し、データは可視である  | 
| ABORTED             | トランザクションは失敗した | 
| LoadJobSourceType   | インポートタスクのタイプ | 
| PrepareTime         | トランザクションの開始時刻 | 
| CommitTime          | トランザクションが正常にコミットされた時刻 | 
| FinishTime          | データが可視になった時刻 | 
| Reason              | エラーメッセージ | 
| ErrorReplicasCount  | エラーのあるレプリカ数 | 
| ListenerId          | 関連するインポートジョブのID | 
| TimeoutMs           | トランザクションタイムアウト時間（ミリ秒） |

## アクセス制御要件

| 権限 | オブジェクト | 備考 |
|:----------| :----------- | :------------------------ |
| LOAD_PRIV | Database |  |

## 例

1. ID 4005のトランザクションを確認する:

   ```sql
   SHOW TRANSACTION WHERE ID=4005;
   ```
2. 指定されたdbで、id 4005のトランザクションを表示します：

   ```sql
   SHOW TRANSACTION FROM db WHERE ID=4005;
   ```
3. label_nameというラベルが付いたトランザクションを表示する：

   ```sql
   SHOW TRANSACTION WHERE LABEL = 'label_name';
   ```
