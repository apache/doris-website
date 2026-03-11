---
{
  "title": "クエリサーキットブレーカー",
  "language": "ja",
  "description": "クエリ回路ブレーカーは、長時間実行されるリソース消費の多いクエリが悪影響を与えることを防ぐために使用される保護メカニズムです"
}
---
クエリサーキットブレーキングは、長時間実行されるクエリやリソースを大量消費するクエリがシステムに悪影響を与えることを防ぐ保護メカニズムです。クエリが事前定義されたリソースまたは時間制限を超えると、サーキットブレーカーメカニズムが自動的にクエリを終了し、システムパフォーマンス、リソース使用量、および他のクエリへの悪影響を回避します。このメカニズムは、マルチユーザー環境でクラスターの安定性を確保し、単一のクエリがシステムリソースを枯渇させたり応答を遅くしたりすることを防ぎ、全体的な可用性と効率性を向上させます。

Dorisには、2種類のサーキットブレーカー戦略があります：

- **プランニング時サーキットブレーキング**、すなわち**SQL Block Rule**は、特定のパターンに一致するステートメントの実行を防ぐために使用されます。ブロックルールはDDLおよびDMLを含む任意のステートメントに適用されます。通常、ブロックルールはデータベース管理者（DBA）によってクラスターの安定性を向上させるために設定されます。例えば、

  - クエリが過度に多くのデータ行をスキャンすることを防ぐ
  - クエリが過度に多くのパーティションをスキャンすることを防ぐ
  - グローバル変数を変更するステートメントを防ぎ、クラスター設定の偶発的な変更を回避する
  - 通常過度にリソースを消費するクエリパターンを防ぐ

- **ランタイムサーキットブレーキング**、すなわち**Workload Policy**は、実行時にクエリの実行時間、スキャンされるデータ量、メモリ消費をリアルタイムで監視し、ルールベースのクエリサーキットブレーキングを実装します。

## SQL Block Rule

ブロックパターンに応じて、以下に分類できます：

- スキャン行数ブロックルール
- スキャンパーティション数ブロックルール
- スキャンバケット数ブロックルール
- クエリステートメントの正規表現マッチングブロックルール
- クエリステートメントのハッシュ値マッチングブロックルール

ブロッキングルールは、ブロッキングの範囲に応じて分類できます：

- グローバルレベルブロッキングルール
- ユーザーレベルブロッキングルール

### 使用法

#### グローバルレベルブロッキングルール

```sql
CREATE SQL_BLOCK_RULE rule_001
PROPERTIES (
  "sql"="select \\* from t",
  "global" = "true",
  "enable" = "true"
)
```
このようにして、グローバルレベルのブロッキングルールを作成しました。このルールはrule_001という名前です。正規表現`select \\* from t`にマッチするすべてのクエリ文をブロックするクエリ文正規表現マッチングルールが設定されています。

これはグローバルレベルのブロッキングルールであるため、上記の正規表現にマッチする文を実行するすべてのユーザーがブロックされます。例えば：

```sql
MySQL root@127.0.0.1:test> select * from t;
(1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
```
#### ユーザーレベルのブロッキングルール

```sql
CREATE SQL_BLOCK_RULE rule_001
PROPERTIES (
  "sql"="select * from t",
  "global" = "false",
  "enable" = "true"
)
```
グローバルレベルのブロッキングルールとは異なり、ユーザーレベルのブロッキングルールは指定されたユーザーにのみ適用されます。ブロッキングルールを作成する際に、プロパティ"global"を"false"に設定します。そうすると、このブロッキングルールはユーザーレベルのブロッキングルールとみなされます。

ユーザーレベルのブロッキングルールを有効にするには、このルールを使用する必要があるユーザーに対応するプロパティも設定する必要があります。例：

```sql
set property for 'root' 'SQL_block_rules' = 'rule_001';
```
したがって、上記の設定後、rootユーザーがクエリを実行すると、rule_001という名前のブロッキングルールが適用されます。

