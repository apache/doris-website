---
{
    "title": "クエリのサーキットブレーク：SQL Block Rule と Workload Policy の設定ガイド",
    "sidebar_label": "クエリのサーキットブレーク",
    "language": "ja",
    "description": "SQL Block Rule と Workload Policy を使用して、テーブルのフルスキャンをブロックし、クエリのリソース消費を制限して、異常に大きいクエリによるクラスターへの過負荷を防ぐ方法を説明します。",
    "keywords": ["クエリのサーキットブレーク", "SQL Block Rule", "Workload Policy", "テーブルのフルスキャンの制限", "大規模クエリの制御", "クラスターの安定性"]
}
---

<!-- Knowledge type: concept + procedure -->

クエリのサーキットブレークは、実行時間が長いクエリやリソースを大量に消費するクエリがクラスターの安定性に影響するのを防ぐ保護機構です。クエリが事前に設定されたリソースまたは時間の上限を超えると、自動的に終了させます。これにより、単一のクエリがシステムリソースを使い尽くしたり、ほかのワークロードを遅くしたりするのを防ぎます。

Doris には、クエリのライフサイクルの異なる段階で働く、次の二種類のサーキットブレーク方式があります。

| 項目 | SQL Block Rule（計画時にブロック） | Workload Policy（実行時に中断） |
|---------|--------------------------|---------------------------|
| 適用段階 | クエリ計画段階で、実行前にブロック | クエリ実行段階で、実行中に中断 |
| 判定基準 | 推定スキャン量、SQL パターンの照合 | 実際の実行時間、メモリ使用量、スキャン量などのリアルタイム指標 |
| 精度 | コスト推定に基づくため、誤検知が起こる可能性がある | リアルタイムの監視に基づくため、より正確 |
| 用途 | 危険であることが分かっている SQL パターンやテーブルのフルスキャンをブロック | 実行中に想定値を超えたクエリを中断 |
| 対応するステートメント | すべてのステートメント（DDL、DML） | select、insert into select、stream load、routine load |

## SQL Block Rule

<!-- Knowledge type: concept -->

SQL Block Rule は、特定のパターンに一致するステートメントを**計画段階**でブロックし、実行段階に進ませません。通常は DBA が設定し、テーブルのフルスキャンや危険な関数の呼び出しなど、既知のリスクがある操作を防ぎます。

### ルールのプロパティ

各ルールの動作と適用範囲は、次のプロパティで定義します。

| プロパティ | 説明 | 値 |
|------|------|------|
| `sql` | クエリのステートメントに一致する正規表現 | Java の正規表現文字列 |
| `sqlHash` | クエリのステートメントに一致するハッシュ値 | SQL ハッシュ値の文字列 |
| `cardinality` | スキャンを許可する行数の上限 | 正の整数 |
| `partition_num` | スキャンを許可するパーティション数の上限 | 正の整数 |
| `tablet_num` | スキャンを許可するタブレット数の上限 | 正の整数 |
| `require_partition_filter` | パーティション化された内部テーブルと Hive テーブルへのクエリに、有効なパーティションフィルターを必須とするかどうか。4.0 系では Doris 4.0.7 以降、4.1 系では Doris 4.1.4 以降でサポートされます。 | `"true"` または `"false"` |
| `global` | ルールをグローバルに適用するかどうか | `"true"`（グローバル）/ `"false"`（紐付けられたユーザーにのみ適用） |
| `enable` | ルールを有効にするかどうか | `"true"` / `"false"` |

### ユースケースと例

<!-- Knowledge type: procedure -->

#### シナリオ 1：スキャンする行数を制限する

**問題**：`SELECT * FROM t` のようなテーブルのフルスキャンは、BE の IO と CPU リソースを大量に消費します。

**対処方法**：単一テーブルからスキャンする行数に上限を設定します。しきい値を超えるクエリはブロックされます。

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

#### シナリオ 2：スキャンするパーティション数を制限する

**問題**：多数のパーティションをスキャンすると、BE の CPU 消費量が大幅に増加します。外部テーブルへのクエリでは、ネットワーク通信とメタデータ取得の負荷も増えます。通常、これはパーティションフィルター条件の欠落や記述ミスによって発生します。

