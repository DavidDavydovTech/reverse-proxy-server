//List of websites hosted on this server. Below is an example website:

// example: {
//     folder: 'example-folder', //the webapp folder name in the 'www' folder
//     build: '' //The directory from that should have its files hosted
//     hosts: ['example.com',
//             'www.example.com'], // List of domains that are allowed to access this website. If you need a subdomain to host a different webapp (for example you want a admin panel at 'admin.example.com') then launch it as a seperate website with the subdomain + regular url ('admin.example.com'). In this example if www.example.com was not included the website could only be accessed via 'example.com' and 'www.example.com' would result in a 404.
//     app: express(), //This should never be changed.
//     server: null, //Never touch this, this is where the http server lives.
//     port: 8001, //The port that this website runs on.
//     protocol: 'http', //The protocol this website uses.
//     cert: null, //The certification to be used if the website is https
// },

const apps = {
    ddtech: {
        folder: '/daviddavydovtech',
        build: '/build',
        hosts: [
            'www.daviddavydov.tech',
            'daviddavydov.tech'
        ]
        ,
        app: express(),
        server: null,
        port: 8000,
        protocol: 'http', 
        cert: null,
    },
    cycalc: {
        folder: '/the-cycle-calc',
        build: '/build',
        hosts: ['cycalc.daviddavydov.tech'],
        app: express(),
        server: null,
        port: 8001,
        protocol: 'http', 
        cert: null,
    },
    twiddler: {
        folder: '/daviddavydovtech',
        build: '/',
        hosts: [
            'twiddler.daviddavydov.tech'
        ]
        ,
        app: express(),
        server: null,
        port: 8000,
        protocol: 'http', 
        cert: null,
    }
}

module.exports.apps = apps;
