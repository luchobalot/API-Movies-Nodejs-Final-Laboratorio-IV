const express = require('express');
const cors = require('cors'); //  Importa CORS

class Server {
  constructor () {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.middleware();
    this.routes();
  }

  middleware () {
    this.app.use(cors()); 
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  routes () {
    // Balot
    this.app.use('/api/v1', require('../routes/api/v1/movies'));
  }

  listen () {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`La API está escuchando en http://0.0.0.0:${this.port}`);
    });
  }
}

module.exports = Server;
