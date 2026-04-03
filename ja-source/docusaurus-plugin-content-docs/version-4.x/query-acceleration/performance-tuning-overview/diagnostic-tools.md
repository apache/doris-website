---
{
  "title": "診断ツール",
  "description": "効率的で効果的なパフォーマンス診断ツールは、データベースシステムのチューニングにとって重要です。",
  "language": "ja"
}
---
## 概要

効率的で効果的なパフォーマンス診断ツールは、データベースシステムのチューニングにおいて重要です。これらのツールは、問題のあるビジネスSQL queries を迅速に特定できるかどうか、その後、パフォーマンスのボトルネックを素早く特定して解決できるかどうかを決定し、データベースシステムがService Level Agreements (SLAs)を満たすことを保証します。

現在、Dorisは実行時間が5秒を超えるSQL queriesを、デフォルトでslow SQLとして扱います。この閾値は`config.qe_slow_log_ms`で設定できます。Dorisは現在、パフォーマンスに問題のあるslow SQL queriesを迅速に特定するのに役立つ以下の3つの診断チャネルを提供しています：

## Doris Manager Logs

Doris Managerのlogモジュールは、slow SQLフィルタリング機能を提供します。ユーザーは、特定のFEノード上で`fe.audit.log`を選択することでslow SQLを確認できます。検索ボックスに`slow_query`と入力するだけで、現在のシステムの過去のslow SQL情報がページに表示されます。下図の通りです：

![Doris Manager Monitoring and Logging](/images/doris-manage-trace-log-2.png)

## Audit ログ

現在、Doris FEは`slow_query`、`query`、`load`、`stream_load`を含む4種類のAudit Logsを提供しています。Managerサービスがインストール・デプロイされているクラスタのlogページを通じてlogsにアクセスする他に、Audit LogsはFEが配置されているノードの`fe/log/fe.audit.log`ファイルに直接アクセスして取得することもできます。

`fe.audit.log`で`slow_query`タグを直接検索することで、実行が遅いSQL queriesを迅速にフィルタリングできます。下記の通りです：

```sql
2024-07-18 11:23:13,042 [slow_query] |クライアント=127.0.0.1:63510|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=11603|ScanBytes=236667379712|ScanRows=13649979418|ReturnRows=100|StmtId=1689|QueryId=91ff336304f14182-9ca537eee75b3856|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     c_name,     c_custkey,     o_orderkey,     o_orderdate,     o_totalprice,     sum(l_quantity) from     customer,     orders,     lineitem where     o_orderkey  in  (         select             l_orderkey         from             lineitem         group  by             l_orderkey  having                 sum(l_quantity)  >  300     )     and  c_custkey  =  o_custkey     and  o_orderkey  =  l_orderkey group  by     c_name,     c_custkey,     o_orderkey,     o_orderdate,     o_totalprice order  by     o_totalprice  desc,     o_orderdate limit  100|CpuTimeMS=918556|ShuffleSendBytes=3267419|ShuffleSendRows=89668|SqlHash=b4e1de9f251214a30188180f37907f7d|peakMemoryBytes=38720935552|SqlDigest=f23c7a7ecff61da33f537b2699e9b053|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:33,043 [slow_query] |クライアント=127.0.0.1:26672|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8978|ScanBytes=334985555968|ScanRows=10717654374|ReturnRows=100|StmtId=1815|QueryId=6e1fae453cb04d9a-b1e5f94d9cea1885|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=990127|ShuffleSendBytes=59208164|ShuffleSendRows=3651504|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10495660672|SqlDigest=fec5a7136f9375aa968a4de971b994da|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:41,044 [slow_query] |クライアント=127.0.0.1:26684|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8514|ScanBytes=334986551296|ScanRows=10717654374|ReturnRows=100|StmtId=1833|QueryId=4f91483464ce4aa8-beeed7dcb8675bc8|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=925841|ShuffleSendBytes=59223190|ShuffleSendRows=3651602|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10505123104|SqlDigest=fec5a7136f9375aa968a4de971b994da|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:49,044 [slow_query] |クライアント=127.0.0.1:10748|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8660|ScanBytes=334987673600|ScanRows=10717654374|ReturnRows=100|StmtId=1851|QueryId=4599cb1bab204f80-ac430dd78b45e3da|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=932664|ShuffleSendBytes=59223178|ShuffleSendRows=3651991|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10532849344|SqlDigest=fec5a7136f9375aa968a4de971b994da|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
```
`fe.audit.log`を通じて取得されたスロー SQLにより、ユーザーは実行時間、スキャンされた行数、返された行数、SQL文そのものなどの詳細情報に簡単にアクセスでき、パフォーマンス問題のさらなる再現と特定のための基盤を築きます。

さらに、Audit Logには`SqlDigest`フィールド（例：上記の例の`SqlDigest=...`）が含まれています。このフィールドは、SQL文の構造から生成されたハッシュ値です（特定のパラメータ値は除去されます）。`slow_query`で`SqlDigest`を集約し分析することにより、スローク エリの「パターン」を特定できます。これは、特定のSQL文がパラメータによってわずかに異なっていても、構造が同じである限り、その`SqlDigest`は同一になることを意味します。

