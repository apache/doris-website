---
{
    "title": "クエリの遮断: SQL Block Rule と Workload Policy の設定ガイド",
    "sidebar_label": "クエリの遮断",
    "language": "ja",
    "description": "SQL Block Rule と Workload Policy を使用して、テーブル全体のスキャンをブロックし、クエリのリソース消費を制限して、異常に大きなクエリによるクラスタへの影響を防ぐ方法を説明します。",
    "keywords": ["クエリの遮断", "SQL Block Rule", "Workload Policy", "テーブル全体のスキャン制限", "大規模クエリの管理", "クラスタの安定性"]
}
---

<!-- Knowledge type: concept + procedure -->

クエリの遮断は、実行時間が長いクエリやリソースを大量に消費するクエリが、クラスタの安定性に影響するのを防ぐ仕組みです。クエリが設定されたリソースまたは時間の上限を超えると、自動的に終了します。これにより、単一のクエリがシステムのリソースを使い尽くしたり、ほかのワークロードの処理を遅らせたりすることを防ぎます。

Doris には、クエリのライフサイクルの異なる段階で動作する、次の二つの遮断方法があります。

| 比較項目 | SQL Block Rule（計画段階で遮断） | Workload Policy（実行時に遮断） |
|---------|--------------------------|---------------------------|
| 動作する段階 | クエリの計画段階。実行前にブロック | クエリの実行段階。実行中に遮断 |
| 判定基準 | 推定スキャン量、SQL パターンの照合 | 実際の実行時間、メモリ使用量、スキャン量などのリアルタイム指標 |
| 精度 | コストの推定に基づくため、誤検出の可能性がある | リアルタイムの監視に基づくため、より正確 |
| 用途 | 危険と分かっている SQL パターンやテーブル全体のスキャンをブロック | 実行中に想定した上限を超えたクエリを遮断 |
| 対応するステートメント | すべてのステートメント（DDL、DML） | select、insert into select、stream load、routine load |

## SQL Block Rule

<!-- Knowledge type: concept -->

SQL Block Rule は、特定のパターンに一致するステートメントを**計画段階**でブロックし、実行段階に進ませません。通常は DBA が設定し、テーブル全体のスキャンや危険な関数呼び出しなど、既知のリスクがある操作を防ぎます。

### ルールのプロパティ

各ルールの動作と適用範囲は、次のプロパティで定義します。

| プロパティ | 説明 | 値 |
|------|------|------|
| `sql` | クエリステートメントに一致する正規表現 | Java の正規表現文字列 |
| `sqlHash` | クエリステートメントに一致するハッシュ値 | SQL のハッシュ値を表す文字列 |
| `cardinality` | スキャンを許可する行数の上限 | 正の整数 |
| `partition_num` | スキャンを許可するパーティション数の上限 | 正の整数 |
| `tablet_num` | スキャンを許可するタブレット数の上限 | 正の整数 |
| `global` | ルールをグローバルに適用するかどうか | `"true"`（グローバル）/ `"false"`（紐付けたユーザーのみに適用） |
| `enable` | ルールを有効にするかどうか | `"true"` / `"false"` |

### ユースケースと例

<!-- Knowledge type: procedure -->

#### シナリオ 1: スキャンする行数を制限する

**問題**: `SELECT * FROM t` のようなテーブル全体のスキャンは、BE の I/O リソースと CPU リソースを大量に消費します。

**対処方法**: 単一のテーブルからスキャンする行数に上限を設定します。しきい値を超えるクエリはブロックされます。

```sql
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
    "cardinality" = "1000",
    "global" = "true",
    "enable" = "true"
);
```

単一テーブルのスキャンが 1000 行を超えると、クエリは拒否されます。

#### シナリオ 2: スキャンするパーティション数を制限する

**問題**: 多数のパーティションをスキャンすると、BE の CPU 消費量が大幅に増えます。外部テーブルへのクエリでは、ネットワーク通信とメタデータ取得の負荷も増えます。通常、これはパーティションのフィルタ条件が欠けているか、正しく記述されていない場合に発生します。

