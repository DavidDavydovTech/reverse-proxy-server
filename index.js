const net = require("net");
const { dirname } = require("path");
const path = require("path");
const fs = require("fs").promises;

class Urusai {
  constructor(options = {}) {
    // Set up options if they don't exist.
    options.ports = options.hasOwnProperty("ports") ? options.ports : [80];
    // Bind all methods.
    this.initalize = this.initalize.bind(this);
    this.initalizeHandlers = this.initalizeHandlers.bind(this);
    this.initalizeApps = this.initalizeApps.bind(this);
    this.fetchApps = this.fetchApps.bind(this);
    // Vars

    // Containers
    this.Handlers = {};
    this.Apps = {};
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
        return this.initalizeApps(configs)
      })
      .catch((err) => {
        console.log(err);
      });
  }

  initalizeOnClose = () => {
    process.on('SIGTERM', () => {
      // Shut down handlers: 
      for (let handlerPort in this.Handlers) {
        handler = this.Handlers[handlerPort];
        handler.close();
      }
    });
  }

  initalizeHandlers(ports) {
    return new Promise((resolve, reject) => {
      try {
        ports = sanatizePorts(ports);
        for (let port of ports) {
          this.Handlers[port] = initalizeHandler(port);
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

  initalizeApps (configs) {
    return new Promise((resolve, reject) =>{
      try {
        this.fetchApps(configs)
        for (let config of configs) {
          console.log(config.name);
        } 
      } catch (err) {
        reject(err)
      }
    })
  }

  fetchApps(configs) {
    for (let config of configs) {
      let dir = config.hasOwnProperty('dir')
        ? config.dir
        : process.env.DEPLOYABLES_PATH
        ? process.env.DEPLOYABLES_PATH
        : "deployables";
      dir = path.join(__dirname, dir, config.name, 'server.js');

      if (this.Apps.hasOwnProperty(config.name)) {
        throw new Error(`APP ${config.name} ALREADY EXISTS (APPS MUST HAVE A UNIQUE "NAME")`)
      } else {
        try {
          this.Apps[config.name] = require(dir);
        } catch (err) {
          throw err;
        }
      }
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

let initalizeHandler = (port) => {
  return net
    .createServer()
    .on("connection", (req) => {
      req.on("data", async (data) => {
        forwardRequest({ port: 8080, request: data.toString() })
          .then((res) => {
            req.write(res.toString());
          })
          .catch((err) => {
            req.write(err.toString());
          });
      });
    })
    .on("error", (err) => {
      throw err;
    })
    .listen({
      port: port,
      host: "localhost",
    });
};

let forwardRequest = ({ url = "localhost", port = "80", request }) => {
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
