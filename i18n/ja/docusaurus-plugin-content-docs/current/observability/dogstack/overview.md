---
{
    "title": "DOG Stack オープンオブザーバビリティの概要",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "DOG Stack は、Apache Doris、OpenTelemetry、Grafana を基盤とするオープンなオブザーバビリティソリューションです。この記事では、DOG Stack の主な機能、コンポーネント、全体的なアーキテクチャを紹介します。",
    "keywords": [
        "DOG Stack",
        "Apache Doris",
        "OpenTelemetry",
        "Grafana",
        "Elasticsearch",
        "ELK",
        "オープンソースのオブザーバビリティ",
        "Doris App プラグイン",
        "ログ",
        "トレース",
        "メトリクス"
    ]
}
---

<!-- Knowledge type: capability definition + architecture overview -->
<!-- Applicable scenario: observability platform / DOG Stack solution selection -->

**DOG Stack** は、**D**oris、**O**penTelemetry（[Doris Exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter) を含む）、**G**rafana（[Doris App プラグイン](https://github.com/velodb/grafana-doris-app) を含む）を基盤とするオープンなオブザーバビリティソリューションです。次の特長を備えています。

- **オープン**: すべてのコンポーネントがオープンソースであり、特定のベンダーへの依存を避けられます。
- **高性能**: 書き込みスループットは最大で毎秒数百 GB に達します。数十億件のレコードを対象とする検索やクエリにも、サブ秒で応答します。
- **低コスト**: ELK や Datadog と比較して、オブザーバビリティのコストを 50% 超、場合によっては 80% 削減できます。
- **スケーラブル**: PB 規模、さらには EB 規模のデータも容易に扱えます。

OpenTelemetry はオブザーバビリティデータ収集の事実上の標準であり、Grafana はその可視化の事実上の標準です。そのため Doris は、新たな収集・可視化ツールを一から作るのではなく、これらを基盤とするオブザーバビリティソリューションを構築しました。Doris は、オブザーバビリティデータの効率的な保存と高速なクエリに注力しています。



## 機能

DOG Stack は、OpenTelemetry と Grafana を基盤として豊富な機能を提供します。

1. **さまざまなオブザーバビリティデータの収集**
   1. OpenTelemetry SDK により、10 を超えるプログラミング言語のアプリケーションを、すぐに、場合によってはコードを書かずに計装できます。
   2. OpenTelemetry Collector は、ローカルファイル、ホストのメトリクス、コンテナのメトリクスを取り込みます。
   3. Vector、Fluentbit、Node Exporter、Telegraf、Logstash、Filebeat など、既存の収集ツールと連携できます。
2. **Kibana を超える検索体験**
   1. Lucene 形式の検索構文とネイティブ SQL 構文の両方に対応します。
   2. ワンクリックでログとトレースを関連付けられます。
   3. 詳細なレコードをテーブル形式または JSON 形式で表示できます。
   4. 特定のログやトレースの前後に発生したデータを時系列で確認できます。
   5. 時間範囲やフィールドを対話的に選択し、フィールドで絞り込めます。
   6. フィールド値の分布を集計できます。
3. **Jaeger のようなトレース体験**
   1. サービス名、オペレーション、タグ、所要時間の範囲でトレースを絞り込めます。
   2. タイムライン、所要時間、スパン数でトレースを可視化できます。
   3. タイムスタンプ、所要時間、スパン数でトレースを並べ替えられます。
   4. 特定のトレースをウォーターフォール表示できます。
   5. トレース内のスパンを、サービス名、スパン名、タグ、所要時間の範囲で絞り込めます。
4. **ダッシュボード**
   1. 折れ線グラフ、棒グラフ、円グラフ、ゲージ、ヒートマップ、ヒストグラム、地図など、20 種類を超える可視化形式を利用できます。
   2. ビジュアルビルダーまたは直接記述した SQL でダッシュボードを作成できます。
   3. Doris の複数テーブル結合を使って、ログ、トレース、メトリクスを横断するダッシュボードを作成できます。
5. **アラート**
   1. データなし / エラー、しきい値、複合しきい値など、複数の条件に対応するアラートルールを設定できます。対象となるメトリクスには、件数、合計、比率などがあります。
   2. メール、PagerDuty、Slack、Discord、Webhook など、20 を超える通知チャネルを利用できます。
   3. アラートテンプレートを使って通知メッセージをカスタマイズ、整形、再利用できます。
6. **OpenTelemetry と Grafana がサポートするその他の機能。**

以下は、Doris App プラグインをインストールした Grafana の画面例です。

- ログ検索

![ログ検索](https://cdnd.selectdb.com/images/upload/dogstack/overview_logs.png)

- トレース分析

![トレース分析](https://cdnd.selectdb.com/images/upload/dogstack/overview_traces.png)

- メトリクスダッシュボード

![メトリクスダッシュボード](https://cdnd.selectdb.com/images/upload/dogstack/overview_dashboard.png)



## アーキテクチャ

![DOG Stack のアーキテクチャ](https://cdnd.selectdb.com/images/upload/dogstack/dogstack_architecture.png)

DOG Stack は、次のコンポーネントで構成されます。

1. **データ収集ツール**: ログ、トレース、メトリクスなどのテレメトリを収集します。OpenTelemetry は二種類の収集ツールを提供します。一つは、10 を超える言語に対応する OpenTelemetry SDK です。アプリケーションや AI エージェントを計装するために使用し、通常はトレースデータを収集します。もう一つは OpenTelemetry Collector のレシーバーです。ローカルファイル用の filelog レシーバー、ホストのメトリクス（CPU、メモリなど）用の hostmetrics レシーバー、Kubernetes の Pod メトリクス用の podmetrics レシーバーなどがあります。Vector、Fluentbit、Node Exporter、Telegraf などのサードパーティ製コレクターも、OTLP などのプロトコルを介して OpenTelemetry Collector にデータを送信できます。
2. **OpenTelemetry Collector（Doris Exporter を含む）**: 収集ツールからテレメトリデータを受け取り、処理したうえで Doris Exporter を介して Doris に永続化します。一般的な処理には、フィルタリング、変換、情報の付加、キューイング、バッチ処理があります。
3. **Doris**: OpenTelemetry Collector からテレメトリデータを受け取り、インデックス付きの列指向ストレージに効率的に保存します。転置インデックス、ブルームフィルターインデックス、ゾーンマップインデックスなどの各種インデックスにより、高速な検索を実現します。また、集約、ソート、結合などの分析クエリでも、ネイティブの高い性能を発揮します。
4. **Grafana（Doris App プラグインを含む）**: ログ、トレース、メトリクス向けの豊富で使いやすい可視化機能を提供します。Grafana の強力な基本機能に加え、Doris App プラグインが実用的な機能を追加します。「Discover」機能は、Kibana ユーザーにも評価される優れた検索体験を提供します。「Traces」機能では、調査すべきトレース（処理の遅いトレースなど）を見つけるためのネイティブなトレース探索ができ、Jaeger ユーザーにも使い慣れた操作感を提供します。
