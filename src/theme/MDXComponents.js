// 导入原映射
import MDXComponents from '@theme-original/MDXComponents';
import VersionsDoc from '@site/src/components/VersionsDoc';

export default {
    // 复用默认的映射
    ...MDXComponents,
    version: VersionsDoc,
};
