const fs = require('fs');
const yaml = require('js-yaml');
const http = require('http');
const yamlObj = yaml.load(fs.readFileSync('./dictionary.yml', 'utf8'));
const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const pages = 20;
const host_name = "bbs.impk.cc";
const default_url = "http://bbs.impk.cc";
const searchCriteria = "摩西之环";
const waitTimeInMs = 10 * 1000;

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

async function start() {
    //visit page by page
    //resolve each poster link
    await generatePagePosterPaths(pages);
    //fetch poster content
    //css selector select content
    //match dictionary
    // return await fetchPosterContent();
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
    const pathsByPage = await Promise.all([...Array(pages).keys()].map(async (value) => {
        const path = "/board-135&page-" + value + 1;
        return await fetchPosterLinksFromPage(path);
    }));
    fs.writeFileSync("linkcache", flatten(pathsByPage).join("\n"));
    console.log("#######update linkcache complete")
}

async function fetchPosterLinksFromPage(path) {
    const rawData = await requestIMPK(path);
    return resolvePosterLinks(rawData);
}

function resolvePosterLinks(rawData) {
    const poster_links_paths = [];
    const dom = new JSDOM(rawData);
    const selected_dom = dom.window.document.querySelectorAll("a.Topic");
    //从第五个开始取得href
    selected_dom.forEach((value, index) => {
        if (index >= 5) {
            poster_links_paths.push(value.href);
        }
    });
    return poster_links_paths;
}

async function fetchPosterContent() {
    const paths = fs.readFileSync("linkcache").toString().split("\n");
    const result = [];
    for (let index = 0; index < paths.length; index++) {
        console.log("###########开始第" + (index + 1) + "页搜索#######");
        await sleep(waitTimeInMs);
        const path = paths[index];
        const rawData = await requestIMPK("/" + path);
        const webLink = accumulateMatchedWebLink(searchCriteria, resolvePosterContent(rawData), path);
        if (webLink.length !== 0) {
            console.log("###########第" + (index + 1) + "页包含物品===>");
            console.log(webLink)
            result.concat(...webLink);
        }
    }
    // paths.slice(0, 10).forEach(async (path) => {
    //     await sleep(waitTimeInMs);
    //     console.log("######req " + path);
    //     console.log(Date.now());
    //     const rawData = await requestIMPK("/" + path);
    //     const webLink = accumulateMatchedWebLink(searchCriteria, resolvePosterContent(rawData), path);
    //     result.concat(...webLink)
    // });
    return result;
    // return await Promise.all(paths.slice(0, 10).map(async (path) => {
    //     await sleep(waitTimeInMs);
    //     console.log(Date.now())
    //     const rawData = await requestIMPK("/" + path);
    //     return accumulateMatchedWebLink(searchCriteria, resolvePosterContent(rawData), path);
    // }));
}

function resolvePosterContent(rawData) {
    const dom = new JSDOM(rawData).window.document.querySelectorAll("td")[26];
    let content = "";
    if (dom) {
        content = dom.textContent;
    }
    return content;
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

function accumulateMatchedWebLink(searchCriteria, posterStr, path) {
    const result = [];
    let keys = Object.keys(yamlObj);
    if (keys.includes(searchCriteria) ||
        keys.map(key => yamlObj[key]).some(strArray => {
            return posterStr.toLowerCase().includes(strArray.map(str => str.toLowerCase()).includes(strArray));
        })) {
        result.push(searchCriteria + " >>> " + default_url + path);
    }
    return result;
}

(async () => {
    await start();
})();
