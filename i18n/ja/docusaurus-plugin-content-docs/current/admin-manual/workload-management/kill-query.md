---
{
    "title": "クエリのキャンセルとセッションの切断：KILL コマンドガイド",
    "sidebar_label": "クエリのキャンセルとセッションの切断",
    "language": "ja",
    "description": "KILL コマンドを使用して実行中のクエリをキャンセルするか、セッションを切断します。Query ID、Connection ID、Trace ID から対象のクエリを特定します。",
    "keywords": ["クエリのキャンセル", "クエリの終了", "セッションの切断", "接続の切断", "KILL QUERY", "KILL CONNECTION", "Query ID", "Trace ID", "processlist"]
}
---

<!-- Knowledge Type: Operation Guide -->

`KILL` コマンドは、実行中のクエリをキャンセルするか、指定したセッションを切断します。使用する前に、対象のクエリの識別子（Query ID、Connection ID、Trace ID のいずれか）を取得し、対応する KILL 文を実行します。

## クエリ識別子の取得

<!-- Knowledge Type: Concept Definition -->

KILL コマンドは、次の三種類のクエリ識別子をサポートします。

| 識別子の種類 | 説明 | 取得方法 |
|---|---|---|
| Query ID | クエリごとにシステムが自動生成する一意の識別子 | `SHOW PROCESSLIST` または `information_schema.processlist` |
| Connection ID | セッション接続を一意に識別する ID | `SHOW PROCESSLIST` または `information_schema.processlist` |
| Trace ID | ユーザーが定義するクエリ識別子（2.1.11 / 3.0.7 以降でサポート） | `session_context` 変数で設定 |

### PROCESSLIST で確認する

<!-- Knowledge Type: Operation Steps -->

`SHOW PROCESSLIST` は、現在のすべてのセッション接続と、それらで実行中のクエリを表示します。Query ID と Connection ID も確認できます。

```sql
SHOW PROCESSLIST;
```

出力例：

```
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
| CurrentConnected | Id   | User | Host                | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                          | Info             | FE            | CloudCluster |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
| No               |    2 | root | 172.20.32.136:54850 | 2025-05-11 10:41:52 | internal |      | Query   |    6 | OK    | 12ccf7f95c1c4d2c-b03fa9c652757c15| select sleep(20) | 172.20.32.152 | NULL         |
| Yes              |    3 | root | 172.20.32.136:54862 | 2025-05-11 10:41:55 | internal |      | Query   |    0 | OK    | b710ed990d4144ee-8b15bb53002b7710| show processlist | 172.20.32.152 | NULL         |
| No               |    1 | root | 172.20.32.136:47964 | 2025-05-11 10:41:54 | internal |      | Sleep   |   11 | EOF   | b60daa992bac4fe4-b29466aacce67d27|                  | 172.20.32.153 | NULL         |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
```

主なフィールドの説明：

- `CurrentConnected`：`Yes` は現在のセッションに対応する接続を示します。
- `Id`：接続を一意に識別する Connection ID です。
- `QueryId`：直近に実行した、または現在実行中の SQL を一意に識別する Query ID です。

**デフォルトの動作**：`SHOW PROCESSLIST` には、現在の接続先 FE ノード上のセッションのみが表示され、ほかの FE ノード上のセッションは含まれません。すべての FE ノード上のセッションを表示するには、クエリの実行前に次の変数を設定します。

```sql
SET show_all_fe_connection = true;
SHOW PROCESSLIST;
```

`information_schema` システムテーブルも使用できます。デフォルトですべての FE ノード上のセッションが表示され、追加の設定は不要です。

```sql
SELECT * FROM information_schema.processlist;
```

### Trace ID でクエリを特定する

<!-- Knowledge Type: Operation Steps -->

> この機能はバージョン 2.1.11 および 3.0.7 以降でサポートされます。

Trace ID は、クエリに事前に割り当てるカスタム識別子です。管理ツールでクエリの送信前に一意の識別子を記録しておけば、送信後はいつでも Trace ID を指定してクエリをキャンセルできます。

現在のセッションに Trace ID を設定するには、次のようにします。

```sql
SET session_context = "trace_id:your_trace_id";
```

- `your_trace_id`：`;` 文字を含まないカスタム文字列です。一意性を確保するため、UUID を推奨します。
- Trace ID はセッション単位のパラメータであり、現在のセッションにのみ適用されます。設定後、このセッションで実行するすべての後続クエリが同じ Trace ID に対応します。

セッション変数を変更せずに、単一のクエリ文に Hint を指定することもできます。

```sql
SELECT /*+SET_VAR(session_context="trace_id:your_trace_id")*/ * FROM table ...;
```

## KILL 操作の実行

<!-- Knowledge Type: Operation Steps -->

**権限に関する注意**：一般ユーザーが終了できるのは、自分で送信したクエリだけです。ADMIN ユーザーは、どのユーザーのクエリも終了できます。

### クエリをキャンセルする

`KILL QUERY` は、セッションを切断せずに、指定した実行中のクエリをキャンセルします。

```sql
KILL QUERY "query_id" | "trace_id" | connection_id;
```

三つの指定形式の比較：

| パラメータの種類 | 例 | 対象範囲 |
|---|---|---|
| `"query_id"` | `KILL QUERY "d36417cc05ff41ab-9d3afe49be251055";` | すべての FE ノードを検索し、一致するクエリをキャンセルします |
| `"trace_id"` | `KILL QUERY "your_trace_id";` | すべての FE ノードを検索し、一致するクエリをキャンセルします |
| `connection_id` | `KILL QUERY 55;` | 現在の接続先 FE ノード上で、この接続で実行中のクエリのみをキャンセルします |

注意事項：

- Query ID と Trace ID は引用符で囲む必要があります。Connection ID は 0 より大きい整数で、引用符で囲んではいけません。
- Connection ID を指定した `KILL QUERY` は、現在の接続先 FE ノードでのみ有効です。

### 接続を切断する

`KILL CONNECTION` は、指定したセッションを切断し、その接続で実行中のクエリもキャンセルします。

```sql
KILL [CONNECTION] connection_id;
```

`CONNECTION` キーワードは省略できます。次の二つの形式は同等です。

```sql
KILL CONNECTION 55;
KILL 55;
```

注意：異なる FE ノードで Connection ID が重複する場合があります。この操作は、現在の接続先 FE ノードでのみ有効です。

## ベストプラクティス：Trace ID でクエリを管理する

<!-- Knowledge Type: Best Practice -->

管理システムや業務プラットフォームでは、Trace ID を使ってクエリに事前に印を付け、対象のクエリを正確にキャンセルすることを推奨します。手順は次のとおりです。

1. **クエリの送信前**に、一意の Trace ID を生成し（UUID を推奨）、クエリに関連付けます。
2. **クエリの実行中**は、システムから Trace ID を指定していつでも KILL リクエストを発行できます。

Trace ID を関連付ける方法は二つあります。

- クエリの実行前にセッション変数を設定する方法（単一接続のシナリオに適しています）：

    ```sql
    SET session_context = "trace_id:your_trace_id";
    SELECT * FROM table ...;
    ```

- クエリ文に Hint を埋め込む方法（接続プールを再利用するシナリオに適しています）：

    ```sql
    SELECT /*+SET_VAR(session_context="trace_id:your_trace_id")*/ * FROM table ...;
    ```

関連付けた後は、次のコマンドでいつでもクエリをキャンセルできます。

```sql
KILL QUERY "your_trace_id";
```
