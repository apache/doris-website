---
{
    "title": "PLAN REPLAYER DUMP",
    "language": "ja",
    "description": "PLAN REPLAYER DUMP は、Doris ユーザーが実行計画の診断ファイルを生成するためのツールです。クエリオプティマイザーの状態と入力データを取得します。"
}
---

## 説明

PLAN REPLAYER DUMP は、Doris ユーザーが実行計画の診断ファイルを生成するためのツールです。クエリオプティマイザーの状態と入力データを取得し、クエリ最適化に関する問題のデバッグと分析に役立ちます。出力は、対応する診断ファイルの HTTP アドレスです。


## 構文

```sql
PLAN REPLAYER DUMP <query>
```


## 必須パラメータ

`<query>`


- 対応する DML 内のクエリ文を指します。
- クエリ文でない場合は、解析エラーが報告されます。
- 詳細については、[SELECT](https://doris.apache.org/docs/dev/sql-manual/sql-statements/data-query/SELECT) の構文を参照してください。


## 必要な権限


この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。


| 権限 | 対象 | 説明 |
| :--: | :--: | :--: |
| SELECT_PRIV | テーブル、ビュー | <query_sql_statement> を実行する際は、クエリ対象のテーブル、ビュー、またはマテリアライズドビューに対する SELECT_PRIV 権限が必要です。 |


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
+-------------------------------------------------------------------------------+
| http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec |
+-------------------------------------------------------------------------------+
```


対応するファイルは、curl または wget を使用して取得できます。例：

```sql
wget http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec
```


認証が必要な場合は、次のようにユーザー名とパスワードを指定できます。

```sql
wget --header="Authorization: Basic $(echo -n 'root:' | base64)" http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec
```
```

