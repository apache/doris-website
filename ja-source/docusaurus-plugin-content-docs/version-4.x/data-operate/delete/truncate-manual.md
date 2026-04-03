---
{
  "title": "TRUNCATE コマンドでデータを削除する",
  "description": "指定されたtableとそのパーティションからデータをクリアするには、このステートメントを使用します。",
  "language": "ja"
}
---
# Truncate

指定されたtableとそのパーティションからデータをクリアするために、このステートメントを使用します。

## Syntax

```sql
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)];
```
- このステートメントはデータをクリアしますが、Tableまたはパーティション構造は保持します。

- DELETEとは異なり、TRUNCATEはメタデータ操作のみを実行するため、高速でクエリパフォーマンスに影響しません。

- この操作によって削除されたデータは復旧できません。

- TableのステータスはNORMALである必要があり、進行中のSCHEMA CHANGE操作がないことが必要です。

- このコマンドは進行中のインポートタスクを失敗させる可能性があります。

## Examples

**1. `example_db`データベースの`tbl`Tableをクリアする**

```sql
TRUNCATE TABLE example_db.tbl;
```
**2. Table`tbl`の`p1`および`p2`パーティションをクリアする**

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```
