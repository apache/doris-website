---
{
  "title": "非同期Materialized Viewsの概要",
  "description": "マテリアライズドビューは、効率的なソリューションとして、ビューの柔軟性と物理tableの高いパフォーマンス上の利点を組み合わせます。",
  "language": "ja"
}
---
Materialized viewsは効率的なソリューションとして、ビューの柔軟性と物理tableの高性能の利点を組み合わせます。クエリの結果セットを事前に計算して保存することで、クエリリクエストが到着した際に保存されたmaterialized viewから直接結果を素早く取得でき、複雑なクエリステートメントを再実行するオーバーヘッドを回避できます。

## ユースケース

- **クエリ加速と同時処理性能の向上**: Materialized viewsはクエリ速度を大幅に向上させると同時に、システムの同時処理能力を高め、リソース消費を効果的に削減します。
- **ETLプロセスの簡素化**: Extract、Transform、Load（ETL）プロセスにおいて、materialized viewsはワークフローを簡素化し、開発効率を向上させ、データ処理をよりスムーズにします。
- **レイクハウスアーキテクチャでの外部tableクエリの高速化**: レイクハウスアーキテクチャにおいて、materialized viewsは外部データソースのクエリ速度を大幅に向上させ、データアクセス効率を改善します。
- **書き込み効率の向上**: リソース競合を削減することで、materialized viewsはデータ書き込みプロセスを最適化し、書き込み効率を向上させ、データの一貫性と整合性を保証します。

## 制限事項
- **非同期Materialized Viewsとベースtableデータの一貫性**: 非同期materialized viewsは最終的にベースtableデータと一貫性を持ちますが、リアルタイムで同期することはできないため、リアルタイムの一貫性は維持できません。
- **ウィンドウ関数クエリのサポート**: 現在、クエリにウィンドウ関数が含まれている場合、そのクエリをmaterialized viewsを利用するように透過的に書き換えることはサポートされていません。
- **クエリtableより多くのtableを結合するMaterialized Views**: Materialized viewで結合されるtableの数がクエリに含まれるtableの数を超える場合（例えば、クエリがt1とt2のみを含むが、materialized viewにはt1、t2、および追加のt3が含まれる場合）、現在システムはそのクエリをmaterialized viewを利用するように透過的に書き換えることをサポートしていません。
- Materialized viewにUNION ALL、LIMIT、ORDER BY、CROSS JOINなどのset操作が含まれている場合、materialized viewは正常に構築できますが、透過的な書き換えには使用できません。

## 原理の紹介

Materialized viewsはデータベースの高度な機能として、本質的にMTMV型の内部tableとして機能します。Materialized viewを作成する際、システムは同時にリフレッシュタスクを登録します。このタスクは必要に応じて実行され、INSERT OVERWRITE文を実行して最新のデータをmaterialized viewに書き込みます。

**リフレッシュメカニズム**  
同期materialized viewsで使用されるリアルタイム増分リフレッシュとは異なり、非同期materialized viewsはより柔軟なリフレッシュオプションを提供します。

- **フルリフレッシュ**:  
  このモードでは、システムはmaterialized viewのSQL定義に関わるすべてのデータを再計算し、完全な結果をmaterialized viewに書き込みます。このプロセスにより、materialized view内のデータがベースtableデータと一貫性を保つことが保証されますが、より多くの計算リソースと時間を消費する可能性があります。

- **パーティション増分リフレッシュ**:  
  Materialized viewのベースtableのパーティションデータが変更された際、システムはこれらの変更を知的に識別し、影響を受けるパーティションのみをリフレッシュできます。このメカニズムにより、materialized viewのリフレッシュに必要な計算リソースと時間を大幅に削減しつつ、最終的なデータ一貫性を保証します。

**透過的書き換え**:  
透過的書き換えは、データベースがクエリパフォーマンスを最適化する重要な手段です。ユーザークエリを処理する際、システムはSQLを自動的に最適化・書き換えて実行効率を向上させ、計算コストを削減できます。この書き換えプロセスはユーザーに対して透過的であり、介入は不要です。