```sql
MySQL root@127.0.0.1:test> set property for 'root' 'SQL_block_rules' = '';
Query OK, 0 rows affected
Time: 0.018s
MySQL root@127.0.0.1:test> select * from t;
+----+----+
| id | c1 |
+----+----+
| 1  | 1  |
+----+----+

1 row in set
Time: 0.027s
MySQL root@127.0.0.1:test> set property for 'root' 'SQL_block_rules' = 'rule_001';
Query OK, 0 rows affected
Time: 0.008s
MySQL root@127.0.0.1:test> select * from t;
(1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
```
- ユーザーに対して複数のユーザーレベルブロッキングルールを追加したい場合は、ルールリストにすべてのルール名をカンマで区切って記載してください。
- ユーザーのすべてのユーザーレベルブロッキングルールを削除したい場合は、ルールリストを空文字列に設定してください。

#### その他の操作
ブロッキングルールを変更または削除する必要がある場合は、ブロッキングルールのSQLマニュアルを参照してください。

### 使用事例
以下のシナリオで使用できます：

* 指定された行数を超えるスキャンをブロック
* 指定されたパーティション数を超えるスキャンをブロック
* 指定されたバケット数を超えるスキャンをブロック
* 特定のパターンを持つクエリをブロック

#### 指定された行数を超えるスキャンのブロック
データのスキャンはBEのIOおよびCPUリソースを大幅に消費します。そのため、不要なデータスキャンはクラスターの安定性に対する大きな課題となります。日常的な使用では、`SELECT * FROM t`のような盲目的なフルテーブルスキャン操作がしばしば発生します。このようなクエリがクラスターに損害を与えることを防ぐために、単一のテーブルで単一のクエリによってスキャンされる行数の上限を設定できます。

```sql
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
   "cardinality" = "1000",
   "global" = "true",
   "enable" = "true"
);
```
上記のルールが設定されている場合、単一のテーブルスキャンが1000行を超える場合、クエリの実行は禁止されます。
スキャンされる行数の計算は実行フェーズではなく計画フェーズで実行されるため、注意が必要です。そのため、行数を計算する際は、partitionとbucketのpruningのみが考慮され、スキャンされる行数に対する他のフィルタリング条件の影響は考慮されません。つまり、最悪の場合のシナリオが考慮されます。そのため、実際にスキャンされる行数が設定値より少ないクエリもブロックされる可能性があります。

#### 指定されたpartition数を超えるデータのスキャンを防止
あまりにも多くのpartitionをスキャンすると、BEのCPU消費量が大幅に増加する可能性があります。さらに、クエリが外部テーブルに対するものである場合、大幅なネットワークオーバーヘッドとメタデータ取得オーバーヘッドが発生する可能性がより高くなります。日常的な使用では、これはしばしばpartition列のフィルタリング条件を書き忘れたり、誤って書いたりすることによるものです。このようなクエリがクラスターに損害を与えることを防ぐために、単一のテーブルに対する単一のクエリでスキャンされるpartition数の上限を設定できます。

```sql
CREATE SQL_BLOCK_RULE rule_part_num 
PROPERTIES
(
   "partition_num" = "30",
   "global" = "true",
   "enable" = "true"
);
```
上記のルールが設定されている場合、単一テーブルでスキャンされるパーティション数が30を超えると、クエリの実行が禁止されます。
スキャンされるパーティション数の計算は実行フェーズではなく、プランニングフェーズで完了することに注意が必要です。そのため、不完全なパーティションプルーニングによってより多くのパーティションが保持される場合があります。したがって、実際にスキャンされるパーティション数が設定値未満のクエリもブロックされる可能性があります。

#### 過剰なバケット数でのデータスキャンを防止
あまりにも多くのバケットをスキャンすると、BEのCPU消費が大幅に増加する可能性があります。このようなクエリがクラスターに害を与えることを防ぐため、単一のクエリが単一のテーブルでスキャンできるパーティション数に上限を設定できます。

```sql
CREATE SQL_BLOCK_RULE rule_teblet_num 
PROPERTIES
(
   "tablet_num" = "200",
   "global" = "true",
   "enable" = "true"
);
```
上記のルールが設定されている場合、単一テーブルでスキャンされるバケット数が200を超えると、クエリの実行が禁止されます。

スキャンされたバケット数の計算は実行フェーズではなく計画フェーズで行われることに注意することが重要です。そのため、不完全なバケットプルーニングにより、より多くのパーティションが保持される可能性があります。その結果、実際のスキャンされたバケット数が設定値未満のクエリもブロックされる可能性があります。

#### 特定パターンのクエリをブロックする

高い計算複雑度や長い計画時間などの様々な理由により、特定のパターンを使用するクエリをブロックしたい場合があります。

