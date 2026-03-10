---
{
  "title": "Release 1.1.0",
  "language": "ja",
  "description": "バージョン1.1では、コンピューティング層とストレージ層の完全なベクトル化を実現しました。"
}
---
バージョン1.1では、コンピューティング層とストレージ層の完全なベクトル化を実現し、ベクトル化実行エンジンを安定した機能として正式に有効化しました。すべてのクエリはデフォルトでベクトル化実行エンジンによって実行され、パフォーマンスは前バージョンより3-5倍向上しています。Apache Icebergの外部テーブルにアクセスする機能を向上させ、DorisとIceberg内のデータの連合クエリをサポートし、データレイクに対するApache Dorisの分析機能を拡張します。元のLZ4に加えてZSTD圧縮アルゴリズムが追加され、データ圧縮率がさらに向上しました。前バージョンの多くのパフォーマンスと安定性の問題を修正し、システムの安定性を大幅に改善しました。ダウンロードして使用することを推奨します。

## アップグレード注意事項

### ベクトル化実行エンジンがデフォルトで有効化

バージョン1.0では、ベクトル化実行エンジンを実験的機能として導入し、ユーザーがクエリを実行する際に`set batch_size = 4096`と`set enable_vectorized_engine = true`でセッション変数を設定することで手動で有効化する必要がありました。

バージョン1.1では、ベクトル化実行エンジンを安定した機能として正式に完全有効化しました。セッション変数`enable_vectorized_engine`はデフォルトでtrueに設定されています。すべてのクエリはデフォルトでベクトル化実行エンジンを通じて実行されます。

### BEバイナリファイルの名前変更

BEバイナリファイルがpalo_beからdoris_beに名前変更されました。クラスター管理やその他の操作でプロセス名に依存していた場合は、関連するスクリプトの修正にご注意ください。

### セグメントストレージ形式のアップグレード

Apache Dorisの以前のバージョンのストレージ形式はSegment V1でした。バージョン0.12では、新しいストレージ形式としてSegment V2を実装し、Bitmapインデックス、メモリテーブル、ページキャッシュ、辞書圧縮、遅延マテリアライゼーションなど多くの機能を導入しました。バージョン0.13以降、新しく作成されるテーブルのデフォルトストレージ形式はSegment V2となり、Segment V1形式との互換性は維持されています。

コード構造の保守性を確保し、冗長な履歴コードによる追加の学習・開発コストを削減するため、次バージョンからSegment v1ストレージ形式のサポートを終了することを決定しました。このコード部分はApache Doris 1.2バージョンで削除される予定です。

### 通常のアップグレード

通常のアップグレード操作については、公式サイトのクラスターアップグレードドキュメントに従ってローリングアップグレードを実行できます。

