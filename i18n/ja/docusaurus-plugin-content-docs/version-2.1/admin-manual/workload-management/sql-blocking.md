---
{
  "title": "クエリサーキットブレーカー",
  "language": "ja",
  "description": "クエリ回路遮断は、長時間実行されるリソース消費の多いクエリが悪影響を与えることを防ぐために使用される保護メカニズムです"
}
---
クエリ回路ブレーカーは、長時間実行されるリソース消費の大きいクエリがシステムに悪影響を与えることを防ぐための保護メカニズムです。クエリが事前定義されたリソースまたは時間制限を超えた場合、回路ブレーカーメカニズムが自動的にクエリを終了し、システムパフォーマンス、リソース使用量、および他のクエリへの悪影響を回避します。このメカニズムは、マルチユーザー環境でクラスターの安定性を確保し、単一のクエリがシステムリソースを枯渇させたり応答を遅くしたりすることを防ぎ、全体的な可用性と効率性を向上させます。

Dorisには、2種類の回路ブレーカー戦略があります：

- **プランニング時回路ブレーカー**、すなわち **SQL Block Rule** は、特定のパターンに一致するステートメントの実行を防ぐために使用されます。ブロックルールはDDLとDMLを含むあらゆるステートメントに適用されます。通常、ブロックルールはデータベース管理者（DBA）によってクラスターの安定性を向上させるために設定されます。例えば、

  - クエリが過剰な行数のデータをスキャンすることを防ぐ
  - クエリが過剰なパーティション数をスキャンすることを防ぐ
  - グローバル変数を変更するステートメントを防いで、クラスター設定への偶発的な変更を回避する
  - 通常過剰なリソースを消費するクエリパターンを防ぐ

- **ランタイム回路ブレーカー**、すなわち **Workload Policy** は、実行時にクエリの実行時間、スキャンされるデータ量、およびメモリ消費をリアルタイムで監視し、ルールベースのクエリ回路ブレーカーを実装します。

## SQL Block Rule

ブロックパターンに応じて、次のように分類できます：

- スキャン行数ブロックルール
- スキャンパーティション数ブロックルール
- スキャンbucket数ブロックルール
- クエリステートメントregexマッチングブロックルール
- クエリステートメントハッシュ値マッチングブロックルール

ブロッキングルールは、ブロッキングの範囲に応じて分類できます：

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
このようにして、グローバルレベルのブロッキングルールを作成しました。このルールの名前は rule_001 です。正規表現 `select \\* from t` にマッチするすべてのクエリ文をブロックするクエリ文regex マッチングルールが設定されています。

これはグローバルレベルのブロッキングルールであるため、上記の正規表現にマッチする文を実行するユーザーはすべてブロックされます。例えば：

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
グローバルレベルのブロッキングルールとは異なり、ユーザーレベルのブロッキングルールは指定されたユーザーにのみ適用されます。ブロッキングルールを作成する際に、プロパティ"global"を"false"に設定します。そうすると、このブロッキングルールはユーザーレベルのブロッキングルールとして扱われます。

ユーザーレベルのブロッキングルールを有効にするには、このルールを使用する必要があるユーザーに対応するプロパティも設定する必要があります。例えば：

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
- ユーザーに対して複数のユーザーレベルブロッキングルールを追加したい場合は、ルールリストにすべてのルール名をカンマで区切ってリストしてください。
- ユーザーに対してすべてのユーザーレベルブロッキングルールを削除したい場合は、ルールリストを空文字列に設定してください。

#### その他の操作
ブロッキングルールを変更または削除する必要がある場合は、ブロッキングルールのSQLマニュアルを参照してください。

### 使用例
以下のシナリオを使用できます：

* 指定された行数を超えるスキャンのブロック
* 指定されたパーティション数を超えるスキャンのブロック
* 指定されたバケット数を超えるスキャンのブロック
* 特定のパターンを持つクエリのブロック

#### 指定された行数を超えるスキャンのブロック
データのスキャンはBEのIOおよびCPUリソースを大幅に消費します。そのため、不要なデータスキャンはクラスタの安定性に対する大きな課題となります。日常的な使用では、`SELECT * FROM t`のような盲目的なフルテーブルスキャン操作がしばしば発生します。そのようなクエリがクラスタに損害を与えることを防ぐため、単一のテーブルで単一のクエリによってスキャンされる行数の上限を設定できます。

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
スキャンされる行数の計算は実行フェーズではなくプランニングフェーズで行われることに注意が必要です。そのため、行数を計算する際は、パーティションとバケットのプルーニングのみが考慮され、他のフィルタリング条件がスキャンされる行数に与える影響は考慮されません。つまり、最悪のケースが考慮されます。そのため、実際にスキャンされる行数が設定値より少ないクエリもブロックされる可能性があります。