Dorisの非同期materialized viewsは、SPJG（SELECT-PROJECT-JOIN-GROUP-BY）モデルに基づく透過的書き換えアルゴリズムを利用します。このアルゴリズムはSQLの構造情報を深く分析し、透過的書き換えに適したmaterialized viewsを自動的に検索・選択できます。複数のmaterialized viewsが利用可能な場合、アルゴリズムは特定の戦略（コストモデルなど）に基づいてクエリSQLに応答する最適なmaterialized viewを選択し、クエリパフォーマンスをさらに向上させます。

## データレイクベースの非同期Materialized Viewsの作成
データレイクベースの非同期materialized viewsを作成する構文は、内部tableベースの非同期materialized viewsを作成する構文とまったく同じですが、いくつかの考慮事項があります：
- Materialized viewsのリフレッシュには、パーティションバージョン情報などのデータレイクからのメタデータが必要です。この情報は、外部環境から直接取得するのではなく、データレイクのメタデータキャッシュから取得されます。そのため、materialized viewがリフレッシュされた後、データはDorisを通じてデータレイクからクエリされた結果と一貫性を保ちます。ただし、他のエンジンを通じてデータレイクからクエリされた結果とは、キャッシュのリフレッシュ状況によって一致しない可能性があります。
- 基盤となるHiveデータがDorisによって制御されない外部プロセス（Spark、Hive、Flinkジョブなど）によってメタデータを変更せずに修正された場合（insert overwriteの実行など）、materialized viewはベースtableデータとの一貫性を想定する可能性がありますが、クエリされたデータはDorisを通じてデータレイクからクエリされた結果と一致しない場合があります。この問題は、materialized viewの強制リフレッシュを手動で実行することで解決できます。
- Icebergベースのパーティション化されたmaterialized viewsを作成する際は、単一のパーティション列を持つIcebergTableのみがサポートされます。パーティション進化に対する限定的なサポートが提供されます。例えば、時間ベースのパーティションの時間範囲の変更はサポートされますが、パーティションフィールドの変更はサポートされません。パーティションフィールドが変更された場合、materialized viewのリフレッシュは失敗します。
- Hudiベースのmaterialized viewsを作成する際、ベースtableデータが変更されたかどうかを認識しません。そのため、materialized view（またはmaterialized viewのパーティション）がリフレッシュされると、ベースtableと同期されたと見なされます。結果として、Hudiベースのmaterialized viewsの作成は、手動によるオンデマンドリフレッシュを必要とするシナリオにのみ適しています。

### Materialized Refreshデータレイクのサポート

Materialized refreshデータレイクのサポートは、tableタイプとcatalogによって異なります。

<table>
    <tr>
        <th rowspan="2">tableタイプ</th>
        <th rowspan="2">カタログタイプ</th>
        <th colspan="2">リフレッシュ方法</th>
        <th>トリガーリフレッシュ</th>
    </tr>
    <tr>
        <th>フルリフレッシュ</th>
        <th>パーティションリフレッシュ</th>
        <th>自動トリガー</th>
    </tr>
    <tr>
        <td>Internal table</td>
        <td>Internal</td>
        <td>2.1でサポート</td>
        <td>2.1でサポート</td>
        <td>2.1.4でサポート</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>2.1でサポート</td>
        <td>2.1でサポート</td>
        <td>サポートされていません</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>2.1でサポート</td>
        <td>3.1でサポート</td>
        <td>サポートされていません</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>2.1でサポート</td>
        <td>3.1でサポート</td>
        <td>サポートされていません</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>2.1でサポート</td>
        <td>3.1でサポート</td>
        <td>サポートされていません</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>2.1でサポート</td>
        <td>サポートされていません</td>
        <td>サポートされていません</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>2.1でサポート</td>
        <td>サポートされていません</td>
        <td>サポートされていません</td>
    </tr>
</table>

### データレイクの透過的書き換えサポート
現在、非同期materialized viewsの透過的書き換え機能は以下のタイプのtableとcatalogをサポートしています。

リアルタイムベースtableデータ認識: Materialized viewがそれが使用する基盤tableデータの変更を検出し、クエリ時に最新のデータを利用する能力を指します。

