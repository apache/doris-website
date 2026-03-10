---
{
  "title": "リリース 1.2.6",
  "language": "ja",
  "description": "このリリースに貢献していただいた皆様に感謝いたします："
}
---
# 動作変更

- decimalの精度を超えるデータのインポートを制御するBE設定項目`allow_invalid_decimalv2_literal`を追加し、以前のロジックとの互換性を保つ。

# クエリ

- 複数のクエリプランニングの問題を修正。
- `sql_select_limit`セッション変数をサポート。
- クエリのコールドラン性能を最適化。
- expr contextメモリリークを修正。
- `explode_split`関数が一部のケースで正しく実行されない問題を修正。

## Multi Catalog

- hiveメタデータの同期によりFEのreplay edit logが失敗する問題を修正。
- `refresh catalog`操作がFE OOMを引き起こす問題を修正。
- jdbc catalogが`0000-00-00`を正しく処理できない問題を修正。
- kerberosチケットが自動的に更新されない問題を修正。
- hiveのパーティションpruning性能を最適化。
- jdbc catalogにおけるtrinoとprestoの動作の不整合を修正。
- 一部の環境でhdfs short-circuit readが使用できずクエリ効率の向上が図れない問題を修正。
- CHDFS上のicebergテーブルが読み取れない問題を修正。

# Storage

- MOWテーブルにおけるdelete bitmapの計算誤りを修正。
- 複数のBEメモリ問題を修正。
- snappy圧縮の問題を修正。
- jemallocが一部のケースでBEクラッシュを引き起こす可能性がある問題を修正。

# その他

- 複数のjava udf関連の問題を修正。
- `recover table`操作が動的パーティションの作成を誤ってトリガーする問題を修正。
- broker load経由でorcファイルをインポートする際のタイムゾーンを修正。
- 新たに追加された`PERCENT`キーワードがroutine load jobのreplay metadataの失敗を引き起こす問題を修正。
- 非パーティションテーブルに対して`truncate`操作が実行できない問題を修正。
- `show snapshot`操作によりmysql接続が失われる問題を修正。
- ロックロジックを最適化し、テーブル作成時のロックタイムアウトエラーの確率を軽減。
- 一部の古いmysqlクライアントとの互換性のためにセッション変数`have_query_cache`を追加。
- ロード時にエラーが発生した場合のエラーメッセージを最適化。

# Big Thanks

このリリースに貢献していただいた皆様に感謝します：

@amorynan

@BiteTheDDDDt

@caoliang-web

@dataroaring

@Doris-Extras

@dutyu

@Gabriel39

@HHoflittlefish777

@htyoung

@jacktengg

@jeffreys-cat

@kaijchen

@kaka11chen

@Kikyou1997

@KnightLiJunLong

@liaoxin01

@LiBinfeng-01

@morningman

@mrhhsg

@sohardforaname

@starocean999

@vinlee19

@wangbo

@wsjz

@xiaokang

@xinyiZzz

@yiguolei

@yujun777

@Yulei-Yang

@zhangstar333

@zy-kkk
