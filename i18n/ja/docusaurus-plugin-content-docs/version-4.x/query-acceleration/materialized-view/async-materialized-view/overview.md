---
{
  "title": "非同期Materialized Viewsの概要",
  "description": "マテリアライズドビューは、効率的なソリューションとして、ビューの柔軟性と物理tableの高いパフォーマンス上の利点を組み合わせます。",
  "language": "ja"
}
---
Materialized viewsは、効率的なソリューションとして、viewの柔軟性と物理tableの高性能という利点を組み合わせたものです。
クエリの結果セットを事前計算して保存することができ、
クエリリクエストが到着した際に、保存されたmaterialized viewから直接結果を高速取得でき、
複雑なクエリ文の再実行によるオーバーヘッドを回避できます。

## 使用ケース

- **クエリの高速化と並行性の向上**: Materialized viewsはクエリ速度を大幅に向上させ、同時にシステムの並行処理能力を高め、リソース消費を効果的に削減できます。
- **ETLプロセスの簡素化**: Extract, Transform, Load (ETL)プロセスにおいて、materialized viewsはワークフローを合理化し、開発効率を向上させ、データ処理をよりスムーズにします。
- **レイクハウスアーキテクチャでの外部tableクエリの高速化**: レイクハウスアーキテクチャにおいて、materialized viewsは外部データソースに対するクエリ速度を大幅に向上させ、データアクセス効率を改善できます。
- **書き込み効率の改善**: リソースの競合を削減することで、materialized viewsはデータ書き込みプロセスを最適化し、書き込み効率を向上させ、データの一貫性と整合性を保証します。

## 制限事項
- **非同期Materialized viewsとベースtableデータの一貫性**: 非同期materialized viewsは最終的にベースtableデータと一貫性を保ちますが、リアルタイムでの同期は不可能であり、リアルタイムの一貫性を維持できません。
- **Window関数クエリのサポート**: 現在、クエリにwindow関数が含まれている場合、そのクエリをmaterialized viewsを利用するよう透過的に書き換えることはサポートされていません。
- **クエリtableより多くのtableを結合するMaterialized views**: Materialized viewで結合されるtable数がクエリに含まれるtable数を超える場合（例えば、クエリがt1とt2のみを含むのに対し、materialized viewがt1、t2、および追加のt3を含む場合）、システムは現在、そのクエリをmaterialized viewを利用するよう透過的に書き換えることをサポートしていません。
- Materialized viewがUNION ALL、LIMIT、ORDER BY、CROSS JOINなどの集合演算を含む場合、materialized viewは正常に構築できますが、透過的な書き換えには使用できません。
- Materialized viewを作成する際、VARBINARYタイプは現在サポートされていません。


## 原理の紹介

Materialized viewsは、データベースの高度な機能として、本質的にMTMVタイプの内部tableとして機能します。Materialized viewを作成する際、システムは同時にリフレッシュタスクを登録します。このタスクは必要に応じて実行され、INSERT OVERWRITE文を実行して最新のデータをmaterialized viewに書き込みます。

**リフレッシュメカニズム**  
同期materialized viewsが使用するリアルタイム増分リフレッシュとは異なり、非同期materialized viewsはより柔軟なリフレッシュオプションを提供します。

- **フルリフレッシュ**:  
  このモードでは、システムはmaterialized viewのSQL定義に含まれるすべてのデータを再計算し、完全な結果をmaterialized viewに書き込みます。このプロセスにより、materialized view内のデータがベースtableデータと一貫性を保つことが保証されますが、より多くの計算リソースと時間を消費する可能性があります。

- **パーティション増分リフレッシュ**:  
  Materialized viewのベースtableのパーティションデータが変更された際、システムはこれらの変更を知的に識別し、影響を受けるパーティションのみをリフレッシュできます。このメカニズムにより、materialized viewのリフレッシュに必要な計算リソースと時間を大幅に削減し、データの最終的な一貫性を保証します。

**透過的な書き換え**:  
透過的な書き換えは、データベースがクエリパフォーマンスを最適化するための重要な手段です。ユーザークエリを処理する際、システムは自動的にSQLを最適化し書き換えて、実行効率を向上させ、計算コストを削減できます。この書き換えプロセスはユーザーに対して透過的で、介入を必要としません。

