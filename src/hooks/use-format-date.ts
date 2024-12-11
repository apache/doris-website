import { useDateTimeFormat } from '@docusaurus/theme-common/internal';

export default function useFormatDate(date:string) {
    const dateTimeFormat = useDateTimeFormat({
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

    const formatDate = (date: string) => dateTimeFormat.format(new Date(date));

    return formatDate(date);
}
