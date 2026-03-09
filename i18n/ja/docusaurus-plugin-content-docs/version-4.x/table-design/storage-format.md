---
{
  "title": "ストレージフォーマット V3",
  "language": "ja"
}
---
<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

Doris Storage Format V3は、Segment V2形式からの大幅な進化です。メタデータの分離とエンコーディング戦略の最適化により、ワイドテーブル、複雑なデータタイプ（Variantなど）、およびクラウドネイティブなストレージ・コンピューティング分離シナリオのパフォーマンスを特に向上させます。

## 主要な最適化

### External Column Meta
*   **背景**: Segment V2では、すべての列のメタデータ（`ColumnMetaPB`）はSegmentファイルのFooterに格納されます。数千の列を持つワイドテーブルや自動スケーリングVariantシナリオでは、Footerが数メガバイトまで肥大化する可能性があります。
*   **最適化**: V3では`ColumnMetaPB`をFooterから分離し、ファイル内の別のエリア（External Column Meta Area）に格納します。
*   **利点**:
    *   **超高速メタデータ読み込み**: Segment Footerのサイズを大幅に削減し、初期ファイルオープンを高速化します。
    *   **オンデマンド読み込み**: 独立したエリアからメタデータをオンデマンドで読み込むことができ、メモリ使用量を削減し、オブジェクトストレージ（S3/OSSなど）でのコールドスタートクエリパフォーマンスを向上させます。

### Integer Type Plain Encoding
*   **最適化**: V3では、数値タイプ（`INT`、`BIGINT`など）に対して、従来のBitShuffleの代わりに`PLAIN_ENCODING`（生のバイナリ格納）をデフォルトで使用します。
*   **利点**: LZ4/ZSTD圧縮と組み合わせることで、`PLAIN_ENCODING`はより高い読み取りスループットと低いCPUオーバーヘッドを提供します。高速IOを持つ現代的な環境では、この「展開をパフォーマンスと引き換える」戦略は、大量のデータをスキャンする際に明確な利点を提供します。

### Binary Plain Encoding V2
*   **最適化**: `BINARY_PLAIN_ENCODING_V2`を導入し、`[length(varuint)][raw_data]`のストリーミングレイアウトを使用して、末尾のオフセットテーブルに依存していた古い形式を置き換えます。
*   **利点**: 大きな末尾のオフセットテーブルを排除し、データ格納をより コンパクトにして、文字列やJSONBタイプのストレージ消費量を大幅に削減します。

## 設計思想
V3の設計思想は、**「メタデータ分離、エンコーディング単純化、ストリーミングレイアウト」**と要約できます。メタデータ処理のボトルネックを削減し、シンプルなエンコーディングの処理における現代CPUの高効率性を活用することで、複雑なスキーマ下での高パフォーマンス分析を実現します。

## ユースケース
- **ワイドテーブル**: 2000列を超える列または長い列名を持つテーブル。
- **半構造化データ**: `VARIANT`または`JSON`タイプの多用。
- **階層ストレージ/クラウドネイティブ**: オブジェクトストレージの読み込み遅延に敏感なシナリオ。
- **高パフォーマンススキャニング**: スキャンスループットに極端な要求を持つ分析タスク。

## 使用方法

### 新しいテーブル作成時に有効化
`CREATE TABLE`文の`PROPERTIES`で`storage_format`を`V3`として指定します:

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    data VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```
