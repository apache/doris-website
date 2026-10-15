---
{
    "title": "QuickSight",
    "language": "ja",
    "description": "Amazon QuickSight から MySQL データソースを介して Apache Doris に接続し、Directly query モードのデータセットを設定して、TPC-H データに基づく可視化ダッシュボードを作成します。",
    "keywords": [
        "QuickSight から Doris に接続",
        "Amazon QuickSight Apache Doris",
        "Doris のデータ可視化と分析",
        "QuickSight Directly query"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: BI tool integration / Visualization analysis -->

QuickSight は公式の MySQL データソースを介して Apache Doris に接続でき、**Directly query** モードと **Import** モードの両方をサポートします。このドキュメントは、QuickSight で Doris のデータを分析したいユーザー向けです。接続の準備、データセットの作成、TPC-H データを使って複数のテーブルを結合した可視化ダッシュボードを構築する手順を説明します。

## 適用シナリオ

| ユースケース | 目的 | 結果 |
| --- | --- | --- |
| Doris データソースへの接続 | QuickSight の公式 MySQL データソースを介して Apache Doris に接続する | QuickSight から Doris クラスターのデータにアクセスできる |
| 分析用データセットの作成 | Doris のテーブルに基づいて QuickSight のデータセットを作成する | 作成したデータセットを後続の分析や可視化に使用できる |
| 複数テーブルを結合したダッシュボードの構築 | TPC-H の `customer`、`nation`、`orders` テーブルを使って結合分析を行う | 国と注文ステータス別の注文数を集計するダッシュボードを作成できる |

## 作業の流れ

| 段階 | 目的 | 内容 |
| --- | --- | --- |
| ステップ 1 | 接続の準備 | Doris のバージョン、ネットワーク接続、MySQL 互換バージョンを確認する |
| ステップ 2 | QuickSight データソースの作成 | QuickSight の公式 MySQL コネクタを使って Apache Doris に接続する |
| ステップ 3 | データセットの作成 | Doris のテーブルを選択し、**Directly query** モードでデータセットを作成する |
| ステップ 4 | 可視化ダッシュボードの構築 | 複数のデータセットを追加し、テーブル間の結合を設定して、分析ダッシュボードを公開する |

## 前提条件

設定を始める前に、以下の条件を満たしていることを確認してください。

| 要件 | 条件 |
| --- | --- |
| Doris のバージョン | Apache Doris 3.1.2 以降 |
| ネットワーク接続 | Doris のデプロイ環境に応じて VPC とセキュリティグループを設定し、AWS サーバーから Doris クラスターにアクセスできるようにする |
| MySQL 互換バージョン | Doris に接続する MySQL クライアントで MySQL 互換バージョンを宣言する |

Doris に接続する MySQL クライアントで、次の SQL を実行して MySQL 互換バージョンを宣言します。

```sql
SET GLOBAL version = '8.3.99';
```

次の SQL を実行して設定を確認します。

```sql
mysql> show variables like "version";
+---------------+--------+---------------+---------+
| Variable_name | Value  | Default_Value | Changed |
+---------------+--------+---------------+---------+
| version       | 8.3.99 | 5.7.99        | 1       |
+---------------+--------+---------------+---------+
1 row in set (0.01 sec)
```

## QuickSight から Apache Doris に接続する

このセクションでは、QuickSight で Doris データソースを作成し、Doris のテーブルに基づくデータセットを作成する方法を説明します。

### ステップ 1：QuickSight の新しいデータセットを作成する

[QuickSight コンソール](https://quicksight.aws.amazon.com/)を開き、データセットのページで **New dataset** をクリックします。

![QuickSight のデータセットページを開く](/images/next/connection-integration/data-integration/quicksight/Cm8EbaeoIoYDeAxGDR8cuSFhns1.png)

![QuickSight の新しいデータセットを作成する](/images/next/connection-integration/data-integration/quicksight/XngnbqKxhouZHIxgVYhcyta5n3f.png)

### ステップ 2：MySQL コネクタを選択する

QuickSight に組み込まれている公式の MySQL コネクタを検索して選択します。

![QuickSight の MySQL コネクタを選択する](/images/next/connection-integration/data-integration/quicksight/Pjf5bRheroLmtKxcZ2PcFYMkn7d.png)

### ステップ 3：Doris の接続情報を入力する

画面の指示に従って Doris の接続情報を入力します。MySQL インターフェースのポートのデフォルト値は `9030` です。実際のポートは Doris FE の `query_port` 設定によって決まります。

![Doris の接続情報を入力する](/images/next/connection-integration/data-integration/quicksight/DlJobTycDoqhDOxdUtCcqZCxnkc.png)

### ステップ 4：Doris のテーブルとクエリモードを選択する

一覧から分析する Doris のテーブルを選択します。

![Doris のテーブルを選択する](/images/next/connection-integration/data-integration/quicksight/LAFXbSSnwop5C7xn3kPcEcBZnmc.png)

**Directly query** モードを選択することを推奨します。

![Directly query モードを選択する](/images/next/connection-integration/data-integration/quicksight/RN4fbtJU5o89gQxePQKcOGRBnyh.png)

**Edit/Preview data** をクリックすると、テーブルのスキーマを確認し、カスタム SQL を調整して、データセットを変更できます。

![QuickSight のデータセットをプレビューして編集する](/images/next/connection-integration/data-integration/quicksight/DoVOMbQTxBrRBpx3Bbgn2gcUXLd.png)

### ステップ 5：データセットを公開して可視化を作成する

データセットの設定が完了したら、データセットを公開して新しい可視化を作成できます。

![QuickSight のデータセットを公開する](/images/next/connection-integration/data-integration/quicksight/MXgObQbdDoLBVTxBrRBcUpx3n2g.png)

## QuickSight で可視化を構築する

このセクションでは、TPC-H データをデータソースとして使用し、QuickSight で複数のテーブルを結合した可視化ダッシュボードを構築する方法を示します。Doris の TPC-H データソースの構築方法については、[TPC-H ベンチマークのドキュメント](../../lakehouse/best-practices/tpch.md)を参照してください。

この例では、国ごとに注文ステータス別の注文数を集計します。Doris は複数テーブルの結合に対して優れたクエリ性能を発揮するため、`customer`、`nation`、`orders` テーブルを使って結合分析を行います。

### ステップ 1：Doris のテーブルに基づくデータセットを作成する

1. 先ほど作成したデータソースを使用し、次のテーブルをデータセットとして追加します。

    - `customer`
    - `nation`
    - `orders`

2. **Create dataset** をクリックします。

    ![QuickSight のデータセットを作成する](/images/next/connection-integration/data-integration/quicksight/LDeebS3RdoB6hPxcYkacV88VnMd.png)

3. 先ほど作成したデータソースを選択します。

    ![先ほど作成したデータソースを選択する](/images/next/connection-integration/data-integration/quicksight/LQlLb26gZoXOurxO3AJc0xCBnqd.png)

4. 必要なテーブルを選択します。

    ![分析するテーブルを選択する](/images/next/connection-integration/data-integration/quicksight/W7bDb42r4ovxr3xGDU0cRxmbnsf.png)

5. **Directly query** モードを選択します。

    ![データセットに Directly query モードを選択する](/images/next/connection-integration/data-integration/quicksight/Nllyb7GkJo8ToCxXSuDc4gNgnvg.png)

6. **Visualize** をクリックしてデータソースを作成し、ほかのテーブルについても同じ手順でデータソースを作成します。

### ステップ 2：分析に複数のデータセットを追加する

1. ダッシュボードの編集画面を開き、現在のデータセットのドロップダウンをクリックして **Add new dataset** を選択します。

    ![分析に新しいデータセットを追加する](/images/next/connection-integration/data-integration/quicksight/D18HbY2PWoQvMOxlJTRcOfZenEh.png)

2. 使用するデータセットをすべて選択し、**Select** をクリックして現在のダッシュボードに追加します。

    ![複数のデータセットを選択する](/images/next/connection-integration/data-integration/quicksight/TzM6boK9No1wD0xBBeAcaJGcnDd.png)

### ステップ 3：データセット間の結合を設定する

1. データセットを追加したら、`nation` の操作メニューをクリックしてデータセットの編集画面を開きます。

    ![nation データセットの編集画面を開く](/images/next/connection-integration/data-integration/quicksight/Y0GpbCY0oo6xeYxfufAcPAC6n1e.png)

2. **Add data** をクリックしてデータソースを追加します。

    ![データセットにデータソースを追加する](/images/next/connection-integration/data-integration/quicksight/ZNKgbdPivoM3y7xwr8kcZbWPn8c.png)

3. 三つのテーブルをすべて追加したら、結合キーを設定します。結合関係は次のとおりです。

    | 左側のテーブル | 左側のフィールド | 右側のテーブル | 右側のフィールド |
    | --- | --- | --- | --- |
    | `customer` | `c_nationkey` | `nation` | `n_nationkey` |
    | `customer` | `c_custkey` | `orders` | `o_custkey` |

    ![三つのテーブル間の結合を設定する](/images/next/connection-integration/data-integration/quicksight/HVNIbL0yDouA8axQmIocXFhFnmc.png)

4. 結合を設定したら、右上の **Save & publish** をクリックして公開します。

    ![結合したデータセットを公開する](/images/next/connection-integration/data-integration/quicksight/CD9pbqFIOouYFtxUrs9cMlyAnph.png)

### ステップ 4：グラフを設定してダッシュボードを公開する

1. 三つのデータソースを追加した **Analyses** 画面に戻り、`n_name` をクリックして、国名別の総注文数を集計するグラフを生成します。

    ![国名別の総注文数を集計する](/images/next/connection-integration/data-integration/quicksight/D6Yrb7Igwo5520x3WBbcZ8T9n9f.png)

2. **VALUE** で `o_orderkey`、**GROUP/COLOR** で `o_orderstatus` を選択し、国と注文ステータス別の注文数を集計するダッシュボードを作成します。

    ![国と注文ステータス別の注文数を集計する](/images/next/connection-integration/data-integration/quicksight/Sl8nbfrszok2bexesfwcsNqbngc.png)

3. 右上の **Publish** をクリックして、ダッシュボードの公開を完了します。

## 結果

これで、QuickSight から Apache Doris への接続と、データ分析・可視化ダッシュボードの構築が完了しました。
