---
{
  "title": "リリース 2.0.4",
  "language": "ja",
  "description": "コミュニティのユーザーと開発者の皆様のおかげで、Doris 2.0.4バージョンでは約333の改善とバグ修正が行われました。"
}
---
コミュニティのユーザーと開発者のおかげで、Doris 2.0.4バージョンでは約333の改善とバグ修正が行われました。

**クイックダウンロード** : [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub** : [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 動作変更
- decimal データ型のより合理的で正確な精度とスケール推論
  - [https://github.com/apache/doris/pull/28034](https://github.com/apache/doris/pull/28034)

- ユーザーまたはロールの drop policy をサポート
  - [https://github.com/apache/doris/pull/29488](https://github.com/apache/doris/pull/29488)

## 新機能

- 新しいオプティマイザー Nereids で datev1、datetimev1、decimalv2 データ型をサポート。
- 新しいオプティマイザー Nereids で ODBC テーブルをサポート。
- 転置インデックスに `lower_case` および `ignore_above` オプションを追加
- 転置インデックスによる `match_regexp` および `match_phrase_prefix` の最適化をサポート
- datalake で paimon ネイティブリーダーをサポート
- `insert into` SQL の audit-log をサポート
- lzo 圧縮形式の parquet ファイル読み取りをサポート

## 3つの改善と最適化

- balance、migration、publish などを含むストレージ管理を改善。
- ディスク容量を節約するためのストレージ cooldown ポリシーを改善。
- ASCII 文字列での substr のパフォーマンス最適化。
- date 関数使用時のパーティションプルーンを改善。
- 自動分析の可視性とパフォーマンスを改善。

改善とバグ修正の完全なリストについては、github [dev/2.0.4-merged](https://github.com/apache/doris/issues?q=label%3Adev%2F2.0.4-merged+is%3Aclosed) をご覧ください。



## クレジット
最後に、このリリースは以下の貢献者なしには実現できませんでした： 

airborne12, amorynan, AshinGau, BePPPower, bingquanzhao, BiteTheDDDDt, bobhan1, ByteYue, caiconghui,CalvinKirs, cambyzju, caoliang-web, catpineapple, csun5285, dataroaring, deardeng, dutyu, eldenmoon, englefly, feifeifeimoon, fornaix, Gabriel39, gnehil, HappenLee, hello-stephen, HHoflittlefish777,hubgeter, hust-hhb, ixzc, jacktengg, jackwener, Jibing-Li, kaka11chen, KassieZ, LemonLiTree,liaoxin01, LiBinfeng-01, lihuigang, liugddx, luwei16, morningman, morrySnow, mrhhsg, Mryange, nextdreamblue, Nitin-Kashyap, platoneko, py023, qidaye, shuke987, starocean999, SWJTU-ZhangLei, w41ter, wangbo, wsjz, wuwenchi, Xiaoccer, xiaokang, XieJiann, xingyingone, xinyiZzz, xuwei0912, xy720, xzj7019, yujun777, zclllyybb, zddr, zhangguoqiang666, zhangstar333, zhannngchen, zhiqiang-hhhh, zy-kkk, zzzxl1993
