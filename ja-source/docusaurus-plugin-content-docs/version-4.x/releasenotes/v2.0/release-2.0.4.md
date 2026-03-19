---
{
  "title": "リリース 2.0.4",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.4バージョンでは約333の改善とバグ修正が行われました。"
}
---
コミュニティのユーザーと開発者のおかげで、Doris 2.0.4バージョンでは約333の改善とバグ修正が行われました。

**クイックダウンロード** : [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub** : [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 動作の変更
- decimal データ型に対する、より合理的で正確な精度とスケールの推論
  - [https://github.com/apache/doris/pull/28034](https://github.com/apache/doris/pull/28034)

- ユーザーまたはロールに対するポリシーの削除をサポート
  - [https://github.com/apache/doris/pull/29488](https://github.com/apache/doris/pull/29488)

## 新機能

- 新しいオプティマイザーNereidsでdatev1、datetimev1、decimalv2データ型をサポート
- 新しいオプティマイザーNereidsでODBCテーブルをサポート
- 転置インデックスに`lower_case`と`ignore_above`オプションを追加
- 転置インデックスによる`match_regexp`と`match_phrase_prefix`の最適化をサポート
- datalakeでpaimon native readerをサポート
- `insert into` SQLの監査ログをサポート
- lzo圧縮形式のparquetファイルの読み込みをサポート

## 改善と最適化

- バランス、移行、パブリッシュなどを含むストレージ管理の改善
- ディスク容量を節約するためのストレージクールダウンポリシーの改善
- ASCII文字列でのsubstrのパフォーマンス最適化
- 日付関数使用時のパーティション刈り込みの改善
- 自動解析の可視性とパフォーマンスの改善

改善とバグ修正の完全なリストはgithubの[dev/2.0.4-merged](https://github.com/apache/doris/issues?q=label%3Adev%2F2.0.4-merged+is%3Aclosed)をご覧ください



## 貢献者
最後になりましたが、このリリースは以下の貢献者なしには実現できませんでした：

airborne12, amorynan, AshinGau, BePPPower, bingquanzhao, BiteTheDDDDt, bobhan1, ByteYue, caiconghui,CalvinKirs, cambyzju, caoliang-web, catpineapple, csun5285, dataroaring, deardeng, dutyu, eldenmoon, englefly, feifeifeimoon, fornaix, Gabriel39, gnehil, HappenLee, hello-stephen, HHoflittlefish777,hubgeter, hust-hhb, ixzc, jacktengg, jackwener, Jibing-Li, kaka11chen, KassieZ, LemonLiTree,liaoxin01, LiBinfeng-01, lihuigang, liugddx, luwei16, morningman, morrySnow, mrhhsg, Mryange, nextdreamblue, Nitin-Kashyap, platoneko, py023, qidaye, shuke987, starocean999, SWJTU-ZhangLei, w41ter, wangbo, wsjz, wuwenchi, Xiaoccer, xiaokang, XieJiann, xingyingone, xinyiZzz, xuwei0912, xy720, xzj7019, yujun777, zclllyybb, zddr, zhangguoqiang666, zhangstar333, zhannngchen, zhiqiang-hhhh, zy-kkk, zzzxl1993
