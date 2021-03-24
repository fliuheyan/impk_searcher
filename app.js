const fs = require('fs');
const yaml = require('js-yaml');
const http = require('http');
const yamlObj = yaml.load(fs.readFileSync('./dictionary.yml', 'utf8'));
const jsdom = require("jsdom");

const {JSDOM} = jsdom;
const key = "格力风";
const pages = 1;
const host_name = "bbs.impk.cc";
const default_url = "http://bbs.impk.cc";
const result = [];
const poster_links = [];

function start() {
    //visit page by page
    //resolve each poster link
    visitPages(pages);
    //fetch poster content
    //css selector select content
    //match dictionary

    // fetchPosterContent();
}

function visitPages(pages) {
    [...Array(pages).keys()].forEach(value => {
        const path = "/board-135&page-" + value + 1;
        const url = default_url + path;
        fetchPosterLinksFromPage(url, path);
    });
}

function fetchPosterLinksFromPage(url, path) {
    requestIMPK(path, function (rawData, url) {
        resolvePosterLinks(rawData);
    })
}

function resolvePosterLinks(rawData) {
    //TODO
    /*
    $("[cellpadding='4'][cellspacing='1'][width='100%']")
     */
    const dom = new JSDOM(rawData);
    const selected_dom = dom.window.document.querySelector(".tableborder").textContent;
    console.log(selected_dom);
    // console.log(rawData);

    poster_links.push('http://bbs.impk.cc/ShowTopic-8536673-135.php?id=8536673');
}

function fetchPosterContent() {
    poster_links.forEach(url => {
        requestIMPK(url, function (rawData) {
            accumulateMatchedWebLink(resolvePosterContent(rawData), url);
        });
    });
}

function resolvePosterContent(rawData) {
    //TODO
    return "";
}

function requestIMPK(path, callback) {
    const decoder = new TextDecoder('gbk');
    const options = {
        hostname: host_name,
        method: 'GET',
        path: path,
        headers: {'Cookie': 'iad=iad; Server=FBB, TempAdmin=No, Expire=0, HideModeratorLinks, Status=0, Name=fliuheyan, Passwd=32TKF5RB1N9BM879CB2HVOTEY66YOMR3{end}; UM_distinctid=1786537cfbf89d-033f5ce79e94e7-19386054-1ea000-1786537cfc0479; FBB-OldThreads=42612g'}
    }
    const req = http.get(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += decoder.decode(chunk);
        });
        res.on('end', () => {
            try {
                callback(rawData);
            } catch (e) {
                console.error(e.message);
            }
        });
    }).on('error', err => {
        console.error(err);
    });
    req.end();
}

function accumulateMatchedWebLink(posterStr, url) {
    if (Object.keys(yamlObj).includes(key) ||
        yamlObj[key].some(str => posterStr.toLowerCase().includes(str.toLowerCase()))) {
        result.push(key + " >>> " + url);
    }
}

start();
console.log(result.join("\n"));
