(function () {
    try {
        if (localStorage.getItem('doris-101-rail-collapsed') === 'true') {
            document.documentElement.setAttribute('data-course-rail', 'collapsed');
        }
    } catch (error) {}
}());
