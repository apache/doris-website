---
{
  "title": "リリース 1.1.0",
  "language": "ja",
  "description": "バージョン1.1では、コンピューティング層とストレージ層の完全なベクトル化を実現しました。"
}
---
バージョン1.1では、コンピューティング層とストレージ層の完全なベクトル化を実現し、ベクトル化実行エンジンを安定した機能として正式に有効にしました。すべてのクエリはデフォルトでベクトル化実行エンジンによって実行され、パフォーマンスは以前のバージョンより3-5倍向上しています。Apache Icebergの外部テーブルへのアクセス機能が向上し、DorisとIcebergのデータの連携クエリをサポートし、データレイクでのApache Dorisの分析能力を拡張します。元のLZ4に加えてZSTD圧縮アルゴリズムが追加され、データ圧縮率がさらに向上しました。以前のバージョンの多くのパフォーマンスと安定性の問題が修正され、システムの安定性が大幅に向上しています。ダウンロードと使用を推奨します。

## アップグレード注意事項

### ベクトル化実行エンジンがデフォルトで有効

バージョン1.0では、実験的機能としてベクトル化実行エンジンを導入し、ユーザーがクエリを実行する際は`set batch_size = 4096`と`set enable_vectorized_engine = true`でセッション変数を設定して手動で有効にする必要がありました。

バージョン1.1では、ベクトル化実行エンジンを安定した機能として正式に完全に有効にしました。セッション変数`enable_vectorized_engine`はデフォルトでtrueに設定されています。すべてのクエリはデフォルトでベクトル化実行エンジンを通して実行されます。

### BEバイナリファイル名の変更

BEバイナリファイルはpalo_beからdoris_beに名前が変更されました。クラスター管理やその他の操作でプロセス名に依存していた場合は、関連スクリプトの修正にご注意ください。

### Segmentストレージ形式のアップグレード

Apache Dorisの初期バージョンのストレージ形式はSegment V1でした。バージョン0.12では、新しいストレージ形式としてSegment V2を実装し、Bitmapインデックス、メモリテーブル、ページキャッシュ、辞書圧縮、遅延マテリアライゼーションなど多くの機能を導入しました。バージョン0.13以降、新しく作成されるテーブルのデフォルトストレージ形式はSegment V2となり、Segment V1形式との互換性を維持しています。

コード構造の保守性を確保し、冗長な履歴コードによる追加の学習・開発コストを削減するため、次のバージョンからSegment v1ストレージ形式のサポートを終了することを決定しました。このコード部分はApache Doris 1.2バージョンで削除される予定です。

### 通常のアップグレード

通常のアップグレード操作については、公式ウェブサイトのクラスターアップグレードドキュメントに従ってローリングアップグレードを実行できます。

