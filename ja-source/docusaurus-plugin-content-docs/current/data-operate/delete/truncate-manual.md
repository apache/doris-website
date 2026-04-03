---
{
  "title": "TRUNCATE コマンドによるデータの削除",
  "language": "ja",
  "description": "このステートメントを使用して、指定されたテーブルとそのパーティションからデータを削除します。"
}
---
# Truncate

指定されたテーブルとそのパーティションからデータをクリアするには、このステートメントを使用します。

## Syntax

```sql
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)] [FORCE];
```
- このステートメントはテーブルまたはパーティション内のデータのみをクリアしますが、テーブルまたはパーティション自体は保持されます。
- DELETEとは異なり、このステートメントは指定されたテーブルまたはパーティション全体のみをクリアでき、フィルター条件を追加することはできません。
- DELETEとは異なり、データのtruncateはクエリパフォーマンスに影響しません。
- この操作で削除されたデータは、RECOVERステートメントによって（一定期間）復旧することができます。詳細については[RECOVER](../../sql-manual/sql-statements/recycle/RECOVER)ステートメントを参照してください。FORCEを付けてコマンドを実行した場合、データは直接削除され復旧できません。この操作は一般的に推奨されません。
- このコマンドを使用する場合、テーブルステータスはNORMALである必要があります。つまり、SCHEMA CHANGEが進行中のテーブルはtruncateできません。
- このコマンドは進行中のインポートを失敗させる可能性があります。

## Examples

**1. `example_db`データベース内のテーブル`tbl`をクリアする**

```sql
TRUNCATE TABLE example_db.tbl;
```
**2. テーブル `tbl` の `p1` および `p2` パーティションをクリアする**

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```
**3. FORCE を使用して `example_db` データベースの `tbl` テーブルをクリアする**

```sql
TRUNCATE TABLE example_db.tbl FORCE;
```