例えば、`abs`関数をブロックする場合、以下の正規表現ブロックルールを使用してこの目的を達成できます。

```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
  "sql"="(?i)abs\\s*\\(.+\\)",
  "global"="true",
  "enable"="true"
);
```
上記の正規表現において：

- `(?i)` は大文字小文字を区別しないマッチングを示します。
- `abs` はブロック対象の関数です。
- `\s*` は `abs` と左括弧の間に任意の量の空白文字が許可されることを意味します。
- `\(.+\)` は関数のパラメータにマッチします。

同様に、類似の方法を使用して `set global` をブロックして意図しない変数の変更を防いだり、`truncate table` をブロックして意図しないデータ削除を防ぐことができます。

### FAQ

#### Q: 正規表現ブロッキングルールはクラスターに副作用がありますか？
A: はい。正規表現マッチングは計算集約的です。複雑な正規表現や過度に多いregexブロッキングルールを使用すると、FEのCPU負荷が大幅に増加する可能性があります。したがって、regexブロッキングルールは慎重に追加してください。必要でない限り、複雑な正規表現の使用は避けてください。

#### Q: ブロッキングルールを一時的に無効化できますか？
A: はい。ブロッキングルールの「enable」プロパティを「false」に設定して修正できます。

#### Q: ブロッキングルールの正規表現はどの標準を使用していますか？
A: ブロッキングルールの正規表現はJavaの正規表現構文を使用しています。一般的な表現についてはSQL構文マニュアルを参照してください。完全なマニュアルは https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html で確認できます。

## Workload Policy

SQL Block Ruleは計画中のサーキットブレイク用の設定ですが、計画中のコスト計算が不正確になる場合があるため（特に非常に複雑なクエリの場合、正確な推定が困難になるため）、ルールが効果的でなかったり、誤検出が発生する可能性があります。Workload Policyはこの制限に対処し、クエリ実行中に特定のメトリクスのリアルタイム監視を可能にし、実行時の状態が期待を満たさないクエリをサーキットブレイクします。これにより、予期しない大きなクエリが過度なリソースを消費してクラスターの安定性に影響を与えることを防ぎます。一般的な実行時監視メトリクスには以下が含まれます：

* クエリ実行時間
* BE毎のスキャンされた行数
* BE毎のスキャンされたバイト数
* BE毎のメモリ使用量

### バージョン注記

Dorisバージョン2.1以降、Workload Policyを使用して大きなクエリのサーキットブレイクを実装できます。

| Version                 | since 2.1 |
|--------------------|-----------|
| select             | yes       |
| insert into select | yes       |
| insert into values | no        |
| stream load        | yes       |
| routine load       | yes       |
| backup             | no        |
| compaction         | no        |

### Workload Policyの作成
`CREATE WORKLOAD Policy` コマンドを使用してリソース管理ポリシーを作成します。

以下の例では、`test_cancel_Policy` という名前のPolicyを作成し、1000ms以上実行されているクラスター内のクエリをキャンセルします。現在のステータスは有効です。Workload Policyの作成には `admin_priv` 権限が必要です。

```sql
create workload policy test_cancel_Policy
Conditions(query_time > 1000)
Actions(cancel_query) 
properties('enabled'='true'); 
```
Workload Policyを作成する際は、以下を指定する必要があります：

- **Condition**はポリシーのトリガー条件を表します。複数のConditionはカンマ「,」を使用してリンクでき、「AND」関係を表します。上記の例では、`query_time > 1000`はクエリ時間が1秒を超えた場合にPolicyがトリガーされることを示します。現在サポートされているConditionは以下の通りです：

| Conditions            | 説明                                                                                                 |
|-----------------------|-------------------------------------------------------------------------------------------------------------|
| username              | クエリによって運ばれるユーザー名。FEでの`set_session_variable` Actionのみをトリガーします。                   |
| be_scan_rows          | 単一のBEプロセスでSQLがスキャンした行数。SQLがBE上で並行実行される場合、複数の並行実行の累積値です。 |
| be_scan_bytes         | 単一のBEプロセスでSQLがスキャンしたバイト数。SQLがBE上で並行実行される場合、複数の並行実行の累積値で、バイト単位です。 |
| query_time            | 単一のBEプロセスでのSQLの実行時間。ミリ秒単位です。                                             |
| query_be_memory_bytes | 単一のBEプロセスでのSQLのメモリ使用量。SQLがBE上で並行実行される場合、複数の並行実行の累積値で、バイト単位です。 |

