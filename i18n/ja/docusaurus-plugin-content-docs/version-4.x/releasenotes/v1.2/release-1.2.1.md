---
{
  "title": "Release 1.2.1",
  "language": "ja",
  "description": "より高い精度とより良いパフォーマンスをサポートするDecimalV3は、過去のバージョンに対して以下の利点があります。"
}
---
# 改善

### 新しいタイプDecimalV3をサポート

より高い精度とより優れたパフォーマンスをサポートするDecimalV3は、過去のバージョンと比較して以下の利点があります。

- より大きな表現可能範囲、値の範囲が大幅に拡張され、有効数字範囲は[1,38]です。

- より高いパフォーマンス、異なる精度に応じて占有するストレージスペースを適応的に調整。

- より完全な精度導出サポート、異なる式に対して、異なる精度導出ルールが結果の精度に適用されます。

[DecimalV3](https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Types/DECIMALV3/)

### Iceberg V2をサポート

Iceberg V2をサポート（Position Deleteのみサポート、Equality Deleteは後続バージョンでサポート予定）。

Iceberg V2形式のテーブルは、Multi-カタログ機能を通じてアクセスできます。

### OR条件からINへの変換をサポート

OR条件をIN条件に変換することをサポートし、一部のシナリオで実行効率を向上できます。[#15437](https://github.com/apache/doris/pull/15437) [#12872](https://github.com/apache/doris/pull/12872)

### JSONBタイプのインポートとクエリパフォーマンスを最適化

JSONBタイプのインポートとクエリパフォーマンスを最適化。[#15219](https://github.com/apache/doris/pull/15219) [#15219](https://github.com/apache/doris/pull/15219)

### Stream loadでクォートされたcsvデータをサポート

ドキュメントでtrim_double_quotesを検索：[https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD](https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD)

### BrokerでTencent Cloud CHDFSおよびBaidu Cloud BOS、AFSをサポート

CHDFS、BOS、AFS上のデータはBrokerを通じてアクセスできます。[#15297](https://github.com/apache/doris/pull/15297) [#15448](https://github.com/apache/doris/pull/15448)

### 新機能

関数`substring_index`を追加。[#15373](https://github.com/apache/doris/pull/15373)

# バグ修正

- 一部のケースで、バージョン1.1からバージョン1.2にアップグレード後、ユーザー権限情報が失われる問題。[#15144](https://github.com/apache/doris/pull/15144)

- datev2/datetimev2タイプをパーティション分割に使用した際に、パーティション値が間違っている問題を修正。[#15094](https://github.com/apache/doris/pull/15094)

- リリース済み機能の多数のバグ修正。完全なリストについては：[PR List](https://github.com/apache/doris/pulls?q=is%3Apr+label%3Adev%2F1.2.1-merged+is%3Aclosed)

# アップグレード通知

### 既知の問題

- BEのランタイムJDKとしてJDK11を使用しないでください。BE Crashの原因となります。
- このバージョンでは、csv形式の読み取りパフォーマンスが低下しており、csv形式のインポートと読み取り効率に影響します。次の3桁バージョンでできるだけ早く修正予定です

### 動作の変更

- BE設定項目`high_priority_flush_thread_num_per_store`のデフォルト値が1から6に変更され、Routine Loadの書き込み効率を向上させます。(https://github.com/apache/doris/pull/14775)

- FE設定項目`enable_new_load_scan_node`のデフォルト値がtrueに変更されました。インポートタスクは新しいFile Scan Nodeを使用して実行されます。ユーザーへの影響はありません。[#14808](https://github.com/apache/doris/pull/14808)

- FE設定項目`enable_multi_catalog`を削除。Multi-カタログ機能はデフォルトで有効になります。

- ベクター化実行エンジンがデフォルトで強制的に有効化されます。[#15213](https://github.com/apache/doris/pull/15213)

セッション変数enable_vectorized_engineは効果がなくなります。デフォルトで有効になります。

再び有効にするには、FE設定項目`disable_enable_vectorized_engine`をfalseに設定し、FEを再起動して`enable_vectorized_engine`を再び有効にしてください。

# 謝辞

このリリースに貢献してくださったすべての方々に感謝いたします！

@adonis0147

@AshinGau

@BePPPower

@BiteTheDDDDt

@ByteYue

@caiconghui

@cambyzju

@chenlinzhong

@dataroaring

@Doris-Extras

@dutyu

@eldenmoon

@englefly

@freemandealer

@Gabriel39

@HappenLee

@Henry2SS

@hf200012

@jacktengg

@Jibing-Li

@Kikyou1997

@liaoxin01

@luozenglin

@morningman

@morrySnow

@mrhhsg

@nextdreamblue

@qidaye

@spaces-X

@starocean999

@wangshuo128

@weizuo93

@wsjz

@xiaokang

@xinyiZzz

@xutaoustc

@yangzhg

@yiguolei

@yixiutt

@Yulei-Yang

@yuxuan-luo

@zenoyang

@zhangstar333

@zhannngchen

@zhengshengjun
