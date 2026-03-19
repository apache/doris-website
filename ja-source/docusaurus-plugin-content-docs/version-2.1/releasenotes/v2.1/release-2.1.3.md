---
{
  "title": "リリース 2.1.3",
  "language": "ja",
  "description": "Apache Doris 2.1.3は2024年5月21日に正式リリースされました。このバージョンでは、Hiveへのデータ書き戻しを含む、いくつかの改善が更新されています。"
}
---
Apache Doris 2.1.3は2024年5月21日に正式リリースされました。このバージョンでは、Hiveへのデータ書き戻し、マテリアライズドビュー、権限管理、バグ修正を含む複数の改善が更新されています。システムのパフォーマンスと安定性をさらに向上させています。

**クイックダウンロード：** https://doris.apache.org/download/

**GitHubリリース：** https://github.com/apache/doris/releases



## 機能強化

**1. Hive カタログによるHiveテーブルへのデータ書き戻しをサポート**

バージョン2.1.3から、Apache DorisはHiveでのDDLおよびDML操作をサポートします。ユーザーはApache Dorisを通じてHiveで直接ライブラリとテーブルを作成し、`INSERT INTO`文を実行してHiveテーブルにデータを書き込むことができます。この機能により、ユーザーはApache Dorisを通じてHiveで完全なデータクエリと書き込み操作を実行でき、統合されたレイクハウスアーキテクチャをさらに簡素化できます。

