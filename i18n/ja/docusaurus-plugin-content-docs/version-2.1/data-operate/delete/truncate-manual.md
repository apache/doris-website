---
{
  "title": "TRUNCATE コマンドによるデータ削除",
  "language": "ja",
  "description": "指定されたテーブルとそのパーティションからデータをクリアするには、このステートメントを使用してください。"
}
---
# Truncate

指定されたテーブルとそのパーティションからデータを削除するには、このステートメントを使用します。

## Syntax

```sql
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)];
```
- この文は、データをクリアしますが、テーブルまたはパーティション構造は保持します。

- DELETEとは異なり、TRUNCATEはメタデータ操作のみを実行するため、より高速で、クエリパフォーマンスに影響しません。

- この操作によって削除されたデータは復旧できません。

- テーブルの状態はNORMALである必要があり、進行中のSCHEMA CHANGE操作がないことが条件です。

- このコマンドは、進行中のインポートタスクを失敗させる可能性があります。

## 例

**1. `example_db`データベースの`tbl`テーブルをクリアする**

```sql
TRUNCATE TABLE example_db.tbl;
```
**2. テーブル `tbl` の `p1` および `p2` パーティションをクリアする**

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```
