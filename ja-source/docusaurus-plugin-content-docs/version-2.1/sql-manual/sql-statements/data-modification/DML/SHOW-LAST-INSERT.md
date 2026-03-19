---
{
  "title": "SHOW LAST INSERT",
  "language": "ja",
  "description": "この構文は、現在のセッション接続における最新のinsert操作の結果を表示するために使用されます"
}
---
## 説明

この構文は、現在のセッション接続での最新のinsert操作の結果を表示するために使用されます

文法:

```sql
SHOW LAST INSERT
```
返される結果の例:

```
     TransactionId: 64067
             Label: insert_ba8f33aea9544866-8ed77e2844d0cc9b
          Database: default_cluster:db1
             Table: t1
TransactionStatus: VISIBLE
        LoadedRows: 2
      FilteredRows: 0
```
説明:

* TransactionId: トランザクション ID
* Label: insert タスクに対応するラベル
* Database: insert に対応するデータベース
* Table: insert に対応するテーブル
* TransactionStatus: トランザクションステータス
   * PREPARE: 準備段階
   * PRECOMMITTED: プリコミット段階
   * COMMITTED: トランザクションは成功したが、データは可視化されていない
   * VISIBLE: トランザクションは成功し、データは可視化されている
   * ABORTED: トランザクション失敗
* LoadedRows: インポートされた行数
* FilteredRows: フィルタリングされている行数

## 例

## キーワード

    SHOW, LASR ,INSERT

## ベストプラクティス