**対処方法**: 単一のクエリでスキャンできるパーティション数の上限を設定します。

```sql
CREATE SQL_BLOCK_RULE rule_part_num 
PROPERTIES
(
    "partition_num" = "30",
    "global" = "true",
    "enable" = "true"
);
```

単一テーブルのスキャンが 30 パーティションを超えると、クエリは拒否されます。

#### シナリオ 3: スキャンするタブレット数を制限する

**問題**: 多数のタブレットをスキャンすると、BE の CPU 消費量も大幅に増えます。

**対処方法**: 単一のクエリでスキャンできるタブレット数の上限を設定します。

```sql
CREATE SQL_BLOCK_RULE rule_tablet_num 
PROPERTIES
(
    "tablet_num" = "200",
    "global" = "true",
    "enable" = "true"
);
```

単一テーブルのスキャンが 200 タブレットを超えると、クエリは拒否されます。

#### シナリオ 4: 特定の SQL パターンをブロックする

**問題**: 特定の関数の呼び出しや危険な操作など、一部のクエリパターンは計算量の増大や計画時間の長期化につながる可能性があります。

**対処方法**: 正規表現に一致するクエリをブロックします。

**例 1: 特定の関数の使用をブロックする**

次のルールは、`abs` 関数を含むすべてのクエリをブロックします。

```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
    "sql"="(?i)abs\\s*\\(.+\\)",
    "global"="true",
    "enable"="true"
);
```

正規表現の説明:

- `(?i)`: 大文字と小文字を区別せずに照合します。
- `abs`: 対象の関数名です。
- `\\s*`: 関数名と開き括弧の間に任意の空白文字を許容します。
- `\\(.+\\)`: 関数の引数に一致します。

**例 2: 危険な操作をブロックする**

同様に、正規表現を使用して `set global`（意図しない変数の変更を防ぐため）や `truncate table`（意図しないデータの削除を防ぐため）をブロックできます。

> 正規表現は Java の規則に従います。詳しくは [Pattern のドキュメント](https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html)を参照してください。

#### シナリオ 5: 特定のユーザーにルールを設定する

**問題**: デフォルトのルールはグローバルに適用されますが、特定のユーザーのみに制限を適用したい場合があります。

**対処方法**: グローバルではないルールを作成し、対象のユーザーに紐付けます。

1. ルールの作成時に `global` を `"false"` に設定します。

    ```sql
    CREATE SQL_BLOCK_RULE rule_001
    PROPERTIES (
        "sql"="select \\* from t",
        "global" = "false",
        "enable" = "true"
    );
    ```

2. ルールを対象のユーザーに紐付けます。

    ```sql
    SET PROPERTY FOR 'root' 'SQL_block_rules' = 'rule_001';
    ```

3. ルールが有効になっていることを確認します。

    ```sql
    MySQL root@127.0.0.1:test> select * from t;
    (1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
    ```

**複数のルールの管理**:

- 複数のルールをユーザーに紐付けるには、`'rule_001,rule_002'` のように、ルール名をカンマで区切ります。
- ユーザーからすべてのルールを解除するには、`SET PROPERTY FOR 'root' 'SQL_block_rules' = '';` のように、ルールのリストを空文字列に設定します。

### 注意事項

- **推定方法**: スキャンする行数、パーティション数、タブレット数は、計画段階に最悪ケースを想定して推定されます（パーティションプルーニングとタブレットプルーニングのみを考慮し、ほかのフィルタ条件は考慮しません）。実際のスキャン量が設定値より少ないクエリも、ブロックされる場合があります。
- **性能への影響**: 正規表現の照合は計算負荷の高い処理です。ルールの数が多すぎたり、正規表現が複雑すぎたりすると FE の CPU に大きな負荷がかかるため、慎重に追加してください。
- **ルールの一時的な無効化**: ルールを削除せず一時的に無効にするには、そのルールの `"enable"` プロパティを `"false"` に変更します。

## Workload Policy