**対処方法**：単一クエリがスキャンできるパーティション数の上限を設定します。

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

#### シナリオ 3：スキャンするタブレット数を制限する

**問題**：多数のタブレットをスキャンすると、BE の CPU 消費量も大幅に増加します。

**対処方法**：単一クエリがスキャンできるタブレット数の上限を設定します。

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

#### シナリオ 4：特定の SQL パターンをブロックする

**問題**：特定の関数の呼び出しや危険な操作など、一部のクエリパターンは計算量の増大や長い計画時間の原因になります。

**対処方法**：正規表現で照合し、該当するクエリをブロックします。

**例 1：特定の関数の使用をブロックする**

次のルールは、`abs` 関数を含むすべてのクエリをブロックします。

```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
    "sql"="(?i)abs\\s*\\(.+\\)",
    "global"="true",
    "enable"="true"
);
```

正規表現の説明：

- `(?i)`：大文字と小文字を区別せずに照合
- `abs`：対象の関数名
- `\\s*`：関数名と左括弧の間に任意個の空白文字を許可
- `\\(.+\\)`：関数の引数に一致

**例 2：危険な操作をブロックする**

同様に、正規表現を使って `set global`（意図しない変数の変更を防ぐため）や `truncate table`（意図しないデータ削除を防ぐため）をブロックできます。

> 正規表現は Java の規則に従います。詳しくは [Pattern のドキュメント](https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html) を参照してください。

#### シナリオ 5：特定のユーザーにルールを設定する

**問題**：デフォルトのルールはグローバルに適用されますが、特定のユーザーだけに制限を適用したい場合もあります。

**対処方法**：グローバルではないルールを作成し、対象のユーザーに紐付けます。

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

**複数のルールの管理**：

- ユーザーに複数のルールを紐付けるには、ルール名をコンマで区切ります。例：`'rule_001,rule_002'`。
- ユーザーからすべてのルールを解除するには、ルールの一覧を空文字列に設定します。例：`SET PROPERTY FOR 'root' 'SQL_block_rules' = '';`。

#### ケース 6：パーティションフィルターを必須にする

パーティション化された内部テーブルや Hive テーブルでは、パーティション列のフィルターがないと、すべてのパーティションがスキャンされる可能性があります。これらのテーブルへのクエリに、有効なパーティションフィルターを必須にできます。

```sql
CREATE SQL_BLOCK_RULE rule_require_partition_filter
PROPERTIES
(
   "require_partition_filter" = "true",
   "global" = "true",
   "enable" = "true"
);
```

ルールを有効にすると、`SELECT * FROM partitioned_table` のようなクエリはブロックされます。`SELECT * FROM partitioned_table WHERE dt = '2024-01-01'` のようにパーティション述語があるクエリは、引き続き実行できます。

### 注意事項

- **推定方法**：スキャンする行数、パーティション数、タブレット数は、計画段階で最悪の場合を想定して推定されます（パーティションプルーニングとタブレットプルーニングのみを考慮し、ほかのフィルター条件は考慮しません）。実際のスキャン量が設定値より少ないクエリもブロックされる可能性があります。
- **パフォーマンスへの影響**：正規表現による照合は計算負荷の高い処理です。ルールが多すぎたり複雑すぎたりすると FE の CPU に大きな負荷がかかるため、慎重に追加してください。
- **ルールの一時的な無効化**：ルールを削除せずに一時的に無効にするには、`"enable"` プロパティを `"false"` に変更します。

## Workload Policy

<!-- Knowledge type: concept -->

Workload Policy は、クエリの**実行中**にリアルタイムの指標を監視し、想定値を超えたクエリに対して中断や変数の調整などのアクションを適用します。SQL Block Rule が計画時の静的な推定に基づくのに対し、Workload Policy は実行中の実測データに基づいて判定するため、より正確です。

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

ポリシーは `CREATE WORKLOAD POLICY` コマンドで作成します。`admin_priv` 権限が必要です。

**基本構文**：

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

条件は、ポリシーをいつ適用するかを指定します。複数の条件はコンマ（`,`）で区切り、AND 条件として扱います。

