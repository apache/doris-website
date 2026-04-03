---
{
  "title": "KILL QUERY",
  "description": "各Doris接続は別々のスレッドで実行されます。このステートメントを使用してスレッドを終了します。",
  "language": "ja"
}
---
## 説明

各Doris接続は個別のスレッドで実行されます。このステートメントを使用してスレッドを終了します。

## 構文

```SQL
KILL [CONNECTION] <processlist_id>
```
## Varaint Syntax

```SQL
KILL QUERY [ { <processlist_id> | <query_id> } ]
```
## 必須パラメータ

**1. `<processlist_id>`**

> 強制終了する必要がある接続スレッドのIDを示します

**2. `<query_id>`**

> 強制終了するクエリのIDを示します

## オプションパラメータ

**1. `CONNECTION`**

> スレッドが現在接続されているかどうかを示します

## 使用上の注意

- スレッドプロセスリスト識別子は、SHOW PROCESSLISTによって出力されるIdカラムから取得できます

- Connection IDは、SELECT CONNECTION_ID()から取得できます

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege    | Object    | 注釈                      |
|:--------------|:-----------|:-----------------------|
| GRANT_PRIV         | DATABASE   | KILL文にはGRANT権限が必要です |

## 例

```sql
select connection_id()
```
```text
+-----------------+
| connection_id() |
+-----------------+
| 48              |
+-----------------+
```
```sql
SHOW PROCESSLIST
```
```text
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
| CurrentConnected | Id   | User | Host               | LoginTime           | カタログ  | Db      | Command | Time | State | QueryId                           | Info                                                                                  |
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
| Yes              |   48 | root | 10.16.xx.xx:44834   | 2025-01-21 16:49:47 | internal | test | Query   |    0 | OK    | e6e4ce9567b04859-8eeab8d6b5513e38 | SHOW PROCESSLIST                                                                      |
|                  |   50 | root | 192.168.xx.xx:52837 | 2025-01-21 16:51:34 | internal |      | Sleep   | 1837 | EOF   | deaf13c52b3b4a3b-b25e8254b50ff8cb | SELECT @@session.transaction_isolation                                                |
|                  |   51 | root | 192.168.xx.xx:52843 | 2025-01-21 16:51:35 | internal |      | Sleep   |  907 | EOF   | 437f219addc0404f-9befe7f6acf9a700 | /* ApplicationName=DBeaver Ultimate 23.1.3 - Metadata */ SHOW STATUS                  |
|                  |   55 | root | 192.168.xx.xx:55533 | 2025-01-21 17:09:32 | internal | test | Sleep   |  271 | EOF   | f02603dc163a4da3-beebbb5d1ced760c | /* ApplicationName=DBeaver Ultimate 23.1.3 - SQLEditor <Console> */ SELECT DATABASE() |
|                  |   47 | root | 10.16.xx.xx:35678   | 2025-01-21 16:21:56 | internal | test | Sleep   | 3528 | EOF   | f4944c543dc34a99-b0d0f3986c8f1c98 | select * from test                                                                    |
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
```
```sql
kill 51
```
