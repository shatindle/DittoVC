const {
    getLocalizations,
    getLang
} = require("./lang");
const { text } = require("./lang/en-US");



for (let key in text) {
    const localizations = getLocalizations(key, text[key], "test1", "test2", "test3", "test4", "test5");
    console.dir(localizations);

    for (let lang in localizations) {
        const locale = getLang(lang, key, text[key], "test1", "test2", "test3", "test4", "test5");
        console.log(`${lang}: ${locale}`);
    }
}

console.log("done");