| 条件 | 説明 |
|-----------|------|
| `username` | クエリに付随するユーザー名。Doris 4.1.3 以降、`query_time`、`be_scan_rows`、`be_scan_bytes`、`query_be_memory_bytes` などの BE 側の実行時指標と組み合わせて、`cancel_query` を実行できます。この条件で使用できる演算子は等号（`=`）のみで、ユーザー名を空にすることはできません |
| `be_scan_rows` | 単一の BE プロセス内で SQL がスキャンした行数。同時実行時の累積値 |
| `be_scan_bytes` | 単一の BE プロセス内で SQL がスキャンしたバイト数。同時実行時の累積値（単位：バイト） |
| `query_time` | 単一の BE プロセスでの SQL の実行時間（単位：ミリ秒） |
| `query_be_memory_bytes` | 単一の BE プロセス内で SQL が使用したメモリ。同時実行時の累積値（単位：バイト） |

#### アクション

アクションは、条件が満たされたときの処理を指定します。現在、各ポリシーに定義できるアクションは一つだけです。

| アクション | 説明 |
|--------|------|
| `cancel_query` | クエリをキャンセルする |

#### ポリシーのプロパティ

| プロパティ | 説明 | デフォルト |
|----------|------|--------|
| `enabled` | ポリシーを有効にするかどうか。値は `true` または `false` | `true` |
| `priority` | 優先度。範囲は 0～100 で、値が大きいほど優先度が高くなります。複数のポリシーに一致した場合、最も優先度が高いものだけが適用されます | `0` |
| `workload_group` | 紐付ける Workload Group の名前。指定した場合、その Workload Group 内のクエリにのみポリシーが適用されます。空の場合はすべてのクエリに適用されます | 空（グローバル） |

#### Workload Group への紐付け

ポリシーを特定の Workload Group に限定するには、`workload_group` プロパティで紐付けます。

```sql
CREATE WORKLOAD POLICY test_cancel_big_query
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('workload_group'='normal');
```

:::caution クラウドモードでは完全修飾形式が必要
上記の `'workload_group'='normal'` という形式は、**非クラウドモード（ストレージとコンピュートの一体型）でのみ有効**です。**クラウドモード（ストレージとコンピュートの分離型）では、完全修飾形式 `<compute_group>.<workload_group>` が必要**です。例：`'workload_group'='compute_group_a.normal'`。この形式を使用しない場合、ステートメントは `workload_group must be '<compute_group>.<workload_group>' in cloud mode` というエラーで失敗します。詳しくは [CREATE WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY) を参照してください。
:::

### 例

<!-- Knowledge type: procedure -->

#### 例 1：実行時間が長いクエリを中断する

次の監査ログでは、SQL の実行に通常 4.5 秒かかっています。

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

3 秒を超えて実行されるクエリをキャンセルするポリシーを作成します。

```sql
CREATE WORKLOAD POLICY test_cancel_3s_query
CONDITIONS(query_time > 3000)
ACTIONS(cancel_query); 
```

同じ SQL を再実行すると、クエリが中断されます。

```sql
MySQL [hits]> SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload policy,id:12345
```

#### 例 2：特定のユーザーの大規模クエリを実行中に中断する

Doris 4.1.3 以降、`username` と BE 側の実行時指標を組み合わせて、特定のユーザーのクエリだけをキャンセルできます。次のポリシーは、`test_user` が実行したクエリについて、単一の BE での実行時間が 3000 ms を超えた場合にキャンセルします。

```sql
CREATE WORKLOAD POLICY cancel_user_long_query
CONDITIONS(username='test_user', query_time > 3000)
ACTIONS(cancel_query);
```

同様に、`username` を `be_scan_rows`、`be_scan_bytes`、`query_be_memory_bytes` と組み合わせて、特定のユーザーのスキャン量や BE のメモリ使用量を制限できます。

### 注意事項
- **非同期実行による遅延**：ポリシーは非同期スレッドによって 500 ms ごとにチェックされるため、適用までに多少の遅れがあります。実行時間が非常に短いクエリは、チェック前に完了してポリシーの適用を免れる場合があります。
- **優先度の仕組み**：クエリが複数のポリシーに一致しても、優先度（`priority` の値）が最も高いものだけが適用されます。
- **変更の制限**：現在、既存のポリシーのアクションと条件を直接変更することはできません。ポリシーを削除して再作成してください。
