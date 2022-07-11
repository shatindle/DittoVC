const { language:enUS } = require("./en-US");

/**
 * @description The first parameter should be the key, the second should be the defaultText.  All other parameters are ignored for this function.
 * @returns The localization file for a given set of keys
 */
function getLocalizations() {
    return {
        "en-US": enUS.apply(null, arguments)
    };
}

/**
 * @description This gets the localization for a specific key. The first parameter should be the language, the second the key text, the third is the default text, and any additional parameters are variables substituted into the localized string.
 * @param {string} lang The language to translate to. Should be the short version, like en-US
 * @returns The appropriately translated text
 */
function getLang(lang) {
    const args = Array.prototype.slice.call(arguments).slice(1);
    switch (lang) {
        case "en-US": return enUS.apply(null, args);
        // TODO: add more languages here
    }

    return enUS.apply(null, args);
}

module.exports = {
    getLocalizations,
    getLang
};