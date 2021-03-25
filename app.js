const fs = require('fs');
const yaml = require('js-yaml');
const http = require('http');
const yamlObj = yaml.load(fs.readFileSync('./dictionary.yml', 'utf8'));
const jsdom = require("jsdom");
const {promisify} = require('util');
const {JSDOM} = jsdom;
const pages = 20;
const host_name = "bbs.impk.cc";
const default_url = "http://bbs.impk.cc";
const promiseGet = promisify(http.get)
const result = [];
const searchCriteria = "qg";
const waitTimeInMs = 200;

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

async function start() {
    //visit page by page
    //resolve each poster link
    const pathsByPage = await generatePagePosterPaths(pages);
    fs.writeFileSync("linkcache", flatten(pathsByPage).join("\n"));
    //fetch poster content
    //css selector select content
    //match dictionary
    return await fetchPosterContent();
}

function flatten(arr) {
    return [].concat(...arr)
}

async function asyncFlatMap(arr, asyncFn) {
    return Promise.all(flatten(await arr.map(asyncFn)))
}

function asyncMap(arr, asyncFn) {
    return Promise.all(arr.map(asyncFn))
}

async function generatePagePosterPaths(pages) {
    return await Promise.all([...Array(pages).keys()].map(async (value) => {
        const path = "/board-135&page-" + value + 1;
        return await fetchPosterLinksFromPage(path);
    }));
}

async function fetchPosterLinksFromPage(path) {
    const rawData = await requestIMPK(path);
    return resolvePosterLinks(rawData);
}

function resolvePosterLinks(rawData) {
    //TODO
    const poster_links_paths = [];
    const dom = new JSDOM(rawData);
    const selected_dom = dom.window.document.querySelectorAll("a.Topic");
    //从第五个开始取得href
    selected_dom.forEach((value, index) => {
        if (index >= 4) {
            poster_links_paths.push(value.href);
        }
    });
    return poster_links_paths;
}

async function fetchPosterContent(paths) {
    const rawData = await requestIMPK("/ShowTopic-8523887-135.php?id=8523887");
    accumulateMatchedWebLink(searchCriteria, resolvePosterContent(rawData), path)
}

function resolvePosterContent(rawData) {
    const dom = new JSDOM(rawData);
    return  dom.window.document.querySelectorAll("td")[26].textContent;
}

function requestIMPK(path) {
    const decoder = new TextDecoder('gbk');
    const options = {
        hostname: host_name,
        method: 'GET',
        path: path,
        headers: {'Cookie': 'iad=iad; Server=FBB, TempAdmin=No, Expire=0, HideModeratorLinks, Status=0, Name=fliuheyan, Passwd=32TKF5RB1N9BM879CB2HVOTEY66YOMR3{end}; UM_distinctid=1786537cfbf89d-033f5ce79e94e7-19386054-1ea000-1786537cfc0479; FBB-OldThreads=42612g'}
    }
    return new Promise(((resolve, reject) => {
        let rawData = '';
        const request = http.get(options, (response) => {
            response.on('data', (chunk) => {
                rawData += decoder.decode(chunk);
            });
            response.on('end', () => {
                try {
                    resolve(rawData)
                } catch (e) {
                    reject(e)
                }
            });
        }).on('error', (err) => {
            console.error(err);
        });
        request.end();
    }));
}

function accumulateMatchedWebLink(searchCriteria, posterStr, url) {
    let keys = Object.keys(yamlObj);
    if (keys.includes(searchCriteria) ||
        keys.map(key => yamlObj[key]).some(str => {
            console.log("###########")
            console.log(str)
            return posterStr.toLowerCase().includes(str.toLowerCase())
        })) {
        result.push(searchCriteria + " >>> " + url);
    }
}

(async () => {
    const result = await start();
    console.log(result);
})();
