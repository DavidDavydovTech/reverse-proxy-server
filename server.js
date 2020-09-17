// .Env
require('dotenv').config();
// Proxy
// const urlPattern = require('url-pattern'); for later
// const http = require('http');
const parseDomain = require('parse-domain').parseDomain;
const express = require('express');
const bodyParser = require('body-parser');
const portScout = require('port-scout');
const axios = require('axios');
// Files
const path = require('path');
const fs = require('fs').promises;
// Extra
const chalk = require('chalk');
const log = {
    error: (location, error, errorObj) => {
        console.log(
            chalk.underline.bgRed(`[${location.toUpperCase()}] ERROR: `), 
            chalk.red(`${error}\n\n`), 
            errorObj
        );
    },
};

// Actual Proxy set-up and deployment.
let serverDirectory = {};
let serversContainer = {};
const configsPath = path.join(__dirname, process.env.CONFIGS_PATH); //Using the "folder" key create a file path to the website's build folder.
fs.readdir(configsPath)
    .then(( configs ) => {
        return Promise.all( configs.map( ( config ) => {
            let currentConfigPath = path.join( configsPath + '/' + config );

            return fs.readFile(currentConfigPath, 'utf8')
                .then((config) => {
                    return JSON.parse(config);
                });
        }))
        .catch((err) => {
            log.error(
                '[MAIN] ERROR: ', 
                'ERROR OCCURRED WHILE TRYING TO READ WEBSITE CONFIGS \n', 
                err
            );
        })
    })
    .then(async (servers) => {
        servers.forEach(async (server, i) => {
            let domain = server.domain;
            let port = await portScout.range(49152, 65535);
            let proccessedSubdomains= [];

            if (!serverDirectory.hasOwnProperty(domain)) {
                serverDirectory[domain] = {};
            }

            for ( let i in server.subdomains ) {
                let subdomain = null;

                if ( server.subdomains[i] === '*' ) {
                    subdomain = '!!!DEFAULT!!!';
                } else {
                    subdomain = server.subdomains[i];
                }

                if ( serverDirectory[domain].hasOwnProperty[subdomain] ) {
                    proccessedSubdomains.forEach((e, i) => {
                        if ( e !== subdomain ) {
                            delete serverDirectory[domain][i];
                        }
                    });

                    log.error(
                        'MAIN',
                        `Tried to attatch a server's port to ${subdomain}, but that subdomain already has a port! Aborting server launch. `,
                        new Error('NO OVERLAPPING SUBDOMAINS')
                    );
   
                    break;
                } else {
                    serverDirectory[domain][subdomain] = port; 
                    proccessedSubdomains.push(subdomain);
                }
            }

            let appLocation = null;
            if ( server.directory ) {
                appLocation = server.directory;
            } else {
                appLocation = path.join(__dirname, process.env.DEPLOYABLES_PATH, server.name, process.env.DEFAULT_EXECUTABLE_NAME);
            }

            let serverApp = null;
            try {
                serverApp = require(appLocation);
            }
            catch (err) {
                proccessedSubdomains.forEach((e, i) => {
                    delete serverDirectory[domain][i];
                });
                
                log.error(
                    'main',
                    `Tried to get a server's app at path "${appLocation}" but an unknown error occured while trying to load it.`,
                    err
                );
            }

            serversContainer[server.name] = serverApp;
            serversContainer[server.name].listen(port);
        })
    })
    .then ( () => {
        let app = express();
        app.use( 
            bodyParser.json({
                verify: (req, res, buf) => {
                req.rawBody = buf
                }
          })
        );

        app.all('*', (req, res) => {
            let origin = parseDomain(req.headers);
            let desitnation = `${origin.domain}.${origin.topLevelDomains ? origin.topLevelDomains.join('.') : ''}`;
            console.log(origin)
            let subs = origin.subDomains ? [...origin.subDomains] : [];

            try {
                if (serverDirectory.hasOwnProperty[desitnation]) {
                    let portLink = serverDirectory[desitnation];
                    if (subs) {
                        let found = false;
                        for (let sub of subs) {
                            if (portLink.hasOwnProperty[sub]) {
                                found = true;

                                axios({
                                    method: req.method,
                                    url: req.url,
                                    headers: req.headers,
                                    params: req.params,
                                    data: req.rawBody
                                })
                                    .then((axiosRes) => {
                                        axiosRes.data.pipe(res);
                                    })
                            }

                            if ( !found ) {
                                throw `SUBDOMAIN DOES NOT EXIST`;
                            }
                        }
                    } else {
                        console.log(portLink)
                    }

                    console.log(portLink);
                } else {
                    throw 'DOMAIN DOES NOT EXIST'
                }
            }
            catch (err) {
                log.error(
                    'bouncer',
                    `Client tried to access ${origin.hostname} but an unknown error occured.`,
                    err
                );
                res.status(400).send('PAGE NOT FOUND');
            }
        })
        
        app.listen(80);
    });
        // console.log('gottem!')
        // bouncy((req, res, bounce) => {
        //     let date = new Date();
        //     console.log(req)
        //     var fullUrl = req.headers.protocol + '://' + req.headers.host + req.headers.originalUrl;
        //     console.log(fullUrl)
        //     var parsed = new urlPattern(fullUrl);
        //     console.log(parsed)
        //     if(serverDirectory[ req.headers.host ]){
        //         bounce(bouncyHosts.https[req.headers.host])
        //     }

        //     else {
        //         log.error(
        //             'bouncy',
        //             `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}] ${req.connection.remoteAddress?req.connection.remoteAddress:"UNDEFINED_IP"}: No matching end-point found! Header was "${req.headers.host}"!`,
        //             `NO ACCESSING NON-CONFIGURED ENDPOINTS`
        //         )
        //         res.statusCode = 404;
        //         res.end('Not Found');
        //     }
        // }).listen(80)
