---
{
  "title": "Release 1.1.5",
  "language": "ja",
  "description": "このリリースでは、Dorisチームは1.1.4以降約36の問題またはパフォーマンス改善を修正しました。このリリースは1のバグ修正リリースです。"
}
---
このリリースでは、Dorisチームは1.1.4以降約36の問題またはパフォーマンス改善を修正しました。このリリースは1.1のバグ修正リリースであり、すべてのユーザーがこのリリースへのアップグレードを推奨します。

# 動作変更

「select year(birthday) as birthday」のようにエイリアス名が元の列名と同じで、それをgroup by、order by、having句で使用する場合、dorisの動作は過去にMySQLと異なっていました。このリリースでは、MySQLの動作に従うようにしました。Group byとhaving句は最初に元の列を使用し、order byは最初にエイリアスを使用します。ここは少し混乱するかもしれないので、簡単なアドバイスとして、元の列名と同じエイリアスを使用しない方が良いでしょう。

# 機能

murmur_hash3_64のサポートを追加。[#14636](https://github.com/apache/doris/pull/14636)

# 改善

パフォーマンス向上のためconvert_tzにタイムゾーンキャッシュを追加。[#14616](https://github.com/apache/doris/pull/14616)

show句呼び出し時にテーブル名で結果をソート。[#14492](https://github.com/apache/doris/pull/14492)

# バグ修正

select句にif定数式がある場合のcoredumpを修正。[#14858](https://github.com/apache/doris/pull/14858)

ColumnVector::insert_date_columnがクラッシュする可能性を修正。[#14839](https://github.com/apache/doris/pull/14839)

high_priority_flush_thread_num_per_storeのデフォルト値を6に更新し、ロードパフォーマンスが向上。[#14775](https://github.com/apache/doris/pull/14775)

quick compactionのcoreを修正。[#14731](https://github.com/apache/doris/pull/14731)

パーティション列がduplicate keyでない場合、spark loadがIndexOutOfBoundsエラーをスローする問題を修正。[#14661](https://github.com/apache/doris/pull/14661)

VCollectorIteratorのメモリリーク問題を修正。[#14549](https://github.com/apache/doris/pull/14549)

sequence列がある場合のcreate table likeを修正。[#14511](https://github.com/apache/doris/pull/14511)

CPUを大量に消費するtotal_bytesの使用の代わりに、バッチサイズ計算にavg rowsetを使用。[#14273](https://github.com/apache/doris/pull/14273)

conjunctでのright outer joinのcoreを修正。[#14821](https://github.com/apache/doris/pull/14821)

tcmallocのgcポリシーを最適化。[#14777](https://github.com/apache/doris/pull/14777) [#14738](https://github.com/apache/doris/pull/14738) [#14374](https://github.com/apache/doris/pull/14374)