<!-- Knowledge type: concept -->

Workload Policy は、クエリの**実行中**にリアルタイムの指標を監視し、想定した上限を超えたクエリに対して、遮断や変数の調整などのアクションを適用します。SQL Block Rule が計画段階の静的な推定に基づくのに対し、Workload Policy は実行時の実測データに基づいて判定するため、より正確です。

Workload Policy は Doris 2.1 以降でサポートされています。ワークロードの種類ごとの対応状況は次のとおりです。

| ワークロードの種類 | 対応 |
|---------|---------|
| select | はい |
| insert into select | はい |
| insert into values | いいえ |
| stream load | はい |
| routine load | はい |
| backup | いいえ |
| compaction | いいえ |

### 作成と設定

<!-- Knowledge type: procedure -->

`CREATE WORKLOAD POLICY` コマンドを使用してポリシーを作成します。`admin_priv` 権限が必要です。

**基本構文**:

```sql
CREATE WORKLOAD POLICY <policy_name>
CONDITIONS(<condition_expr>)
ACTIONS(<action_expr>) 
PROPERTIES('<key>'='<value>');
```

次の例では、実行時間が 1000 ms を超えたクエリをキャンセルするポリシーを作成します。

```sql
CREATE WORKLOAD POLICY test_cancel_policy
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('enabled'='true'); 
```

#### トリガー条件

条件は、ポリシーを適用するタイミングを指定します。複数の条件を指定する場合はカンマ（`,`）で区切り、すべての条件を満たしたときに適用されます。

| 条件 | 説明 |
|-----------|------|
| `username` | クエリに含まれるユーザー名です。Doris 4.1.3 以降では、`query_time`、`be_scan_rows`、`be_scan_bytes`、`query_be_memory_bytes` などの BE 側の実行時指標と組み合わせて、`cancel_query` を実行できます。この条件で使用できる演算子は等号（`=`）のみで、ユーザー名は空にできません。 |
| `be_scan_rows` | 単一の BE プロセス内で SQL がスキャンした行数です。並行実行時は累積値です。 |
| `be_scan_bytes` | 単一の BE プロセス内で SQL がスキャンしたバイト数です。並行実行時は累積値です（単位: バイト）。 |
| `query_time` | 単一の BE プロセス上で SQL を実行した時間です（単位: ミリ秒）。 |
| `query_be_memory_bytes` | 単一の BE プロセス内で SQL が使用したメモリ量です。並行実行時は累積値です（単位: バイト）。 |

#### アクション

アクションは、条件を満たしたときの処理を指定します。現在、各 Policy に定義できる Action は一つだけです。

| アクション | 説明 |
|--------|------|
| `cancel_query` | クエリをキャンセルします。 |

#### ポリシーのプロパティ

| プロパティ | 説明 | デフォルト |
|----------|------|--------|
| `enabled` | ポリシーを有効にするかどうかを指定します。値は `true` または `false` です。 | `true` |
| `priority` | 優先度を 0～100 の範囲で指定します。値が大きいほど優先度が高くなります。複数の Policy が一致した場合は、優先度が最も高いものだけが適用されます。 | `0` |
| `workload_group` | 紐付ける Workload Group の名前です。指定すると、その Workload Group 内のクエリにのみ Policy が適用されます。空の場合はすべてのクエリに適用されます。 | 空（グローバル） |

#### Workload Group への紐付け

ポリシーを特定の Workload Group に限定するには、`workload_group` プロパティで紐付けます。

```sql
CREATE WORKLOAD POLICY test_cancel_big_query
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('workload_group'='normal');
```

:::caution クラウドモードでは完全修飾名が必要
上記の `'workload_group'='normal'` 形式が有効なのは、**非クラウドモード（ストレージとコンピューティングの結合モード）のみ**です。**クラウドモード（ストレージとコンピューティングの分離モード）では、完全修飾形式の `<compute_group>.<workload_group>` が必要**です。たとえば `'workload_group'='compute_group_a.normal'` を指定します。指定しない場合、ステートメントは `workload_group must be '<compute_group>.<workload_group>' in cloud mode` というエラーで失敗します。詳しくは [CREATE WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY) を参照してください。
:::

