export const debounce = (fn, wait = 300, that = null) => {
    let timeout: NodeJS.Timeout;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn.apply(that ?? this, args);
        }, wait);
    };
};