Dorisの非同期materialized viewsは、SPJG (SELECT-PROJECT-JOIN-GROUP-BY)モデルに基づく透過的な書き換えアルゴリズムを利用しています。このアルゴリズムはSQLの構造情報を深く分析し、透過的な書き換えに適したmaterialized viewsを自動的に検索して選択できます。複数のmaterialized viewsが利用可能な場合、アルゴリズムは特定の戦略（コストモデルなど）に基づいて最適なmaterialized viewを選択してクエリSQLに応答し、クエリパフォーマンスをさらに向上させます。

## データレイクに基づく非同期Materialized viewsの作成
データレイクに基づく非同期materialized viewsの作成構文は、内部tableに基づく非同期materialized viewsの作成構文と全く同じですが、いくつかの考慮事項があります：
- Materialized viewsのリフレッシュには、パーティションバージョン情報などのデータレイクからのメタデータが必要です。この情報は、外部環境から直接ではなく、データレイクのメタデータキャッシュから取得されます。そのため、materialized viewがリフレッシュされた後、データはDorisを通じてデータレイクからクエリされた結果と一貫性を保ちます。ただし、他のエンジンを通じてデータレイクからクエリされた結果とは、キャッシュのリフレッシュ状況によって一致しない場合があります。
- 基盤となるHiveデータがDorisによって制御されない外部プロセス（Spark、Hive、Flinkジョブなど）によってメタデータを変更せずに修正された場合（insert overwriteの実行など）、materialized viewはベースtableデータと一貫性があると仮定する場合がありますが、クエリされたデータはDorisを通じてデータレイクからクエリされた結果と一致しない可能性があります。この問題は、materialized viewを手動で強制リフレッシュすることで解決できます。
- Icebergに基づくパーティション化されたmaterialized viewsを作成する際、単一のパーティション列を持つIcebergTableのみがサポートされています。パーティション進化に対する限定的なサポートが提供されています。例えば、時間ベースのパーティションの時間範囲の変更はサポートされていますが、パーティションフィールドの変更はサポートされていません。パーティションフィールドが修正された場合、materialized viewのリフレッシュは失敗します。
- Hudiに基づくmaterialized viewsを作成する際、ベースtableデータが変更されたかどうかの認識はありません。そのため、materialized view（またはmaterialized viewのパーティション）がリフレッシュされると、ベースtableと同期していると見なされます。結果として、Hudiに基づくmaterialized viewsの作成は、手動でのオンデマンドリフレッシュを必要とするシナリオにのみ適しています。


### Materialized refresh data lakeのサポート

Materialized refresh data lakesのサポートは、tableタイプとcatalogによって異なります。

<table>
    <tr>
        <th rowspan="2">table タイプ</th>
        <th rowspan="2">カタログ タイプ</th>
        <th colspan="2">Refresh Method</th>
        <th>Triggered Refresh</th>
    </tr>
    <tr>
        <th>Full Refresh</th>
        <th>パーティション Refresh</th>
        <th>Auto Trigger</th>
    </tr>
    <tr>
        <td>Internal table</td>
        <td>Internal</td>
        <td>Supported in 2.1</td>
        <td>Supported in 2.1</td>
        <td>Supported in 2.1.4</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>Supported in 2.1</td>
        <td>Supported in 2.1</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>Supported in 2.1</td>
        <td>Supported in 3.1</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>Supported in 2.1</td>
        <td>Supported in 3.1</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>Supported in 2.1</td>
        <td>Supported in 3.1</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>Supported in 2.1</td>
        <td>Not supported</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>Supported in 2.1</td>
        <td>Not supported</td>
        <td>Not supported</td>
    </tr>
</table>

### データレイクの透過的な書き換えサポート
現在、非同期materialized viewsの透過的な書き換え機能は、以下のタイプのtableとcatalogをサポートしています。

リアルタイムベースtableデータ認識：Materialized viewが使用する基盤tableデータの変更を検出し、クエリ時に最新のデータを利用する能力を指します。

