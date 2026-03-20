---
{
  "title": "クエリサーキットブレーカー",
  "language": "ja",
  "description": "クエリサーキットブレーキングは、長時間実行されるリソース消費の多いクエリが悪影響を与えることを防ぐために使用される保護メカニズムです"
}
---
クエリサーキットブレーキングは、長時間実行されるクエリやリソース消費の多いクエリがシステムに悪影響を与えることを防ぐ保護メカニズムです。クエリが事前定義されたリソースや時間の制限を超えた場合、サーキットブレーカーメカニズムが自動的にクエリを終了し、システムパフォーマンス、リソース使用量、および他のクエリへの悪影響を回避します。このメカニズムにより、マルチユーザー環境でのクラスターの安定性が確保され、単一のクエリがシステムリソースを枯渇させたり応答を遅くしたりすることを防ぎ、全体的な可用性と効率性を向上させます。

Dorisでは、2種類のサーキットブレーカー戦略があります：

- **計画時サーキットブレーキング**、すなわち**SQL Block Rule**は、特定のパターンにマッチするステートメントの実行を防ぐために使用されます。ブロックルールは、DDLやDMLを含むあらゆるステートメントに適用されます。通常、ブロックルールはデータベース管理者（DBA）によってクラスターの安定性を向上させるために設定されます。例えば、

  - クエリが過度に多くの行のデータをスキャンすることを防ぐ
  - クエリが過度に多くのパーティションをスキャンすることを防ぐ
  - グローバル変数を変更するステートメントを防ぎ、クラスター設定への偶発的な変更を回避する
  - 通常過度なリソースを消費するクエリパターンを防ぐ

- **ランタイムサーキットブレーキング**、すなわち**Workload Policy**は、実行時にクエリの実行時間、スキャンされるデータ量、メモリ消費をリアルタイムで監視し、ルールベースのクエリサーキットブレーキングを実装します。

## SQL Block Rule

ブロックパターンによって、以下に分類できます：

- スキャン行数ブロックルール
- スキャンパーティション数ブロックルール
- スキャンbucket数ブロックルール
- クエリステートメント正規表現マッチングブロックルール
- クエリステートメントハッシュ値マッチングブロックルール

ブロッキングルールは、ブロッキングの範囲によって分類できます：

- グローバルレベルブロッキングルール
- ユーザーレベルブロッキングルール

### 使用方法

#### グローバルレベルブロッキングルール

```sql
CREATE SQL_BLOCK_RULE rule_001
PROPERTIES (
  "sql"="select \\* from t",
  "global" = "true",
  "enable" = "true"
)
```
このようにして、グローバルレベルのブロッキングルールを作成しました。ルール名は rule_001 です。正規表現 `select \\* from t` にマッチするすべてのクエリステートメントをブロックするクエリステートメント正規表現マッチングルールが設定されています。

これはグローバルレベルのブロッキングルールであるため、上記の正規表現にマッチするステートメントを実行するすべてのユーザーがブロックされます。例えば：

```sql
MySQL root@127.0.0.1:test> select * from t;
(1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
```
#### ユーザーレベルブロッキングルール

```sql
CREATE SQL_BLOCK_RULE rule_001
PROPERTIES (
  "sql"="select * from t",
  "global" = "false",
  "enable" = "true"
)
```
グローバルレベルのblocking rulesとは異なり、ユーザーレベルのblocking rulesは指定されたユーザーにのみ適用されます。blocking ruleを作成する際、プロパティ"global"を"false"に設定します。すると、このblocking ruleはユーザーレベルのblocking ruleとして扱われます。

ユーザーレベルのblocking rulesを有効にするには、このruleを使用する必要があるユーザーに対して対応するプロパティも設定する必要があります。例えば：

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
- ユーザーに対して複数のユーザーレベルブロッキングルールを追加したい場合は、ルールリストにすべてのルール名をカンマ区切りで記載してください。
- ユーザーに対してすべてのユーザーレベルブロッキングルールを削除したい場合は、ルールリストを空の文字列に設定してください。

#### その他の操作
ブロッキングルールを変更または削除する必要がある場合は、ブロッキングルールのSQLマニュアルを参照してください。

### 使用例
以下のシナリオで使用できます：

* 指定された行数を超えるスキャンをブロック
* 指定されたパーティション数を超えるスキャンをブロック
* 指定されたバケット数を超えるスキャンをブロック
* 特定のパターンを持つクエリをブロック

#### 指定された行数を超えるスキャンをブロック
データのスキャンはBEのIOとCPUリソースを大幅に消費します。そのため、不要なデータスキャンはクラスタの安定性に大きな課題をもたらします。日常的な使用では、`SELECT * FROM t`のような盲目的なフルテーブルスキャン操作がしばしば発生します。このようなクエリがクラスタにダメージを与えることを防ぐため、単一のテーブルで単一のクエリがスキャンする行数に上限を設定することができます。

