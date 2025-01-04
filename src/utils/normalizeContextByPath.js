export function normalizeContextByPath(context, currentLocale) {
    if (typeof context === "string") {
        return {
            label: context,
            path: context,
        };
    }
    else {
        const { label, path } = context;
        if (typeof label === "string") {
            return { label, path };
        }
        if (Object.prototype.hasOwnProperty.call(label, currentLocale)) {
            return {
                label: label[currentLocale],
                path,
            };
        }
        return {
            label: path,
            path,
        };
    }
}