`SqlDigest`を使用することで、ユーザーはどのSQLパターンが最も頻繁に現れるか、または最も多くの時間を消費するかを判断でき、これらの「高頻度」または「高レイテンシ」パターンの最適化を優先できます。このアプローチは、個別のSQL文を一つずつ分析する非効率性を避けることにより、スロークエリ最適化の効率を大幅に向上させます。

`SqlDigest`自体は単なるハッシュ値であり、直接読み取ることはできないことに注意することが重要です。最適化すべきスロークエリパターンが特定されたら、Audit Logの`Stmt`フィールドを参照して、そのパターンに対応する具体的なSQL文の内容を取得する必要があります。さらに、`QueryId`フィールドを使用して、クエリの詳細なProfile情報を取得し（Profileの取得と分析については後続のセクションで詳述します）、詳細なパフォーマンス分析と最適化を行うことができます。

### スロークエリ分析例

上記の`fe.audit.log`の4つのスロークエリログを例にとると、以下のことが観察できます：

1. 最初のログ（`Time(ms)=11603`）の`SqlDigest`は`f23c7a7ecff61da33f537b2699e9b053`です。
2. 後続の3つのログ（`Time(ms)=8978`、`8514`、`8660`）はすべて`SqlDigest`が`fec5a7136f9375aa968a4de971b994da`です。

これは、後者の3つのスロークエリが同じSQLパターン（構造的に同一）に属していることを示していますが、具体的な実行時間（`Time(ms)`）と詳細は若干異なります。

実際の最適化シナリオでは、特定の`SqlDigest`（例：`fec5a7136f9375aa968a4de971b994da`）がスロークエリログに繰り返し現れる、または総実行時間の高い割合を占めることが判明した場合、このパターンの最適化を優先すべきです。

**推奨される最適化手順：**

1. **ビジネスロジックの特定**：このパターンの任意のログエントリの`Stmt`フィールドを調べることで：

    ```sql
    select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where ...
    ```
特定のSQLロジックを識別できます。

2. **詳細分析**: ログから`QueryId`（例：`6e1fae453cb04d9a-b1e5f94d9cea1885`）を使用して、Dorisの対応するQuery Profileを取得します。Profileは、問題が過度なデータスキャン、長時間のJoin操作、またはその他の理由によるものかを分析するのに役立ち、対象を絞った最適化戦略（インデックスの追加、SQLの記述最適化、Table構造の調整など）を可能にします。

このパターンの問題が解決されると、このパターンに属するすべてのスロークエリが改善されます。

## audit_logシステムTable

Dorisバージョン2.1から、`__internal_schema`データベース下で`audit_log`システムTableが提供され、ユーザーがSQLクエリの実行状況を確認できます。使用前に、グローバル設定`set global enable_audit_plugin=true`;を有効にする必要があります（このスイッチはデフォルトで無効です）。

```sql
mysql> use __internal_schema;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+-----------------------------+
| Tables_in___internal_schema |
+-----------------------------+
| audit_log                   |
| column_statistics           |
| histogram_statistics        |
| partition_statistics        |
+-----------------------------+
4 rows in set (0.00 sec)

mysql> desc audit_log;
+-------------------+--------------+------+-------+---------+-------+
| Field             | Type         | Null | Key   | Default | Extra |
+-------------------+--------------+------+-------+---------+-------+
| query_id          | varchar(48)  | Yes  | true  | NULL    |       |
| time              | datetime     | Yes  | true  | NULL    |       |
| client_ip         | varchar(128) | Yes  | true  | NULL    |       |
| user              | varchar(128) | Yes  | false | NULL    | NONE  |
| catalog           | varchar(128) | Yes  | false | NULL    | NONE  |
| db                | varchar(128) | Yes  | false | NULL    | NONE  |
| state             | varchar(128) | Yes  | false | NULL    | NONE  |
| error_code        | int          | Yes  | false | NULL    | NONE  |
| error_message     | text         | Yes  | false | NULL    | NONE  |
| query_time        | bigint       | Yes  | false | NULL    | NONE  |
| scan_bytes        | bigint       | Yes  | false | NULL    | NONE  |
| scan_rows         | bigint       | Yes  | false | NULL    | NONE  |
| return_rows       | bigint       | Yes  | false | NULL    | NONE  |
| stmt_id           | bigint       | Yes  | false | NULL    | NONE  |
| is_query          | tinyint      | Yes  | false | NULL    | NONE  |
| frontend_ip       | varchar(128) | Yes  | false | NULL    | NONE  |
| cpu_time_ms       | bigint       | Yes  | false | NULL    | NONE  |
| sql_hash          | varchar(128) | Yes  | false | NULL    | NONE  |
| sql_digest        | varchar(128) | Yes  | false | NULL    | NONE  |
| peak_memory_bytes | bigint       | Yes  | false | NULL    | NONE  |
| stmt              | text         | Yes  | false | NULL    | NONE  |
+-------------------+--------------+------+-------+---------+-------+
```
`audit_log`内部Tableを通じて、ユーザーは詳細なSQL実行情報をクエリし、スロークエリフィルタリングなどの詳細な統計分析を実行できます。

## まとめ

Doris Managerログ、監査ログ、および`audit_log`システムTableは、スローSQLクエリの自動または手動フィルタリング、およびSQL実行情報の細かい粒度での統計分析などの機能を提供します。これらのツールは、体系的なパフォーマンス診断とチューニングに強力なサポートを提供します。
