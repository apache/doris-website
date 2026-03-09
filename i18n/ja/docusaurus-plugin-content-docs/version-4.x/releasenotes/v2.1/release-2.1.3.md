---
{
  "title": "リリース 2.1.3",
  "language": "ja",
  "description": "Apache Doris 2.1.3は2024年5月21日に正式リリースされました。このバージョンでは、Hiveへのデータ書き戻しを含む、いくつかの改善が更新されています。"
}
---
Apache Doris 2.1.3は2024年5月21日に正式にリリースされました。このバージョンでは、Hiveへのデータ書き戻し、マテリアライズドビュー、権限管理、バグ修正を含む複数の改良が更新されています。システムのパフォーマンスと安定性をさらに向上させています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases



## 機能拡張

**1. Hive CatalogによるHiveテーブルへのデータ書き戻しをサポート**

バージョン2.1.3以降、Apache DorisはHiveに対するDDLおよびDML操作をサポートします。ユーザーはApache DorisからHiveのライブラリとテーブルを直接作成し、`INSERT INTO`文を実行してHiveテーブルにデータを書き込むことができます。この機能により、ユーザーはApache DorisからHiveに対する完全なデータクエリと書き込み操作を実行でき、統合レイクハウスアーキテクチャをさらに簡素化します。

