// Reads custom settings
GETSCHEMA('Settings').workflow2('load');

// Disables an analytic counter for administration / manager
MODULE('webcounter').blacklist(CONFIG('manager-url'));

// Global static variables (default values)
F.global.blogs = [];
F.global.blogstags = [];
F.global.blogslatest = [];
F.global.commentslatest = [];