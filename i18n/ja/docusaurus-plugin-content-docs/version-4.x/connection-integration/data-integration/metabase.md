---
{
    "title": "Metabase",
    "language": "ja",
    "description": "Doris Driver を使用して Metabase を Apache Doris に接続し、データソースの設定、ダッシュボードの作成、Catalog とパラメーター化 SQL の利用を行う方法を説明します。",
    "keywords": [
        "Metabase と Doris の接続",
        "Apache Doris Metabase Driver",
        "Doris の可視化ダッシュボード",
        "Metabase Doris データソース"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Connect to Apache Doris in Metabase and build visualization dashboards -->

Metabase は、データ分析、データの可視化、対話型ダッシュボード、データのドリルダウン、SQL クエリの編集、データのエクスポートを提供するオープンソースのビジネスインテリジェンスツールです。Metabase Apache Doris Driver を使用すると、Apache Doris のデータベースとテーブルを Metabase のデータソースとして統合し、Doris の内部データや外部データをクエリして、可視化ダッシュボードを作成できます。

このドライバーは独立した Metabase コミュニティドライバーであり、Metabase には組み込まれていません。

この記事では、ユーザーの利用シナリオに沿って、次の操作を説明します。

| シナリオ | 目的 | 主な操作 |
|----------|----------|----------|
| Metabase 環境の準備 | Metabase で Apache Doris をデータソースとして認識できるようにする | Metabase をインストールし、Doris ドライバーをダウンロードしてインストールする |
| Doris データソースの設定 | Metabase から Doris の `tpch` データベースに接続する | FE ノード、Query Port、Catalog、データベース、ユーザー名、パスワードを入力する |
| 可視化分析の作成 | 出荷方法別の注文金額が時間とともにどう変化するかを分析する | Question を作成して SQL を記述し、折れ線グラフを設定してダッシュボードに保存する |
| 高度な機能の利用 | 外部データソースへのアクセスとクエリ体験の改善 | Catalog、パラメーター化クエリ、パーティションプルーニング、マテリアライズドビュー、キャッシュを利用する |

## Metabase 環境を準備する

### 前提条件

設定を始める前に、次の環境を用意してください。

| 項目 | 要件 |
|------|------|
| Metabase | Metabase `0.59.6.3` 以降をダウンロードしてインストールする。インストール方法は[Metabase のインストールドキュメント](https://www.metabase.com/docs/latest/installation-and-operation/installing-metabase)を参照してください |
| Java | Metabase の実行には Java 21 が必要 |
| Apache Doris | 接続可能な Apache Doris クラスターを用意する |
| Doris ドライバー | [Metabase Doris Driver](https://github.com/velodb/metabase-doris-driver/releases/tag/v1.0.0) をダウンロードする |

### ドライバーをダウンロードして検証する

:::caution
Metabase Doris Driver はサードパーティが提供・保守しています。Apache Doris プロジェクトの一部ではなく、Apache Doris コミュニティがリリースまたは推奨するものでもありません。本番環境で使用する前にドライバーを自身で評価し、ダウンロードしたファイルのチェックサムを検証して、サードパーティプロジェクトのライセンスに従ってください。ドライバーの問題は提供元のプロジェクトに報告してください。
:::

リリース版の JAR とチェックサムファイルをダウンロードします。

```bash
curl -LO https://github.com/velodb/metabase-doris-driver/releases/download/v1.0.0/doris.metabase-driver-v1.0.0.jar
curl -LO https://github.com/velodb/metabase-doris-driver/releases/download/v1.0.0/doris.metabase-driver-v1.0.0.jar.sha256
sha256sum -c doris.metabase-driver-v1.0.0.jar.sha256
```

期待される SHA-256 ダイジェストは次のとおりです。

```text
b23e82f19a7f9226343e42566e1e192b6df7a0dfc48a73d2101fc74bfec243f3
```

### 通常のデプロイでドライバーをインストールする

Metabase を通常の方法でデプロイしている場合は、次の手順で Doris ドライバーをインストールします。

1. 前述の手順に従って、ドライバーのリリースファイルをダウンロードし、検証します。

2. Metabase の plugins ディレクトリが存在しない場合は作成します。

    ```bash
    mkdir -p /path/to/metabase/plugins
    ```

3. リリース版の JAR を plugins ディレクトリにコピーします。

    ```bash
    cp doris.metabase-driver-v1.0.0.jar /path/to/metabase/plugins/doris.metabase-driver.jar
    ```

4. Metabase サービスを再起動します。

5. Metabase の起動ログで `doris` ドライバーが登録されていることを確認します。**Admin Settings** > **Databases** > **Add database** に、データベースの種類として **Apache Doris** が表示されます。

### Docker デプロイでドライバーをインストールする

Docker で Metabase を起動する場合は、`doris.metabase-driver.jar` をマウントして起動することを推奨します。Docker コンテナ内のプラグインのパスは `/plugins/` です。

1. ドライバーのリリースファイルをダウンロードし、検証します。

2. 前提条件を満たす Metabase イメージでコンテナを起動します。

    ```bash
    docker run -d \
      -p 3000:3000 \
      --name metabase \
      -v "$(pwd)/doris.metabase-driver-v1.0.0.jar:/plugins/doris.metabase-driver.jar:ro" \
      metabase/metabase
    ```

## Doris データソースを設定する

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Add an Apache Doris database connection on the Metabase admin page -->

Metabase と `metabase-doris-driver` をインストールしたら、Doris の `tpch` データベースに接続するデータソースを Metabase に追加できます。

### 接続パラメーター

Apache Doris に接続する際に使用する項目は次のとおりです。

| パラメーター | 意味 | 例 |
|------|------|------|
| **Display Name** | データソースの表示名 | Doris-TPCH |
| **Host** | Doris FE ノードのアドレス | 127.0.0.1 |
| **Port** | Doris の Query Port（MySQL プロトコルのポート）。デフォルトは `9030` | 9030 |
| **Catalog** | Catalog 名。省略可能で、デフォルトは `internal` | internal |
| **Database (optional)** | 選択した Catalog 内のデータベース。省略可能で、空欄の場合は Catalog 内の参照可能なすべてのデータベースが検出される | tpch |
| **Username** | ユーザー名 | root |
| **Password** | パスワード | your_password |
| **SSL** | JDBC TLS を有効にする。ドライバーは MariaDB の `sslMode=trust` を使用し、サーバー証明書やホスト名を検証しない | false |
| **Sync Schemas Include** | 省略可能。**Database (optional)** が空欄の場合に使用する、データベースのカンマ区切りの許可リスト | tpch |
| **Sync Schemas Exclude** | 省略可能。**Database (optional)** が空欄の場合に使用する、データベースのカンマ区切りの除外リスト。除外ルールが許可ルールより優先される | information_schema |
| **Additional JDBC connection string options** | その他の MariaDB JDBC URL パラメーター | connectTimeout=10000 |

Catalog とデータベースの範囲は、次のように選択します。

- **内部テーブル**：**Catalog** は `internal` のままにし、`tpch` などのデータベースを入力します。
- **外部テーブル**：外部 Catalog と、その Catalog 内で参照可能なデータベースを入力します。
- **複数のデータベース**：**Database (optional)** を空欄にします。ドライバーは設定したアカウントから参照可能なデータベースを検出し、その中のテーブルを一覧表示する前に許可リストと除外リストを適用します。

**Database (optional)** が空欄の場合、ドライバーはデフォルトで `information_schema`、`__internal_schema`、`mysql` を除外します。許可ルールと除外ルールでは大文字と小文字を区別せず、同じデータベースが両方のリストにある場合は除外ルールが優先されます。**Database (optional)** を明示的に設定した場合、同期範囲はそのデータベースに限定され、許可リストと除外リストの設定によって同期範囲は変わりません。

### 設定手順

1. Metabase を起動してログインを完了します。

2. 右上の歯車アイコンをクリックし、**Admin Settings** を選択します。

![Metabase の管理設定](/images/next/connection-integration/data-integration/metabase/metabase-01.png)

3. 左側のメニューで **Databases** を選択し、右上の **Add database** ボタンをクリックします。

![データベースを追加](/images/next/connection-integration/data-integration/metabase/metabase-02.png)

4. **Database type** のドロップダウンから **Apache Doris** を選択します。

![Apache Doris を選択](/images/next/connection-integration/data-integration/metabase/metabase-03.png)

5. 接続情報を入力します。

    | パラメーター | 値の例 |
    |------|--------|
    | **Display name** | Doris-TPCH |
    | **Host** | 127.0.0.1 |
    | **Port** | 9030 |
    | **Catalog** | internal |
    | **Database (optional)** | tpch |
    | **Username** | admin |
    | **Password** | ****** |

![接続情報を入力](/images/next/connection-integration/data-integration/metabase/metabase-04.png)

6. **Save** をクリックして設定を保存します。

7. Metabase が接続をテストし、データベースのメタデータの同期を開始します。接続に成功すると、成功を示すメッセージが表示されます。

![接続成功](/images/next/connection-integration/data-integration/metabase/metabase-05.png)

データソースの設定が完了したら、Metabase で可視化を作成できます。

## 可視化ダッシュボードを作成する

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Use Doris TPC-H data to create a Question and a Dashboard in Metabase -->

この例では、TPC-H データをデータソースとして使用します。Doris の TPC-H データソースの構築方法については、[Doris TPC-H ベンチマークのドキュメント](../../lakehouse/best-practices/tpch.md)を参照してください。

コスト分析のために、出荷方法別の注文金額が時間とともにどう増加するかを分析するとします。次の手順で可視化を設定できます。

### Question を作成する

1. ホームページ右上の **New +** ボタンをクリックし、**Question** を選択します。

![新しい Question を作成](/images/next/connection-integration/data-integration/metabase/metabase-06.png)

2. データソースを選択します。

    | パラメーター | 値の例 |
    |------|--------|
    | **Database** | Doris TPCH |
    | **Table** | lineitem |

![テーブルを選択](/images/next/connection-integration/data-integration/metabase/metabase-07.png)

### SQL でカスタム指標を作成する

売上高を計算するには、カスタム SQL 式を使用する必要があります。

1. 右上の **view sql** をクリックし、続いて **convert this question to SQL** をクリックして SQL を編集します。

![SQL モードに切り替え](/images/next/connection-integration/data-integration/metabase/metabase-08.png)

2. 次の SQL クエリを入力します。

    ```sql
    SELECT
      DATE_FORMAT(l_shipdate, '%Y-%m') AS ship_month,
      l_shipmode,
      SUM(l_extendedprice * (1 - l_discount)) AS revenue
    FROM lineitem
    WHERE l_shipdate >= '1995-01-01'
      AND l_shipdate < '1997-01-01'
    GROUP BY
      DATE_FORMAT(l_shipdate, '%Y-%m'),
      l_shipmode
    ORDER BY ship_month, l_shipmode
    ```

3. 右下の **Visualize** ボタンをクリックして結果を表示します。

![結果を表示](/images/next/connection-integration/data-integration/metabase/metabase-09.png)

### 可視化グラフを設定する

1. 結果はデフォルトで表として表示されます。左下の **Visualization** ボタンをクリックし、**Line** グラフを選択します。

![折れ線グラフを選択](/images/next/connection-integration/data-integration/metabase/metabase-10.png)

2. 必要に応じてグラフのパラメーターを設定します。Metabase は次の設定を自動的に生成します。

    | 設定 | 値の例 | 意味 |
    |--------|--------|------|
    | **X-axis** | ship_month | 出荷月 |
    | **Y-axis** | revenue | 売上高 |
    | **Series** | l_shipmode | 出荷方法 |

3. グラフのスタイルをカスタマイズします。

    - **Settings** アイコンをクリックして、色、ラベル、凡例の位置などを調整します。
    - **Display** タブでは、軸のタイトルや数値形式などを設定できます。

4. グラフの設定が完了したら、右上の **Save** をクリックして保存します。

5. Question 名に **my-tpch** を入力し、保存先の Collection を選択します。

![Question に名前を付ける](/images/next/connection-integration/data-integration/metabase/metabase-11.png)

### Dashboard を作成する

1. **+ New** > **Dashboard** をクリックして新しいダッシュボードを作成し、ダッシュボード名として **my-tpch** を入力します。

![ダッシュボードを作成](/images/next/connection-integration/data-integration/metabase/metabase-12.png)

2. **Add a chart** をクリックし、保存した Question をダッシュボードに追加します。

![Question を追加](/images/next/connection-integration/data-integration/metabase/metabase-13.png)

3. グラフの位置とサイズを調整し、右上の **Save** をクリックしてダッシュボードを保存します。

![ダッシュボードを保存](/images/next/connection-integration/data-integration/metabase/metabase-14.png)

これで Metabase から Apache Doris への接続、データ分析、可視化ダッシュボードの作成が完了しました。

## ドライバーの機能と制限

次の表に、ドライバーの機能と現在のサポート範囲をまとめます。

| 機能 | 対応状況と制限 |
|------|------|
| Internal Catalog | Doris の内部テーブルの同期とクエリに対応 |
| Native SQL | 対応。SQL は設定した Doris アカウントの権限で実行され、ドライバーはステートメントを読み取り専用に制限しない |
| Query Builder | グループ集計と日単位のバケット化に対応 |
| External Catalog | Doris の External Catalog にあるデータの同期とクエリに対応。利用できる範囲とメタデータの完全性は、個々のコネクターによって異なる |
| Native テンプレートパラメーター | 数値、テキスト、オプションブロックに対応 |
| 複合型 | トップレベルの `ARRAY`、`MAP`、`JSON`、および不透明な複合フィールドは表示されるが、ネストされたサブフィールドは展開されない |
| キーとインデックスのメタデータ | 主キー、外部キー、インデックス、テーブル権限は同期されない |
| Metabase の書き込み機能 | データアップロード、書き戻し、Actions、データ編集、永続化モデルには対応しない |

## 高度な利用シナリオ

<!-- Knowledge type: Feature description -->
<!-- Applicable scenario: Access external data sources, create interactive dashboards, and optimize query performance -->

### Catalog を使用して外部データにアクセスする

接続ページで **Catalog** と **Database (optional)** を設定すると、Doris の外部 Catalog にあるテーブルを同期できます。

| 設定 | 値の例 | 説明 |
|--------|--------|------|
| `Catalog` | `hive_catalog` | `hive_catalog` という名前の Doris Catalog を選択する |
| `Database (optional)` | `warehouse` | その Catalog 内の `warehouse` データベースを選択する |

![Catalog を設定](/images/next/connection-integration/data-integration/metabase/metabase-15.png)

SQL クエリでは Catalog を明示的に指定します。

```sql
SELECT * FROM hive.warehouse.orders LIMIT 100;
```

### パラメーター化クエリを使用する

ドライバーは基本的な Native SQL テンプレートパラメーターに対応しています。次の例では、数値パラメーター、テキストパラメーター、オプションブロックを使用します。

```sql
SELECT
  category,
  COUNT(*) AS row_count,
  SUM(amount) AS total_amount
FROM orders
WHERE amount > {{min_amount}}
[[AND category = {{category}}]]
GROUP BY category
```

`category` に値がない場合、Metabase はオプションブロック全体を削除します。

| テンプレート機能 | 対応状況 |
|----------|----------|
| 数値変数 | 対応 |
| テキスト変数 | 対応 |
| オプションブロック `[[ ... ]]` | 対応 |
| フィールドフィルター | 非対応 |
| `{{#card-id}}` などのカード参照 | 非対応 |
| 動的なテーブル参照 | 非対応 |

### データ型

メタデータの同期時に、ドライバーは Doris の型を次の表に示す Metabase の基本型に対応付けます。

| Doris の型 | Metabase の基本型 |
|------------|-------------------|
| `BOOLEAN` | `type/Boolean` |
| `TINYINT`、`SMALLINT`、`INT`、`INTEGER`（`INT(11)` のような表示幅を含む） | `type/Integer` |
| `BIGINT`、`LARGEINT`（`BIGINT(20)` のような表示幅を含む） | `type/BigInteger` |
| `FLOAT`、`DOUBLE` | `type/Float` |
| `DECIMAL` | `type/Decimal` |
| `DATE`、`DATEV2` | `type/Date` |
| `TIME`（小数秒の精度を含む） | `type/Time` |
| `DATETIME`、`DATETIMEV2`、`TIMESTAMP` | `type/DateTime` |
| `TIMESTAMPTZ` | `type/DateTimeWithTZ` |
| `CHAR`、`VARCHAR`、`STRING`、`TEXT` | `type/Text` |
| `JSON`、`JSONB` | `type/JSON` |
| `ARRAY` | `type/Array` |
| `MAP` | `type/Dictionary` |
| `STRUCT`、`VARIANT`、`HLL`、`BITMAP` | `type/*` |

`ARRAY`、`MAP`、`JSON`、`STRUCT`、`VARIANT` の値に含まれるネストされたフィールドは、Metabase のサブフィールドとして展開されません。`LARGEINT` は `type/BigInteger` に対応付けられ、文字列への変換は必要ありません。

### パフォーマンス調整の推奨事項

| 推奨事項 | 説明 |
|------|------|
| パーティションプルーニングを使用する | `WHERE` 句にパーティション列のフィルター条件を追加する。例：`WHERE date >= '2024-01-01' AND date < '2024-02-01'` |
| マテリアライズドビューを活用する | 複雑な集計クエリでは Doris にマテリアライズドビューを作成して、クエリを高速化する |
| 結果セットのサイズを制御する | `LIMIT` で返す行数を制限し、一度に大量のデータを読み込まないようにする |
| クエリキャッシュを使用する | Metabase はクエリ結果を自動的にキャッシュする。適切なキャッシュ時間を設定すると性能を改善できる |

### 接続と利用のヒント

| シナリオ | 推奨事項 |
|------|------|
| ドライバーのインストール | `doris.metabase-driver.jar` が Metabase の `plugins` ディレクトリに配置されていることを確認し、Metabase を再起動する |
| タイムゾーンの設定 | タイムゾーンに関する問題が発生した場合は、JDBC 接続文字列に `serverTimezone=Asia/Shanghai` を追加する |
| パーティションテーブルの最適化 | Doris のパーティションテーブルを適切に作成し、時間に基づいてパーティション分割とバケット分割を行い、クエリでスキャンするデータ量を効果的に減らす |
| ネットワーク接続 | パブリックネットワーク経由のアクセスに伴うセキュリティリスクを避けるため、VPC のプライベート接続を使用する |
| 権限管理 | Doris ユーザーアカウントのロールとアクセス権限を細かく設定し、最小権限の原則に従う |
| メタデータの同期 | Doris のテーブル構造が変わった場合は、Metabase の管理画面で **Sync database schema now** をクリックして手動で同期する |
| パフォーマンスの監視 | クエリが遅い場合は、Doris で `SHOW QUERY PROFILE` を使用して性能上のボトルネックを分析する |

### データ型の表示に異常がある場合

Metabase でデータ型が異常に表示される場合は、まず Doris Driver の最新版を使用していることを確認してください。Doris の `largeint` 型については、SQL で明示的に変換する必要があります。

```sql
SELECT CAST(large_int_col AS STRING) FROM table
```
