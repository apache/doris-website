---
{
  "title": "リリース 2.0.4",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.4バージョンでは約333の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.4 バージョンでは約333件の改善とバグ修正が行われました。

**クイックダウンロード** : [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub** : [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 動作変更
- decimal データタイプのより合理的で正確な精度とスケール推論
  - [https://github.com/apache/doris/pull/28034](https://github.com/apache/doris/pull/28034)

- ユーザーまたはロールに対する drop policy のサポート
  - [https://github.com/apache/doris/pull/29488](https://github.com/apache/doris/pull/29488)

## 新機能

- 新しいオプティマイザー Nereids で datev1、datetimev1、decimalv2 データタイプをサポート
- 新しいオプティマイザー Nereids で ODBC table をサポート
- 転置インデックスに `lower_case` および `ignore_above` オプションを追加
- 転置インデックスによる `match_regexp` と `match_phrase_prefix` の最適化をサポート
- datalake で paimon ネイティブリーダーをサポート
- `insert into` SQL の監査ログをサポート
- lzo 圧縮形式の parquet ファイル読み取りをサポート

## 改善と最適化

- バランス、マイグレーション、パブリッシュなどを含むストレージ管理の改善
- ディスク容量を節約するためのストレージクールダウンポリシーの改善
- ASCII 文字列での substr のパフォーマンス最適化
- 日付関数使用時のパーティション剪定の改善
- 自動解析の可視性とパフォーマンスの改善

github で改善とバグ修正の完全なリストをご覧ください [dev/2.0.4-merged](https://github.com/apache/doris/issues?q=label%3Adev%2F2.0.4-merged+is%3Aclosed)



## クレジット
最後になりましたが、このリリースは以下のコントリビューターなしには実現できませんでした：

airborne12, amorynan, AshinGau, BePPPower, bingquanzhao, BiteTheDDDDt, bobhan1, ByteYue, caiconghui,CalvinKirs, cambyzju, caoliang-web, catpineapple, csun5285, dataroaring, deardeng, dutyu, eldenmoon, englefly, feifeifeimoon, fornaix, Gabriel39, gnehil, HappenLee, hello-stephen, HHoflittlefish777,hubgeter, hust-hhb, ixzc, jacktengg, jackwener, Jibing-Li, kaka11chen, KassieZ, LemonLiTree,liaoxin01, LiBinfeng-01, lihuigang, liugddx, luwei16, morningman, morrySnow, mrhhsg, Mryange, nextdreamblue, Nitin-Kashyap, platoneko, py023, qidaye, shuke987, starocean999, SWJTU-ZhangLei, w41ter, wangbo, wsjz, wuwenchi, Xiaoccer, xiaokang, XieJiann, xingyingone, xinyiZzz, xuwei0912, xy720, xzj7019, yujun777, zclllyybb, zddr, zhangguoqiang666, zhangstar333, zhannngchen, zhiqiang-hhhh, zy-kkk, zzzxl1993
