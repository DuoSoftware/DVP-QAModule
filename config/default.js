module.exports = {


  "Redis":
  {
    "mode":"sentinel",//instance, cluster, sentinel
    "ip": "",
    "port": 6389,
    "user": "",
    "password": "",
    "sentinels":{
      "hosts": "",
      "port":16389,
      "name":"redis-cluster"
    }

  },

  "Security":
  {

    "ip" : "",
    "port": 6389,
    "user": "",
    "password": "",
    "mode":"sentinel",//instance, cluster, sentinel
    "sentinels":{
      "hosts": "",
      "port":16389,
      "name":"redis-cluster"
    }
  },
  "Host":
  {
    "resource": "cluster",
    "vdomain": "localhost",
    "domain": "localhost",
    "port": "3637",
    "version": "1.0"
  },

  "LBServer" : {

    "ip": "localhost",
    "port": "3434"

  },

  "RabbitMQ":
  {
    "ip": "",
    "port": 5672,
    "user": "",
    "password": ""
  },


  "Mongo":
  {
    "ip":"",
    "port":"27017",
    "dbname":"",
    "password":"",
    "user":"",
    "replicaset" :""
  }

};
