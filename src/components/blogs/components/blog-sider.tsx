import Link from 'next/link';
import { ArrowIcon } from '../icons/arrow-icon';

export function BlogSidebar({ title }: { title: string }) {
    return (
        <div className=" container  mx-auto hidden text-sm text-[#4C576C] lg:flex lg:text-base">
            <Link className="flex items-center gap-x-1" href="/blogs">
                <ArrowIcon />
                <span>Back to Blog</span>
            </Link>
        </div>
    );
}
