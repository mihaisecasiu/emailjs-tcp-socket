import { propOr } from 'ramda'

export default class TCPSocket {
  static open (host, port, options = {}) {
    return new TCPSocket({ host, port, options })
  }

  constructor ({ host, port, options }) {
    this.host = host
    this.port = port
    this.ssl = propOr(false, 'useSecureTransport')(options)
    this.bufferedAmount = 0
    this.readyState = 'connecting'
    this.binaryType = propOr('arraybuffer', 'binaryType')(options)

    if (this.binaryType !== 'arraybuffer') {
      throw new Error('Only arraybuffers are supported!')
    }


    this._socket = new Socket();

    // add all event listeners to the new socket
    this._attachListeners();

    this._socket.open(this.host,this.port, () => this._emit('open'), error => this._emit('error',error),this.ssl);

  }

  _attachListeners () {

    this._socket.onData = data => this._emit('data',data);
    this._socket.onError = error => {
      // Ignore ECONNRESET errors. For the app this is the same as normal close
      if (error.code !== 'ECONNRESET') {
        this._emit('error', error)
      }
      this.close()
    };

    this._socket.onClose = hasError => this._emit('close');
  }

  _removeListeners () {
    this._socket.onData=null;
    this._socket.onError=null;
    this._socket.onClose=null;
  }

  _emit (type, data) {
    const target = this
    switch (type) {
      case 'open':
        this.readyState = 'open'
        this.onopen && this.onopen({ target, type, data })
        break
      case 'error':
        this.onerror && this.onerror({ target, type, data })
        break
      case 'data':
        this.ondata && this.ondata({ target, type, data })
        break
      case 'drain':
        this.ondrain && this.ondrain({ target, type, data })
        break
      case 'close':
        this.readyState = 'closed'
        this.onclose && this.onclose({ target, type, data })
        break
    }
  }

  //
  // API
  //

  close () {
    this.readyState = 'closing'
    this._socket.close();
  }

  send (data) {
    // convert data to string or node buffer
    this._socket.write(data, this._emit.bind(this, 'drain'),this.emit.bind(this,'error'))
  }
/*
  upgradeToSecure () {
    if (this.ssl) return

    this._removeListeners()
    this._socket = tls.connect({ socket: this._socket }, () => { this.ssl = true })
    this._attachListeners()
  }
*/
}

