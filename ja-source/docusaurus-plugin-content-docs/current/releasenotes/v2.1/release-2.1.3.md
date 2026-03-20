---
{
  "title": "リリース 2.1.3",
  "language": "ja",
  "description": "Apache Doris 2.1.3は2024年5月21日に正式リリースされました。このバージョンでは、Hiveへのデータ書き戻しを含む、いくつかの改善が更新されています。"
}
---
Apache Doris 2.1.3は2024年5月21日に正式リリースされました。このバージョンでは、Hiveへのデータ書き戻し、materialized view、権限管理、バグ修正を含む複数の改善が更新されました。システムのパフォーマンスと安定性がさらに向上しています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases



## 機能強化

**1. Hive カタログによるHiveテーブルへのデータ書き戻しをサポート**

バージョン2.1.3から、Apache DorisはHiveでのDDLおよびDML操作をサポートします。ユーザーはApache Dorisを通じて直接Hiveでライブラリとテーブルを作成し、`INSERT INTO`文を実行してHiveテーブルにデータを書き込むことができます。この機能により、ユーザーはApache Dorisを通じてHiveで完全なデータクエリと書き込み操作を実行でき、統合されたlakehouseアーキテクチャをさらに簡素化します。

参照: [https://doris.apache.org/docs/lakehouse/datalake-building/hive-build/](https://doris.apache.org/docs/lakehouse/datalake-building/hive-build/)

**2. 既存のmaterialized viewの上に新しい非同期materialized viewの構築をサポート**

ユーザーは既存のmaterialized viewの上に新しい非同期materialized viewを作成でき、データ処理のために事前計算された中間結果を直接再利用できます。これにより、複雑な集約と計算操作が簡素化され、リソース消費と保守コストが削減される一方で、クエリパフォーマンスがさらに高速化され、データの可用性が向上します。[#32984](https://github.com/apache/doris/pull/32984)

**3. ネストされたmaterialized viewによる書き換えをサポート**

Materialized View (MV)は、クエリ結果を格納するために使用されるデータベースオブジェクトです。現在、Apache Dorisはネストされたmaterialized viewによる書き換えをサポートしており、これはクエリパフォーマンスの最適化に役立ちます。[#33362](https://github.com/apache/doris/pull/33362)

**4. 新しい`SHOW VIEWS`文**

`SHOW VIEWS`文はデータベース内のviewをクエリするために使用でき、データベース内のviewオブジェクトの管理と理解を向上させます。[#32358](https://github.com/apache/doris/pull/32358)

**5. Workload Groupが特定のBEノードへのバインドをサポート**

Workload Groupを特定のBEノードにバインドでき、クエリ実行をより細かく制御してリソース使用量を最適化し、パフォーマンスを向上させることができます。[#32874](https://github.com/apache/doris/pull/32874)

**6. Broker Loadが圧縮JSON形式をサポート**

Broker Loadは圧縮JSON形式データのインポートをサポートし、データ転送の帯域幅要件を大幅に削減し、データインポートパフォーマンスを高速化します。[#30809](https://github.com/apache/doris/pull/30809)

**7. TRUNCATE関数がスケールパラメータとして列を使用可能**

TRUNCATE関数はスケールパラメータとして列を受け入れることができるようになり、数値データを処理する際により柔軟性を提供します。[#32746](https://github.com/apache/doris/pull/32746)

**8. 新しい関数`uuid_to_int`および`int_to_uuid`を追加**

これら2つの関数により、ユーザーはUUIDと整数間の変換ができ、UUIDデータを処理する必要があるシナリオで大幅に役立ちます。[#33005](https://github.com/apache/doris/pull/33005)

**9. クエリキューをバイパスする`bypass_workload_group`セッション変数を追加**

`bypass_workload_group`セッション変数により、特定のクエリがWorkload Groupキューをバイパスして直接実行でき、迅速な応答が必要な重要なクエリの処理に有用です。[#33101](https://github.com/apache/doris/pull/33101)

**10. strcmp関数を追加**

strcmp関数は2つの文字列を比較してその比較結果を返し、テキストデータ処理を簡素化します。[#33272](https://github.com/apache/doris/pull/33272)

**11. HLL関数`hll_from_base64`および`hll_to_base64`をサポート**

HyperLogLog (HLL)はカーディナリティ推定のアルゴリズムです。これら2つの関数により、ユーザーはBase64エンコードされた文字列からHLLデータをデコードしたり、HLLデータをBase64文字列としてエンコードでき、HLLデータの格納と伝送に非常に有用です。[#32089](https://github.com/apache/doris/pull/32089)

## 最適化と改善

**1. SipHashをXXHashに置き換えてshuffleパフォーマンスを改善**

SipHashとXXHashは両方ともハッシュ関数ですが、XXHashは特定のシナリオでより高速なハッシュ速度と優れたパフォーマンスを提供する可能性があります。この最適化は、XXHashを採用することでデータシャッフル中のパフォーマンス向上を目的としています。[#32919](https://github.com/apache/doris/pull/32919)

**2. 非同期materialized viewがOLAPテーブルでのNULLパーティション列をサポート**

この拡張により、非同期materialized viewがOLAPテーブルでのNULLパーティション列をサポートし、データ処理の柔軟性が向上します。[#32698](https://github.com/apache/doris/pull/32698)

**3. 列統計収集時に最大文字列長を1024に制限してBEメモリ使用量を制御**

列統計収集時に文字列長を制限することで、過度なデータがBEメモリを過剰に消費することを防ぎ、システムの安定性とパフォーマンスの維持に役立ちます。[#32470](https://github.com/apache/doris/pull/32470)

**4. パフォーマンス向上のためBitmapキャッシュの動的削除をサポート**

不要になったBitmap Cacheを動的に削除することで、メモリを解放し、システムパフォーマンスを向上させます。[#32991](https://github.com/apache/doris/pull/32991)

**5. ALTER操作中のメモリ使用量を削減**

ALTER操作中のメモリ使用量を削減することで、システムリソース利用効率を改善します。[#33474](https://github.com/apache/doris/pull/33474)

**6. 複合型の定数畳み込みをサポート**

Array/Map/Struct複合型の定数畳み込みをサポートします。[#32867](https://github.com/apache/doris/pull/32867)

**7. Aggregate Key ModelでのVariant型のサポートを追加**

Variantデータ型は複数のデータ型を格納できます。この最適化により、Variant型データでの集約操作が可能になり、半構造化データ分析の柔軟性が向上します。[#33493](https://github.com/apache/doris/pull/33493)

**8. CCRで新しい転置インデックス形式をサポート** [#33415](https://github.com/apache/doris/pull/33415)

**9. ネストされたmaterialized viewの書き換えパフォーマンスを最適化** [#34127](https://github.com/apache/doris/pull/34127)

**10. 行ベースストレージ形式でdecimal256型をサポート**

行ベースストレージでのdecimal256型のサポートにより、システムの高精度数値データ処理能力が拡張されます。[#34887](https://github.com/apache/doris/pull/34887)

## 動作変更

**1. 認可**

- **Grant_priv権限の変更**: `Grant_priv`は任意に付与できなくなりました。`GRANT`操作を実行する際、ユーザーは`Grant_priv`だけでなく、付与される権限も持っている必要があります。たとえば、`table1`で`SELECT`権限を付与するには、ユーザーは`GRANT`権限と`table1`での`SELECT`権限の両方が必要で、権限管理のセキュリティと一貫性が向上しています。[#32825](https://github.com/apache/doris/pull/32825)

- **Workload groupとresourceのusage_priv**: Workload GroupとResourceの`Usage_priv`はグローバルではなく、ResourceとWorkload Groupに限定され、権限付与と使用がより具体的になりました。[#32907](https://github.com/apache/doris/pull/32907)

- **操作の認可**: 以前は認可されていなかった操作に対応する認可が追加され、より詳細で包括的な操作権限制御が行われます。[#33347](https://github.com/apache/doris/pull/33347)

**2. LOGディレクトリ設定**

FEとBEのログディレクトリ設定は、現在`LOG_DIR`環境変数を統一して使用します。その他すべての異なる種類のログは、`LOG_DIR`をルートディレクトリとして格納されます。バージョン間の互換性を維持するため、以前の設定項目`sys_log_dir`は引き続き使用できます。[#32933](https://github.com/apache/doris/pull/32933)

**3. S3 table Function (TVF)**

特定のケースでS3 URLを正しく認識または処理する問題があるため、オブジェクトストレージパスの解析ロジックがリファクタリングされました。S3テーブル関数でファイルパスを使用する場合、正しい解析を確実にするために`force_parsing_by_standard_uri`パラメータを渡す必要があります。[#33858](https://github.com/apache/doris/pull/33858)

## アップグレード問題

多くのユーザーが特定のキーワードを列名や属性値として使用するため、以下のキーワードが非予約語として設定され、ユーザーが識別子として使用できるようになりました。[#34613](https://github.com/apache/doris/pull/34613)

## バグ修正

**1. Tencent Cloud COSNでHiveテーブル読み取り時のデータなしエラーを修正**

Tencent Cloud COSNでHiveテーブルを読み取る際に発生する可能性があるデータなしエラーを解決し、Tencent Cloudストレージサービスとの互換性を向上させました。

**2. `milliseconds_diff`関数が不正な結果を返す問題を修正**

`milliseconds_diff`関数が一部のケースで不正な結果を返す問題を修正し、時間差計算の精度を確保しました。[#32897](https://github.com/apache/doris/pull/32897)

**3. ユーザー定義変数をMasterノードに転送する必要がある**

ユーザー定義変数がMasterノードに正しく渡されることを確実にし、システム全体での一貫性と正しい実行ロジックを実現しました。[#33013]https://github.com/apache/doris/pull/33013

**4. 複合型列追加時のSchema Change問題を修正**

複合型列を追加する際に発生する可能性があるSchema Change問題を解決し、Schema Changeの正確性を確保しました。[#31824](https://github.com/apache/doris/pull/31824)

**5. FE Masterノード変更時のRoutine Loadでのデータ損失問題を修正**

`Routine Load`はKafkaメッセージキューの購読によく使用されます。この修正は、FE Masterノード変更時に発生する可能性があるデータ損失問題に対処しています。[#33678](https://github.com/apache/doris/pull/33678)

**6. Workload Groupが見つからない場合のRoutine Load失敗を修正**

指定されたWorkload Groupが見つからない場合に`Routine Load`が失敗する問題を解決しました。[#33596](https://github.com/apache/doris/pull/33596)

**7. 文字列サイズがunit32をオーバーフローした際のjoin失敗を回避するためstring64列をサポート**

一部のケースでは、文字列サイズがunit32制限を超える可能性があります。`string64`型をサポートすることで、文字列JOIN操作の正しい実行を確保します。[#33850](https://github.com/apache/doris/pull/33850)

**8. HadoopユーザーのPaimon カタログ作成を許可**

認証されたHadoopユーザーがPaimon カタログを作成することを許可しました。[#33833](https://github.com/apache/doris/pull/33833)

**9. 定数パラメータでの`function_ipxx_cidr`関数問題を修正**

`function_ipxx_cidr`関数が定数パラメータを処理する際の問題を解決し、関数実行の正確性を確保しました。[#33968](https://github.com/apache/doris/pull/33968)

**10. HDFSを使用した復元時のファイルダウンロードエラーを修正**

HDFSを使用したデータ復元時に発生する「failed to download」エラーを解決し、データ復旧の精度と信頼性を確保しました。[#33303](https://github.com/apache/doris/issues/33303)

**11. 隠し列に関連する列権限問題を修正**

一部のケースでは、隠し列の権限設定が不正になる可能性があります。この修正により、列権限設定の正確性とセキュリティを確保します。[#34849](https://github.com/apache/doris/pull/34849)

**12. K8sデプロイメントでArrow Flightが正しいIPを取得できない問題を修正**

この修正により、Kubernetesデプロイメント環境でArrow FlightがIPアドレスを正しく取得できない問題を解決しました。[#34850](https://github.com/apache/doris/pull/34850)