- **Action**は条件がトリガーされたときに実行されるアクションを表します。現在、Policyは1つのActionのみを定義できます（`set_session_variable`を除く）。上記の例では、`cancel_query`はクエリをキャンセルすることを示します。現在サポートされているActionは以下の通りです：

| Actions                | 説明                                                                                                      |
|------------------------|------------------------------------------------------------------------------------------------------------------|
| cancel_query           | クエリをキャンセルします。                                                                                                 |
| set_session_variable   | `set session variable`ステートメントをトリガーします。単一のポリシーは複数の`set_session_variable`オプションを持つことができ、現在は`username` ConditionによってFEでのみトリガーされます。 |

- **Properties**は現在のPolicyの属性を定義し、有効かどうかとその優先度を含みます。

| Properties      | 説明                                                                                                                                                 |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| enabled         | `true`または`false`を指定でき、デフォルトは`true`で、Policyが有効であることを示します。`false`はPolicyが無効であることを示します。                                      |
| priority        | 0から100の範囲の整数で、デフォルトは0、Policyの優先度を表します。値が高いほど優先度が高くなります。この属性は主に、クエリが複数のPolicyにマッチした場合に、最も優先度の高いPolicyのみが選択されることを保証します。 |
| workload_group  | 現在、Policyは1つのworkload groupにバインドでき、このPolicyが特定のWorkload Groupからのクエリにのみ適用されることを意味します。デフォルトは空で、すべてのクエリに適用されることを意味します。 |

### Workload PolicyをWorkload Groupにバインドする

デフォルトでは、Workload Policyはサポートされているすべてのクエリに適用されます。Policyが特定のWorkload Groupのみを対象とするように指定したい場合は、`workload_group`オプションを通じてWorkload Groupをバインドする必要があります。ステートメントは以下の通りです：

```sql
create workload policy test_cancel_big_query
Conditions(query_time > 1000)
Actions(cancel_query) 
properties('workload_group'='normal')
```
### 重要な注意事項
- 同一のPolicyのConditionsとActionsは、両方ともFEまたは両方ともBEのいずれかである必要があります。例えば、`set_session_variable`と`cancel_query`は同一のPolicy内で設定することはできません。Conditions `be_scan_rows`と`username`は同一のPolicy内で設定することはできません。
- 現在、Policyは固定時間間隔で非同期スレッドによって実行されるため、ポリシー実行に一定の遅延が生じます。例えば、ユーザーがスキャンされた行数が1,000,000を超えた時にクエリをキャンセルするポリシーを設定し、その時点でクラスターリソースが比較的アイドル状態の場合、キャンセルポリシーが有効になる前にクエリが完了する可能性があります。現在の間隔は500msであり、この間隔より短い実行時間のクエリはポリシーチェックをバイパスする可能性があります。
- 現在サポートされているロードタイプには、select/insert、select/stream load、broker load、およびroutine loadが含まれます。
- 単一のクエリは複数のPolicyにマッチする可能性がありますが、最も高い優先度を持つPolicyのみが有効になります。
- ActionsとConditionsの変更は現在サポートされていません。削除と再作成によってのみ変更できます。

### Workload Policy デモンストレーション

#### 1. セッション変数変更テスト
Adminアカウントのセッション変数で同時実行関連パラメータの変更を試行します。

```sql
-- log on admin to check variables
show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 8     | 8             | 0       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.00 sec)

-- Create a Policy to modify the concurrency parameters of the admin account.
create workload Policy test_set_var_Policy
Conditions(username='admin')
Actions(set_session_variable 'parallel_fragment_exec_instance_num=1') 

-- After some time, check the admin account's parameters again.
show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 1     | 8             | 1       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.01 sec)
```
#### 2. Big Query Circuit Breaker Test
3秒を超えて実行されるクエリをサーキットブレークするテスト。以下は、ckbenchのq29の正常実行の監査ログで、このSQLが完了するまでに4.5秒かかったことを示している。

```sql
mySQL [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
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
3秒以上実行されるクエリをキャンセルするPolicyを作成します。

```sql
create workload Policy test_cancel_3s_query
Conditions(query_time > 3000)
Actions(cancel_query) 
```
SQLを再実行すると、SQL実行が直接エラーを報告することが確認できます。

```sql
mySQL [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload Policy,id:12345
```
