//For web hosting & proxying
const express = require('express');
const http = require("http");
const bouncy = require('bouncy');

//For finding the files in the website folders
const path = require('path');
const fs = require('fs');
const { config } = require('process');

//For actually getting our apps
const config = require('./config');
const apps = config.apps;

//This is the middleware/function used to set up and launch the websites.
let launchWebsites = () => {
    for(let website in apps){ // Itterate through websites in the "apps" object
        website = apps[website]; // Make the "website" variable refrence the current website in the "apps" object.
    
        const websitePath = path.join(__dirname+`/apps/${website.folder}${website.build}`); //Using the "folder" key create a file path to the website's build folder.
    
        fs.readdir(websitePath, (err, files) => { //Go to the website's build folder and store the filenames in a "files" array
            if(err){ //If there's an error trying the access the build folder (permissions, build folder doesn't exist, etc) then console log an error and skip the setup.
                console.log(`${website.host}: An error occured while trying to access files.`)
            } else {
                let isHttps = null; //Assigned to true or false in the if statement below, used to launch the server using different methods depending on if its http or https. 
    
                if(website.protocol === "http"){ 
                    isHttps = false;
            
                } else if (website.protocol === "https"){
                    isHttps = true;
    
                } else { // Failsafe for when the protocol for the website is missing.
                    console.log(`Warning a website ("${website.hosts[0]}") tried to be launched but it had no protocol.`)
                    next();
                }
                
                // Filter the files in the build folder not to include index.html. 
                // Since our react websites aren't fragmented any routes that lead to a url on the site (for instance "example.com/about") need to be directed to index.html to be delt with there. 
                // However if there's a specific file that needs to be loaded or a folder that contains files that needs to be served via the server (for example "example.com/images/[etc]") then it needs to actually refrence that file. 
                // We take care of this by assuming that the developer is competent and that files/folders in the build folder and routes in the React website all have unique names (and that none of them are called index).
                // Then later down the line if a user requests a route and its in the files array, we assume they need that file to be served to them and that a route with that name does not exist on the React website. Likewise we assume that if we don't have that file name in the array that its a route they're trying to access on the React website itself.
                const fileArray = files.filter(file => file !== 'index.html')
                console.log()
                website.app.use('/*', (req,res) =>{ //We do our own route filtering so we can just use "/*"
                    let route = req.params["0"].substring(0, req.params["0"].indexOf('/')); // Get the route from the request.
    
                    if(fileArray.includes(route)){ // If the first part of the route is in the files array its either a file or a folder, we try to send them the file in the code below.
                        
                        // Set the route path to a variable.
                        // P.S. We don't have to worry about traversal with "../", this is taken care of automatically.
                        let tempFilePath = path.join(__dirname+`/www/${website.folder}/build/${req.params["0"]}`); //Set the file path

                        //Check if file exists. If it does send the file, otherwise send a 404 and console.log an error. 
                        fs.access(tempFilePath, fs.F_OK, (err) => {
                            if (err) {
                                console.error(err)
                                res.statusCode = 404;
                                res.end('Not Found');

                            } else {
                                res.sendFile(tempFilePath);

                            }
                          
                        })

                    } else { // Otherwise its a route in the React website.
                        res.sendFile(path.join(__dirname+`/www/${website.folder}/build/index.html`));

                    }
                    
                });
            
                
                //Temperary warning on the left since I haven't added the ability to deploy https websites. Otherwise deploys a http website perfectly.
                website.server = isHttps?console.warn(`Warning a website ("${website.hosts[0]}" tried to be launched as a https website but it https isn't supported yet.`):http.createServer(website.app)
                website.server.listen(website.port) // Listen on the port in the website object.
    
                for(let host of website.hosts){ //For every host in the hosts key add their host as the keyname to the correct protocall and assign the port in that website object to that new key. This acts as a directory for bouncy.
                    bouncyHosts[isHttps?"https":"http"][host] = website.port;
                    
                }
            }
    
        })
    }
}


let bouncyHosts = {
    http: {},
    https: {}
}

launchWebsites(apps);

bouncy((req, res, bounce) => {
    let date = new Date();

    if(bouncyHosts.https[req.headers.host]){
        bounce(bouncyHosts.https[req.headers.host])
    } 
    
    else if (bouncyHosts.http[req.headers.host]){
        bounce(bouncyHosts.http[req.headers.host])
    }

    else {
        console.log(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}] ${req.connection.remoteAddress?req.connection.remoteAddress:"UNDEFINED_IP"}: No matching Domain found! Header was "${req.headers.host}"!`)
        res.statusCode = 404;
        res.end('Not Found');
    }
}).listen(80)