```sql
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
   "cardinality" = "1000",
   "global" = "true",
   "enable" = "true"
);
```
上記のルールが設定されている場合、単一のテーブルスキャンが1000行を超えると、クエリの実行が禁止されます。
スキャンされる行数の計算は実行フェーズではなく計画フェーズで行われるため、注意が必要です。したがって、行数を計算する際は、partitionとbucketのpruningのみが考慮され、その他のフィルタリング条件がスキャンされる行数に与える影響は考慮されません。つまり、最悪ケースのシナリオが考慮されます。そのため、実際にスキャンされる行数が設定値より少ないクエリもブロックされる可能性があります。

#### 指定されたpartition数を超えるデータのスキャンを防ぐ
あまりにも多くのpartitionをスキャンすると、BEのCPU消費量が大幅に増加する可能性があります。さらに、クエリが外部テーブルに対するものである場合、大幅なネットワークオーバーヘッドとメタデータ取得オーバーヘッドが発生する可能性が高くなります。日常的な使用では、これはpartition列のフィルタリング条件を書き忘れるか、誤って記述することが原因であることが多いです。このようなクエリがクラスタに損害を与えることを防ぐため、単一のテーブルに対する単一のクエリでスキャンされるpartition数の上限を設定できます。

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
スキャンされるパーティション数の計算は、実行フェーズではなく計画フェーズで完了することに注意してください。したがって、不完全なパーティションpruningにより、より多くのパーティションが保持される場合があります。そのため、実際にスキャンされるパーティション数が設定値より少ないクエリもブロックされる可能性があります。

#### 過剰なBucket数のデータスキャンを防止する
あまりにも多くのbucketをスキャンすると、BEのCPU消費量が大幅に増加する可能性があります。このようなクエリがクラスタに害を与えることを防ぐために、単一のクエリが単一テーブルでスキャンできるパーティション数の上限を設定できます。

```sql
CREATE SQL_BLOCK_RULE rule_teblet_num 
PROPERTIES
(
   "tablet_num" = "200",
   "global" = "true",
   "enable" = "true"
);
```
上記のルールが設定されている場合、単一テーブルでスキャンされるバケット数が200を超える場合、クエリの実行は禁止されます。

スキャンされるバケット数の計算は実行フェーズではなく、プランニングフェーズで行われることに注意することが重要です。そのため、不完全なバケットプルーニングにより、より多くのパーティションが保持される可能性があります。結果として、実際のスキャンバケット数が設定値より少ないクエリもブロックされる場合があります。

#### 特定のパターンを持つクエリのブロック

高い計算複雑度や長いプランニング時間など、さまざまな理由により、特定のパターンを使用するクエリをブロックしたい場合があります。

例えば、`abs`関数をブロックする場合です。この目的を達成するために、以下の正規表現ブロックルールを使用できます。

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

同様に、類似の方法で `set global` をブロックして意図しない変数変更を防いだり、`truncate table` をブロックして意図しないデータ削除を防いだりできます。

### FAQ

#### Q: 正規表現ブロックルールはクラスタに副作用がありますか？
A: はい。正規表現マッチングは計算集約的です。複雑な正規表現や過度に多くの正規表現ブロックルールを使用する場合、FEのCPU負荷を大幅に増加させる可能性があります。そのため、正規表現ブロックルールは慎重に追加してください。必要でない限り、複雑な正規表現の使用は避けてください。

#### Q: ブロックルールを一時的に無効にできますか？
A: はい。ブロックルールの「enable」プロパティを「false」に設定して、ブロックルールを変更できます。

#### Q: ブロックルールの正規表現はどの標準を使用しますか？
A: ブロックルールの正規表現はJavaの正規表現構文を使用します。一般的な表現についてはSQL構文マニュアルを参照できます。完全なマニュアルは https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html で確認できます。

## Workload Policy

SQL Block Ruleは計画時におけるサーキットブレイクのための設定ですが、計画時のコスト計算が不正確な場合（特に非常に複雑なクエリの場合、正確な推定が困難）があるため、ルールが効果的でないか誤検出につながる可能性があります。Workload Policyは、クエリ実行中の特定のメトリクスをリアルタイムで監視し、実行時の状態が期待に合わないクエリをサーキットブレイクすることで、この制限に対処します。これにより、予期しない大きなクエリが過度なリソースを消費してクラスタの安定性に影響を与えることを防ぎます。一般的な実行時監視メトリクスには以下があります：

* クエリ実行時間
* BE あたりのスキャンされた行数
* BE あたりのスキャンされたバイト数
* BE あたりのメモリ使用量

### バージョン注記

Doris バージョン 2.1 以降、Workload Policy を使用して大きなクエリのサーキットブレイクを実装できます。

| Version                 | since 2.1 |
|--------------------|-----------|
| select             | yes       |
| insert into select | yes       |
| insert into values | no        |
| stream load        | yes       |
| routine load       | yes       |
| backup             | no        |
| compaction         | no        |

### Workload Policy の作成
`CREATE WORKLOAD Policy` コマンドを使用してリソース管理ポリシーを作成します。

以下の例では、`test_cancel_Policy` という名前の Policy を作成し、クラスタで1000ms以上実行されているクエリをキャンセルします。現在の状態は有効です。Workload Policy を作成するには `admin_priv` 権限が必要です。