参照：[https://doris.apache.org/docs/lakehouse/datalake-building/hive-build/](https://doris.apache.org/docs/lakehouse/datalake-building/hive-build/)

**2. 既存のマテリアライズドビューの上に新しい非同期マテリアライズドビューの構築をサポート**

ユーザーは既存のマテリアライズドビューの上に新しい非同期マテリアライズドビューを作成し、事前に計算された中間結果を直接再利用してデータ処理を行うことができます。これにより、複雑な集約と計算操作が簡素化され、リソース消費とメンテナンスコストが削減され、クエリパフォーマンスがさらに加速し、データ可用性が向上します。[#32984](https://github.com/apache/doris/pull/32984)

**3. ネストされたマテリアライズドビューによる書き換えをサポート**

マテリアライズドビュー（MV）は、クエリ結果を格納するために使用されるデータベースオブジェクトです。現在、Apache Dorisはネストされたマテリアライズドビューによる書き換えをサポートしており、クエリパフォーマンスの最適化に役立ちます。[#33362](https://github.com/apache/doris/pull/33362)

**4. 新しい`SHOW VIEWS`文**

`SHOW VIEWS`文を使用してデータベース内のビューをクエリでき、データベース内のビューオブジェクトのより良い管理と理解を促進します。[#32358](https://github.com/apache/doris/pull/32358)

**5. Workload Groupが特定のBEノードへのバインドをサポート**

Workload Groupは特定のBEノードにバインドでき、クエリ実行のより洗練された制御を可能にし、リソース使用量を最適化してパフォーマンスを向上させます。[#32874](https://github.com/apache/doris/pull/32874)

**6. Broker Loadが圧縮JSON形式をサポート**

Broker Loadは圧縮JSON形式データのインポートをサポートするようになり、データ転送の帯域幅要件を大幅に削減し、データインポートパフォーマンスを加速します。[#30809](https://github.com/apache/doris/pull/30809)

**7. TRUNCATE関数でスケールパラメータとして列を使用可能**

TRUNCATE関数は現在、スケールパラメータとして列を受け入れることができ、数値データを処理する際により多くの柔軟性を提供します。[#32746](https://github.com/apache/doris/pull/32746)

**8. 新しい関数`uuid_to_int`と`int_to_uuid`を追加**

これらの2つの関数により、ユーザーはUUIDと整数の間で変換でき、UUIDデータの処理が必要なシナリオで大幅に役立ちます。[#33005](https://github.com/apache/doris/pull/33005)

**9. クエリキューをバイパスする`bypass_workload_group`セッション変数を追加**

`bypass_workload_group`セッション変数により、特定のクエリがWorkload Groupキューをバイパスして直接実行でき、迅速な応答が必要な重要なクエリの処理に有用です。[#33101](https://github.com/apache/doris/pull/33101)

**10. strcmp関数を追加**

strcmp関数は2つの文字列を比較してその比較結果を返し、テキストデータ処理を簡素化します。[#33272](https://github.com/apache/doris/pull/33272)

**11. HLL関数`hll_from_base64`と`hll_to_base64`をサポート**

HyperLogLog（HLL）はカーディナリティ推定のアルゴリズムです。これらの2つの関数により、ユーザーはBase64エンコードされた文字列からHLLデータをデコードするか、HLLデータをBase64文字列としてエンコードでき、HLLデータの保存と送信に非常に有用です。[#32089](https://github.com/apache/doris/pull/32089)

## 最適化と改善

**1. shuffleパフォーマンス向上のためSipHashをXXHashに置換**

SipHashとXXHashはどちらもハッシュ関数ですが、XXHashは特定のシナリオでより高速なハッシュ速度とより良いパフォーマンスを提供する場合があります。この最適化は、XXHashを採用することでデータshuffling中のパフォーマンス向上を目的としています。[#32919](https://github.com/apache/doris/pull/32919)

**2. 非同期マテリアライズドビューがOLAPテーブルのNULLパーティション列をサポート**

この強化により、非同期マテリアライズドビューがOLAPテーブルのNULLパーティション列をサポートし、データ処理の柔軟性が向上します。[#32698](https://github.com/apache/doris/pull/32698)

**3. BEメモリ使用量制御のため列統計収集時の最大文字列長を1024に制限**

列統計収集時の文字列長を制限することで、過度なデータがBEメモリを過剰に消費することを防ぎ、システムの安定性とパフォーマンスの維持に役立ちます。[#32470](https://github.com/apache/doris/pull/32470)

**4. パフォーマンス向上のためBitmapキャッシュの動的削除をサポート**

不要になったBitmap Cacheを動的に削除することで、メモリを解放し、システムパフォーマンスを向上させることができます。[#32991](https://github.com/apache/doris/pull/32991)

**5. ALTER操作時のメモリ使用量削減**

ALTER操作時のメモリ使用量を削減することで、システムリソース利用の効率が向上します。[#33474](https://github.com/apache/doris/pull/33474)

**6. 複合型の定数フォールディングをサポート**

Array/Map/Struct複合型の定数フォールディングをサポートします。[#32867](https://github.com/apache/doris/pull/32867)

**7. Aggregate Key ModelでのVariant型サポートを追加**

Variantデータ型は複数のデータ型を格納できます。この最適化により、Variant型データでの集約操作が可能になり、半構造化データ分析の柔軟性が向上します。[#33493](https://github.com/apache/doris/pull/33493)

**8. CCRでの新しい転置インデックス形式をサポート** [#33415](https://github.com/apache/doris/pull/33415)

**9. ネストされたマテリアライズドビューの書き換えパフォーマンスを最適化** [#34127](https://github.com/apache/doris/pull/34127)

**10. 行ベースストレージ形式でdecimal256型をサポート**

行ベースストレージでのdecimal256型のサポートにより、システムの高精度数値データ処理能力が拡張されます。[#34887](https://github.com/apache/doris/pull/34887)

## 動作変更

**1. 認可**

- **Grant_priv権限の変更**: `Grant_priv`は任意に付与できなくなりました。`GRANT`操作を実行する際、ユーザーは`Grant_priv`を持つだけでなく、付与される権限も持つ必要があります。例えば、`table1`に`SELECT`権限を付与するには、ユーザーは`GRANT`権限と`table1`の`SELECT`権限の両方が必要で、権限管理のセキュリティと一貫性が向上します。[#32825](https://github.com/apache/doris/pull/32825)

- **Workload groupとリソースのusage_priv**: Workload GroupとResourceの`Usage_priv`はグローバルではなく、ResourceとWorkload Groupに限定され、権限付与と使用がより具体的になります。[#32907](https://github.com/apache/doris/pull/32907)

- **操作の認可**: 以前は認可されていなかった操作に対応する認可が追加され、より詳細で包括的な操作権限制御が行われます。[#33347](https://github.com/apache/doris/pull/33347)

**2. LOGディレクトリ設定**

FEとBEのログディレクトリ設定は、現在統一して`LOG_DIR`環境変数を使用します。他のすべての異なるタイプのログは、`LOG_DIR`をルートディレクトリとして保存されます。バージョン間の互換性を維持するため、以前の設定項目`sys_log_dir`は引き続き使用できます。[#32933](https://github.com/apache/doris/pull/32933)

**3. S3 table Function（TVF）**

特定のケースでS3 URLを正しく認識または処理する問題があるため、オブジェクトストレージパスの解析ロジックがリファクタリングされました。S3テーブル関数のファイルパスについては、正しい解析を確保するために`force_parsing_by_standard_uri`パラメータを渡す必要があります。[#33858](https://github.com/apache/doris/pull/33858)

## アップグレード問題

多くのユーザーが特定のキーワードを列名や属性値として使用するため、以下のキーワードは非予約語に設定され、ユーザーが識別子として使用できるようになりました。[#34613](https://github.com/apache/doris/pull/34613)

## バグ修正

**1. Tencent Cloud COSNでHiveテーブルを読み取る際のデータなしエラーを修正**

Tencent Cloud COSNでHiveテーブルを読み取る際に発生する可能性があったデータなしエラーを解決し、Tencent Cloudストレージサービスとの互換性を向上させました。

**2. `milliseconds_diff`関数が返す不正確な結果を修正**

`milliseconds_diff`関数が一部のケースで不正確な結果を返す問題を修正し、時間差計算の精度を確保しました。[#32897](https://github.com/apache/doris/pull/32897)

**3. ユーザー定義変数をMasterノードに転送すべき**

ユーザー定義変数が正しくMasterノードに渡されることを確保し、システム全体での一貫性と正しい実行ロジックを実現しました。[#33013]https://github.com/apache/doris/pull/33013

**4. 複合型列追加時のSchema Change問題を修正**

複合型列を追加する際に発生する可能性があったSchema Change問題を解決し、Schema Changeの正確性を確保しました。[#31824](https://github.com/apache/doris/pull/31824)

**5. FE Masterノード変更時のRoutine Loadでのデータ損失問題を修正**

`Routine Load`はKafkaメッセージキューの購読によく使用されます。この修正は、FE Masterノード変更時に発生する可能性があったデータ損失問題に対処します。[#33678](https://github.com/apache/doris/pull/33678)

**6. Workload Groupが見つからない場合のRoutine Load失敗を修正**

指定されたWorkload Groupが見つからない場合に`Routine Load`が失敗する問題を解決しました。[#33596](https://github.com/apache/doris/pull/33596)

**7. 文字列サイズがunit32をオーバーフローした場合のjoin失敗を回避するためstring64列をサポート**

一部のケースでは、文字列サイズがunit32制限を超える場合があります。`string64`型をサポートすることで、文字列JOIN操作の正しい実行が保証されます。[#33850](https://github.com/apache/doris/pull/33850)

**8. HadoopユーザーのPaimon カタログ作成を許可**

認可されたHadoopユーザーのPaimon カタログ作成を許可しました。[#33833](https://github.com/apache/doris/pull/33833)

**9. 定数パラメータでの`function_ipxx_cidr`関数の問題を修正**

定数パラメータを処理する際の`function_ipxx_cidr`関数の問題を解決し、関数実行の正確性を確保しました。[#33968](https://github.com/apache/doris/pull/33968)

**10. HDFSを使用した復元時のファイルダウンロードエラーを修正**

HDFSを使用したデータ復元中に発生した「failed to download」エラーを解決し、データ回復の精度と信頼性を確保しました。[#33303](https://github.com/apache/doris/issues/33303)

**11. 隠し列に関連する列権限問題を修正**

一部のケースで、隠し列の権限設定が不正確である場合がありました。この修正により、列権限設定の正確性とセキュリティが確保されます。[#34849](https://github.com/apache/doris/pull/34849)

**12. K8sデプロイメントでArrow Flightが正しいIPを取得できない問題を修正**

この修正により、Kubernetesデプロイメント環境でArrow FlightがIPアドレスを正しく取得できない問題が解決されます。[#34850](https://github.com/apache/doris/pull/34850)
