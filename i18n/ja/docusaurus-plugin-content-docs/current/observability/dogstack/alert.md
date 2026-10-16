---
{
    "title": "アラートと通知",
    "sidebar_label": "アラート",
    "language": "ja",
    "description": "Apache Doris の SQL を使用して DOG Stack でアラートを作成する方法を説明します。Grafana Alerting のルール作成、アラート条件、ラベル、コンタクトポイント、アラート管理を扱います。",
    "keywords": [
        "Grafana Alerting",
        "Doris のアラート",
        "アラートルール",
        "アラート通知",
        "アラート条件",
        "Webhook",
        "Slack アラート",
        "メールアラート"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / alert rule configuration and management -->

DOG Stack には Grafana が統合されているため、Grafana で直接アラートを作成・管理できます。この記事では、一般的なアラート操作を紹介します。より高度な機能については、[Grafana Alerting のドキュメント](https://grafana.com/docs/grafana/latest/alerting/)を参照してください。

図に示すように、Grafana のアラートの基本的な仕組みは次のとおりです。

1. ユーザーが、基となるクエリと発火条件を含むアラートルールを定義します。
2. システムが定期的にルールのクエリを実行し、発火条件を評価します。
3. 発火条件が満たされると、アラートインスタンスが生成されます。
4. アラートはコンタクトポイントに直接送信されるか、通知ポリシーを通じて柔軟に振り分けられます。

![Grafana のアラートの仕組み](https://cdnd.selectdb.com/images/upload/dogstack/alert_overview.png)



一般的なアラートルールの作成と管理の流れは次のとおりです。

**1. Grafana Alerting → Alert rules を開き、「Create alert」をクリックする**

![アラートの作成画面](https://cdnd.selectdb.com/images/upload/dogstack/alert_create.png)



**2. クエリと発火条件を定義する**

まず、Doris などのデータソースを選択します。**Builder** モードでは、画面上の操作で簡単なクエリを構築できます。**Code** モードでは、より複雑なクエリを SQL で記述できます。この例では **Code** モードを使用し、直近 10 分間に `otel.otel_logs` の `body` フィールドがキーワード `error` にマッチする行の数を取得します。

次に、**Expression** セクションで、必要に応じてクエリ結果をさらに集計する方法を選び、アラートの発火しきい値を設定します。この例ではしきい値を「result > 10」に設定し、追加の集計は行いません。

最後に **Preview** をクリックし、クエリ結果とアラートが発火するかどうかを確認します。ここではクエリ結果が 882 で、しきい値の 10 を超えているため、ステータスは **1 Firing** と表示されます。

詳しくは、[Grafana のドキュメント](https://grafana.com/docs/grafana/latest/alerting/alerting-rules/create-grafana-managed-rule/)を参照してください。

![クエリとアラート条件の設定画面](https://cdnd.selectdb.com/images/upload/dogstack/alert_condition.png)



**3. 評価間隔とアラートの整理方法を設定する**

まずアラートを整理するフォルダーを選び、次にアラートの評価間隔を設定し、最後に Pending duration を選択します。この例では、毎分実行される評価グループを作成し、Pending = None を選択します。これは、条件が一定時間（例えば 1 分間）継続するのを待たず、条件が満たされるとアラートが直ちに **Firing** 状態になることを意味します。

詳しくは、[Grafana のドキュメント](https://grafana.com/docs/grafana/latest/alerting/fundamentals/alert-rule-evaluation/)を参照してください。

![アラートの評価間隔の設定画面](https://cdnd.selectdb.com/images/upload/dogstack/alert_evaluation.png)



**4. 通知チャネルを設定する**

Grafana は Email、Slack、Discord、PagerDuty、Webhook など、多くの通知チャネルに対応しています。既存のコンタクトポイントを選ぶか、新しく作成できます。また、ラベルに基づいてアラートを振り分ける通知ポリシーも設定できます。

詳しくは、[Grafana のドキュメント](https://grafana.com/docs/grafana/latest/alerting/fundamentals/notifications/)を参照してください。

![アラートのラベル設定画面](https://cdnd.selectdb.com/images/upload/dogstack/alert_lable.png)

![コンタクトポイントの設定画面](https://cdnd.selectdb.com/images/upload/dogstack/alert_contact.png)



**5. 通知メッセージを設定する**

通知を受け取る人が状況をすばやく把握できるよう、概要、説明、対応手順を示すランブックの URL など、通知内容をカスタマイズできます。

![アラートの通知メッセージ設定画面](https://cdnd.selectdb.com/images/upload/dogstack/alert_message.png)



**6. アラートを管理する**

アラートルールの作成後は、アラートの一時停止、一定期間の通知のミュート、ルールの変更、通知チャネルの変更などを行えます。

詳しくは、[Grafana のドキュメント](https://grafana.com/docs/grafana/latest/alerting/monitor-status/)を参照してください。

![アラートの管理画面](https://cdnd.selectdb.com/images/upload/dogstack/alert_management.png)