[https://doris.apache.org//docs/admin-manual/cluster-management/upgrade](https://doris.apache.org//docs/admin-manual/cluster-management/upgrade)

## 機能

### データのランダム分散のサポート [実験的]

一部のシナリオ（ログデータ分析など）では、ユーザーがデータスキューを回避するための適切なバケットキーを見つけられない場合があるため、システムはこの問題を解決するための追加の分散方法を提供する必要があります。

そのため、テーブル作成時に`DISTRIBUTED BY random BUCKETS number`を設定してランダム分散を使用できます。データはインポート時にランダムに単一のタブレットに書き込まれ、読み込みプロセス中のデータファンアウトを削減します。また、リソースオーバーヘッドを削減し、システムの安定性を向上させます。

### Iceberg外部テーブルの作成サポート[実験的]

Iceberg外部テーブルは、Apache DorisにIcebergに格納されたデータへの直接アクセスを提供します。Iceberg外部テーブルを通じて、ローカルストレージとIcebergに格納されたデータの連合クエリを実装でき、煩雑なデータ読み込み作業を節約し、データ分析のためのシステムアーキテクチャを簡素化し、より複雑な分析操作を実行します。

バージョン1.1では、Apache DorisはIceberg外部テーブルの作成とデータクエリをサポートし、REFRESHコマンドを通じてIcebergデータベース内のすべてのテーブルスキーマの自動同期をサポートします。

### ZSTD圧縮アルゴリズムの追加

現在、Apache Dorisのデータ圧縮方式はシステムによって統一的に指定され、デフォルトはLZ4です。データストレージコストに敏感な一部のシナリオでは、元のデータ圧縮率要件を満たすことができませんでした。

バージョン1.1では、ユーザーはテーブル作成時にテーブルプロパティで"compression"="zstd"を設定して圧縮方式をZSTDとして指定できます。25GBの1億1000万行のテキストログテストデータでは、最高圧縮率は約10倍となり、元の圧縮率より53%向上し、ディスクからのデータ読み取りと解凍の速度が30%向上しました。

## 改善

### より包括的なベクトル化サポート

バージョン1.1では、コンピューティング層とストレージ層の完全なベクトル化を実装しました。これには以下が含まれます：

すべての組み込み関数のベクトル化を実装

ストレージ層でベクトル化を実装し、低カーディナリティ文字列カラムの辞書最適化をサポート

ベクトル化エンジンの多数のパフォーマンスと安定性の問題を最適化し解決

SSBとTPC-H標準テストデータセットでApache Dorisバージョン1.1とバージョン0.15のパフォーマンスをテストしました：

SSBテストデータセットの全13SQLにおいて、バージョン1.1はバージョン0.15より優れており、全体的なパフォーマンスは約3倍向上し、バージョン1.0の一部シナリオでのパフォーマンス低下問題を解決しました。

TPC-Hテストデータセットの全22SQLにおいて、バージョン1.1はバージョン0.15より優れており、全体的なパフォーマンスは約4.5倍向上し、一部シナリオのパフォーマンスは10倍以上向上しました。

![release-note-1.1.0-SSB](/images/release-note-1.1.0-SSB.png)

<p align='center'>SSB Benchmark</p>

![release-note-1.1.0-TPC-H](/images/release-note-1.1.0-TPC-H.png)

<p align='center'>TPC-H Benchmark</p>

**パフォーマンステストレポート**

[https://doris.apache.org//docs/benchmark/ssb](https://doris.apache.org//docs/benchmark/ssb)

[https://doris.apache.org//docs/benchmark/tpch](https://doris.apache.org//docs/benchmark/tpch)

### Compactionロジックの最適化とリアルタイム保証

Apache Dorisでは、各コミットがデータバージョンを生成します。高並行書き込みシナリオでは、データバージョンが多すぎてcompactionが間に合わないため-235エラーが発生しやすく、クエリパフォーマンスも相応に低下します。

バージョン1.1では、QuickCompactionを導入し、データバージョンが増加した際に積極的にcompactionをトリガーします。同時に、フラグメントメタデータをスキャンする能力を向上させることで、データバージョンが多すぎるフラグメントを迅速に発見し、compactionをトリガーできます。積極的トリガーと受動的スキャンを通じて、データマージのリアルタイム問題を完全に解決しました。

同時に、高頻度小ファイルのcumulative compactionに対しては、compactionタスクのスケジューリングと分離を実装し、重量級のbase compactionが新しいデータのマージに影響することを防ぎます。

最後に、小ファイルのマージについては、小ファイルマージ戦略を最適化し、段階的マージの方法を採用しました。マージに参加するファイルは毎回同じデータ規模に属し、サイズに大きな差があるバージョンのマージを防ぎ、段階的に階層マージすることで、単一ファイルがマージに参加する回数を削減し、システムのCPU消費を大幅に節約できます。

データアップストリームが毎秒10万の書き込み頻度を維持する場合（20並行書き込みタスク、ジョブあたり5000行、チェックポイント間隔1s）、バージョン1.1は以下のように動作します：

- 迅速なデータ統合：Tabletバージョンは50以下を維持し、compactionスコアは安定します。前バージョンの高並行書き込み時に頻繁に発生した-235問題と比較して、compactionマージ効率は10倍以上向上しました。

- CPUリソース消費の大幅削減：小ファイルCompactionの戦略が最適化されました。上記の高並行書き込みシナリオにおいて、CPUリソース消費は25%削減されました。

- 安定したクエリ時間消費：データの全体的な整然性が向上し、クエリ時間消費の変動が大幅に削減されました。高並行書き込み中のクエリ時間消費はクエリのみの場合と同じで、クエリパフォーマンスは前バージョンと比較して3-4倍向上しました。

### ParquetおよびORCファイルの読み取り効率最適化

arrowパラメータを調整し、arrowのマルチスレッド読み取り機能を使用して各row_groupのArrow読み取りを高速化し、SPSCモデルに修正してプリフェッチによりネットワーク待機コストを削減しました。最適化後、Parquetファイルインポートのパフォーマンスは4-5倍向上しました。

### より安全なメタデータCheckpoint

メタデータcheckpoint後に生成されるイメージファイルのダブルチェックと履歴イメージファイルの保持機能により、イメージファイルエラーによるメタデータ破損問題を解決しました。

## バグ修正

### データバージョンの欠落によりデータがクエリできない問題の修正（重大）

この問題はバージョン1.0で導入され、複数レプリカのデータバージョン欠落を引き起こす可能性がありました。

### 読み込みタスクのリソース使用制限においてリソース分離が無効になる問題の修正（中程度）

1.1では、broker loadとroutine loadは指定されたリソースタグを持つBackendsを使用して読み込みを実行します。

### 2GBを超えるネットワークデータパケット転送にHTTP BRPCを使用（中程度）

前バージョンでは、BRPC経由でBackends間で転送されるデータが2GBを超える場合、データ転送エラーを引き起こす可能性がありました。

## その他

### Mini Loadの無効化

`/_load`インターフェースはデフォルトで無効化されています。`/_stream_load`インターフェースを統一して使用してください。もちろん、FE設定項目`disable_mini_load`をオフにすることで再度有効化できます。

Mini Loadインターフェースはバージョン1.2で完全に削除される予定です。

### SegmentV1ストレージ形式の完全無効化

SegmentV1形式のデータの新規作成は許可されなくなりました。既存のデータは引き続き正常にアクセスできます。`ADMIN SHOW TABLET STORAGE FORMAT`文を使用して、クラスター内にSegmentV1形式のデータがまだ存在するかを確認できます。データ変換コマンドを通じてSegmentV2に変換してください。

SegmentV1データへのアクセスはバージョン1.2でサポートされなくなります。

### String型の最大長制限

前バージョンでは、String型の最大長は2GBまで許可されていました。バージョン1.1では、string型の最大長を1MBに制限します。この長さを超える文字列は書き込むことができなくなります。同時に、String型をテーブルのパーティショニングやバケッティングカラムとして使用することもサポートされなくなりました。

すでに書き込まれたString型は正常にアクセスできます。

### fastjson関連の脆弱性修正

fastjsonセキュリティ脆弱性を修正するためCanal バージョンにアップデートしました。

### `ADMIN DIAGNOSE TABLET`コマンドの追加

指定されたタブレットの問題を迅速に診断するために使用されます。

## ダウンロードして使用

### ダウンロードリンク

[hhttps://doris.apache.org/download](https://doris.apache.org/download)

### フィードバック

使用中に問題が発生した場合は、GitHub discussion forumまたはDev e-mail groupを通じていつでもお気軽にお問い合わせください。

GitHub Forum: [https://github.com/apache/doris/discussions](https://github.com/apache/doris/discussions)

Mailing list: dev@doris.apache.org

## 謝辞

このリリースに貢献してくださったすべての方々に感謝いたします：

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
