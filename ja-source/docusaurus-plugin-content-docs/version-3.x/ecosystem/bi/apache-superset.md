---
{
  "title": "Apache Superset",
  "language": "ja",
  "description": "Apache Supersetは、豊富なデータソース接続と様々な可視化手法をサポートするオープンソースのデータマイニングプラットフォームです。"
}
---
Apache Supersetは、豊富なデータソース接続、多様な可視化手法、きめ細かいユーザーアクセス制御をサポートするオープンソースのデータマイニングプラットフォームです。主な機能には、セルフサービス分析、カスタマイズ可能なダッシュボード、分析結果の可視化（エクスポート）、ユーザー/ロールアクセス制御、SQL編集とクエリのための統合SQLエディタが含まれます。

Apache Supersetバージョン3.1は公式接続方法を提供し、Apache Dorisの内部および外部データのクエリと可視化の両方を公式にサポートしています。Apache Dorisバージョン2.0.4以上が推奨されます。

この接続方法により、SupersetはApache Dorisデータベースとテーブルをデータソースとして統合できます。この機能を有効にするには、以下のセットアップガイドに従ってください：

- 前提条件のセットアップ
- Apache SupersetでのApache Dorisデータソースの設定
- Apache Supersetでの可視化の構築
- 接続と使用のヒント

## Supersetとthe Doris Python clientのインストール

1. Python 3をインストールしてください。バージョン3.1.11が推奨されます。
2. Apache Supersetバージョン3.1以降をインストールしてください。詳細は[Installing Superset from PyPI repository](https://superset.apache.org/docs/installation/installing-superset-from-pypi)を参照してください。
3. Apache SupersetサーバーにApache Doris Python clientをインストールしてください。以下のコマンドを参考にできます：

```
pip install pydoris
```
インストール結果の確認:

```
-> pip list | grep pydoris
pydoris                       1.1.0
```
環境が正しいことを確認したら、SupersetでDorisデータソースを設定し、データビジュアライゼーションの構築を開始できます！

## SupersetでのDorisデータソースの設定

**Pydoris**と**Apache Superset**ドライバーをインストールしたので、Dorisのtpchデータベースに接続するSupersetのデータソースを定義する方法を見てみましょう。

1. PydorisでApache Dorisに接続するには、SQLAlchemy URI接続文字列を設定する必要があります：

この形式で設定を完了してください：

`doris://<User>:<Password>@<Host>:<Port>/<Catalog>.<Database>`

URIパラメータは以下で説明されています：

| パラメータ | 意味 | 例 |
|------|------|------|
| **User** | ユーザー名 | testuser |
| **Password** | パスワード | xxxxxx |
| **Host** | データベースホスト | 127.0.1.28 |
| **Port** | データベースクエリポート | 9030 |
| **Catalog** | Doris Catalog、外部テーブルとデータレイクのクエリ時に使用、内部テーブルはinternal | internal |
| **Database** | データベース名 | tpch |

2. Supersetへのアクセス。

![](/images/ecomsystem/superset/OXIbbtkncoLHDUxjfdCcAmaenJm.png)

3. ログイン後、右上のSettings -> Database Connectorsをクリックします。

![](/images/ecomsystem/superset/ELzsb6xMaoqcAYxnVuzcP3hhnbg.png)

4. Add Databaseをクリックします。Connect a databaseポップアップウィンドウで、Apache Dorisを選択します。

![](/images/ecomsystem/superset/TQpibvPYEoyKltx34G5c8B5AnGg.png)

5. 接続情報にSQLAlchemy URIを入力します。接続が正しいことを確認後、Connectをクリックします。

![](/images/ecomsystem/superset/FndlbO7Fgo4ppixTFWIc0UQUnFb.png)

6. データソースの追加が完了しました。

![](/images/ecomsystem/superset/GsClbUlmsooSdMx994tcjqm1nre.png)

次に、Supersetでビジュアライゼーションを構築できます！

## Supersetでのビジュアライゼーション構築

データソースとしてTPC-Hデータを選択します。Doris TPC-Hデータソースの構築手順については、[このドキュメント](../../benchmark/tpch)を参照してください。

SupersetでDorisデータソースを設定したので、データを可視化してみましょう...

コスト分析のために、異なる輸送方法の注文金額の時間変動曲線を分析する必要があるとします。

1. DatasetsをクリックしてDatasetを追加します

![](/images/ecomsystem/superset/C55Kbstx1ogXOtxadBccEavLnOf.png)

2. 以下を順番に選択し、右下のCreate dataset and create chartをクリックします：
   - Database：Doris
   - Schema： tpch
   - Table：lineitem

![](/images/ecomsystem/superset/AAlebfk9ro0SkCxLKXFcq2Scnov.png)

3. lineitem Datasetを編集します

![](/images/ecomsystem/superset/BHIObcQrboRQWSx4yatcoo4enxc.png)

4. Metrics -> Add itemをクリックして計算メトリックを追加します。
   - Metric Key : Revenue
   - SQL expression :  `SUM(`l_extendedprice` * (1 - `l_discount`))`

![](/images/ecomsystem/superset/DUOvbeQPdojk9YxAsbGcfKT2nOe.png)

5. Chart -> Add Chartに移動し、dataesetでlineitemを選択し、チャートタイプでLine Chartを選択します。

![](/images/ecomsystem/superset/KKndbObRCoVBDQxOgMNcJLYanUz.png)

6. l_shipdateをX軸にドラッグして時間粒度を設定します。同時に、Revenumカスタムメトリックとデータ列l_shipmodeをそれぞれMetersとDimensionsにドラッグします。

![](/images/ecomsystem/superset/Aewqbeul9oFZekx3vOUcZ3ranAf.png)

7. Update chartをクリックしてダッシュボードコンテンツを表示します。Saveをクリックしてダッシュボードを保存します。

![](/images/ecomsystem/superset/WwYLbzgatoYuLzx9jjmc1STOnwb.png)

この時点で、SupersetはApache Dorisへの接続に成功し、データ分析とビジュアライゼーションダッシュボードの作成が実装されました。

## 接続と使用のヒント

- データベース作成時にApache Dorisを選択できるよう、Superset環境にpydorisを事前にインストールしてください。
- 実際のニーズに応じてDorisデータベーステーブルを合理的に作成し、時間によるパーティショニングとバケティングを行うことで、述語フィルタリングとほとんどのデータ転送を効果的に削減できます。
- パブリックネットワークアクセスによるセキュリティリスクを避けるため、VPCプライベート接続の使用を推奨します。
- 過度の権限委譲を避けるため、Dorisユーザーアカウントの役割とアクセス権限を詳細に設定してください。
