---
{
  "title": "SHOW PLUGINS",
  "description": "このステートメントは、インストールされたプラグインを表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、インストールされたプラグインを表示するために使用されます。

## Syntax

```sql
SHOW PLUGINS
```
## 戻り値

| カラム | 説明 |
| ------ | ----------- |
| デスクリプション | 対応するプラグインの説明 |
| Version | プラグインに対応するバージョン番号 |
| JavaVersion | 対応するJavaバージョン番号 |
| ClassName | プログラムクラス名 |
| SoName | プログラム共有オブジェクト名 |
| Sources | プラグインソース |
| Status | インストール状況 |
| Properties | プラグインプロパティ |

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限         | オブジェクト   | 注記            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | クラスタ全体 | クラスタ全体の管理者権限が必要 |

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
