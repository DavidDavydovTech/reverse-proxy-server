# Reverse-Proxy-Server

### Introduction
This is a server/'router' that is supposed to take other git projects on my github, launch them, and then route incoming requests to port 80 to the port that they live on. This server assumes that:
 * Each server will have a 'export.js' file that exports the server via `module.exports = <server>`.
 * Each server will only export a single thing withing it being in an object, a instanc of `express`.
 * Each server will handle routing to its own subdomains. If a sub domain is meant to route to a completely different app it should provide a 'exceptions' object where the keys are the subdomains and the values are (for now).
 * Each server will take in any ports.
 * Each server that needs a database connects to the mongodb server on the VPS and doesn't have its own database to run. 

### How does this know what servers exist where?
Each server is expected to have a `.json` file describing everything this server needs to know about it. For subdomains using a `*` wildcard will route any subdomains not found in a website's 'object' will send traffic to the express app in the `!!!DEFAULT!!!` key. DO NOT TRY TO ASSIGN A SUBDOMAIN TO THAT KEY NAME OR HAVE MORE THAN TWO WILDCARDS. Examples will be put here later.