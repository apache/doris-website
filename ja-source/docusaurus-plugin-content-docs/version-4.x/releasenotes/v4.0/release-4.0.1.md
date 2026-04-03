---
{
  "title": "リリース 4.0.1",
  "language": "ja",
  "description": "その他"
}
---
# 動作変更

- SHOW PARTITIONSコマンドはIcebergテーブルをサポートしなくなりました。パーティションを表示するには、Icebergの$partitionsシステムテーブルを直接使用してください。[#56985](https://github.com/apache/doris/pull/56985)

# 新機能

- 他のサードパーティライブラリと一貫性のあるハッシュ結果を生成するmmh64_v2関数を追加しました。[#57180](https://github.com/apache/doris/pull/57180)
- jsonb型のハッシュ値を生成するjson_hash関数を追加しました。[#56962](https://github.com/apache/doris/pull/56962)
- binaryデータ型と一連の関連関数：length、from_base64_binary、to_base64_binary、sub_binaryを追加しました。[#56648](https://github.com/apache/doris/pull/56648)
- jsonbのキーをソートするためのsort_json_object_keys/normalize_json_numbers_to_double関数を追加しました。
- MySQL互換の時間関数を複数追加しました：UTC_DATE、UTC_TIME、UTC_TIMESTAMP。[#57443](https://github.com/apache/doris/pull/57443)
- MaxCompute Schema階層のサポートを追加しました。[#56874](https://github.com/apache/doris/pull/56874) ドキュメント：https://doris.apache.org/docs/3.x/lakehouse/catalogs/maxcompute-catalog#hierarchical-mapping
- JSON_OBJECT関数でパラメータとして*の使用をサポートしました。[#57256](https://github.com/apache/doris/pull/57256)

# 改善

## AI & Search

- SEARCH関数にフレーズクエリ、ワイルドカードクエリ、正規表現クエリのサポートを追加しました。[#57372](https://github.com/apache/doris/pull/57372) [#57007](https://github.com/apache/doris/pull/57007)
- SEARCH関数を2つの新しいパラメータで拡張しました：オプションのdefault_fieldパラメータ（デフォルトカラム）とdefault_operatorパラメータ（マルチカラムクエリのboolean演算子を「and」または「or」として指定）。[#57312](https://github.com/apache/doris/pull/57312)
- SEARCH関数でvariant型のサブカラムの検索をサポートし、ドット記法によるJSONパスの特定フィールドの直接検索を可能にしました（例：variantColumn.subcolumn:keyword）。
- 転置インデックスのデフォルトストレージ形式をV2からV3にアップグレードしました。[#57140](https://github.com/apache/doris/pull/57140)
- char_filterコンポーネントを追加してカスタムトークナイザーパイプラインのサポートを強化し、アナライザーフレームワークに2つの組み込みトークナイザー（basic tokenizerとICU tokenizer）を導入し、組み込みトークナイザーのエイリアスを追加し、同名コンポーネント設定をサポートして統一アナライザーフレームワークを最適化しました。[#56243](https://github.com/apache/doris/pull/56243) [#57055](https://github.com/apache/doris/pull/57055)

## レイクハウス

- 特定の条件下で外部テーブルのMerge IOで深刻な読み取り増幅の問題に対処するため、セッション変数merge_io_read_slice_size_bytesを追加しました。ドキュメント：https://doris.apache.org/docs/3.x/lakehouse/best-practices/optimization#merge-io-optimization

## Query

- JOINシャッフル選択アルゴリズムを最適化しました。[#56279](https://github.com/apache/doris/pull/56279)

その他

- 物理プランにおけるRuntime Filterシリアライゼーション情報のサイズを最適化しました。[#57108](https://github.com/apache/doris/pull/57108) [#56978](https://github.com/apache/doris/pull/56978)

# バグ修正

## AI & Search

- トークン化されていないフィールドの検索クエリ結果の問題を修正し、MOWテーブルでのsearch関数の実行を有効にしました。[#56914](https://github.com/apache/doris/pull/56914) [#56927](https://github.com/apache/doris/pull/56927)
- IS NULL述語でフィルタリングする際の転置インデックスの計算エラーを修正しました。[#56964](https://github.com/apache/doris/pull/56964)

## レイクハウス

- 特定の条件下でプレディケートプッシュダウンがParquet Page Indexを使用できない問題を修正しました。[#55795](https://github.com/apache/doris/pull/55795)
- 特定の条件下で外部テーブルクエリでのシャード読み取りが欠落する問題を修正しました。[#57071](https://github.com/apache/doris/pull/57071)
- 特定の条件下でHadoopファイルシステムキャッシュが有効になっているときにカタログプロパティの変更が反映されない問題を修正しました。[#57063](https://github.com/apache/doris/pull/57063)
- 特定の条件下で古いバージョンからのアップグレード時に接続プロパティ検証によるメタデータリプレイ失敗の問題を修正しました。[#56929](https://github.com/apache/doris/pull/56929)
- 特定の条件下でRefresh カタログによって引き起こされるFEスレッドデッドロックの問題を修正しました。[#56639](https://github.com/apache/doris/pull/56639)
- HiveからコンバートされたIcebergテーブルを読み取れない問題を修正しました。[#56918](https://github.com/apache/doris/pull/56918)
- 特定の条件下でQuery Profilesの収集によって引き起こされるBEクラッシュの問題を修正しました。[#56806](https://github.com/apache/doris/pull/56806)

## Query

- 境界条件でのタイムゾーン関連キャスト操作中のdatetime型の不正な結果を修正しました。[#57422](https://github.com/apache/doris/pull/57422)
- 一部のdatetime関連関数の結果の不正な精度導出を修正しました。[#56671](https://github.com/apache/doris/pull/56671)
- float型の述語条件としてinfが使用された際のcore dumpの問題を修正しました。[#57100](https://github.com/apache/doris/pull/57100)
- 可変パラメータを持つexplode関数のcore dumpの問題を修正しました。[#56991](https://github.com/apache/doris/pull/56991)
- decimal256からfloat型へのキャスト時の不安定性の問題を修正しました。[#56848](https://github.com/apache/doris/pull/56848)
- spillディスク操作中の重複スケジューリングによって引き起こされる潜在的なcore dumpの問題を修正しました。[#56755](https://github.com/apache/doris/pull/56755)
- mark joinと他のjoin間の順序の不正な調整が時折発生する問題を修正しました。[#56837](https://github.com/apache/doris/pull/56837)
- 一部のコマンドがマスターフロントエンドに正しく転送されて実行されない問題を修正しました。[#55185](https://github.com/apache/doris/pull/55185)
- ウィンドウ関数による partition topnの不正な生成が時折発生する問題を修正しました。[#56622](https://github.com/apache/doris/pull/56622)
- 同期mv定義にキーワードが含まれている場合の潜在的なクエリエラーを修正しました。[#57052](https://github.com/apache/doris/pull/57052)

## その他

- 同期mvに基づく別の同期mvの作成を禁止しました。[#56912](https://github.com/apache/doris/pull/56912)
- profilesでのメモリ解放の遅延の問題を修正しました。[#57257](https://github.com/apache/doris/pull/57257)
