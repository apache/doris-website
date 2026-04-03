---
{
  "title": "SHOW PLUGINS",
  "language": "ja",
  "description": "このステートメントはインストールされたplug-inを表示するために使用されます"
}
---
## 説明

この文は、インストールされたプラグインを表示するために使用されます

## 構文

```sql
SHOW PLUGINS
```
## 戻り値

| Column | Description |
| ------ | ----------- |
| Description | 対応するプラグイン説明 |
| Version | プラグイン対応バージョン番号 |
| JavaVersion | 対応するJavaバージョン番号 |
| ClassName | プログラムクラス名 |
| SoName | プログラム共有オブジェクト名 |
| Sources | Plugin Source |
| Status | インストール状態 |
| Properties | Plugin Properties  |

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Permissions         | Object   | Notes            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | クラスタ全体 | クラスタ全体の管理者権限が必要 |

## 例

- インストール済みプラグインを表示：

    ```SQL
    SHOW PLUGINS;
    ```
    ```text
    +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
   | Name                          | Type    | Description                                               | Version | JavaVersion | ClassName                                                  | SoName | Sources | Status    | Properties |
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
   | __builtin_AuditLoader         | AUDIT   | builtin audit loader, to load audit log to internal table | 2.1.0   | 1.8.31      | org.apache.doris.plugin.audit.AuditLoader                  | NULL   | Builtin | INSTALLED | {}         |
   | __builtin_AuditLogBuilder     | AUDIT   | builtin audit logger                                      | 0.12.0  | 1.8.31      | org.apache.doris.plugin.audit.AuditLogBuilder              | NULL   | Builtin | INSTALLED | {}         |
   | __builtin_SqlDialectConverter | DIALECT | builtin sql dialect converter                             | 2.1.0   | 1.8.31      | org.apache.doris.plugin.dialect.HttpDialectConverterPlugin | NULL   | Builtin | INSTALLED | {}         |
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
    ```