```sql
create workload policy test_cancel_Policy
Conditions(query_time > 1000)
Actions(cancel_query) 
properties('enabled'='true'); 
```
Workload Policyを作成する際は、以下を指定する必要があります：

- **Condition**はポリシーのトリガー条件を表します。複数のConditionをカンマ","で連結して「AND」関係を表すことができます。上記の例では、`query_time > 1000`はクエリ時間が1秒を超えた場合にPolicyがトリガーされることを示しています。現在サポートされているConditionは以下の通りです：

| Conditions            | Description                                                                                                 |
|-----------------------|-------------------------------------------------------------------------------------------------------------|
| username              | クエリが持つユーザー名。FEでの`set_session_variable` Actionのみをトリガーします。                   |
| be_scan_rows          | 単一のBEプロセスでSQLによってスキャンされた行数。SQLがBE上で並行実行される場合は、複数の並行実行の累積値です。 |
| be_scan_bytes         | 単一のBEプロセスでSQLによってスキャンされたバイト数。SQLがBE上で並行実行される場合は、複数の並行実行の累積値で、単位はバイトです。 |
| query_time            | 単一のBEプロセスでのSQLの実行時間、単位はミリ秒です。                                             |
| query_be_memory_bytes | 単一のBEプロセスでのSQLのメモリ使用量。SQLがBE上で並行実行される場合は、複数の並行実行の累積値で、単位はバイトです。 |

- **Action**は条件がトリガーされた際に実行されるアクションを表します。現在、Policyは1つのActionのみを定義できます（`set_session_variable`を除く）。上記の例では、`cancel_query`はクエリをキャンセルすることを示しています。現在サポートされているActionは以下の通りです：

| Actions                | Description                                                                                                      |
|------------------------|------------------------------------------------------------------------------------------------------------------|
| cancel_query           | クエリをキャンセルします。                                                                                                 |
| set_session_variable   | `set session variable`文をトリガーします。単一のポリシーは複数の`set_session_variable`オプションを持つことができ、現在は`username` ConditionによってFEでのみトリガーされます。 |

- **Properties**は現在のPolicyの属性を定義し、有効かどうかと優先度を含みます。

| Properties      | Description                                                                                                                                                 |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| enabled         | `true`または`false`で、デフォルトは`true`、Policyが有効であることを示します。`false`はPolicyが無効であることを示します。                                      |
| priority        | 0から100の範囲の整数で、デフォルトは0、Policyの優先度を表します。値が高いほど優先度が高くなります。この属性は主に、クエリが複数のPolicyにマッチする場合に、最も優先度の高いPolicyのみが選択されることを保証します。 |
| workload_group  | 現在、Policyは1つのworkload groupにバインドでき、このPolicyが特定のWorkload Groupからのクエリにのみ適用されることを意味します。デフォルトは空で、全てのクエリに適用されることを意味します。 |

### Workload PolicyをWorkload Groupにバインドする

デフォルトでは、Workload Policyはサポートされる全てのクエリに適用されます。Policyが特定のWorkload Groupのみを対象とするように指定したい場合は、`workload_group`オプションを通じてWorkload Groupをバインドする必要があります。文は以下の通りです：

```sql
create workload policy test_cancel_big_query
Conditions(query_time > 1000)
Actions(cancel_query) 
properties('workload_group'='normal')
```
### 重要な注意事項
- 同一のPolicyのConditionsとActionsは、両方ともFEまたは両方ともBEのいずれかである必要があります。例えば、`set_session_variable`と`cancel_query`を同一のPolicy内で設定することはできません。Conditions `be_scan_rows`と`username`を同一のPolicy内で設定することはできません。
- 現在、Policyは固定時間間隔で非同期スレッドによって実行されるため、ポリシー実行に一定の遅延が生じます。例えば、ユーザーがスキャンされた行数が1,000,000を超えた際にクエリをキャンセルするポリシーを設定し、その時点でクラスタリソースが比較的アイドル状態である場合、キャンセルポリシーが有効になる前にクエリが完了する可能性があります。現在の間隔は500msであり、この間隔より短い実行時間のクエリはポリシーチェックを回避する可能性があります。
- 現在サポートされているロードタイプには、select/insert、select/stream load、broker load、routine loadが含まれます。
- 単一のクエリは複数のPolicyにマッチする可能性がありますが、最も優先度の高いPolicyのみが有効になります。
- ActionsとConditionsの変更は現在サポートされていません。削除して再作成することによってのみ変更できます。

### Workload Policyデモンストレーション

#### 1. Session Variable変更テスト
AdminアカウントのセッションVariable内の並行性関連パラメータの変更を試行します。

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
3秒以上実行されるクエリを回路遮断するテスト。以下は、ckbenchのq29の正常実行の監査ログで、このSQLの完了に4.5秒かかったことを示している。

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
3秒を超えて実行されるクエリをキャンセルするPolicyを作成します。

```sql
create workload Policy test_cancel_3s_query
Conditions(query_time > 3000)
Actions(cancel_query) 
```
SQLを再実行すると、SQL実行で直接エラーが報告されることが確認できます。

```sql
mySQL [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload Policy,id:12345
```
