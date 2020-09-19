const net = require("net");
const path = require("path");
const fs = require("fs").promises;

class Urusai {
  constructor(options = {}) {
    // Set up options if they don't exist.
    options.ports = options.hasOwnProperty('ports') ? options.ports : [ 80 ];
    // Bind all methods.
    this.initalize = this.initalize.bind(this);
    this.initalizeHandlers = this.initalizeHandlers.bind(this);
    this.forwardRequest = this.forwardRequest.bind(this);

    // Vars

    // Containers
    this.handlers = {};

    // Initalize the class
    this.initalize(options);
  }

  initalize(options) {
    this.initalizeHandlers(options.ports)
      .then(() => {
        return this.initalizeWebConfigs(options.path);
      })
      .then((websiteData) => {
        console.log(stuff)
      })
      .catch((err)=>{console.log(err)})
  }

  initalizeHandlers(ports) {
    return new Promise((resolve, reject) => {
      try {
        ports = sanatizePorts(ports);
        for (let port of ports) {
          this.handlers[port] = initalizeHandler(port);
          console.log('Handler now listening on port', port)
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    })
  }

  initalizeWebConfigs(dir) {
    dir = dir ? dir : process.env.CONFIGS_PATH ? process.env.CONFIGS_PATH : 'configs';
    dir = path.join(__dirname, dir)

    return parseConfigsJSON(dir);
  }
}

module.exports = Urusai;

let sanatizePorts = (ports) => {
  ports = [...ports]
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
}