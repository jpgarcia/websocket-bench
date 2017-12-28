/*global module, require*/
var util = require('util')
var BaseWorker = require('./baseworker.js')
var logger = require('../logger.js')
const ApolloClient = require('apollo-client').default
const { InMemoryCache } = require('apollo-cache-inmemory')
const { WebSocketLink } = require('apollo-link-ws')

/**
 * ApolloWorker Worker class inherits form BaseWorker
 */
var ApolloWorker = function(server, generator) {
  ApolloWorker.super_.apply(this, arguments)
}

util.inherits(ApolloWorker, BaseWorker)

ApolloWorker.prototype.createClient = async function(callback) {
  var self = this
  let options = {}

  if (self.generator.beforeConnect) {
    options = await self.generator.beforeConnect()
  }

  Object.assign(options, {
    connectionCallback: function(err, otro) {
      if (err) {
        if (self.verbose) {
          logger.error('Apollo Worker connect_failed' + JSON.stringify(err), err)
        }
        callback(true, client)
      }
    },
  })

  const webSocketImpl = require('ws')

  const link = new WebSocketLink({
    uri: this.server,
    options,
    webSocketImpl,
  })

  const cache = new InMemoryCache()
  const client = new ApolloClient({ link, cache })

  link.subscriptionClient.onConnected(function() {
    callback(false, client)
  })
}

ApolloWorker.prototype.close = function() {
  this.running = false

  for (var i = 0; i < this.clients.length; i++) {
    try {
      this.clients[i].close()
    } catch (err) {}
  }
}

module.exports = ApolloWorker