#### 指定されたパーティション数を超えるデータのスキャンを防止
あまりに多くのパーティションをスキャンすると、BEのCPU消費量が大幅に増加する可能性があります。さらに、クエリが外部テーブルに対するものである場合、大きなネットワークオーバーヘッドとメタデータ取得オーバーヘッドが発生する可能性が高くなります。日常的な使用では、これはパーティション列のフィルタリング条件を書き忘れたり、間違って書いたりすることが原因であることが多いです。このようなクエリがクラスターに損害を与えることを防ぐため、単一のテーブルに対する単一のクエリでスキャンされるパーティション数に上限を設定できます。

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
スキャンされるパーティション数の計算は実行フェーズではなく計画フェーズで完了することに注意してください。そのため、不完全なパーティションプルーニングにより、より多くのパーティションが保持される場合があります。したがって、実際にスキャンされるパーティション数が設定値より少ないクエリもブロックされる可能性があります。

#### 過剰なBucket数でのデータスキャンを防ぐ
あまりに多くのbucketをスキャンすると、BEのCPU消費量が大幅に増加する可能性があります。このようなクエリがクラスターに害を与えることを防ぐため、単一のクエリが単一テーブルでスキャンできるパーティション数に上限を設定できます。

```sql
CREATE SQL_BLOCK_RULE rule_teblet_num 
PROPERTIES
(
   "tablet_num" = "200",
   "global" = "true",
   "enable" = "true"
);
```
上記のルールが設定されている場合、単一のテーブルでスキャンされるバケット数が200を超えると、クエリの実行が禁止されます。

スキャンされるバケット数の計算は、実行フェーズではなく計画フェーズで行われることに注意することが重要です。そのため、不完全なバケットプルーニングにより、より多くのパーティションが保持される可能性があります。その結果、実際のスキャンバケット数が設定値未満のクエリもブロックされる可能性があります。

#### 特定のパターンを持つクエリのブロック

計算の複雑さが高い、計画時間が長いなど、さまざまな理由で、特定のパターンを使用するクエリをブロックしたい場合があります。

例えば、`abs`関数をブロックする場合。この目的を達成するために、以下の正規表現ブロックルールを使用できます。

```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
  "sql"="(?i)abs\\s*\\(.+\\)",
  "global"="true",
  "enable"="true"
);
```
上記の正規表現において：

- `(?i)` は大文字小文字を区別しない一致を示します。
- `abs` はブロック対象の関数です。
- `\s*` は `abs` と左括弧の間に任意の量の空白を許可することを示します。
- `\(.+\)` は関数のパラメータにマッチします。

同様に、類似の方法で `set global` をブロックして意図しない変数変更を防いだり、`truncate table` をブロックして意図しないデータ削除を防ぐことができます。

### FAQ

#### Q: 正規表現ブロック規則はクラスターに副作用をもたらしますか？
A: はい。正規表現マッチングは計算集約的です。複雑な正規表現を使用したり、regexブロック規則を過度に使用すると、FEのCPU負荷を大幅に増加させる可能性があります。そのため、regexブロック規則は慎重に追加してください。必要でない限り、複雑な正規表現の使用を避けてください。

#### Q: ブロック規則を一時的に無効にできますか？
A: はい。ブロック規則の「enable」プロパティを「false」に設定することで、ブロック規則を変更できます。

#### Q: ブロック規則の正規表現はどの標準を使用していますか？
A: ブロック規則の正規表現はJavaの正規表現構文を使用しています。一般的な表現はSQL構文マニュアルを参照してください。完全なマニュアルは https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html で確認できます。

## Workload Policy

SQL Block Ruleはプランニング時のサーキットブレーカー設定ですが、プランニング時のコスト計算が不正確な場合（特に非常に複雑なクエリの場合、正確に見積もることが困難）、規則が効果的でなかったり偽陽性につながる可能性があります。Workload Policyはこの制限に対処し、クエリ実行中に特定のメトリクスをリアルタイムで監視し、実行時状態が期待を満たさないクエリをサーキットブレークできるようにします。これにより、予期しない大きなクエリが過度にリソースを消費し、クラスターの安定性に影響を与えることを防ぎます。一般的な実行時監視メトリクスには以下があります：

* クエリ実行時間
* BE単位でのスキャン行数
* BE単位でのスキャンバイト数
* BE単位でのメモリ使用量

### バージョンノート

Dorisバージョン2.1以降、Workload Policyを使用して大きなクエリのサーキットブレークを実装できます。

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
`CREATE WORKLOAD Policy`コマンドを使用してリソース管理ポリシーを作成します。

以下の例では、`test_cancel_Policy`という名前のPolicyを作成し、クラスター内で1000ms以上実行されているクエリをキャンセルします。現在の状態は有効です。Workload Policyの作成には`admin_priv`権限が必要です。

