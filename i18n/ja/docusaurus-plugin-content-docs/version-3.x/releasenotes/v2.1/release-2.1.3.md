---
{
  "title": "リリース 2.1.3",
  "language": "ja",
  "description": "Apache Doris 2.1.3は2024年5月21日に正式リリースされました。このバージョンでは、Hiveへのデータ書き戻しを含む、いくつかの改善が更新されています。"
}
---
Apache Doris 2.1.3は2024年5月21日に正式にリリースされました。このバージョンでは、Hiveへのデータ書き戻し、マテリアライズドビュー、権限管理、バグ修正を含む複数の改善が更新されました。システムのパフォーマンスと安定性がさらに向上しました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHubリリース:** https://github.com/apache/doris/releases

## 機能強化

**1. Hive CatalogによるHiveテーブルへのデータ書き戻しをサポート**

バージョン2.1.3から、Apache DorisはHiveでのDDLおよびDML操作をサポートします。ユーザーはApache Doris経由で直接Hive内にライブラリとテーブルを作成し、`INSERT INTO`文を実行してHiveテーブルにデータを書き込むことができます。この機能により、ユーザーはApache Doris経由でHiveに対して完全なデータクエリと書き込み操作を実行でき、統合されたlakehouseアーキテクチャをさらに簡素化します。

