---
{
    "title": "SHOW SNAPSHOT",
    "language": "ja",
    "description": "この文は、リポジトリにすでに存在するバックアップを表示するために使用します。"
}
---

## 説明

この文は、リポジトリにすでに存在するバックアップを表示するために使用します。

## 構文

```sql
SHOW SNAPSHOT ON `<repo_name>`
[WHERE SNAPSHOT = "<snapshot_name>" [AND TIMESTAMP = "<backup_timestamp>"]];
```

## パラメータ

**1.`<repo_name>`**

選択したバックアップリポジトリの名前。

**2.`<snapshot_name>`**

バックアップ名。

**3.`<backup_timestamp>`**

バックアップのタイムスタンプ。

## 戻り値

| 列 | 説明 |
| -- | -- |
| Snapshot | バックアップの名前 |
| Timestamp | バックアップの時刻バージョンに対応します |
| Status | バックアップの時刻バージョンに対応します |
| Database | バックアップデータが元々属していたデータベースの名前 |
| Details | バックアップ全体のデータディレクトリとファイル構造を JSON 形式で表示します |

## 例

1. リポジトリ example_repo に存在するバックアップを表示します。

```sql
SHOW SNAPSHOT ON example_repo;
```

2. リポジトリ example_repo 内の backup1 という名前のバックアップだけを表示します。

```sql
SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1";
```

3. ウェアハウス example_repo 内の backup1 という名前で、時刻バージョンが "2018-05-05-15-34-26" のバックアップの詳細を表示します。

```sql
SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1" AND TIMESTAMP = "2018-05-05-15-34-26";
```
