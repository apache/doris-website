---
{
  "title": "SHOW LAST INSERT",
  "description": "この構文は、現在のセッション接続における最新の挿入操作の結果を表示するために使用されます",
  "language": "ja"
}
---
## 説明

この構文は、現在のセッション接続における最新のinsert操作の結果を表示するために使用されます

grammar:

```sql
SHOW LAST INSERT
```
返却される結果の例：

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

* TransactionId: トランザクションID
* Label: insertタスクに対応するラベル
* Database: insertに対応するデータベース
* Table: insertに対応するTable
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
