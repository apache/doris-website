---
{
  "title": "SNAPSHOT を表示",
  "language": "ja",
  "description": "このステートメントは、リポジトリに既に存在するバックアップを表示するために使用されます。"
}
---
## 説明

このステートメントは、リポジトリに既に存在するバックアップを表示するために使用されます。

## 構文

```sql
SHOW SNAPSHOT ON `<repo_name>`
[WHERE SNAPSHOT = "<snapshot_name>" [AND TIMESTAMP = "<backup_timestamp>"]];
```
## パラメータ

**1.`<repo_name>`**

選択されたリポジトリ名をバックアップします。

**2.`<snapshot_name>`**

バックアップ名。

**3.`<backup_timestamp>`**

バックアップのタイムスタンプ。

## 戻り値

| カラム | 説明 |
| -- | -- |
| Snapshot | バックアップの名前 |
| Timestamp | バックアップの時刻バージョンに対応 |
| Status | バックアップの時刻バージョンに対応 |
| Database | バックアップデータが元々属していたデータベースの名前 |
| Details | Json形式で、バックアップ全体のデータディレクトリとファイル構造を表示 |

## 例

1. リポジトリ example_repo 内の既存のバックアップを表示

```sql
SHOW SNAPSHOT ON example_repo;
```
2. リポジトリ example_repo 内の backup1 という名前のバックアップのみを表示する：

```sql
SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1";
```
3. warehouse example_repo 内の time version "2018-05-05-15-34-26" を持つ backup1 という名前のバックアップの詳細を表示します：

```sql
SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1" AND TIMESTAMP = "2018-05-05-15-34-26";
```