<table>
    <tr>
        <th>tableタイプ</th>
        <th>カタログタイプ</th>
        <th>透過的書き換えサポート</th>
        <th>リアルタイムベースtableデータ認識</th>
    </tr>
    <tr>
        <td>Internal table</td>
        <td>Internal</td>
        <td>サポート</td>
        <td>サポート</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>サポート</td>
        <td>3.1でサポート</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>サポート</td>
        <td>3.1でサポート</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>サポート</td>
        <td>3.1でサポート</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>サポート</td>
        <td>サポートされていません</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>サポート</td>
        <td>サポートされていません</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>サポート</td>
        <td>サポートされていません</td>
    </tr>
</table>

外部tableを使用するMaterialized viewsは、デフォルトでは透過的書き換えに参加しません。
外部tableを含むmaterialized viewsの透過的書き換えを有効にしたい場合は、`SET materialized_view_rewrite_enable_contain_external_table = true`を設定できます。

バージョン2.1.11以降、Dorisは外部tableの透過的書き換えパフォーマンスを最適化し、主に外部tableを含む利用可能なmaterialized viewsの取得パフォーマンスを向上させました。

外部tableを含むパーティション化されたmaterialized viewsで透過的書き換えが遅い場合は、fe.confで以下を設定する必要があります：
`max_hive_partition_cache_num = 20000`、Hive MetastoreTableレベルパーティションキャッシュの最大数で、デフォルト値は10000です。
外部HiveTableに多くのパーティションがある場合は、この値をより高く設定できます。

`external_cache_expire_time_minutes_after_access`、最後のアクセス後のキャッシュ有効期限です。デフォルトは10分で、適切に増やすことができます。
（外部tableスキーマキャッシュとHiveメタデータキャッシュに適用されます）

`external_cache_refresh_time_minutes = 60`、外部tableメタデータキャッシュの自動リフレッシュ間隔です。デフォルトは10分で、適切に増やすことができます。この設定はバージョン3.1以降でサポートされています。
外部tableメタデータキャッシュ設定の詳細については、[Metadata Cache](../../../lakehouse/meta-cache.md)を参照してください。

## Materialized ViewsとOLAP内部tableの関係

非同期materialized viewsは、ベースtableのtableモデルに制限なくSQLを定義でき、detailモデル、primary keyモデル（merge-on-writeおよびmerge-on-read）、aggregateモデルなどが可能です。

Materialized viewsの基盤実装は、DuplicateモデルのolapTableに依存しており、理論的にDuplicateモデルのすべてのコア機能をサポートできます。ただし、materialized viewsがデータリフレッシュタスクを安定的かつ効率的に実行できるようにするため、その機能に一連の必要な制限を課しています。具体的な制限は以下の通りです：

- Materialized viewsのパーティションはベースtableに基づいて自動的に作成・維持されるため、ユーザーはmaterialized viewsに対してパーティション操作を実行できません。
- Materialized viewsの背後には処理が必要な関連ジョブ（JOB）があるため、DELETE TABLEやRENAME TABLEなどのコマンドを使用してmaterialized viewsを操作することはできません。代わりに、materialized view専用のコマンドを使用してこれらの操作を行う必要があります。
- Materialized viewsの列データ型は作成時に指定されたクエリステートメントに基づいて自動的に推論されるため、これらのデータ型を変更することはできません。そうでなければ、materialized viewのリフレッシュタスクで障害が発生する可能性があります。
- Materialized viewsはDuplicateTableにはないいくつかのプロパティを持ち、これらのプロパティはmaterialized viewのコマンドを通じて変更する必要があります。他の共通プロパティはALTER TABLEコマンドを使用して変更する必要があります。

## その他の参照
非同期materialized viewsの作成、クエリ、保守については、[非同期Materialized Viewsの作成、クエリ、保守](../async-materialized-view/functions-and-demands.md)を参照してください。

ベストプラクティスについては、[ベストプラクティス](../async-materialized-view/use-guide.md)を参照してください。

よくある質問については、[よくある質問](../async-materialized-view/faq.md)を参照してください。
