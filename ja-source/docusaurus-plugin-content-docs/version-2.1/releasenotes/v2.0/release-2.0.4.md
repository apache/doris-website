---
{
  "title": "リリース 2.0.4",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.4バージョンでは約333の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.4バージョンでは約333の改善とバグ修正が行われました。

**クイックダウンロード** : [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub** : [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 動作の変更
- decimalデータ型におけるより合理的で正確な精度とスケールの推論
  - [https://github.com/apache/doris/pull/28034](https://github.com/apache/doris/pull/28034)

- ユーザーまたはロールのポリシー削除をサポート
  - [https://github.com/apache/doris/pull/29488](https://github.com/apache/doris/pull/29488)

## 新機能

- 新しいオプティマイザーNereidsにおけるdatev1、datetimev1、decimalv2データ型をサポート。
- 新しいオプティマイザーNereidsにおけるODBCテーブルをサポート。
- 転置インデックスに`lower_case`と`ignore_above`オプションを追加
- 転置インデックスによる`match_regexp`と`match_phrase_prefix`の最適化をサポート
- datalakeにおけるpaimonネイティブリーダーをサポート
- `insert into` SQLの監査ログをサポート
- lzo圧縮形式のparquetファイルの読み取りをサポート

## 3つの改善と最適化

- バランス、移行、公開などを含むストレージ管理を改善。
- ディスク容量節約のためのストレージクールダウンポリシーを改善。
- ASCII文字列でのsubstrのパフォーマンス最適化。
- 日付関数使用時のパーティションプルーンを改善。
- 自動分析の可視性とパフォーマンスを改善。

github [dev/2.0.4-merged](https://github.com/apache/doris/issues?q=label%3Adev%2F2.0.4-merged+is%3Aclosed)で改善とバグ修正の完全なリストをご覧ください



## 謝辞
最後になりましたが、このリリースは以下のコントリビューターの皆様なしには実現できませんでした：

airborne12, amorynan, AshinGau, BePPPower, bingquanzhao, BiteTheDDDDt, bobhan1, ByteYue, caiconghui,CalvinKirs, cambyzju, caoliang-web, catpineapple, csun5285, dataroaring, deardeng, dutyu, eldenmoon, englefly, feifeifeimoon, fornaix, Gabriel39, gnehil, HappenLee, hello-stephen, HHoflittlefish777,hubgeter, hust-hhb, ixzc, jacktengg, jackwener, Jibing-Li, kaka11chen, KassieZ, LemonLiTree,liaoxin01, LiBinfeng-01, lihuigang, liugddx, luwei16, morningman, morrySnow, mrhhsg, Mryange, nextdreamblue, Nitin-Kashyap, platoneko, py023, qidaye, shuke987, starocean999, SWJTU-ZhangLei, w41ter, wangbo, wsjz, wuwenchi, Xiaoccer, xiaokang, XieJiann, xingyingone, xinyiZzz, xuwei0912, xy720, xzj7019, yujun777, zclllyybb, zddr, zhangguoqiang666, zhangstar333, zhannngchen, zhiqiang-hhhh, zy-kkk, zzzxl1993
