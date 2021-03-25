const http = require('http');

const options = {
    hostname: 'bbs.impk.cc',
    port: 80,
    path: '/Forum-83.php?type=dyn',
    method: 'GET',
};

async function doSomethingUseful() {
    // return the response
    return await doRequest(options);
}


function doRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.setEncoding('utf8');
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                resolve(responseBody);
            });
        });

        req.on('error', (err) => {
            reject(err);
        });
        req.end();
    });
}

(async () => {
    const result = await doSomethingUseful(options);
    console.log(result);
})();

