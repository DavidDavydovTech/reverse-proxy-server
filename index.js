const { url } = require("inspector");
const net = require("net");
const { dirname } = require("path");
const path = require("path");
const fs = require("fs").promises;
const parseDomain = require("parse-domain").parseDomain;
const set = require("lodash.set");
const portScout = require('port-scout');

class Urusai {
  constructor(options = {}) {
    // Set up options if they don't exist.
    options.ports = options.hasOwnProperty("ports") ? options.ports : [80];
    // Bind all methods.
    this.initalize = this.initalize.bind(this);
    this.initalizeOnClose = this.initalizeOnClose.bind(this);
    this.initalizeHandler = this.initalizeHandler.bind(this);
    this.initalizeHandlers = this.initalizeHandlers.bind(this);
    this.initalizeApps = this.initalizeApps.bind(this);
    this.fetchApps = this.fetchApps.bind(this);
    this.close = this.close.bind(this);
    // Vars

    // Containers
    this.Handlers = {};
    this.Apps = {};
    this.Dictonary = {};
    // Initalize the class
    this.initalize(options);
  }

  /**
   * Initalizes the app by running methods prepended by 'initalize'.
   * @param {object} options - The options for this server passes via constructor.
   */
  initalize(options) {
    this.initalizeHandlers(options.ports)
      .then(() => {
        return this.initalizeWebConfigs(options.path);
      })
      .then((configs) => {
        return this.initalizeApps(configs);
      })
      .then(() => {
        console.log('DICTIONARY: \n', this.Dictonary);
      })
      .catch((err) => {
        throw err;
      });
  }

  initalizeOnClose = () => {
    process.on("SIGTERM", () => {
      this.close();
    });
  };

  initalizeHandler(port) {
    return net
      .createServer()
      .on("connection", (req) => {
        req.on("data", async (data) => {
          let url = readHost(data.toString());
          //Note, this doesn't work on localhost subdomains.
          if (
            !url.hasOwnProperty("domain") ||
            !url.hasOwnProperty("topLevelDomains")
          ) {
            throw "LOCALHOST_NOT_SUPPORTED";
          }
          let currentPath = this.Dictonary[url.topLevelDomains[0]];
          console.log(currentPath)
          // Go through TLDs:
          for (let i = 1; i < url.topLevelDomains.length; i++) {
            let tld = url.topLevelDomains[i];
            if (currentPath.hasOwnProperty(tld)) {
              currentPath = currentPath[tld];
            }
          }
          // Add domain:
          currentPath = currentPath[url.domain];
          console.log('domain', currentPath)
          // Add subdomains if needed, otherwise finish up.
          if (
            url.hasOwnProperty('subDomains') &&
            url.subDomains.length > 0
          ) {
            for (let i = url.subDomains.length - 1; i >= 0; i--) {
              let sub = url.subDomains[i];
              console.log(sub)
              console.log(currentPath[sub])
              if (currentPath.hasOwnProperty(sub)) {
                currentPath = currentPath[sub];
                console.log(currentPath)
              } else {
                currentPath = currentPath["!!!DEFAULT!!!"];
              }
            }
          } else {
            currentPath = currentPath["!!!DEFAULT!!!"];
          }
          console.log(currentPath);
          if (currentPath) {
           forwardRequest({port: currentPath, request: data})
            .then((res) => {
              req.write(res);
            });
          } else {
            throw 'DOMAIN_DOES_NOT_EXIST'
          }
        });
      })
      .on("error", (err) => {
        throw err;
      })
      .listen({
        port: port,
        host: "localhost",
      });
  }

  initalizeHandlers(ports) {
    return new Promise((resolve, reject) => {
      try {
        ports = sanatizePorts(ports);
        for (let port of ports) {
          this.Handlers[port] = this.initalizeHandler(port);
          console.log("Handler now listening on port", port);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  initalizeWebConfigs(dir) {
    dir = dir
      ? dir
      : process.env.CONFIGS_PATH
      ? process.env.CONFIGS_PATH
      : "configs";
    dir = path.join(__dirname, dir);

    return parseConfigsJSON(dir);
  }

  initalizeApps(configs) {
    return new Promise(async (resolve, reject) => {
      this.fetchApps(configs);
      console.log('hi1')
      for await (let config of configs) {
        let port = await portScout.range(49152, 65535);

      console.log('hi2')
        let currentPath = [];
        let tlds = config.tld.split(".");
        // Go through TLDs:
        for (let i = 0; i < tlds.length; i++) {
          let tld = tlds[i];
          currentPath.push(tld);
        }
        console.log('hi3')
        // Add domain:
        currentPath.push(config.domain);
        // Add subdomains if needed, otherwise finish up.
        if (config.hasOwnProperty('subdomains') && config.subdomains.length > 0) {
          config.subdomains.forEach((e) => {
            console.log('hi4')
            let subs = e.split('.');
            let subPath = [];
            for (let i = subs.length - 1; i >= 0; i--) {
              let sub = subs[i];
              subPath.push(sub);
            }
            console.log('hi5')

            set(this.Dictonary, [...currentPath, ...subPath].join('.'), port);
          })  ;
        } else {
          set(this.Dictonary, [...currentPath, "!!!DEFAULT!!!"].join('.'), port);
        }

        this.Apps[config.name].listen(port)
      }
      console.log('hi6')
      resolve(this.Dictonary);
    });
  }

  fetchApps(configs) {
    for (let config of configs) {
      let dir = config.hasOwnProperty("dir")
        ? config.dir
        : process.env.DEPLOYABLES_PATH
        ? process.env.DEPLOYABLES_PATH
        : "deployables";
      dir = path.join(__dirname, dir, config.name, "server.js");

      if (this.Apps.hasOwnProperty(config.name)) {
        throw new Error(
          `APP ${config.name} ALREADY EXISTS (APPS MUST HAVE A UNIQUE "NAME")`
        );
      } else {
        try {
          this.Apps[config.name] = require(dir);
        } catch (err) {
          throw err;
        }
      }
    }
  }

  close() {
    // Shut down handlers:
    for (let handlerPort in this.Handlers) {
      let handler = this.Handlers[handlerPort];
      handler.close();
    }
    // Shut down express servers:
    for (let server in this.Apps) {
      server = this.Apps[server];
      server.close();
    }
  }
}

module.exports = Urusai;

// Helpers

let sanatizePorts = (ports) => {
  ports = [...ports];
  let included = [];
  return ports.filter((e) => {
    if (isNaN(parseInt(e)) === false && included.includes(e) === false) {
      included.push(e);
      return e;
    }
  });
};

let parseConfigsJSON = (dir) => {
  return fs.readdir(dir).then((configs) => {
    return Promise.all(
      configs.map((config) => {
        let currentConfigPath = path.join(dir, config);

        return fs.readFile(currentConfigPath, "utf8").then((config) => {
          return JSON.parse(config);
        });
      })
    );
  });
};

let forwardRequest = function ({ url = "localhost", port = "80", request }) {
  var socket = net.createConnection(port, url);

  return new Promise((resolve, reject) => {
    socket
      .on("data", (data) => {
        resolve(data);
      })
      .on("error", (err) => {
        reject(err);
      })
      .write(request);
  });
};

let readHost = (request) => {
  let url = request.match(/(?<=Host:(\s+)).*/)[0];
  url.replace(/\s/g, "");
  url = parseDomain(url);
  return url;
};

let promisifyNow = (func, ...args) => {
  return new Promise((resolve, reject) => {
    try {
      resolve(func.apply(null, args));
    } catch (err) {
      reject(err);
    }
  });
};
