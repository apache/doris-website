---
{
    "title": "クイックスタート",
    "sidebar_label": "クイックスタート",
    "language": "ja",
    "description": "DOG Stack のオブザーバビリティソリューションをすばやく試す方法を説明します。Docker Compose によるワンクリックデプロイから、Doris App プラグイン、ログ検索、トレース分析、ダッシュボード、アラート機能までを一通り紹介します。",
    "keywords": [
        "DOG Stack クイックスタート",
        "Docker Compose",
        "Doris App プラグイン",
        "Grafana",
        "OpenTelemetry",
        "ログ検索",
        "トレース分析",
        "ダッシュボード",
        "アラート機能"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability quick validation / DOG Stack onboarding -->

DOG Stack を最も手軽に試すには、[オンラインデモ](https://observability-demo.velodb.io/)にアクセスしてください。デプロイは不要です。独自のインスタンスを実行したい場合も、Docker Compose で簡単に始められます。



## デプロイ

```Bash
git clone https://github.com/ai-observe/ai-observe-stack.git
cd ai-observe/demo
docker compose up -d
```

これにより、10+ のマイクロサービスで構成されるデモ用 EC アプリケーションとともに、DOG Stack 全体が起動します。

ブラウザーで http://localhost:33000/grafana/plugins を開き、`doris` を検索して、**Doris App** の項目をクリックします。

![Doris App プラグイン](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_plugin.png)

次に **Enable** ボタンをクリックして Doris App を有効にします。

![Doris App の有効化](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_enable.png)

有効にすると、左側のメニューの「More apps」に Doris App が表示されます。「Doris App」をクリックして使い始めます。

![Doris App のメニュー項目](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_apps.png)



## 検索

Doris App で、データソースに `Doris`、データベースに `otel`、テーブルに `otel_logs` を選択すると、データが表示されます。Kibana の利用者には見慣れた、使いやすい画面です。

![ログのデータソース](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_logs.png)

検索ボックスに `body:error` と入力し、body フィールドに `error` という語を含むログを探してみてください。

![body:error の検索](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_search.png)



## トレース

**Doris App** メニューの **Traces** をクリックして、トレースを調査、分析します。

データソースに `Doris`、データベースに `otel`、テーブルに `otel_traces` を選択します。**Find Traces** ボタンをクリックすると、最新のトレースレコード 50 件が取得され、上部にグラフ、下部に一覧として表示されます。左側の Service、Operation、Tags、Duration フィルターや、トレースグラフの下にある並べ替えオプションを試してみてください。

![トレース一覧](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_traces.png)

特定のトレースをクリックすると、ウォーターフォール表示を確認できます。この画面では、**Span Filter** を使ってトレース内のスパンをさらに絞り込めます。

![トレースのウォーターフォール表示](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_waterfall.png)

## ダッシュボード

左側のメニューで **Dashboards** をクリックし、**Doris Demo**、**Collector Self-Monitoring** の順にクリックします。以下のデモ用ダッシュボードが表示され、OpenTelemetry Collector 自体のホストメトリクスを確認できます。

![デモ用ダッシュボード](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_dashboard.png)



## アラート機能

Doris に対する SQL クエリに基づいてアラートルールを作成できます。**Reduce** 関数や **Threshold** など、アラート条件のパラメーターを指定します。

![アラートルール](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_alert.png)
