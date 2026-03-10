---
{
  "title": "リリース 2.0.11",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.11バージョンでは約123の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.11 バージョンでは約123の改善とバグ修正が行われました。

**クイックダウンロード:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)

## 1 動作変更

inverted indexが成熟し安定したため、従来の`BITMAP INDEX`を置き換えることができるようになりました。そのため、新しく作成される`BITMAP INDEX`は自動的に`INVERTED INDEX`に切り替わりますが、既存の`BITMAP INDEX`は変更されません。この切り替えプロセス全体はユーザーに対して透明であり、書き込みやクエリに変更はありません。また、ユーザーはFE設定`enable_create_bitmap_index_as_inverted_index`をfalseに設定することで、この自動切り替えを無効にできます。[#35528](https://github.com/apache/doris/pull/35528)

## 2 改善と最適化

- JSONとTIME用のTrino JDBC Catalogタイプマッピングを追加

- 不明な状態と大量のログを防ぐため、(非)マスターへの転送に失敗した場合にFEを終了

- drop stats tableの実行時に監査ログを書き込み

- 非効率なクエリプランを避けるため、テーブルが部分的に分析されている場合はmin/max列統計を無視

- `set1 - set2`のようなsetに対するマイナス操作をサポート

- concat (col, pattern_str)を使用したLIKEとREGEXP句のパフォーマンスを改善、例：`col1 LIKE concat('%', col2, '%')`

- アップグレード互換性のためのショートサーキットクエリのクエリオプションを追加

改善とバグ修正の完全なリストは[github](https://github.com/apache/doris/compare/2.0.10...2.0.11)をご覧ください。

## クレジット

このリリースに貢献してくださった全ての方に感謝いたします：

@AshinGau, @BePPPower, @BiteTheDDDDt, @ByteYue, @CalvinKirs, @cambyzju, @csun5285, @dataroaring, @eldenmoon, @englefly, @feiniaofeiafei, @Gabriel39, @GoGoWen, @HHoflittlefish777, @hubgeter, @jacktengg, @jackwener, @jeffreys-cat, @Jibing-Li, @kaka11chen, @kobe6th, @LiBinfeng-01, @mongo360, @morningman, @morrySnow, @mrhhsg, @Mryange, @nextdreamblue, @qidaye, @sjyango, @starocean999, @SWJTU-ZhangLei, @w41ter, @wangbo, @wsjz, @wuwenchi, @xiaokang, @XieJiann, @xy720, @yujun777, @Yukang-Lian, @Yulei-Yang, @zclllyybb, @zddr, @zhangstar333, @zhiqiang-hhhh, @zy-kkk, @zzzxl1993
