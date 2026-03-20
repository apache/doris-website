---
{
  "title": "PLAN REPLAYER DUMP",
  "description": "PLAN REPLAYER DUMP は、Doris ユーザーが実行プラン診断ファイルを生成するためのツールです。クエリオプティマイザーの状態と入力データをキャプチャします。",
  "language": "ja"
}
---
## 説明

PLAN REPLAYER DUMPは、Dorisユーザーが実行プラン診断ファイルを生成するためのツールです。クエリオプティマイザーの状態と入力データをキャプチャし、クエリ最適化の問題のデバッグと分析を容易にします。出力は、対応する診断ファイルのhttpアドレスです。

## 構文

```sql
PLAN REPLAYER DUMP <query>
```
## 必須パラメータ

`<query>`

- 対応するDML内のクエリステートメントを指します。
- クエリステートメントでない場合、パースエラーが報告されます。
- 詳細については、[SELECT](https://doris.apache.org/docs/dev/sql-manual/sql-statements/data-query/SELECT)構文を参照してください。

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
| :--: | :--: | :--: |
| SELECT_PRIV | Table、View | <query_sql_statement>を実行する際、クエリ対象のTable、ビュー、またはマテリアライズドビューに対するSELECT_PRIV権限が必要です。 |

## 例

### 基本例

```sql
create database test_replayer;
use database test_replayer;
create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
plan replayer dump select * from t1;
```
実行結果の例：

```sql
+-------------------------------------------------------------------------------+
| Plan Replayer dump url                                                        |
| Plan Replayer dump url |
+-------------------------------------------------------------------------------+
| http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec |
+-------------------------------------------------------------------------------+
```
curlまたはwgetを使用して対応するファイルを取得できます。例えば：

```sql
wget http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec
```
パーミッションが必要な場合、usernameとpasswordを以下に含めることができます：

```sql
wget --header="Authorization: Basic $(echo -n 'root:' | base64)" http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec
```
```