### 例

<!-- Knowledge type: procedure -->

#### 例 1: 実行時間が長いクエリを遮断する

次の監査ログは、ある SQL の実行に通常 4.5 秒かかることを示しています。

```sql
MySQL [hits]> SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
+-----------------------------------------------------------------------+------------------+----------+---------------------------------------------------------------------------------------------------------------------+
| k                                                                     | l                | c        | min(Referer)                                                                                                        |
+-----------------------------------------------------------------------+------------------+----------+---------------------------------------------------------------------------------------------------------------------+
| 1                                                                     | 85.4611926713085 | 67259319 | http://%26ad%3D1%25EA%25D0%26utm_source=web&cd=19590&input_onlist/би-2 место будущей кондицин                       |
| http:%2F%2Fwwww.regnancies/search&evL8gE&where=all&filmId=bEmYZc_WTDE |               69 |   207347 | http:%2F%2Fwwww.regnancies/search&evL8gE&where=all&filmId=bEmYZc_WTDE                                               |
| http://новострашная                                                   |               31 |   740277 | http://новострашная                                                                                                 |
| http://loveche.html?ctid                                              |               24 |   144901 | http://loveche.html?ctid                                                                                            |
| http://rukodeliveresult                                               |               23 |   226135 | http://rukodeliveresult                                                                                             |
| http://holodilnik.ru                                                  |               20 |   133893 | http://holodilnik.ru                                                                                                |
| http://smeshariki.ru                                                  |               20 |   210736 | http://smeshariki.ru                                                                                                |
| http:%2F%2Fviewtopic                                                  |               20 |   391115 | http:%2F%2Fviewtopic                                                                                                |
| http:%2F%2Fwwww.ukr                                                   |               19 |   655178 | http:%2F%2Fwwww.ukr                                                                                                 |
| http:%2F%2FviewType                                                   |               19 |   148907 | http:%2F%2FviewType                                                                                                 |
| http://state=2008                                                     |               17 |   139630 | http://state=2008                                                                                                   |
+-----------------------------------------------------------------------+------------------+----------+---------------------------------------------------------------------------------------------------------------------+
11 rows in set (4.50 sec)
```

実行時間が 3 秒を超えたクエリをキャンセルするポリシーを作成します。

```sql
CREATE WORKLOAD POLICY test_cancel_3s_query
CONDITIONS(query_time > 3000)
ACTIONS(cancel_query); 
```

同じ SQL を再度実行すると、クエリは遮断されます。

```sql
MySQL [hits]> SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload policy,id:12345
```

#### 例 2: 特定のユーザーが実行する大規模クエリを遮断する

Doris 4.1.3 以降では、`username` を BE 側の実行時指標と組み合わせ、特定のユーザーのクエリだけをキャンセルできます。次のポリシーは、`test_user` が送信したクエリの単一の BE 上での実行時間が 3000 ms を超えた場合に、そのクエリをキャンセルします。

```sql
CREATE WORKLOAD POLICY cancel_user_long_query
CONDITIONS(username='test_user', query_time > 3000)
ACTIONS(cancel_query);
```

同様に、`username` を `be_scan_rows`、`be_scan_bytes`、`query_be_memory_bytes` と組み合わせて、特定のユーザーのスキャン量や BE メモリ使用量を制限できます。

### 注意事項
- **非同期実行による遅延**: ポリシーは非同期スレッドによって 500 ms ごとにチェックされるため、適用までに多少の遅延があります。実行時間が非常に短いクエリは、チェック前に完了し、ポリシーの対象にならない場合があります。
- **優先度の仕組み**: クエリが複数の Policy に一致しても、優先度（`priority` の値）が最も高いものだけが適用されます。
- **変更の制限**: 現在、既存の Policy の Action と Condition を直接変更することはできません。Policy を削除してから作成し直してください。