<table>
    <tr>
        <th>table タイプ</th>
        <th>カタログ タイプ</th>
        <th>Transparent Rewriting Support</th>
        <th>Real-time Base table Data Awareness</th>
    </tr>
    <tr>
        <td>Internal table</td>
        <td>Internal</td>
        <td>Supported</td>
        <td>Supported</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>Supported</td>
        <td>3.1 Supported</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>Supported</td>
        <td>3.1 Supported</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>Supported</td>
        <td>3.1 Supported</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>Supported</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>Supported</td>
        <td>Not Supported</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>Supported</td>
        <td>Not Supported</td>
    </tr>
</table>

外部tableを使用するMaterialized viewsは、デフォルトでは透過的な書き換えに参加しません。
外部tableを含むmaterialized viewsで透過的な書き換えを有効にしたい場合は、`SET materialized_view_rewrite_enable_contain_external_table = true`を設定できます。

バージョン2.1.11以降、Dorisは外部tableの透過的な書き換えパフォーマンスを最適化し、主に外部tableを含む利用可能なmaterialized viewsの取得パフォーマンスを向上させました。

外部tableを含むパーティション化されたmaterialized viewsで透過的な書き換えが遅い場合は、fe.confで以下を設定する必要があります：
`max_hive_partition_cache_num = 20000`、Hive MetastoreTableレベルパーティションキャッシュの最大数、デフォルト値は10000です。
外部HiveTableに多数のパーティションがある場合は、この値をより高く設定できます。

`external_cache_expire_time_minutes_after_access`、最後のアクセス後にキャッシュが期限切れになるまでの時間。デフォルトは10分で、適切に増やすことができます。
（外部tableスキーマキャッシュとHiveメタデータキャッシュに適用されます）

`external_cache_refresh_time_minutes = 60`、外部tableメタデータキャッシュの自動リフレッシュ間隔。デフォルトは10分で、適切に増やすことができます。この設定はバージョン3.1以降でサポートされています。
外部tableメタデータキャッシュ設定の詳細については、[メタデータキャッシュ](../../../lakehouse/meta-cache.md)をご覧ください。

## Materialized viewsとOLAP内部tableの関係

非同期materialized viewsは、ベースtableのtableモデルを制限なしにSQLで定義でき、detailモデル、primary keyモデル（merge-on-writeおよびmerge-on-read）、aggregateモデルなどが可能です。

Materialized viewsの基盤実装はDuplicateモデルのOLAPTableに依存しており、理論的にはDuplicateモデルのすべてのコア機能をサポートできます。ただし、materialized viewsがデータリフレッシュタスクを安定かつ効率的に実行できるように、その機能に一連の必要な制限を課しています。具体的な制限は以下の通りです：

- Materialized viewsのパーティションはベースtableに基づいて自動的に作成・維持されるため、ユーザーはmaterialized viewsに対してパーティション操作を実行できません。
- Materialized viewsの背後には処理が必要な関連ジョブ(JOB)があるため、DELETE TABLEやRENAME TABLEなどのコマンドを使用してmaterialized viewsを操作することはできません。代わりに、materialized view専用のコマンドをこれらの操作に使用する必要があります。
- Materialized viewsのカラムデータタイプは作成時に指定されたクエリ文に基づいて自動的に推論されるため、これらのデータタイプは変更できません。そうしないと、materialized viewのリフレッシュタスクが失敗する可能性があります。
- Materialized viewsにはDuplicateTableにはない一部のプロパティがあり、これらのプロパティはmaterialized viewのコマンドを通じて変更する必要があります。その他の共通プロパティは、ALTER TABLEコマンドを使用して変更する必要があります。

## その他の参考資料
非同期materialized viewsの作成、クエリ、メンテナンスについては、[非同期Materialized viewsの作成、クエリ、メンテナンス](../async-materialized-view/functions-and-demands.md)を参照してください。

ベストプラクティスについては、[ベストプラクティス](../async-materialized-view/use-guide.md)を参照してください。

よくある質問については、[よくある質問](../async-materialized-view/faq.md)を参照してください。
