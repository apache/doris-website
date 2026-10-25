// 导入原映射
import MDXComponents from '@theme-original/MDXComponents';
import VersionsDoc from '@site/src/components/VersionsDoc';
import LocalizedLink from '@site/src/components/home-next/LocalizedLink';

export default {
    // 复用默认的映射
    ...MDXComponents,
    a: LocalizedLink,
    version: VersionsDoc,
};
