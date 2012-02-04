## About
P2P Distributed Encrypted Anonymous Chat System. The current interface is similar to an IRC screen.

## Features
* Easy download, Install & Run
* Standalone with built in Webserver.
* Slick, minimal web based interface.
* Tiny codebase using Express.js and Node.js
* NEW Supports Multiple Channels

## Dependencies
See package.json. Basically Express.js and Jade for templating. npm install takes care of installing local app versions needed.

## Install

#### Assumptions
* Node.js is installed
* npm is installed. (The node package manager)
* For these instructions, you are on linux.

#### Download
```
git clone git://github.com/DistributedCity/node-dc-chat.git
cd node-dc-chat
```

#### Install Dependencies listed in package.json
```
npm install
```

#### Run
```
node server.js
```

#### Play
Point two different browsers or tabs to:
http://localhost:3000/

## TODO
* Implement Encryption
* Implement Persistence and Replication Layer in CouchDB.
* Package and delpoy to npm (node package manager) service.
* Implement Peer Auto Discovery
* Document setup with SSL, I2P and Tor for both Personal and Shared usage.
* Add Windows and OS X documentation.
* Investigate Android/IOS viability.


## Authors
* Original fork from node_chat_express by Jonathan Kupferman (jkupferman@umail.ucsb.edu)
* Hiro White, Agorist Radio

## Contact
[IRC](http://distributedcity.github.com/#contact)

## License
MIT
