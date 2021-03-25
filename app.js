const fs = require('fs');
const yaml = require('js-yaml');
const http = require('http');
const yamlObj = yaml.load(fs.readFileSync('./dictionary.yml', 'utf8'));
const jsdom = require("jsdom");

const {JSDOM} = jsdom;
const pages = 1;
const host_name = "bbs.impk.cc";
const default_url = "http://bbs.impk.cc";
const result = [];
const searchCriteria = "";

async function start() {
    //visit page by page
    //resolve each poster link
    const paths = await visitPages(pages);
    //fetch poster content
    //css selector select content
    //match dictionary

    fetchPosterContent(paths);
}

async function visitPages(pages) {
    const paths = [];
    [...Array(pages).keys()].forEach(value => {
        const path = "/board-135&page-" + value + 1;
        paths.push(fetchPosterLinksFromPage(path));
    });
    return paths;
}

function fetchPosterLinksFromPage(path) {
    const poster_links_paths = [];
    requestIMPK(path, function (rawData) {
        resolvePosterLinks(rawData, poster_links_paths);
    });
    console.log(poster_links_paths)
    return poster_links_paths;
}

function resolvePosterLinks(rawData, poster_links_paths) {
    //TODO
    /*
    $("[cellpadding='4'][cellspacing='1'][width='100%']")
     */
    const dom = new JSDOM(rawData);
    const selected_dom = dom.window.document.querySelectorAll("a.Topic");
    //从第五个开始取得href
    selected_dom.forEach((value, index) => {
        if (index >= 4) {
            poster_links_paths.push(value.href);
        }
    });
}

function fetchPosterContent(paths) {
    console.log("############start content")
    console.log(paths)

    paths.forEach(path => {
        requestIMPK("/" + path, function (rawData) {
            accumulateMatchedWebLink(searchCriteria, resolvePosterContent(rawData), path);
        });
    });
}

function resolvePosterContent(rawData) {
    //TODO
    console.log("#######resolve");
    const dom = new JSDOM(rawData);

    debugger;
    const content = dom.window.document.querySelectorAll("table");
    console.log(content.text)
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

function accumulateMatchedWebLink(searchCriteria,posterStr, url) {
    if (Object.keys(yamlObj).includes(searchCriteria) ||
        yamlObj[searchCriteria].some(str => posterStr.toLowerCase().includes(str.toLowerCase()))) {
        result.push(searchCriteria + " >>> " + url);
    }
}

start();
console.log(result.join("\n"));
