---
{
    "title": "分散トレース分析",
    "sidebar_label": "トレース",
    "language": "ja",
    "description": "Doris App で分散トレースを分析する方法を説明します。トレースの散布図、ウォーターフォール表示、Span Filter、サービス・オペレーション・タグ・継続時間による多次元フィルタリングを取り上げ、遅いリクエストや異常な呼び出しの特定に役立てます。",
    "keywords": [
        "トレース分析",
        "分散トレーシング",
        "Span Filter",
        "ウォーターフォール表示",
        "Doris App",
        "Grafana",
        "OpenTelemetry",
        "低速リクエストの分析"
    ]
}
---

<!-- Knowledge type: capability definition + operational steps -->
<!-- Applicable scenario: observability platform / distributed trace analysis -->

トレースは、オブザーバビリティデータを構成する三つの柱の一つです。リクエストの実行全体を追跡し、各サービス内の実行区間であるスパンと、その呼び出し関係から構成されます。トレースは、分散システムにおけるリクエストの性能や異常を分析するうえで欠かせません。

**Traces** ページでトレースを分析できます。関心のあるトレース（実行時間の長いものなど）を見つけ、特定のトレースを可視化して、そのスパンを詳しく調べます。

以下に示すように、**Traces** ページは四つのエリアで構成されます。

1. **データ選択エリア（上部）**: トレースのデータソース（Datasource、Database、Table）、時刻フィールド、期間を選択します。
2. **フィルターエリア（左側）**: Service、Operation、Tags、Duration でトレースを絞り込みます。
3. **トレース分布エリア（右上）**: 条件に一致するトレースの散布図です。横軸はトレースの開始時刻、縦軸はトレースの継続時間、バブルの大きさはトレース内のスパン数を表します。散布図から、実行時間が長いトレースやスパン数の多い大規模なトレースをすばやく見つけられます。バブルをクリックすると、そのトレースの詳細がウォーターフォールチャートで表示されます。
4. **トレース一覧エリア（右下）**: 条件に一致するトレースの一覧で、サービス、オペレーション、trace_id、トレースの継続時間、スパン数などを表示します。既定の並び順 `Most Recent` では、開始時刻の降順で新しいトレースから表示されます。継続時間が長い順・短い順、スパン数が多い順・少ない順にも切り替えられます。

![Traces ページの概要](https://cdnd.selectdb.com/images/upload/dogstack/trace_page.gif)

トレースをクリックすると、詳細情報を含む Trace Panel が開き、トレース内のスパンをさらに分析できます。

1. トレースの呼び出しチェーンのミニマップとウォーターフォールチャートで、各スパンの実行区間と呼び出し関係を確認します。
2. スパンをクリックすると、その開始時刻、継続時間、Span Attributes と Resource Attributes を含むコンテキスト情報を表示します。
3. **Span Filter** をクリックして、Service Name、Span Name、Duration、Tags などでスパンを絞り込みます。

![Trace Panel の詳細](https://cdnd.selectdb.com/images/upload/dogstack/trace_panel.gif)



## よく使うフィルターの例

### サービスで絞り込む

```
Service = frontend-web
```

指定したサービスが生成したトレースをすばやく確認できます。

![サービスで絞り込む](https://cdnd.selectdb.com/images/upload/dogstack/trace_service.png)

### オペレーションで絞り込む

```
Operation = HTTP POST
```

特定のエンドポイントやリクエストの種類を探すときに役立ちます。

![オペレーションで絞り込む](https://cdnd.selectdb.com/images/upload/dogstack/trace_operation.png)

### タグで絞り込む

```
upstream_cluster.name="flagservice"
```

スパン属性を絞り込むには、**logfmt key=value** 構文を使用します。

![タグで絞り込む](https://cdnd.selectdb.com/images/upload/dogstack/trace_tags.png)

### 継続時間で絞り込む

`Min Duration = 100ms ``Max Duration = 1.2s`

遅いリクエストをすばやく特定できます。

![継続時間で絞り込む](https://cdnd.selectdb.com/images/upload/dogstack/trace_duration.png)



## 並べ替えとページ分割

トレース一覧では、次の並べ替えオプションを使用できます。

- Most Recent
- Longest / Shortest Duration
- Most / Fewest Spans

ページ単位での閲覧にも対応しています。

![並べ替えとページ分割](https://cdnd.selectdb.com/images/upload/dogstack/trace_sort.png)
