"use strict";

var config = {
    LANGUAGE: {
        VALUES: ['en', 'hi', 'tg'],
        DEFAULT: 'en'
    },
    STATUS: {
        MAP: {
            DRAFTED: "drafted",
            PUBLISHED: "published",
            UNPUBLISHED: "unpublished"
        },
        VALUES: ["drafted", "published", "unpublished"],
        DEFAULT: "drafted"
    }
};

module.exports = config;