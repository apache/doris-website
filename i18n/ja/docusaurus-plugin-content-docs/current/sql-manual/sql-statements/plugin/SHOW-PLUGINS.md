---
{
    "title": "SHOW PLUGINS",
    "language": "ja",
    "description": "インストール済みのプラグインを表示するステートメントです"
}
---

## 説明

このステートメントは、インストール済みのプラグインを表示します。

## 構文

```sql
SHOW PLUGINS
```

## 戻り値

| カラム | 説明 |
| ------ | ----------- |
| Description | 対応するプラグインの説明 |
| Version | プラグインのバージョン番号 |
| JavaVersion | 対応する Java のバージョン番号 |
| ClassName | プログラムのクラス名 |
| SoName | プログラムの共有オブジェクト名 |
| Sources | プラグインの提供元 |
| Status | インストール状態 |
| Properties | プラグインのプロパティ |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限         | 対象   | 備考            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | クラスター全体 | クラスター全体に対する管理者権限が必要です |

## 例

- インストール済みのプラグインを表示します。

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
