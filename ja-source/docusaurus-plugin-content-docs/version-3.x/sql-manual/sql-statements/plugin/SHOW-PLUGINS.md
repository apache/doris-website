---
{
  "title": "SHOW PLUGINS",
  "description": "このステートメントは、インストールされたプラグインを表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントはインストールされているプラグインを表示するために使用されます

## 構文

```sql
SHOW PLUGINS
```
## 戻り値

| Column | デスクリプション |
| ------ | ----------- |
| デスクリプション | 対応するプラグインの説明 |
| Version | プラグインの対応するバージョン番号 |
| JavaVersion | 対応するJavaバージョン番号 |
| ClassName | プログラムクラス名 |
| SoName | プログラム共有オブジェクト名 |
| Sources | プラグインソース |
| Status | インストール状態 |
| Properties | プラグインプロパティ |

## 権限制御

このSQLコマンドを実行するユーザーは、最低限以下の権限を持つ必要があります：

| Permissions         | Object   | 注釈            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | クラスタ全体 | クラスタ全体に対する管理者権限が必要 |

## 例

- インストール済みプラグインを表示：

    ```SQL
    SHOW PLUGINS;
    ```
    ```text
    +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
   | Name                          | タイプ    | デスクリプション                                               | Version | JavaVersion | ClassName                                                  | SoName | Sources | Status    | Properties |
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
   | __builtin_AuditLoader         | AUDIT   | builtin audit loader, to load audit log to internal table | 2.1.0   | 1.8.31      | org.apache.doris.plugin.audit.AuditLoader                  | NULL   | Builtin | INSTALLED | {}         |
   | __builtin_AuditLogBuilder     | AUDIT   | builtin audit logger                                      | 0.12.0  | 1.8.31      | org.apache.doris.plugin.audit.AuditLogBuilder              | NULL   | Builtin | INSTALLED | {}         |
   | __builtin_SqlDialectConverter | DIALECT | builtin sql dialect converter                             | 2.1.0   | 1.8.31      | org.apache.doris.plugin.dialect.HttpDialectConverterPlugin | NULL   | Builtin | INSTALLED | {}         |
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
    ```