参考: [https://doris.apache.org/docs/lakehouse/datalake-building/hive-build/](https://doris.apache.org/docs/lakehouse/datalake-building/hive-build/)

**2. 既存のマテリアライズドビューの上に新しい非同期マテリアライズドビューの構築をサポート**

ユーザーは既存のマテリアライズドビューの上に新しい非同期マテリアライズドビューを作成し、事前計算された中間結果を直接再利用してデータ処理を行うことができます。これにより複雑な集計と計算操作が簡素化され、リソース消費とメンテナンスコストを削減しながら、クエリパフォーマンスをさらに向上させ、データ可用性を改善します。[#32984](https://github.com/apache/doris/pull/32984)

**3. ネストされたマテリアライズドビューによる書き換えをサポート**

Materialized View（MV）はクエリ結果を保存するために使用されるデータベースオブジェクトです。現在、Apache Dorisはネストされたマテリアライズドビューによる書き換えをサポートし、クエリパフォーマンスの最適化に役立ちます。[#33362](https://github.com/apache/doris/pull/33362)

**4. 新しい`SHOW VIEWS`文**

`SHOW VIEWS`文はデータベース内のビューをクエリするために使用でき、データベース内のビューオブジェクトの管理と理解を促進します。[#32358](https://github.com/apache/doris/pull/32358)

**5. Workload Groupが特定のBEノードへのバインディングをサポート**

Workload Groupを特定のBEノードにバインドできるようになり、クエリ実行のより細かい制御が可能になり、リソース使用量を最適化してパフォーマンスを向上させます。[#32874](https://github.com/apache/doris/pull/32874)

**6. Broker Loadが圧縮JSON形式をサポート**

Broker Loadは圧縮JSON形式データのインポートをサポートし、データ転送の帯域幅要件を大幅に削減し、データインポートパフォーマンスを向上させます。[#30809](https://github.com/apache/doris/pull/30809)

**7. TRUNCATE関数でカラムをscaleパラメータとして使用可能**

TRUNCATE関数はカラムをscaleパラメータとして受け入れられるようになり、数値データ処理時により多くの柔軟性を提供します。[#32746](https://github.com/apache/doris/pull/32746)

**8. 新しい関数`uuid_to_int`と`int_to_uuid`を追加**

これらの2つの関数により、ユーザーはUUIDと整数間の変換が可能になり、UUIDデータの処理が必要なシナリオで大幅に役立ちます。[#33005](https://github.com/apache/doris/pull/33005)

**9. クエリキューをバイパスする`bypass_workload_group`セッション変数を追加**

`bypass_workload_group`セッション変数により、特定のクエリがWorkload Groupキューをバイパスして直接実行できるようになり、迅速な応答が必要な重要なクエリの処理に役立ちます。[#33101](https://github.com/apache/doris/pull/33101)

**10. strcmp関数を追加**

strcmp関数は2つの文字列を比較し、その比較結果を返すため、テキストデータ処理を簡素化します。[#33272](https://github.com/apache/doris/pull/33272)

**11. HLL関数`hll_from_base64`と`hll_to_base64`をサポート**

HyperLogLog（HLL）はカーディナリティ推定のアルゴリズムです。これらの2つの関数により、ユーザーはBase64エンコードされた文字列からHLLデータをデコードしたり、HLLデータをBase64文字列としてエンコードできるため、HLLデータの保存と転送に非常に有用です。[#32089](https://github.com/apache/doris/pull/32089)

## 最適化と改善

**1. SipHashをXXHashに置き換えてshuffleパフォーマンスを向上**

SipHashとXXHashはどちらもハッシュ関数ですが、XXHashは特定のシナリオでより高速なハッシュ速度と優れたパフォーマンスを提供する可能性があります。この最適化は、XXHashを採用してデータシャッフル中のパフォーマンスを向上させることを目的としています。[#32919](https://github.com/apache/doris/pull/32919)

**2. 非同期マテリアライズドビューがOLAPテーブルのNULLパーティションカラムをサポート**

この拡張により、非同期マテリアライズドビューがOLAPテーブルのNULLパーティションカラムをサポートし、データ処理の柔軟性が向上します。[#32698](https://github.com/apache/doris/pull/32698)

**3. BEメモリ使用量を制御するため、カラム統計収集時の最大文字列長を1024に制限**

カラム統計収集時の文字列長を制限することで、過度なデータによるBEメモリの過剰消費を防ぎ、システムの安定性とパフォーマンス維持に役立ちます。[#32470](https://github.com/apache/doris/pull/32470)

**4. パフォーマンス向上のためBitmapキャッシュの動的削除をサポート**

不要になったBitmap Cacheを動的に削除することで、メモリを解放してシステムパフォーマンスを向上させます。[#32991](https://github.com/apache/doris/pull/32991)

**5. ALTER操作中のメモリ使用量を削減**

ALTER操作中のメモリ使用量を削減することで、システムリソース利用の効率を改善します。[#33474](https://github.com/apache/doris/pull/33474)

**6. 複合型の定数畳み込みをサポート**

Array/Map/Struct複合型の定数畳み込みをサポートします。[#32867](https://github.com/apache/doris/pull/32867)

**7. Aggregate Key ModelでのVariant型サポートを追加**

Variantデータ型は複数のデータ型を格納できます。この最適化により、Variant型データでの集約操作が可能になり、半構造化データ分析の柔軟性が向上します。[#33493](https://github.com/apache/doris/pull/33493)

**8. CCRで新しい転置インデックス形式をサポート** [#33415](https://github.com/apache/doris/pull/33415)

**9. ネストされたマテリアライズドビューの書き換えパフォーマンスを最適化** [#34127](https://github.com/apache/doris/pull/34127)

**10. 行ベースストレージ形式でdecimal256型をサポート**

行ベースストレージでdecimal256型をサポートすることで、高精度数値データを処理するシステム能力を拡張します。[#34887](https://github.com/apache/doris/pull/34887)

## 動作の変更

**1. 認可**

- **Grant_priv権限の変更**: `Grant_priv`はもはや任意に付与できません。`GRANT`操作を実行する際、ユーザーは`Grant_priv`だけでなく、付与する権限も持つ必要があります。たとえば、`table1`に`SELECT`権限を付与するには、ユーザーは`GRANT`権限と`table1`に対する`SELECT`権限の両方が必要であり、権限管理のセキュリティと一貫性を向上させます。[#32825](https://github.com/apache/doris/pull/32825)

- **Workload groupとresource usage_priv**: Workload GroupとResourceの`Usage_priv`はもはやグローバルではなく、ResourceとWorkload Groupに限定され、権限の付与と使用がより具体的になります。[#32907](https://github.com/apache/doris/pull/32907)

- **操作の認可**: 以前は認可されていなかった操作に対応する認可が追加され、より詳細で包括的な操作権限制御が可能になります。[#33347](https://github.com/apache/doris/pull/33347)

**2. LOGディレクトリ設定**

FEとBEのログディレクトリ設定は、統一して`LOG_DIR`環境変数を使用するようになりました。他のすべての異なる種類のログは`LOG_DIR`をルートディレクトリとして保存されます。バージョン間の互換性を維持するため、従来の設定項目`sys_log_dir`も引き続き使用できます。[#32933](https://github.com/apache/doris/pull/32933)

**3. S3 Table Function（TVF）**

特定のケースでS3 URLの正しい認識や処理の問題により、オブジェクトストレージパスの解析ロジックがリファクタリングされました。S3テーブル関数のファイルパスについては、正しい解析を保証するために`force_parsing_by_standard_uri`パラメータを渡す必要があります。[#33858](https://github.com/apache/doris/pull/33858)

## アップグレード問題

多くのユーザーが特定のキーワードをカラム名や属性値として使用しているため、以下のキーワードが非予約語に設定され、ユーザーが識別子として使用できるようになりました。[#34613](https://github.com/apache/doris/pull/34613)

## バグ修正

**1. Tencent Cloud COSNでHiveテーブル読み取り時のデータなしエラーを修正**

Tencent Cloud COSNでHiveテーブルを読み取る際に発生する可能性があったデータなしエラーを解決し、Tencent Cloudストレージサービスとの互換性を向上させました。

**2. `milliseconds_diff`関数が不正な結果を返す問題を修正**

`milliseconds_diff`関数が一部のケースで不正な結果を返す問題を修正し、時間差計算の精度を保証します。[#32897](https://github.com/apache/doris/pull/32897)

**3. ユーザー定義変数はMasterノードに転送されるべき**

ユーザー定義変数がMasterノードに正しく渡されることを保証し、システム全体での一貫性と正しい実行ロジックを確保します。[#33013](https://github.com/apache/doris/pull/33013)

**4. 複合型カラム追加時のSchema Change問題を修正**

複合型カラムを追加する際に発生する可能性があったSchema Change問題を解決し、Schema Changeの正確性を保証します。[#31824](https://github.com/apache/doris/pull/31824)

**5. FE Masterノード変更時のRoutine Loadでのデータ損失問題を修正**

`Routine Load`はKafkaメッセージキューの購読によく使用されます。この修正はFE Masterノード変更中に発生する可能性があったデータ損失問題に対処します。[#33678](https://github.com/apache/doris/pull/33678)

**6. Workload Groupが見つからない場合のRoutine Load失敗を修正**

指定されたWorkload Groupが見つからない場合に`Routine Load`が失敗する問題を解決しました。[#33596](https://github.com/apache/doris/pull/33596)

**7. 文字列サイズがunit32をオーバーフローした際のjoin失敗を回避するためstring64カラムをサポート**

一部のケースでは、文字列サイズがunit32制限を超える可能性があります。`string64`型をサポートすることで、文字列JOIN操作の正しい実行を保証します。[#33850](https://github.com/apache/doris/pull/33850)

**8. HadoopユーザーのPaimon Catalog作成を許可**

認可されたHadoopユーザーがPaimon Catalogを作成することを許可しました。[#33833](https://github.com/apache/doris/pull/33833)

**9. `function_ipxx_cidr`関数の定数パラメータに関する問題を修正**

定数パラメータを処理する際の`function_ipxx_cidr`関数の問題を解決し、関数実行の正確性を保証します。[#33968](https://github.com/apache/doris/pull/33968)

**10. HDFSを使用したリストア時のファイルダウンロードエラーを修正**

HDFSを使用したデータリストア中に発生した「ダウンロード失敗」エラーを解決し、データ復旧の正確性と信頼性を保証します。[#33303](https://github.com/apache/doris/issues/33303)

**11. 隠されたカラムに関するカラム権限問題を修正**

一部のケースで、隠されたカラムの権限設定が不正である可能性がありました。この修正により、カラム権限設定の正確性とセキュリティを保証します。[#34849](https://github.com/apache/doris/pull/34849)

**12. K8sデプロイメントでArrow Flightが正しいIPを取得できない問題を修正**

この修正により、Kubernetesデプロイメント環境でArrow FlightがIPアドレスを正しく取得できない問題が解決されます。[#34850](https://github.com/apache/doris/pull/34850)