参照: [https://doris.apache.org/docs/lakehouse/datalake-building/hive-build/](https://doris.apache.org/docs/lakehouse/datalake-building/hive-build/)

**2. 既存のマテリアライズドビュー上への新しい非同期マテリアライズドビューの構築をサポート**

ユーザーは既存のマテリアライズドビュー上に新しい非同期マテリアライズドビューを作成し、データ処理において事前計算された中間結果を直接再利用できます。これにより複雑な集約と計算操作が簡素化され、リソース消費とメンテナンスコストが削減される一方で、クエリパフォーマンスがさらに向上し、データ可用性が改善されます。[#32984](https://github.com/apache/doris/pull/32984)

**3. ネストされたマテリアライズドビューによる書き換えをサポート**

Materialized View（MV）はクエリ結果を保存するために使用されるデータベースオブジェクトです。現在、Apache Dorisはネストされたマテリアライズドビューによる書き換えをサポートし、クエリパフォーマンスの最適化に役立ちます。[#33362](https://github.com/apache/doris/pull/33362)

**4. 新しい`SHOW VIEWS`文**

`SHOW VIEWS`文を使用してデータベース内のビューをクエリでき、データベース内のビューオブジェクトの管理と理解を促進します。[#32358](https://github.com/apache/doris/pull/32358)

**5. Workload Groupが特定のBEノードへのバインドをサポート**

Workload Groupを特定のBEノードにバインドでき、クエリ実行のより精密な制御を可能にして、リソース使用を最適化し、パフォーマンスを向上させます。[#32874](https://github.com/apache/doris/pull/32874)

**6. Broker Loadが圧縮JSON形式をサポート**

Broker Loadが圧縮JSON形式データのインポートをサポートし、データ転送の帯域幅要件を大幅に削減し、データインポートパフォーマンスを向上させます。[#30809](https://github.com/apache/doris/pull/30809)

**7. TRUNCATE関数でカラムをスケールパラメータとして使用可能**

TRUNCATE関数でカラムをスケールパラメータとして受け入れることができ、数値データ処理時により多くの柔軟性を提供します。[#32746](https://github.com/apache/doris/pull/32746)

**8. 新しい関数`uuid_to_int`と`int_to_uuid`を追加**

これら2つの関数により、ユーザーはUUIDと整数間の変換が可能になり、UUIDデータの処理が必要なシナリオで大幅に役立ちます。[#33005](https://github.com/apache/doris/pull/33005)

**9. クエリキューをバイパスする`bypass_workload_group`セッション変数を追加**

`bypass_workload_group`セッション変数により、特定のクエリがWorkload Groupキューをバイパスして直接実行でき、迅速な応答が必要な重要なクエリの処理に有用です。[#33101](https://github.com/apache/doris/pull/33101)

**10. strcmp関数を追加**

strcmp関数は2つの文字列を比較し、その比較結果を返すことで、テキストデータ処理を簡素化します。[#33272](https://github.com/apache/doris/pull/33272)

**11. HLL関数`hll_from_base64`と`hll_to_base64`をサポート**

HyperLogLog（HLL）はカーディナリティ推定のためのアルゴリズムです。これら2つの関数により、ユーザーはBase64エンコードされた文字列からHLLデータをデコードしたり、HLLデータをBase64文字列としてエンコードしたりでき、HLLデータの保存と転送に非常に有用です。[#32089](https://github.com/apache/doris/pull/32089)

## 最適化と改善

**1. SipHashをXXHashに置き換えてshuffleパフォーマンスを向上**

SipHashとXXHashは両方ともハッシュ関数ですが、XXHashは特定のシナリオでより高速なハッシュ速度とより良いパフォーマンスを提供する可能性があります。この最適化は、XXHashを採用することでデータshuffling時のパフォーマンス向上を目指します。[#32919](https://github.com/apache/doris/pull/32919)

**2. 非同期マテリアライズドビューがOLAPテーブルのNULLパーティションカラムをサポート**

この強化により、非同期マテリアライズドビューがOLAPテーブルのNULLパーティションカラムをサポートし、データ処理の柔軟性が向上します。[#32698](https://github.com/apache/doris/pull/32698)

**3. BEメモリ使用量制御のため、カラム統計収集時の最大文字列長を1024に制限**

カラム統計収集時の文字列長を制限することで、過度なデータがBEメモリを過剰に消費することを防ぎ、システムの安定性とパフォーマンスの維持に役立ちます。[#32470](https://github.com/apache/doris/pull/32470)

**4. パフォーマンス向上のためBitmapキャッシュの動的削除をサポート**

不要になったBitmap Cacheを動的に削除することで、メモリを解放し、システムパフォーマンスを向上させます。[#32991](https://github.com/apache/doris/pull/32991)

**5. ALTER操作時のメモリ使用量を削減**

ALTER操作時のメモリ使用量を削減することで、システムリソース利用の効率性を向上させます。[#33474](https://github.com/apache/doris/pull/33474)

**6. 複合型の定数畳み込みをサポート**

Array/Map/Struct複合型の定数畳み込みをサポートします。[#32867](https://github.com/apache/doris/pull/32867)

**7. Aggregate Key ModelでVariant型のサポートを追加**

Variantデータ型は複数のデータ型を保存できます。この最適化により、Variant型データの集約操作が可能になり、半構造化データ分析の柔軟性が向上します。[#33493](https://github.com/apache/doris/pull/33493)

**8. CCRで新しい転置インデックス形式をサポート** [#33415](https://github.com/apache/doris/pull/33415)

**9. ネストされたマテリアライズドビューの書き換えパフォーマンスを最適化** [#34127](https://github.com/apache/doris/pull/34127)

**10. 行ベースストレージ形式でdecimal256型をサポート**

行ベースストレージでdecimal256型をサポートすることで、システムの高精度数値データ処理能力を拡張します。[#34887](https://github.com/apache/doris/pull/34887)

## 動作変更

**1. 認可**

- **Grant_priv権限の変更**: `Grant_priv`は任意に付与できなくなりました。`GRANT`操作を実行する際、ユーザーは`Grant_priv`を持つだけでなく、付与する権限も持つ必要があります。例えば、`table1`に対する`SELECT`権限を付与するには、ユーザーは`GRANT`権限と`table1`に対する`SELECT`権限の両方を持つ必要があり、権限管理のセキュリティと一貫性が向上します。[#32825](https://github.com/apache/doris/pull/32825)

- **Workload groupとresourceのusage_priv**: Workload GroupとResourceの`Usage_priv`はグローバルではなく、ResourceとWorkload Groupに限定されるようになり、権限の付与と使用がより具体的になります。[#32907](https://github.com/apache/doris/pull/32907)

- **操作の認可**: 以前は認可されていなかった操作に対して対応する認可が設けられ、より詳細で包括的な操作権限制御が実現されます。[#33347](https://github.com/apache/doris/pull/33347)

**2. LOGディレクトリ設定**

FEとBEのログディレクトリ設定は、統一して`LOG_DIR`環境変数を使用するようになりました。他のすべての異なる種類のログは、`LOG_DIR`をルートディレクトリとして保存されます。バージョン間の互換性を維持するため、以前の設定項目`sys_log_dir`も引き続き使用できます。[#32933](https://github.com/apache/doris/pull/32933)

**3. S3 Table Function (TVF)**

特定のケースでS3 URLを正しく認識または処理する問題により、オブジェクトストレージパスの解析ロジックがリファクタリングされました。S3テーブル関数のファイルパスでは、正しい解析を確保するために`force_parsing_by_standard_uri`パラメータを渡す必要があります。[#33858](https://github.com/apache/doris/pull/33858)

## アップグレード問題

多くのユーザーが特定のキーワードをカラム名または属性値として使用するため、以下のキーワードが非予約語に設定され、ユーザーが識別子として使用できるようになりました。[#34613](https://github.com/apache/doris/pull/34613)

## バグ修正

**1. Tencent Cloud COSNでHiveテーブル読み取り時のデータなしエラーを修正**

Tencent Cloud COSNでHiveテーブルを読み取る際に発生する可能性があったデータなしエラーを解決し、Tencent Cloudストレージサービスとの互換性を向上させました。

**2. `milliseconds_diff`関数が間違った結果を返す問題を修正**

`milliseconds_diff`関数が一部のケースで間違った結果を返していた問題を修正し、時間差計算の精度を確保しました。[#32897](https://github.com/apache/doris/pull/32897)

**3. ユーザー定義変数をMasterノードに転送するように修正**

ユーザー定義変数がMasterノードに正しく渡されるようにし、システム全体での一貫性と正しい実行ロジックを確保しました。[#33013]https://github.com/apache/doris/pull/33013

**4. 複合型カラム追加時のSchema Change問題を修正**

複合型カラムを追加する際に発生する可能性があったSchema Change問題を解決し、Schema Changeの正確性を確保しました。[#31824](https://github.com/apache/doris/pull/31824)

**5. FE Masterノード変更時のRoutine Loadデータ損失問題を修正**

`Routine Load`はKafkaメッセージキューの購読によく使用されます。この修正では、FE Masterノード変更時に発生する可能性があるデータ損失問題に対処します。[#33678](https://github.com/apache/doris/pull/33678)

**6. Workload Groupが見つからない場合のRoutine Load失敗を修正**

指定されたWorkload Groupが見つからない場合に`Routine Load`が失敗する問題を解決しました。[#33596](https://github.com/apache/doris/pull/33596)

**7. 文字列サイズがunit32をオーバーフローした際のjoin失敗を回避するためstring64カラムをサポート**

一部のケースでは、文字列サイズがunit32の制限を超える可能性があります。`string64`型をサポートすることで、文字列JOIN操作の正しい実行を確保します。[#33850](https://github.com/apache/doris/pull/33850)

**8. HadoopユーザーがPaimon Catalogを作成できるよう許可**

認可されたHadoopユーザーがPaimon Catalogを作成できるようにしました。[#33833](https://github.com/apache/doris/pull/33833)

**9. `function_ipxx_cidr`関数の定数パラメータでの問題を修正**

`function_ipxx_cidr`関数が定数パラメータを処理する際の問題を解決し、関数実行の正確性を確保しました。[#33968](https://github.com/apache/doris/pull/33968)

**10. HDFSを使用した復元時のファイルダウンロードエラーを修正**

HDFSを使用してデータ復元を行う際に発生する「failed to download」エラーを解決し、データ回復の精度と信頼性を確保しました。[#33303](https://github.com/apache/doris/issues/33303)

**11. 隠しカラムに関連するカラム権限問題を修正**

一部のケースで、隠しカラムの権限設定が間違っている可能性がありました。この修正により、カラム権限設定の正確性とセキュリティを確保します。[#34849](https://github.com/apache/doris/pull/34849)

**12. K8sデプロイメントでArrow Flightが正しいIPを取得できない問題を修正**

この修正により、Kubernetesデプロイメント環境でArrow FlightがIPアドレスを正しく取得できない問題を解決します。[#34850](https://github.com/apache/doris/pull/34850)