[https://doris.apache.org//docs/admin-manual/cluster-management/upgrade](https://doris.apache.org//docs/admin-manual/cluster-management/upgrade)

## 機能

### データのランダム分散をサポート [実験的]

一部のシナリオ（ログデータ解析など）では、ユーザーがデータスキューを回避するための適切なバケットキーを見つけることができない場合があるため、システムは問題を解決するための追加の分散方法を提供する必要があります。

したがって、テーブル作成時に`DISTRIBUTED BY random BUCKETS number`を設定してランダム分散を使用できます。データはインポート時に単一のタブレットにランダムに書き込まれ、読み込みプロセス中のデータファンアウトを削減し、リソースオーバーヘッドを削減してシステム安定性を向上させます。

### Iceberg外部テーブルの作成をサポート[実験的]

Iceberg外部テーブルは、Apache DorisにIcebergに保存されたデータへの直接アクセスを提供します。Iceberg外部テーブルを通して、ローカルストレージとIcebergに保存されたデータの連携クエリを実装でき、煩雑なデータロード作業を節約し、データ解析のシステムアーキテクチャを簡素化し、より複雑な分析操作を実行できます。

バージョン1.1では、Apache DorisはIceberg外部テーブルの作成とデータクエリをサポートし、REFRESHコマンドを通したIcebergデータベースのすべてのテーブルスキーマの自動同期をサポートします。

### ZSTD圧縮アルゴリズムを追加

現在、Apache Dorisのデータ圧縮方法はシステムによって統一的に指定され、デフォルトはLZ4です。データストレージコストに敏感な一部のシナリオでは、元のデータ圧縮率要件を満たすことができません。

バージョン1.1では、ユーザーはテーブル作成時にテーブルプロパティで"compression"="zstd"を設定して圧縮方法をZSTDとして指定できます。25GB 1億1000万行のテキストログテストデータでは、最高圧縮率は約10倍、元の圧縮率より53%高く、ディスクからデータを読み取り解凍する速度が30%向上しました。

## 改善

### より包括的なベクトル化サポート

バージョン1.1では、コンピューティング層とストレージ層の完全なベクトル化を実装しました：

すべての組み込み関数のベクトル化を実装

ストレージ層でベクトル化を実装し、低カーディナリティ文字列カラムの辞書最適化をサポート

ベクトル化エンジンの多数のパフォーマンスと安定性の問題を最適化・解決

SSBとTPC-H標準テストデータセットでApache Dorisバージョン1.1と0.15のパフォーマンステストを実施しました：

SSBテストデータセットの全13SQLにおいて、バージョン1.1はバージョン0.15より優れており、全体的なパフォーマンスは約3倍向上し、バージョン1.0の一部シナリオでのパフォーマンス劣化問題を解決しました。

TPC-Hテストデータセットの全22SQLにおいて、バージョン1.1はバージョン0.15より優れており、全体的なパフォーマンスは約4.5倍向上し、一部シナリオのパフォーマンスは10倍以上向上しました。

![release-note-1.1.0-SSB](/images/release-note-1.1.0-SSB.png)

<p align='center'>SSB Benchmark</p>

![release-note-1.1.0-TPC-H](/images/release-note-1.1.0-TPC-H.png)

<p align='center'>TPC-H Benchmark</p>

**パフォーマンステストレポート**

[https://doris.apache.org//docs/benchmark/ssb](https://doris.apache.org//docs/benchmark/ssb)

[https://doris.apache.org//docs/benchmark/tpch](https://doris.apache.org//docs/benchmark/tpch)

### Compactionロジックの最適化とリアルタイム保証

Apache Dorisでは、各コミットでデータバージョンが生成されます。高並行書き込みシナリオでは、データバージョンが多すぎることとcompactionが適時でないことにより-235エラーが発生しやすく、クエリパフォーマンスも相応に低下します。

バージョン1.1では、QuickCompactionを導入し、データバージョンが増加したときにcompactionを能動的にトリガーします。同時に、フラグメントメタデータをスキャンする機能を向上させることで、データバージョンが多すぎるフラグメントを迅速に発見してcompactionをトリガーできます。能動的トリガーと受動的スキャンを通して、データマージのリアルタイム問題を完全に解決しました。

同時に、高頻度小ファイルcumulative compactionに対して、compactionタスクのスケジューリングと分離を実装し、重量級のbase compactionが新しいデータのマージに影響することを防ぎます。

最後に、小ファイルのマージに対して、小ファイルマージ戦略を最適化し、段階的マージの方法を採用しました。毎回マージに参加するファイルは同じデータ規模に属し、サイズが大幅に異なるバージョンのマージを防ぎ、階層的に段階的にマージし、単一ファイルがマージに参加する回数を削減し、システムのCPU消費を大幅に節約できます。

データ上流が毎秒10万の書き込み頻度を維持する場合（20並行書き込みタスク、ジョブあたり5000行、チェックポイント間隔1秒）、バージョン1.1は以下のような動作をします：

- 迅速なデータ統合：Tabletバージョンは50以下を維持し、compactionスコアは安定しています。以前のバージョンで高並行書き込み時に頻発した-235問題と比較して、compactionマージ効率は10倍以上向上しました。

- CPUリソース消費を大幅削減：小ファイルCompactionに対して戦略を最適化しました。上記の高並行書き込みシナリオで、CPUリソース消費が25%削減されました。

- 安定したクエリ時間消費：データの全体的な整合性が向上し、クエリ時間消費の変動が大幅に削減されました。高並行書き込み時のクエリ時間消費はクエリのみの場合と同じで、クエリパフォーマンスは以前のバージョンと比較して3-4倍向上しました。

### ParquetおよびORCファイルの読み取り効率最適化

arrowパラメータを調整してarrowのマルチスレッド読み取り機能を使用し、Arrowの各row_groupの読み取りを高速化し、SPSCモデルに変更してプリフェッチを通してネットワーク待機コストを削減しました。最適化後、Parquetファイルインポートのパフォーマンスは4-5倍向上しました。

### より安全なメタデータCheckpoint

メタデータcheckpoint後に生成されたイメージファイルをダブルチェックし、履歴イメージファイルの機能を保持することで、イメージファイルエラーによるメタデータ破損問題を解決しました。

## バグ修正

### データバージョンの欠落によりデータをクエリできない問題を修正（重要）

この問題はバージョン1.0で導入され、複数レプリカのデータバージョン損失を引き起こす可能性があります。

### ロードタスクのリソース使用制限に対するリソース分離が無効な問題を修正（中程度）

1.1では、broker loadとroutine loadは指定されたリソースタグを持つBackendsを使用してロードを実行します。

### 2GBを超えるネットワークデータパケットの転送にHTTP BRPCを使用（中程度）

以前のバージョンでは、Backends間でBRPCを通して送信されるデータが2GBを超えた場合、データ送信エラーが発生する可能性がありました。

## その他

### Mini Loadの無効化

`/_load`インターフェースはデフォルトで無効化されています。`/_stream_load`インターフェースを統一して使用してください。もちろん、FE設定項目`disable_mini_load`をオフにして再度有効にできます。

Mini Loadインターフェースはバージョン1.2で完全に削除されます。

### SegmentV1ストレージ形式の完全無効化

SegmentV1形式のデータの新規作成は許可されなくなりました。既存のデータは正常にアクセスを継続できます。`ADMIN SHOW TABLET STORAGE FORMAT`文を使用してクラスター内にSegmentV1形式のデータがまだ存在するかを確認できます。データ変換コマンドを通してSegmentV2に変換してください。

SegmentV1データへのアクセスはバージョン1.2でサポートされなくなります。

### String型の最大長制限

以前のバージョンでは、String型は最大2GBの長さが許可されていました。バージョン1.1では、文字列型の最大長を1MBに制限します。この長さを超える文字列はもう書き込めません。同時に、String型をテーブルのパーティションまたはバケットカラムとして使用することはサポートされなくなりました。

既に書き込まれたString型は正常にアクセスできます。

### fastjson関連の脆弱性を修正

fastjsonセキュリティ脆弱性を修正するためCanalバージョンを更新しました。

### `ADMIN DIAGNOSE TABLET`コマンドを追加

指定されたタブレットの問題を迅速に診断するために使用されます。

## ダウンロードして使用

### ダウンロードリンク

[hhttps://doris.apache.org/download](https://doris.apache.org/download)

### フィードバック

使用中に問題が発生した場合は、GitHub discussionフォーラムまたはDev eメールグループを通していつでもお気軽にお問い合わせください。

GitHubフォーラム：[https://github.com/apache/doris/discussions](https://github.com/apache/doris/discussions)

メーリングリスト：dev@doris.apache.org

## 謝辞

このリリースに貢献いただいたすべての方に感謝します：

```

@adonis0147

@airborne12

@amosbird

@aopangzi

@arthuryangcs

@awakeljw

@BePPPower

@BiteTheDDDDt

@bridgeDream

@caiconghui

@cambyzju

@ccoffline

@chenlinzhong

@daikon12

@DarvenDuan

@dataalive

@dataroaring

@deardeng

@Doris-Extras

@emerkfu

@EmmyMiao87

@englefly

@Gabriel39

@GoGoWen

@gtchaos

@HappenLee

@hello-stephen

@Henry2SS

@hewei-nju

@hf200012

@jacktengg

@jackwener

@Jibing-Li

@JNSimba

@kangshisen

@Kikyou1997

@kylinmac

@Lchangliang

@leo65535

@liaoxin01

@liutang123

@lovingfeel

@luozenglin

@luwei16

@luzhijing

@mklzl

@morningman

@morrySnow

@nextdreamblue

@Nivane

@pengxiangyu

@qidaye

@qzsee

@SaintBacchus

@SleepyBear96

@smallhibiscus

@spaces-X

@stalary

@starocean999

@steadyBoy

@SWJTU-ZhangLei

@Tanya-W

@tarepanda1024

@tianhui5

@Userwhite

@wangbo

@wangyf0555

@weizuo93

@whutpencil

@wsjz

@wunan1210

@xiaokang

@xinyiZzz

@xlwh

@xy720

@yangzhg

@Yankee24

@yiguolei

@yinzhijian

@yixiutt

@zbtzbtzbt

@zenoyang

@zhangstar333

@zhangyifan27

@zhannngchen

@zhengshengjun

@zhengshiJ

@zingdle

@zuochunwei

@zy-kkk
```