```sql
create workload policy test_cancel_Policy
Conditions(query_time > 1000)
Actions(cancel_query) 
properties('enabled'='true'); 
```
Workload Policyを作成する際は、以下を指定する必要があります：

- **Condition**はポリシーのトリガー条件を表します。複数のConditionはカンマ「,」を使用して連結でき、「AND」関係を表します。上記の例では、`query_time > 1000`はクエリ時間が1秒を超えた際にPolicyがトリガーされることを示しています。現在サポートされているConditionは以下の通りです：

| Conditions            | 説明                                                                                                 |
|-----------------------|-----------------------------------------------------------------------------------------------------|
| username              | クエリが保持するユーザー名、FEの`set_session_variable` Actionのみをトリガーします。                   |
| be_scan_rows          | 単一のBEプロセスでSQLがスキャンした行数。SQLがBE上で並行実行される場合、複数の並行実行の累積値となります。 |
| be_scan_bytes         | 単一のBEプロセスでSQLがスキャンしたバイト数。SQLがBE上で並行実行される場合、複数の並行実行の累積値となり、単位はバイトです。 |
| query_time            | 単一のBEプロセスでのSQLの実行時間、単位はミリ秒です。                                             |
| query_be_memory_bytes | 単一のBEプロセスでのSQLのメモリ使用量。SQLがBE上で並行実行される場合、複数の並行実行の累積値となり、単位はバイトです。 |

- **Action**は条件がトリガーされた際に実行されるアクションを表します。現在、Policyは1つのActionのみを定義できます（`set_session_variable`を除く）。上記の例では、`cancel_query`はクエリのキャンセルを示しています。現在サポートされているActionは以下の通りです：

| Actions                | 説明                                                                                                      |
|------------------------|------------------------------------------------------------------------------------------------------------------|
| cancel_query           | クエリをキャンセルします。                                                                                                 |
| set_session_variable   | `set session variable`文をトリガーします。単一のpolicyは複数の`set_session_variable`オプションを持つことができ、現在は`username` ConditionによってFEでのみトリガーされます。 |

- **Properties**は現在のPolicyの属性を定義し、有効かどうかとその優先度を含みます。

| Properties      | 説明                                                                                                                                                 |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| enabled         | `true`または`false`を指定でき、デフォルトは`true`でPolicyが有効であることを示します。`false`はPolicyが無効であることを示します。                                      |
| priority        | 0から100の整数値、デフォルトは0で、Policyの優先度を表します。値が高いほど優先度が高くなります。この属性は主に、クエリが複数のPolicyにマッチした場合に、最も優先度の高いPolicyのみが選択されることを保証します。 |
| workload_group  | 現在、Policyは1つのworkload groupにバインドでき、このPolicyが特定のWorkload Groupからのクエリにのみ適用されることを意味します。デフォルトは空で、すべてのクエリに適用されることを意味します。 |

### Workload PolicyのWorkload Groupへのバインド

デフォルトでは、Workload Policyはサポートされているすべてのクエリに適用されます。特定のWorkload Groupのみを対象とするPolicyを指定したい場合は、`workload_group`オプションを通じてWorkload Groupをバインドする必要があります。文は以下の通りです：

```sql
create workload policy test_cancel_big_query
Conditions(query_time > 1000)
Actions(cancel_query) 
properties('workload_group'='normal')
```
### 重要な注意事項
- 同一のPolicyのConditionsとActionsは、両方ともFEであるか両方ともBEである必要があります。例えば、`set_session_variable`と`cancel_query`を同一のPolicy内で設定することはできません。Conditions `be_scan_rows`と`username`を同一のPolicy内で設定することはできません。
- 現在、Policyは固定時間間隔で非同期スレッドによって実行されるため、ポリシー実行に一定の遅延が生じます。例えば、ユーザーがスキャン行数が1,000,000を超えた場合にクエリをキャンセルするポリシーを設定し、その時点でクラスタリソースが比較的アイドル状態である場合、キャンセルポリシーが効果を発揮する前にクエリが完了する可能性があります。現在の間隔は500msであり、この間隔より短い実行時間のクエリはポリシーチェックを回避する可能性があります。
- 現在サポートされているロードタイプには、select/insert、select/stream load、broker load、routine loadが含まれます。
- 単一のクエリは複数のPolicyにマッチする可能性がありますが、最も高い優先度を持つPolicyのみが有効になります。
- ActionsとConditionsの変更は現在サポートされていません。削除して再作成することによってのみ変更できます。

### Workload Policy実証

#### 1. Session Variable変更テスト
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
3秒より長く実行されるクエリを回路遮断するテスト。以下は、ckbenchのq29の正常実行の監査ログで、このSQLが完了するのに4.5秒かかったことを示している。

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
