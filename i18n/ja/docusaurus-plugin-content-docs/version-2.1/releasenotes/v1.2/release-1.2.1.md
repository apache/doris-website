---
{
  "title": "リリース 1.2.1",
  "language": "ja",
  "description": "DecimalV3は、より高い精度とより優れたパフォーマンスをサポートし、過去のバージョンに対して以下の利点があります。"
}
---
# 改善

### 新しいタイプDecimalV3をサポート

DecimalV3は、より高い精度とより良いパフォーマンスをサポートし、過去のバージョンと比較して以下の利点があります。

- より大きな表現可能範囲、値の範囲が大幅に拡張され、有効な数値範囲は[1,38]です。

- より高いパフォーマンス、異なる精度に応じてストレージ容量の使用量を適応的に調整します。

- より完全な精度導出サポート、異なる式に対して、異なる精度導出ルールが結果の精度に適用されます。

[DecimalV3](https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Types/DECIMALV3/)

### Iceberg V2をサポート

Iceberg V2をサポートします（Position Deleteのみサポート、Equality Deleteは後続のバージョンでサポート予定）。

Iceberg V2形式のテーブルはMulti-Catalog機能を通じてアクセスできます。

### OR条件からINへの変換をサポート

OR条件をIN条件に変換することをサポートし、一部のシナリオで実行効率を向上させることができます。[#15437](https://github.com/apache/doris/pull/15437) [#12872](https://github.com/apache/doris/pull/12872)

### JSONBタイプのインポートとクエリパフォーマンスを最適化

JSONBタイプのインポートとクエリパフォーマンスを最適化しました。[#15219](https://github.com/apache/doris/pull/15219) [#15219](https://github.com/apache/doris/pull/15219)

### Stream loadでクォートされたcsvデータをサポート

ドキュメント内でtrim_double_quotesを検索してください：[https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD](https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD)

### BrokerでTencent Cloud CHDFSとBaidu Cloud BOS、AFSをサポート

CHDFS、BOS、AFS上のデータはBrokerを通じてアクセスできます。[#15297](https://github.com/apache/doris/pull/15297) [#15448](https://github.com/apache/doris/pull/15448)

### 新しい関数

関数`substring_index`を追加しました。[#15373](https://github.com/apache/doris/pull/15373)

# Bug修正

- 一部のケースで、バージョン1.1からバージョン1.2にアップグレード後、ユーザー権限情報が失われる問題。[#15144](https://github.com/apache/doris/pull/15144)

- datev2/datetimev2タイプをパーティション化に使用する際に、パーティション値が間違っている問題を修正しました。[#15094](https://github.com/apache/doris/pull/15094)

- リリースされた多数の機能のバグ修正。完全なリストについては以下を参照してください：[PR List](https://github.com/apache/doris/pulls?q=is%3Apr+label%3Adev%2F1.2.1-merged+is%3Aclosed)

# アップグレード通知

### 既知の問題

- BEのランタイムJDKとしてJDK11を使用しないでください。BE Crashを引き起こします。
- このバージョンではcsv形式の読み取りパフォーマンスが低下しており、csv形式のインポートと読み取り効率に影響します。次の3桁バージョンでできるだけ早く修正します。

### 動作の変更

- BE設定項目`high_priority_flush_thread_num_per_store`のデフォルト値が1から6に変更され、Routine Loadの書き込み効率を向上させます。(https://github.com/apache/doris/pull/14775)

- FE設定項目`enable_new_load_scan_node`のデフォルト値がtrueに変更されました。インポートタスクは新しいFile Scan Nodeを使用して実行されます。ユーザーへの影響はありません。[#14808](https://github.com/apache/doris/pull/14808)

- FE設定項目`enable_multi_catalog`を削除しました。Multi-Catalog機能はデフォルトで有効です。

- ベクトル化実行エンジンがデフォルトで強制的に有効になります。[#15213](https://github.com/apache/doris/pull/15213)

セッション変数enable_vectorized_engineは効果がなくなります。デフォルトで有効です。

再度有効にするには、FE設定項目`disable_enable_vectorized_engine`をfalseに設定し、FEを再起動して`enable_vectorized_engine`を再度有効にしてください。


# 感謝

このリリースに貢献してくれたすべての方々に感謝します！


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
